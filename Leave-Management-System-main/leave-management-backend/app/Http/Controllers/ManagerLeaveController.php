<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManagerLeaveController extends Controller
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
            ->whereIn('leave_requests.status', ['pending_supervisor', 'rejected'])
            ->where('users.supervisor_id', auth()->id())
            ->orderBy('leave_requests.created_at')
            ->select(
                'leave_requests.*',
                'users.name as employee_name',
                'leave_types.name as leave_type_label',
            )
            ->get();

        return response()->json(['pending_req' => $pending]);
    }

    public function approve($id)
    {
        return DB::transaction(function () use ($id) {
            $req = DB::table('leave_requests')->where('id', $id)->lockForUpdate()->first();

            if (!$req || $req->status !== 'pending_supervisor') {
                return response()->json(['error' => 'Request not found or not pending supervisor approval.'], 422);
            }

            // Verify this supervisor owns this request
            $employee = DB::table('users')->where('id', $req->user_id)->first();
            if ($employee->supervisor_id !== auth()->id()) {
                return response()->json(['error' => 'Unauthorized.'], 403);
            }

            DB::table('leave_requests')->where('id', $id)->update([
                'status'     => 'pending_hr',
                'updated_at' => now(),
            ]);

            // Notify employee
            $this->notify($req->user_id, 'leave_approved',
                'Your leave request has been approved by your supervisor and is pending final HR validation.', $id);

            // Notify HR
            $hr = DB::table('users')->where('role', 'hr')->first();
            if ($hr) {
                $this->notify($hr->id, 'leave_submitted',
                    "{$employee->name}'s leave request has been approved by their supervisor and requires your final validation.", $id);
            }

            return response()->json(['message' => 'Approved. Forwarded to HR.']);
        });
    }

    public function reject(Request $request, $id)
    {
        $request->validate(['rejection_reason' => 'required|string|max:500']);

        return DB::transaction(function () use ($request, $id) {
            $req = DB::table('leave_requests')->where('id', $id)->lockForUpdate()->first();

            if (!$req || $req->status !== 'pending_supervisor') {
                return response()->json(['error' => 'Request not found or not pending supervisor approval.'], 422);
            }

            $employee = DB::table('users')->where('id', $req->user_id)->first();
            if ($employee->supervisor_id !== auth()->id()) {
                return response()->json(['error' => 'Unauthorized.'], 403);
            }

            DB::table('leave_requests')->where('id', $id)->update([
                'status'           => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'updated_at'       => now(),
            ]);

            $this->notify($req->user_id, 'leave_rejected',
                'Your leave request has been rejected by your supervisor.', $id);

            return response()->json(['message' => 'Request rejected.']);
        });
    }
}
