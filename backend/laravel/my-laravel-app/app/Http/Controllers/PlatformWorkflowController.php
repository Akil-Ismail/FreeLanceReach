<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\FreelancerProfile;
use App\Models\MeetingRequest;
use App\Models\Proposal;
use App\Models\ProposalMatch;
use App\Models\ServiceDecision;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class PlatformWorkflowController extends Controller
{
    private function getActorFromRequest(Request $request): ?User
    {
        $actorUserId = (int) $request->input('actor_user_id');
        if (!$actorUserId) {
            return null;
        }

        return User::find($actorUserId);
    }

    private function actorRequired(Request $request): User|JsonResponse
    {
        $actor = $this->getActorFromRequest($request);
        if (!$actor) {
            return response()->json(['message' => 'actor_user_id is required and must exist'], 422);
        }

        return $actor;
    }

    public function upsertFreelancerProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'user_id' => 'required|exists:users,id',
            'headline' => 'nullable|string|max:255',
            'skills' => 'nullable|array',
            'hourly_rate' => 'nullable|numeric|min:0',
            'experience_level' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'portfolio_url' => 'nullable|url',
            'availability' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);
        $profileUser = User::find($data['user_id']);

        if (!$actor || !$profileUser || $actor->id !== $profileUser->id || $profileUser->role !== 'freelancer') {
            return response()->json(['message' => 'Only the freelancer owner can update this profile'], 403);
        }

        unset($data['actor_user_id']);

        $profile = FreelancerProfile::updateOrCreate(
            ['user_id' => $data['user_id']],
            $data
        );

        // Index updated profile into Qdrant for ANN-based matching
        try {
            Http::timeout(10)->post(
                rtrim(env('FASTAPI_URL', 'http://localhost:8001/api'), '/') . '/matching/index-profile',
                [
                    'user_id'            => $profile->user_id,
                    'headline'           => $profile->headline,
                    'skills'             => $profile->skills ?? [],
                    'bio'                => $profile->bio,
                    'experience_level'   => $profile->experience_level,
                    'availability'       => $profile->availability,
                    'hourly_rate'        => $profile->hourly_rate,
                    'freelance_category' => $profileUser->freelance_category ?? null,
                    'first_name'         => $profileUser->first_name ?? null,
                    'last_name'          => $profileUser->last_name ?? null,
                ]
            );
        } catch (\Throwable) {}

        // Re-run matching for all open proposals so this new freelancer is considered
        Proposal::where('status', 'open')->each(function ($proposal) {
            $this->doRunMatches($proposal);
        });

        return response()->json([
            'message' => 'Freelancer profile saved successfully',
            'profile' => $profile,
        ]);
    }

    public function createProposal(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'company_user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:20',
            'required_skills' => 'nullable|array',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0',
            'timeline' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,open,matched,closed',
            'ai_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);
        $company = User::find($data['company_user_id']);

        if (!$actor || !$company || $actor->id !== $company->id || $company->role !== 'company') {
            return response()->json(['message' => 'Only employer/company accounts can create proposals'], 403);
        }

        unset($data['actor_user_id']);
        $proposal = Proposal::create($data);

        // Auto-run BERT matching immediately after creation
        $matches = $this->doRunMatches($proposal);

        return response()->json([
            'message' => 'Proposal created and AI matching ran automatically',
            'proposal' => $proposal,
            'matches_count' => count($matches),
        ], 201);
    }

    public function listProposals(Request $request): JsonResponse
    {
        $actor = $this->actorRequired($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $query = Proposal::query()->latest();

        if ($actor->role === 'company') {
            $query->where('company_user_id', $actor->id);
        } else {
            $query->whereIn('status', ['open', 'matched']);
        }

        return response()->json($query->get());
    }

    private function doRunMatches(Proposal $proposal): array
    {
        $fastApiBase = rtrim(env('FASTAPI_URL', 'http://localhost:8001/api'), '/');

        $proposalData = [
            'title'           => $proposal->title,
            'description'     => $proposal->description,
            'required_skills' => $proposal->required_skills ?? [],
            'budget_min'      => $proposal->budget_min,
            'budget_max'      => $proposal->budget_max,
            'timeline'        => $proposal->timeline,
        ];

        // Source of truth: ALL users with role=freelancer (with their profile if it exists)
        $freelancerUsers = User::where('role', 'freelancer')
            ->with('freelancerProfile')
            ->get();

        if ($freelancerUsers->isEmpty()) {
            return [];
        }

        // Build a unified freelancer payload merging User fields + FreelancerProfile fields
        $allFreelancerData = $freelancerUsers->map(function ($u) {
            $p = $u->freelancerProfile;
            return [
                'user_id'            => $u->id,
                'headline'           => $p?->headline ?? $u->freelance_category ?? '',
                'skills'             => $p?->skills ?? [],
                'bio'                => $p?->bio ?? $u->professional_bio ?? '',
                'experience_level'   => $p?->experience_level ?? '',
                'availability'       => $p?->availability ?? '',
                'hourly_rate'        => $p?->hourly_rate ?? null,
                'freelance_category' => $u->freelance_category ?? '',
                'first_name'         => $u->first_name ?? '',
                'last_name'          => $u->last_name ?? '',
            ];
        });

        // 1. Qdrant ANN search for semantically indexed freelancers
        $qdrantScores = [];
        $qdrantUserIds = [];
        try {
            $resp = Http::timeout(30)->post(
                "{$fastApiBase}/matching/search",
                ['proposal' => $proposalData, 'top_k' => 50]
            );
            if ($resp->successful()) {
                $qdrantScores = $resp->json('matches', []);
                $qdrantUserIds = array_column($qdrantScores, 'user_id');
            }
        } catch (\Throwable) {}

        // 2. Score freelancers not yet in Qdrant via direct BERT, then index them
        $indexed = array_flip($qdrantUserIds);
        $missing = $allFreelancerData->filter(fn ($f) => !array_key_exists($f['user_id'], $indexed));

        $additionalScores = [];
        if ($missing->isNotEmpty()) {
            $missingList = $missing->values()->all();

            // Score via direct BERT
            try {
                $resp = Http::timeout(30)->post(
                    "{$fastApiBase}/matching/bert-score",
                    ['proposal' => $proposalData, 'freelancers' => $missingList]
                );
                if ($resp->successful()) {
                    $additionalScores = $resp->json('matches', []);
                }
            } catch (\Throwable) {}

            // Jaccard final fallback for missing
            if (empty($additionalScores)) {
                $reqSkills = collect($proposal->required_skills ?? [])
                    ->map(fn ($s) => strtolower(trim($s)))->filter();

                $additionalScores = collect($missingList)->map(function ($f) use ($reqSkills) {
                    $pSkills = collect($f['skills'] ?? [])->map(fn ($s) => strtolower(trim($s)))->filter();
                    $intersection = $reqSkills->intersect($pSkills)->count();
                    $union = $reqSkills->merge($pSkills)->unique()->count();
                    return [
                        'user_id'      => $f['user_id'],
                        'score'        => $union > 0 ? round($intersection / $union, 4) : 0,
                        'model_source' => 'fallback_jaccard',
                    ];
                })->values()->all();
            }

            // Index them into Qdrant for future searches
            foreach ($missingList as $f) {
                try {
                    Http::timeout(10)->post("{$fastApiBase}/matching/index-profile", $f);
                } catch (\Throwable) {}
            }
        }

        // Merge Qdrant + direct BERT results and sort by score desc
        $allScores = array_merge($qdrantScores, $additionalScores);
        usort($allScores, fn ($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));

        $saved = [];
        foreach ($allScores as $item) {
            if (!isset($item['user_id'])) continue;

            $saved[] = ProposalMatch::updateOrCreate(
                ['proposal_id' => $proposal->id, 'freelancer_user_id' => $item['user_id']],
                [
                    'match_score'  => $item['score'] ?? 0,
                    'model_source' => $item['model_source'] ?? 'bert',
                    'status'       => 'pending',
                ]
            );
        }

        if (count($saved) > 0) {
            $proposal->status = 'matched';
            $proposal->save();
        }

        return $saved;
    }

    public function runMatches(Request $request, int $proposalId): JsonResponse
    {
        $actor = $this->actorRequired($request);
        if ($actor instanceof JsonResponse) return $actor;

        $proposal = Proposal::findOrFail($proposalId);
        if ($actor->role !== 'company' || $proposal->company_user_id !== $actor->id) {
            return response()->json(['message' => 'Only the proposal owner company can run matching'], 403);
        }

        $saved = $this->doRunMatches($proposal);

        return response()->json([
            'message'     => 'Matching completed',
            'proposal_id' => $proposal->id,
            'matches'     => $saved,
        ]);
    }

    public function listMatches(Request $request): JsonResponse
    {
        $actor = $this->actorRequired($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $query = ProposalMatch::with(['proposal', 'freelancer']);

        if ($actor->role === 'freelancer') {
            $query->where('freelancer_user_id', $actor->id);
        } else {
            $query->whereHas('proposal', fn ($q) => $q->where('company_user_id', $actor->id));
        }

        return response()->json($query->latest()->get());
    }

    public function respondToMatch(Request $request, int $matchId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'approve' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $match = ProposalMatch::findOrFail($matchId);
        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);

        if (!$actor) {
            return response()->json(['message' => 'Actor not found'], 422);
        }

        $proposal = Proposal::find($match->proposal_id);
        if (!$proposal) {
            return response()->json(['message' => 'Proposal not found for match'], 404);
        }

        if ($actor->role === 'company' && $proposal->company_user_id !== $actor->id) {
            return response()->json(['message' => 'Company actor is not owner of this proposal'], 403);
        }

        if ($actor->role === 'freelancer' && $match->freelancer_user_id !== $actor->id) {
            return response()->json(['message' => 'Freelancer actor is not owner of this match'], 403);
        }

        if (!in_array($actor->role, ['company', 'freelancer'])) {
            return response()->json(['message' => 'Invalid actor role for match response'], 403);
        }

        if (!$data['approve']) {
            $match->status = 'rejected';
            $match->save();

            return response()->json(['message' => 'Match rejected', 'match' => $match]);
        }

        if ($actor->role === 'company') {
            $match->status = $match->status === 'freelancer_approved' ? 'mutual_approved' : 'company_approved';
        } else {
            $match->status = $match->status === 'company_approved' ? 'mutual_approved' : 'freelancer_approved';
        }

        $match->save();

        return response()->json(['message' => 'Match response saved', 'match' => $match]);
    }

    public function createMeetingRequest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'proposal_match_id' => 'required|exists:proposal_matches,id',
            'company_user_id' => 'required|exists:users,id',
            'freelancer_user_id' => 'required|exists:users,id',
            'proposed_at' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);
        $match = ProposalMatch::find($data['proposal_match_id']);

        if (!$actor || $actor->role !== 'company' || $actor->id !== (int) $data['company_user_id']) {
            return response()->json(['message' => 'Only the company actor can create meeting requests'], 403);
        }

        if (!$match || $match->status !== 'mutual_approved') {
            return response()->json(['message' => 'Meeting can only be created after mutual approval'], 422);
        }

        if ((int) $data['freelancer_user_id'] !== (int) $match->freelancer_user_id) {
            return response()->json(['message' => 'Freelancer does not belong to selected match'], 422);
        }

        unset($data['actor_user_id']);

        $meeting = MeetingRequest::create([
            ...$data,
            'status' => 'pending_freelancer',
        ]);

        return response()->json(['message' => 'Meeting request created', 'meeting_request' => $meeting], 201);
    }

    public function respondToMeeting(Request $request, int $meetingId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'action' => 'required|in:approve,edit,reject',
            'new_time' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $meeting = MeetingRequest::findOrFail($meetingId);
        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);

        if (!$actor || !in_array($actor->role, ['company', 'freelancer'])) {
            return response()->json(['message' => 'Invalid actor for meeting action'], 403);
        }

        if ($actor->role === 'company' && $meeting->company_user_id !== $actor->id) {
            return response()->json(['message' => 'Company actor is not owner of this meeting'], 403);
        }

        if ($actor->role === 'freelancer' && $meeting->freelancer_user_id !== $actor->id) {
            return response()->json(['message' => 'Freelancer actor is not owner of this meeting'], 403);
        }

        if ($data['action'] === 'reject') {
            $meeting->status = 'rejected';
            $meeting->save();
            return response()->json(['message' => 'Meeting request rejected', 'meeting_request' => $meeting]);
        }

        if ($data['action'] === 'edit') {
            if (empty($data['new_time'])) {
                return response()->json(['message' => 'new_time is required for edit action'], 422);
            }
            if ($actor->role === 'freelancer') {
                $meeting->freelancer_proposed_at = $data['new_time'];
                $meeting->status = 'pending_company';
            } else {
                $meeting->proposed_at = $data['new_time'];
                $meeting->status = 'pending_freelancer';
            }
            $meeting->save();
            return response()->json(['message' => 'Meeting time updated', 'meeting_request' => $meeting]);
        }

        if ($actor->role === 'company' && $meeting->status === 'pending_company') {
            $meeting->status = 'approved';
        } elseif ($actor->role === 'freelancer' && $meeting->status === 'pending_freelancer') {
            $meeting->status = 'approved';
        } else {
            return response()->json([
                'message' => 'This actor cannot approve the meeting in current state',
                'meeting_request' => $meeting,
            ], 422);
        }

        $meeting->google_meet_link = $meeting->google_meet_link ?: $this->generateMeetLink();
        $meeting->save();

        return response()->json([
            'message' => 'Meeting approved',
            'meeting_request' => $meeting,
        ]);
    }

    public function listMeetings(Request $request): JsonResponse
    {
        $actor = $this->actorRequired($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $query = MeetingRequest::with(['proposalMatch', 'company', 'freelancer'])->latest();

        if ($actor->role === 'company') {
            $query->where('company_user_id', $actor->id);
        } else {
            $query->where('freelancer_user_id', $actor->id);
        }

        return response()->json($query->get());
    }

    public function recordServiceDecision(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'meeting_request_id' => 'required|exists:meeting_requests,id',
            'company_user_id' => 'required|exists:users,id',
            'freelancer_user_id' => 'required|exists:users,id',
            'decision' => 'required|in:approved,denied',
            'feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);
        $meeting = MeetingRequest::find($data['meeting_request_id']);

        if (!$actor || $actor->role !== 'company' || $actor->id !== (int) $data['company_user_id']) {
            return response()->json(['message' => 'Only company actor can submit this notification decision'], 403);
        }

        if (!$meeting || $meeting->status !== 'approved') {
            return response()->json(['message' => 'Meeting must be approved before sending notification decision'], 422);
        }

        if ($meeting->company_user_id !== (int) $data['company_user_id'] || $meeting->freelancer_user_id !== (int) $data['freelancer_user_id']) {
            return response()->json(['message' => 'Meeting participants mismatch for decision'], 422);
        }

        unset($data['actor_user_id']);

        $decision = ServiceDecision::updateOrCreate(
            ['meeting_request_id' => $data['meeting_request_id']],
            $data
        );

        return response()->json([
            'message' => 'Decision recorded and freelancer can be notified',
            'service_decision' => $decision,
        ]);
    }

    public function createContractDraft(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'proposal_match_id' => 'required|exists:proposal_matches,id',
            'company_user_id' => 'required|exists:users,id',
            'freelancer_user_id' => 'required|exists:users,id',
            'details' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $actor = User::find($validated['actor_user_id']);
        $match = ProposalMatch::find($validated['proposal_match_id']);

        if (!$actor || $actor->role !== 'company' || $actor->id !== (int) $validated['company_user_id']) {
            return response()->json(['message' => 'Only company actor can create contract drafts'], 403);
        }

        if (!$match || $match->status !== 'mutual_approved') {
            return response()->json(['message' => 'Contract draft requires mutual approved match'], 422);
        }

        if ($match->freelancer_user_id !== (int) $validated['freelancer_user_id']) {
            return response()->json(['message' => 'Freelancer does not belong to selected match'], 422);
        }

        $contractText = $this->generateContractText($validated['details']);

        $contract = Contract::create([
            'proposal_match_id' => $validated['proposal_match_id'],
            'company_user_id' => $validated['company_user_id'],
            'freelancer_user_id' => $validated['freelancer_user_id'],
            'details' => $validated['details'],
            'contract_text' => $contractText,
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Contract draft created',
            'contract' => $contract,
        ], 201);
    }

    public function signContract(Request $request, int $contractId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'signature' => 'required|string',
            'approve' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $contract = Contract::findOrFail($contractId);
        $data = $validator->validated();
        $actor = User::find($data['actor_user_id']);

        if (!$actor || !in_array($actor->role, ['company', 'freelancer'])) {
            return response()->json(['message' => 'Invalid actor for contract signing'], 403);
        }

        if ($actor->role === 'company' && $contract->company_user_id !== $actor->id) {
            return response()->json(['message' => 'Company actor does not belong to this contract'], 403);
        }

        if ($actor->role === 'freelancer' && $contract->freelancer_user_id !== $actor->id) {
            return response()->json(['message' => 'Freelancer actor does not belong to this contract'], 403);
        }

        if (!$data['approve']) {
            $contract->status = 'rejected';
            $contract->save();
            return response()->json(['message' => 'Contract rejected', 'contract' => $contract]);
        }

        if ($actor->role === 'company') {
            $contract->employer_signature = $data['signature'];
            $contract->status = 'company_signed';
        } else {
            $contract->freelancer_signature = $data['signature'];
            $contract->status = $contract->employer_signature ? 'active' : 'freelancer_signed';
        }

        $contract->save();

        return response()->json([
            'message' => 'Contract signature saved',
            'contract' => $contract,
        ]);
    }

    public function listContracts(Request $request): JsonResponse
    {
        $actor = $this->actorRequired($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $query = Contract::with(['proposalMatch', 'company', 'freelancer'])->latest();

        if ($actor->role === 'company') {
            $query->where('company_user_id', $actor->id);
        } else {
            $query->where('freelancer_user_id', $actor->id);
        }

        return response()->json($query->get());
    }

    public function listTasks(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'contract_id' => 'required|exists:contracts,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $contract = Contract::find((int) $request->input('contract_id'));
        $actor = User::find((int) $request->input('actor_user_id'));

        if (!$contract || !$actor || !in_array($actor->id, [$contract->company_user_id, $contract->freelancer_user_id])) {
            return response()->json(['message' => 'Not allowed to access tasks for this contract'], 403);
        }

        $tasks = Task::where('contract_id', $contract->id)
            ->orderBy('order_index')
            ->orderBy('created_at')
            ->get();

        return response()->json($tasks);
    }

    public function createTask(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'contract_id' => 'required|exists:contracts,id',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,done',
            'priority' => 'nullable|in:low,medium,high',
            'due_date' => 'nullable|date',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $contract = Contract::find($data['contract_id']);
        $actor = User::find($data['actor_user_id']);

        if (!$contract || !$actor || !in_array($actor->id, [$contract->company_user_id, $contract->freelancer_user_id])) {
            return response()->json(['message' => 'Not allowed to create tasks for this contract'], 403);
        }

        if (!in_array($contract->status, ['active', 'company_signed', 'freelancer_signed'])) {
            return response()->json(['message' => 'Contract must be signed before tasks can be created'], 422);
        }

        unset($data['actor_user_id']);

        $task = Task::create($data);

        return response()->json([
            'message' => 'Task created',
            'task' => $task,
        ], 201);
    }

    public function updateTask(Request $request, int $taskId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actor_user_id' => 'required|exists:users,id',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,done',
            'priority' => 'nullable|in:low,medium,high',
            'due_date' => 'nullable|date',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $task = Task::findOrFail($taskId);
        $contract = Contract::find($task->contract_id);
        $actor = User::find((int) $request->input('actor_user_id'));

        if (!$contract || !$actor || !in_array($actor->id, [$contract->company_user_id, $contract->freelancer_user_id])) {
            return response()->json(['message' => 'Not allowed to update this task'], 403);
        }

        $data = $validator->validated();
        unset($data['actor_user_id']);

        $task->update($data);

        return response()->json([
            'message' => 'Task updated',
            'task' => $task,
        ]);
    }

    private function generateContractText(array $details): string
    {
        try {
            $response = Http::timeout(30)->post(
                rtrim(env('FASTAPI_URL', 'http://localhost:8001/api'), '/') . '/company-chat/contract-draft',
                ['details' => $details]
            );

            if ($response->successful() && $response->json('contract_text')) {
                return $response->json('contract_text');
            }
        } catch (\Throwable $e) {
        }

        $scope = $details['scope'] ?? 'Detailed services as agreed by both parties.';
        $fee = $details['payment_terms'] ?? 'Compensation as mutually agreed.';
        $timeline = $details['timeline'] ?? 'Timeline to be finalized by both parties.';

        return "SERVICE AGREEMENT\n\n1. Scope of Work\n{$scope}\n\n2. Payment Terms\n{$fee}\n\n3. Timeline\n{$timeline}\n\n4. Confidentiality\nBoth parties agree to keep all sensitive information confidential.\n\n5. Termination\nEither party may terminate with written notice as mutually agreed.";
    }

    private function generateMeetLink(): string
    {
        $alphabet = 'abcdefghijklmnopqrstuvwxyz';
        $partA = substr(str_shuffle($alphabet), 0, 3);
        $partB = substr(str_shuffle($alphabet), 0, 4);
        $partC = substr(str_shuffle($alphabet), 0, 3);

        return "https://meet.google.com/{$partA}-{$partB}-{$partC}";
    }
}
