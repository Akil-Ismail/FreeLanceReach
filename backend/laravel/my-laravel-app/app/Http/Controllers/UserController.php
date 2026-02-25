<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\StoreFreelancerRequest;
use App\Http\Requests\UpdateUserRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
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
    public function registerCompany(StoreCompanyRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['role'] = 'company';

        $user = User::create($data);

        return response()->json([
            'message' => 'Company registered successfully',
            'user' => $user
        ], 201);
    }

    // Register freelancer
    public function registerFreelancer(StoreFreelancerRequest $request): JsonResponse
    {
        $data = $request->validated();
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
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update($request->validated());

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
