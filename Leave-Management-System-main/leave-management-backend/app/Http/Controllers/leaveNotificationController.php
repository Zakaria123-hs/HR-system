<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class leaveNotificationController extends Controller
{
    public function myNotifications() {
        $notifications = DB::table('notifications')
            ->where('user_id', auth()->id()) 
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')   
            ->select(
                'id',
                'message',
                'type',
                'read_at',
                'created_at'
            )
            ->get();

        return response()->json([
            'status' => 'success',
            'notifications' => $notifications
        ]);
    }
    public function readNotification($id) 
    {
        // 💡 FIX: Cast to integer if your DB auto-increments IDs, or keep string if using UUIDs

        $updated = DB::table('notifications') 
            ->where('id', (string) $id)
            ->where('user_id', auth()->id())
            ->update(['read_at' => now()]);

        // Log this to your storage/logs/laravel.log so we can see exactly how many rows changed
        

        return response()->json([
            'message' => 'Notification processed',
            'rows_affected' => $updated // 💡 If this says 0, the where clauses didn't match anything!
        ]);
    }
}
