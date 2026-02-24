<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Define API routes here

Route::middleware('api')->group(function () {
    // Example route
    Route::get('/users', 'UserController@index');
    Route::post('/users', 'UserController@store');
    Route::get('/users/{id}', 'UserController@show');
    Route::put('/users/{id}', 'UserController@update');
    Route::delete('/users/{id}', 'UserController@destroy');
});