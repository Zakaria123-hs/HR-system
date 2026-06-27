<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HRLeaveController extends Controller
{
    private function notify(int $userId, string $type, string $message, int $leaveRequestId): void
    {
        DB::table('notifications')->insert([
            'user_id'          => $userId,
            'leave_request_id' => $leaveRequestId,
            'type'             => $type,
            'message'          => $message,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    public function pendingRequests()
    {
        $pending = DB::table('leave_requests')
            ->join('users', 'leave_requests.user_id', '=', 'users.id')
            ->join('leave_types', 'leave_requests.leave_type_id', '=', 'leave_types.id')
            ->whereIn('leave_requests.status', ['pending_hr', 'rejected'])
            ->orderBy('leave_requests.created_at')
            ->select(
                'leave_requests.id',
                'users.name as employee_name',
                'leave_types.name as leave_type',
                'leave_requests.start_date',
                'leave_requests.end_date',
                'leave_requests.days_count',
                'leave_requests.reason',
                'leave_requests.rejection_reason',
                'leave_requests.status',
                'leave_requests.created_at',
            )
            ->get();

        return response()->json(['pending' => $pending]);
    }

    public function approve($id)
    {
        return DB::transaction(function () use ($id) {
            $req = DB::table('leave_requests')->where('id', $id)->lockForUpdate()->first();

            if (!$req || $req->status !== 'pending_hr') {
                return response()->json(['error' => 'Request not found or not pending HR approval.'], 422);
            }

            $year = Carbon::parse($req->start_date)->year;

            // Deduct balance
            $balance = DB::table('leave_balances')
                ->where('user_id', $req->user_id)
                ->where('leave_type_id', $req->leave_type_id)
                ->where('year', $year)
                ->first();

            if ($balance) {
                if (($balance->initial_days - $balance->used_days) < $req->days_count) {
                    return response()->json(['error' => 'Solde insuffisant.'], 422);
                }
                DB::table('leave_balances')
                    ->where('id', $balance->id)
                    ->increment('used_days', $req->days_count);
            }

            DB::table('leave_requests')->where('id', $id)->update([
                'status'      => 'approved',
                'approved_by' => auth()->id(),
                'updated_at'  => now(),
            ]);

            $this->notify($req->user_id, 'leave_approved',
                'Your leave request has been fully approved by HR.', $id);

            return response()->json(['message' => 'Leave request approved.']);
        });
    }

    public function reject(Request $request, $id)
    {
        $request->validate(['rejection_reason' => 'required|string|max:500']);

        return DB::transaction(function () use ($request, $id) {
            $req = DB::table('leave_requests')->where('id', $id)->lockForUpdate()->first();

            if (!$req || $req->status !== 'pending_hr') {
                return response()->json(['error' => 'Request not found or not pending HR approval.'], 422);
            }

            DB::table('leave_requests')->where('id', $id)->update([
                'status'           => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'updated_at'       => now(),
            ]);

            $this->notify($req->user_id, 'leave_rejected',
                'Your leave request has been rejected by HR.', $id);

            return response()->json(['message' => 'Leave request rejected.']);
        });
    }
}
