<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// User CRUD routes
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/role/{role}', [UserController::class, 'getByRole']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::post('/register/company', [UserController::class, 'registerCompany']);
Route::post('/register/freelancer', [UserController::class, 'registerFreelancer']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);
