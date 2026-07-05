<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function generateToken()
    {
        // Deactivate old tokens to keep the database clean
        QrCode::where('is_active', true)->update(['is_active' => false]);

        // Create a new token that expires in 15 seconds
        $qrCode = QrCode::create([
            'token' => Str::random(64),
            'expires_at' => Carbon::now()->addSeconds(15),
            'is_active' => true,
        ]);

        return response()->json([
            'token' => $qrCode->token,
            'expires_in_seconds' => 15
        ], 200);
    }
}
