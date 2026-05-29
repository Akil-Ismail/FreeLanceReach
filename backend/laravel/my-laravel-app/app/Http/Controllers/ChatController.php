<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    public function history(Request $request): JsonResponse
    {
        $user = auth()->user();

        $messages = ChatMessage::where('user_id', $user->id)
            ->orderBy('created_at')
            ->get(['role', 'content', 'created_at']);

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'messages'         => 'required|array',
            'messages.*.role'  => 'required|in:user,assistant',
            'messages.*.content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();

        // Only persist the last two messages (the new user turn + assistant reply)
        $incoming = collect($request->input('messages'))->slice(-2);

        foreach ($incoming as $msg) {
            ChatMessage::create([
                'user_id' => $user->id,
                'role'    => $msg['role'],
                'content' => $msg['content'],
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function clear(Request $request): JsonResponse
    {
        $user = auth()->user();
        ChatMessage::where('user_id', $user->id)->delete();
        return response()->json(['ok' => true]);
    }

    public function profile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $data = [
            'id'   => $user->id,
            'role' => $user->role,
        ];

        if ($user->isFreelancer()) {
            $profile = $user->freelancerProfile;
            $data = array_merge($data, [
                'first_name'       => $user->first_name,
                'last_name'        => $user->last_name,
                'email'            => $user->email,
                'phone'            => $user->phone_number,
                'category'         => $user->freelance_category,
                'professional_bio' => $user->professional_bio,
                'headline'         => $profile?->headline,
                'skills'           => $profile?->skills ?? [],
                'hourly_rate'      => $profile?->hourly_rate,
                'experience_level' => $profile?->experience_level,
                'bio'              => $profile?->bio,
                'portfolio_url'    => $profile?->portfolio_url,
                'availability'     => $profile?->availability,
            ]);
        } else {
            $data = array_merge($data, [
                'company_name'        => $user->company_name,
                'contact_first_name'  => $user->contact_first_name,
                'contact_last_name'   => $user->contact_last_name,
                'email'               => $user->email,
                'work_email'          => $user->work_email,
                'phone'               => $user->phone_number,
                'website'             => $user->company_website,
                'company_size'        => $user->company_size,
                'industry'            => $user->industry,
                'company_description' => $user->company_description,
            ]);
        }

        return response()->json(['profile' => $data]);
    }
}
