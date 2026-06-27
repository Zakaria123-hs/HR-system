<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HRLeaveContoller extends Controller
{
    public function hrPendingRequests() {
        // Get the authenticated HR user's department service ID
        $hrServiceId = auth()->user()->id_service; 

        // 💡 FIX: Start directly from your base data table context
        $pending = DB::table('leave_requests')
            // Join employees safely
            ->join('users as employees', 'leave_requests.user_id', '=', 'employees.id')
            // Join managers/supervisors safely
            ->join('users as supervisors', 'leave_requests.supervisor_id', '=', 'supervisors.id')
            // Join leave category details
            ->join('leave_types', 'leave_requests.leave_type_id', '=', 'leave_types.id')
            
            // 1. Explicitly match the service ID of the employee
            ->where('employees.id_service', '=', $hrServiceId) 
            
            // 2. Filter by status string matches
            ->where('leave_requests.status', '=', 'pending_hr') 
            
            ->orderBy('leave_requests.created_at', 'asc') 
            ->select(
                'leave_requests.id',
                'employees.name as employee_name',
                'leave_types.name as leave_type',
                'leave_requests.start_date',
                'leave_requests.end_date',
                'leave_requests.days_count',
                'leave_requests.reason',
                'supervisors.name as supervisor_who_approved'
            )
            ->get();

        return response()->json(['hr_pending' => $pending]);
    }


    public function hrValidate(Request $request, $id) {
        $request->validate([
            'action' => 'required|in:approved,rejected'
        ]);

        // Find the specific request
        $leaveRequest = DB::table('leave_requests')->where('id', $id)->first();

        if (!$leaveRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ($leaveRequest->status !== 'pending_hr') {
            return response()->json(['message' => 'This request does not require HR validation'], 400);
        }

        // Fetch the employee details so we can use their name in the supervisor's notification
        $employee = DB::table('users')->where('id', $leaveRequest->user_id)->first();

        if ($request->action === 'approved') {
            // 1. Deduct the days from the employee's balance profile
            $balance = DB::table('leave_balances')
                ->where('user_id', $leaveRequest->user_id)
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->first();

            if ($balance) {
                DB::table('leave_balances')
                    ->where('id', $balance->id)
                    ->update([
                        'remaining_days' => $balance->remaining_days - $leaveRequest->days_count,
                        'used_days' => $balance->used_days + $leaveRequest->days_count,
                        'updated_at' => now()
                    ]);
            }

            // 2. Update Leave Request Status to final approved state
            DB::table('leave_requests')->where('id', $id)->update([
                'status' => 'approved',
                'approved_at' => now()
            ]);

            // Define messages
            $employeeMsg = "Your leave request has been fully approved by HR!";
            $supervisorMsg = "The leave request for {$employee->name} has been fully approved by HR.";
            $type = 'leave_final_approved';

        } else {
            // If rejected by HR
            DB::table('leave_requests')->where('id', $id)->update([
                'status' => 'rejected',
                'updated_at' => now()
            ]);

            // Define messages
            $employeeMsg = "Your leave request was rejected during final HR validation.";
            $supervisorMsg = "The leave request for {$employee->name} was rejected during final HR validation.";
            $type = 'leave_final_rejected';
        }

        // =========================================================
        // 🔔 HR NOTIFICATION LAYER (Sends to both targets)
        // =========================================================

        // TARGET 1: Notify the Employee
        DB::table('notifications')->insert([
            'user_id' => $leaveRequest->user_id,
            'leave_request_id' => $id,
            'type' => $type,
            'message' => $employeeMsg,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // TARGET 2: Notify the Supervisor who initiated step 1
        DB::table('notifications')->insert([
            'user_id' => $leaveRequest->supervisor_id, // Sends to the manager!
            'leave_request_id' => $id,
            'type' => $type,
            'message' => $supervisorMsg,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Request successfully processed and notifications dispatched.']);
    }
}
