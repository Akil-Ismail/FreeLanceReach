<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    // Login user
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $plainToken = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->save();

        return response()->json([
            'message' => 'Login successful',
            'token' => $plainToken,
            'user' => $user,
        ]);
    }

    // Google OAuth login / register
    public function googleAuth(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'credential'  => 'required|string',
            'email'       => 'required|email',
            'first_name'  => 'nullable|string',
            'last_name'   => 'nullable|string',
            'role'        => 'nullable|in:freelancer,company',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        // Verify access token with Google userinfo endpoint
        $accessToken = $request->input('credential');
        $googleResponse = Http::withoutVerifying()->withToken($accessToken)
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (!$googleResponse->successful() || empty($googleResponse->json('email'))) {
            return response()->json([
                'message' => 'Invalid Google token',
                'detail'  => $googleResponse->body(),
            ], 401);
        }

        $email     = $request->input('email');
        $firstName = $request->input('first_name', '');
        $lastName  = $request->input('last_name', '');

        // Find or create user
        $isNew = false;
        $user  = User::where('email', $email)->first();
        if (!$user) {
            $isNew = true;
            $user  = User::create([
                'email'        => $email,
                'first_name'   => $firstName,
                'last_name'    => $lastName,
                'role'         => 'freelancer', // temporary; will be updated by set-role
                'phone_number' => '',
                'password'     => bcrypt(Str::random(32)),
            ]);
        }

        $plainToken      = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->save();

        return response()->json([
            'message'      => 'Google authentication successful',
            'token'        => $plainToken,
            'user'         => $user,
            'is_new_user'  => $isNew,
        ]);
    }

    // Set role for a new Google user
    public function googleSetRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role'    => 'required|in:freelancer,company',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }
        $user = User::findOrFail($request->user_id);
        $user->role = $request->role;
        $user->save();
        return response()->json(['message' => 'Role updated', 'user' => $user]);
    }

    // Get all users
    public function index(): JsonResponse
    {
        $users = User::all();
        return response()->json($users);
    }

    // Get users by role
    public function getByRole(string $role): JsonResponse
    {
        $users = User::where('role', $role)->get();
        return response()->json($users);
    }

    // Get single user
    public function show(User $user): JsonResponse
    {
        $user->load('freelancerProfile');
        return response()->json($user);
    }

    // Register company
    public function registerCompany(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'contact_first_name' => 'required|string|max:255',
            'contact_last_name' => 'required|string|max:255',
            'work_email' => 'required|email|unique:users,work_email',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'company_website' => 'nullable|url',
            'company_size' => 'required|string',
            'industry' => 'required|string',
            'company_description' => 'required|string|min:20',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $data['role'] = 'company';

        $user = User::create($data);

        $plainToken = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->save();

        return response()->json([
            'message' => 'Company registered successfully',
            'token' => $plainToken,
            'user' => $user,
        ], 201);
    }

    // Register freelancer
    public function registerFreelancer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'freelance_category' => 'required|string',
            'professional_bio' => 'required|string|min:10',
            'cv' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $data['role'] = 'freelancer';

        // Handle CV upload before removing the file from $data
        $cvPath = null;
        if ($request->hasFile('cv')) {
            $original = $request->file('cv')->getClientOriginalName();
            $cvPath = $request->file('cv')->storeAs('cvs', 'tmp_' . $original, 'public');
        }

        // Remove the UploadedFile object — not a DB column
        unset($data['cv']);

        $user = User::create($data);

        // Rename CV to include real user ID now that we have it
        if ($cvPath) {
            $original = basename($cvPath);
            $newPath = 'cvs/' . $user->id . '_' . ltrim($original, 'tmp_');
            Storage::disk('public')->move($cvPath, $newPath);
            $user->cv_path = $newPath;
            $user->save();
        }

        // Generate auth token so the user can immediately call protected routes
        $plainToken = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->save();

        return response()->json([
            'message' => 'Freelancer registered successfully',
            'token' => $plainToken,
            'user' => $user,
        ], 201);
    }

    // Update user
    public function update(Request $request, User $user): JsonResponse
    {
        $user->update($request->only([
            'email',
            'phone_number',
            'company_name',
            'contact_first_name',
            'contact_last_name',
            'work_email',
            'company_website',
            'company_size',
            'industry',
            'company_description',
            'first_name',
            'last_name',
            'freelance_category',
            'professional_bio'
        ]));

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    // Upload CV for a freelancer
    public function uploadCv(Request $request, User $user): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cv' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if ($user->cv_path) {
            Storage::disk('public')->delete($user->cv_path);
        }

        $original = $request->file('cv')->getClientOriginalName();
        $path = $request->file('cv')->storeAs('cvs', $user->id . '_' . $original, 'public');
        $user->cv_path = $path;
        $user->save();

        return response()->json([
            'message' => 'CV uploaded successfully',
            'has_cv'  => true,
            'cv_name' => $original,
        ]);
    }

    // Download/view CV (public — no auth required so employer can open it directly)
    public function downloadCv(User $user)
    {
        if (!$user->cv_path || !Storage::disk('public')->exists($user->cv_path)) {
            return response()->json(['message' => 'No CV found'], 404);
        }

        $filename = basename($user->cv_path);
        $fullPath = storage_path('app/public/' . $user->cv_path);
        return response()->file($fullPath, [
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    // Upload profile picture
    public function uploadProfilePicture(Request $request, User $user): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'picture' => 'required|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if ($user->profile_picture_path) {
            Storage::disk('public')->delete($user->profile_picture_path);
        }

        Storage::disk('public')->makeDirectory('profile_pictures');

        $ext  = $request->file('picture')->getClientOriginalExtension() ?: 'jpg';
        $filename = $user->id . '_' . time() . '.' . $ext;
        $path = $request->file('picture')->storeAs('profile_pictures', $filename, 'public');

        if (!$path) {
            return response()->json(['message' => 'Failed to store image on disk'], 500);
        }

        $user->profile_picture_path = $path;
        $user->save();

        return response()->json([
            'message'      => 'Profile picture uploaded successfully',
            'picture_path' => $path,
        ]);
    }

    // Upload cover photo
    public function uploadCoverPhoto(Request $request, User $user): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cover' => 'required|image|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if ($user->cover_photo_path) {
            Storage::disk('public')->delete($user->cover_photo_path);
        }

        Storage::disk('public')->makeDirectory('cover_photos');

        $ext      = $request->file('cover')->getClientOriginalExtension() ?: 'jpg';
        $filename = $user->id . '_cover_' . time() . '.' . $ext;
        $path     = $request->file('cover')->storeAs('cover_photos', $filename, 'public');

        if (!$path) {
            return response()->json(['message' => 'Failed to store cover photo on disk'], 500);
        }

        $user->cover_photo_path = $path;
        $user->save();

        return response()->json(['message' => 'Cover photo uploaded successfully', 'cover_path' => $path]);
    }

    // Serve cover photo (public)
    public function showCoverPhoto(User $user)
    {
        if (!$user->cover_photo_path || !Storage::disk('public')->exists($user->cover_photo_path)) {
            return response()->json(['message' => 'No cover photo found'], 404);
        }

        $fullPath = storage_path('app/public/' . $user->cover_photo_path);
        return response()->file($fullPath);
    }

    // Serve profile picture (public)
    public function showProfilePicture(User $user)
    {
        if (!$user->profile_picture_path || !Storage::disk('public')->exists($user->profile_picture_path)) {
            return response()->json(['message' => 'No profile picture found'], 404);
        }

        $fullPath = storage_path('app/public/' . $user->profile_picture_path);
        return response()->file($fullPath);
    }

    // Delete user
    public function destroy(User $user): JsonResponse
    {
        if ($user->cv_path) {
            Storage::disk('public')->delete($user->cv_path);
        }
        if ($user->profile_picture_path) {
            Storage::disk('public')->delete($user->profile_picture_path);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}
