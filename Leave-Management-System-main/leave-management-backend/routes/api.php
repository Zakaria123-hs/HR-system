<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\ManagerLeaveController;
use App\Http\Controllers\HRLeaveController;
use App\Http\Controllers\DocumentRequestController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\leaveNotificationController;
use Illuminate\Support\Facades\DB;

// Auth
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->get('/user', fn(Request $r) => $r->user());


// Authenticated endpoints for employees
Route::get('/attendance/generate-qr', [AttendanceController::class, 'generateToken']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/attendance/scan-qr', [AttendanceController::class, 'scanToken']);
});

// All
Route::middleware(['auth:sanctum', 'role:employee,supervisor,hr'])->group(function () {
    Route::get('/leave-types', [LeaveRequestController::class, 'leaveTypes']);
    Route::get('/company-holidays', [LeaveRequestController::class, 'holidays']);
    Route::get('/team', [LeaveRequestController::class, 'getTeam']);
    Route::get('/dashboard-data', [LeaveRequestController::class, 'dashboardData']);

    Route::get('/my-leave-requests', [LeaveRequestController::class, 'myRequests']);
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    Route::patch('/leave-requests/{id}/cancel', [LeaveRequestController::class, 'cancel']);

    Route::get('/my-balances', [LeaveRequestController::class, 'myBalances']);

    Route::get('/my-document-requests', [DocumentRequestController::class, 'myRequests']);
    Route::post('/document-requests', [DocumentRequestController::class, 'store']);

    Route::get('/my-notifications', [leaveNotificationController::class, 'myNotifications']);
    Route::post('/notifications/{id}/read', [leaveNotificationController::class, 'readNotification']);

    Route::get('/documents', fn() => response()->json(DB::table('documents')->get()));
    Route::get('/services',  fn() => response()->json(DB::table('services')->get()));
});

// Supervisor 
Route::middleware(['auth:sanctum', 'role:supervisor'])->group(function () {
    Route::get('/supervisor/pending', [ManagerLeaveController::class, 'pendingRequests']);
    Route::post('/supervisor/approve/{id}', [ManagerLeaveController::class, 'approve']);
    Route::post('/supervisor/reject/{id}', [ManagerLeaveController::class, 'reject']);
});

// HR
Route::middleware(['auth:sanctum', 'role:hr'])->group(function () {
    Route::get('/hr/leave/pending', [HRLeaveController::class, 'pendingRequests']);
    Route::post('/hr/leave/approve/{id}', [HRLeaveController::class, 'approve']);
    Route::post('/hr/leave/reject/{id}', [HRLeaveController::class, 'reject']);

    Route::get('/hr/document-requests/pending', [DocumentRequestController::class, 'pending']);
    Route::post('/hr/document-requests/{id}/approve', [DocumentRequestController::class, 'approve']);
    Route::post('/hr/document-requests/{id}/reject', [DocumentRequestController::class, 'reject']);

    Route::get('/hr/employees', [EmployeeController::class, 'index']);
    Route::post('/hr/employees', [EmployeeController::class, 'store']);
    Route::get('/hr/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/hr/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/hr/employees/{id}', [EmployeeController::class, 'destroy']);
    Route::get('/hr/services/{serviceId}/supervisors', [EmployeeController::class, 'supervisorsForService']);
});
