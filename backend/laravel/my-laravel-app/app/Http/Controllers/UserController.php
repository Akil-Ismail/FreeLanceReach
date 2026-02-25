<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

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

        return response()->json([
            'message' => 'Login successful',
            'user' => $user
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
            'professional_bio' => 'required|string|min:50',
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

        // Handle CV upload
        if ($request->hasFile('cv')) {
            $path = $request->file('cv')->store('cvs', 'public');
            $data['cv_path'] = $path;
        }

        $user = User::create($data);

        return response()->json([
            'message' => 'Freelancer registered successfully',
            'user' => $user
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
