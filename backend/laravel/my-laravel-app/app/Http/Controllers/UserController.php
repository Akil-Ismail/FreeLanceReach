<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        return response()->json([
            'message' => 'Company registered successfully',
            'user' => $user
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

    // Delete user
    public function destroy(User $user): JsonResponse
    {
        // Delete CV if exists
        if ($user->cv_path) {
            Storage::disk('public')->delete($user->cv_path);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}
