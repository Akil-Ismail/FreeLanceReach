<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PlatformWorkflowController;
use Illuminate\Support\Facades\Route;

// Public: authentication and registration (no token required)
Route::post('/login', [UserController::class, 'login']);
Route::post('/register/company', [UserController::class, 'registerCompany']);
Route::post('/register/freelancer', [UserController::class, 'registerFreelancer']);

// Public CV download — no auth so employer can open the file directly in a browser tab
Route::get('/users/{user}/cv', [UserController::class, 'downloadCv']);

// Public profile picture and cover photo — no auth so they can be used in <img> tags freely
Route::get('/users/{user}/profile-picture', [UserController::class, 'showProfilePicture']);
Route::get('/users/{user}/cover-photo',     [UserController::class, 'showCoverPhoto']);

// Protected: all workflow and user management routes require a valid Bearer token
Route::middleware('auth.token')->group(function () {

    // User management
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/role/{role}', [UserController::class, 'getByRole']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/cv', [UserController::class, 'uploadCv']);
    Route::post('/users/{user}/profile-picture', [UserController::class, 'uploadProfilePicture']);
    Route::post('/users/{user}/cover-photo',     [UserController::class, 'uploadCoverPhoto']);

    // Freelancer profile
    Route::post('/freelancer-profile', [PlatformWorkflowController::class, 'upsertFreelancerProfile']);

    // Proposals
    Route::get('/proposals', [PlatformWorkflowController::class, 'listProposals']);
    Route::post('/proposals', [PlatformWorkflowController::class, 'createProposal']);
    Route::post('/proposals/{proposalId}/match', [PlatformWorkflowController::class, 'runMatches']);

    // Matches
    Route::get('/matches', [PlatformWorkflowController::class, 'listMatches']);
    Route::post('/matches/{matchId}/respond', [PlatformWorkflowController::class, 'respondToMatch']);

    // Meetings
    Route::get('/meetings', [PlatformWorkflowController::class, 'listMeetings']);
    Route::post('/meetings', [PlatformWorkflowController::class, 'createMeetingRequest']);
    Route::post('/meetings/{meetingId}/respond', [PlatformWorkflowController::class, 'respondToMeeting']);

    // Service decisions
    Route::post('/service-decisions', [PlatformWorkflowController::class, 'recordServiceDecision']);

    // Contracts
    Route::get('/contracts', [PlatformWorkflowController::class, 'listContracts']);
    Route::post('/contracts', [PlatformWorkflowController::class, 'createContractDraft']);
    Route::post('/contracts/{contractId}/sign', [PlatformWorkflowController::class, 'signContract']);

    // Tasks
    Route::get('/tasks', [PlatformWorkflowController::class, 'listTasks']);
    Route::post('/tasks', [PlatformWorkflowController::class, 'createTask']);
    Route::put('/tasks/{taskId}', [PlatformWorkflowController::class, 'updateTask']);

    // Chat history & profile for AI chatbot
    Route::get('/chat/history', [ChatController::class, 'history']);
    Route::post('/chat/history', [ChatController::class, 'store']);
    Route::delete('/chat/history', [ChatController::class, 'clear']);
    Route::get('/chat/profile', [ChatController::class, 'profile']);
});
