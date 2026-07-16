<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function generateToken()
        {
            QrCode::query()->delete();

            // 2. Create the single, active token
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
    public function scanToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = auth()->user();
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        // Step A: Validate the QR token security expiration
        $validToken = QrCode::where('token', $request->token)
                            ->isValid()
                            ->first();

        if (!$validToken) {
            return response()->json(['error' => 'Code QR expiré ou invalide. Veuillez réessayer.'], 422);
        }

        // Step B: Look for an existing attendance log for today
        $attendance = Attendance::where('user_id', $user->id)
                                ->where('date', $today)
                                ->first();
                                

        // 🚪 CASE 1: CLOCK IN (First scan of the day)
        if (!$attendance) {
            // Basic rule: Late if checking in after 09:00 AM
            $status = $now->format('H:i') > '09:00' ? 'late' : 'present';

            Attendance::create([
                'user_id' => $user->id,
                'date' => $today,
                'check_in' => $now,
                'status' => $status,
            ]);

            return response()->json([
                'message' => 'Pointage entrée enregistré ! Bon travail.',
                'type' => 'check_in',
                'time' => $now->format('H:i:s')
            ], 201);
        }

        // 🚪 CASE 2: CLOCK OUT (Second scan of the day)
        if ($attendance && is_null($attendance->check_out)) {
            
            $checkInTime = Carbon::parse($attendance->check_in);
            $workedMinutes = $checkInTime->diffInMinutes($now);

            $attendance->update([
                'check_out' => $now,
                'worked_minutes' => $workedMinutes,
            ]);

            return response()->json([
                'message' => 'Pointage sortie enregistré ! Bonne soirée.',
                'type' => 'check_out',
                'time' => $now->format('H:i:s'),
                'worked_minutes' => $workedMinutes
            ], 200);
        }

        // 🛑 CASE 3: Already fully clocked in and out today
        return response()->json([
            'error' => 'Vous avez déjà effectué vos pointages pour aujourd’hui.'
        ], 422);
    }
}
