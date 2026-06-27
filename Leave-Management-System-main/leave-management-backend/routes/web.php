<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController; 
Route::get('/', function () {
    return view('welcome');
});
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout']);