<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveRequestController extends Controller
{
    // ── Helpers ──────────────────────────────────────────────────────────────


    
    private function computeDays(string $start, string $end): int
    {
        $year = Carbon::parse($start)->year;
        
        $holidays = DB::table('holidays')
            // ✅ Use whereYear on your 'date' column instead!
            ->whereYear('date', $year) 
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $count = 0;
        foreach (CarbonPeriod::create($start, $end) as $date) {
            if ($date->isWeekend()) continue;
            if (in_array($date->toDateString(), $holidays)) continue;
            $count++;
        }
        return $count;
    }

    private function notify(int $userId, string $type, string $message, ?int $leaveRequestId = null): void
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

    // ── Employee endpoints ────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date|after_or_equal:today',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();

        // 1. 6-month service requirement
        if (!$user->hired_at || Carbon::parse($user->hired_at)->diffInMonths(now()) < 6) {
            return response()->json(['error' => 'You must have at least 6 months of service to submit a leave request.'], 403);
        }

        $days = $this->computeDays($data['start_date'], $data['end_date']);

        if ($days === 0) {
            return response()->json(['error' => 'The selected date range contains no working days.'], 422);
        }

        // 2. Overlap check
        $overlap = DB::table('leave_requests')
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending_supervisor', 'pending_hr', 'approved'])
            ->where('start_date', '<=', $data['end_date'])
            ->where('end_date', '>=', $data['start_date'])
            ->exists();

        if ($overlap) {
            return response()->json(['error' => 'You already have a leave request overlapping these dates.'], 422);
        }

        $leaveType = DB::table('leave_types')->where('id', $data['leave_type_id'])->first();

        // ── Sick leave: auto-approve, skip balance & staffing checks ─────────
        if (!$leaveType->is_paid) {
            $id = DB::table('leave_requests')->insertGetId([
                'user_id'       => $user->id,
                'leave_type_id' => $data['leave_type_id'],
                'start_date'    => $data['start_date'],
                'end_date'      => $data['end_date'],
                'days_count'    => $days,
                'status'        => 'approved',
                'reason'        => $data['reason'] ?? null,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Notify supervisor and HR
            $this->notify($user->supervisor_id, 'leave_submitted',
                "{$user->name} submitted a sick leave request ({$days} day(s)).", $id);

            $hr = DB::table('users')->where('role', 'hr')->first();
            if ($hr) {
                $this->notify($hr->id, 'leave_submitted',
                    "{$user->name} submitted a sick leave request ({$days} day(s)).", $id);
            }

            return response()->json(['message' => 'Sick leave submitted and auto-approved.'], 201);
        }

        // ── Paid leave ────────────────────────────────────────────────────────

        // 3. Balance check
        $balance = DB::table('leave_balances')
            ->where('user_id', $user->id)
            ->where('leave_type_id', $data['leave_type_id'])
            ->first();

        if (!$balance) {
            return response()->json(['error' => 'No leave balance found for this leave type.'], 422);
        }

        $remaining = $balance->initial_days - $balance->used_days;
        if ($remaining < $days) {
            return response()->json(['error' => 'Solde insuffisant.'], 422);
        }

        // 4. Staffing check
        $service = DB::table('services')->where('id', $user->service_id)->first();
        if ($service) {
            $totalStaff = DB::table('users')->where('service_id', $user->service_id)->count();
            $absent     = DB::table('leave_requests')
                ->join('users', 'leave_requests.user_id', '=', 'users.id')
                ->where('users.service_id', $user->service_id)
                ->where('leave_requests.status', 'approved')
                ->where('leave_requests.start_date', '<=', $data['end_date'])
                ->where('leave_requests.end_date', '>=', $data['start_date'])
                ->distinct('leave_requests.user_id')
                ->count('leave_requests.user_id');

            if (($totalStaff - $absent - 1) < $service->min_active_staff) {
                return response()->json(['error' => 'Effectif minimum du service non respecté.'], 422);
            }
        }

        // 5. Determine initial status:
        //    If supervisor's own supervisor is HR → go straight to pending_hr
        $supervisor        = DB::table('users')->where('id', $user->supervisor_id)->first();
        $supervisorIsHr    = $supervisor && $supervisor->role === 'hr';
        $initialStatus     = $supervisorIsHr ? 'pending_hr' : 'pending_supervisor';

        $id = DB::table('leave_requests')->insertGetId([
            'user_id'       => $user->id,
            'leave_type_id' => $data['leave_type_id'],
            'start_date'    => $data['start_date'],
            'end_date'      => $data['end_date'],
            'days_count'    => $days,
            'status'        => $initialStatus,
            'reason'        => $data['reason'] ?? null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $this->notify($user->supervisor_id, 'leave_submitted',
            "{$user->name} submitted a leave request ({$days} day(s)) awaiting your approval.", $id);

        return response()->json(['message' => 'Leave request submitted successfully.'], 201);
    }

    public function cancel($id)
    {
        $user    = auth()->user();
        $request = DB::table('leave_requests')->where('id', $id)->where('user_id', $user->id)->first();

        if (!$request) {
            return response()->json(['error' => 'Request not found.'], 404);
        }

        if (!in_array($request->status, ['pending_supervisor', 'pending_hr', 'approved'])) {
            return response()->json(['error' => 'This request cannot be cancelled.'], 422);
        }

        DB::table('leave_requests')->where('id', $id)->update([
            'status'     => 'cancelled',
            'updated_at' => now(),
        ]);

        // Restore balance if it was approved
        if ($request->status === 'approved') {
            $year = Carbon::parse($request->start_date)->year;
            DB::table('leave_balances')
                ->where('user_id', $user->id)
                ->where('leave_type_id', $request->leave_type_id)
                ->where('year', $year)
                ->decrement('used_days', $request->days_count);
        }

        // Notify supervisor and HR
        $this->notify($user->supervisor_id, 'leave_cancelled',
            "{$user->name} cancelled their leave request.", $id);

        $hr = DB::table('users')->where('role', 'hr')->first();
        if ($hr) {
            $this->notify($hr->id, 'leave_cancelled',
                "{$user->name} cancelled their leave request.", $id);
        }

        return response()->json(['message' => 'Leave request cancelled.']);
    }

    public function myRequests()
    {
        $requests = DB::table('leave_requests')
            ->join('leave_types', 'leave_requests.leave_type_id', '=', 'leave_types.id')
            ->leftJoin('users as approver', 'leave_requests.approved_by', '=', 'approver.id')
            ->where('leave_requests.user_id', auth()->id())
            ->orderByDesc('leave_requests.created_at')
            ->select(
                'leave_requests.id',
                'leave_types.name as leave_type',
                'leave_requests.start_date',
                'leave_requests.end_date',
                'leave_requests.days_count',
                'leave_requests.status',
                'leave_requests.reason',
                'leave_requests.rejection_reason',
                'approver.name as approved_by',
                'leave_requests.created_at',
            )
            ->get();

        return response()->json(['my_requests' => $requests]);
    }

    public function myBalances()
    {
        $year     = now()->year;
        $balances = DB::table('leave_balances')
            ->join('leave_types', 'leave_balances.leave_type_id', '=', 'leave_types.id')
            ->where('leave_balances.user_id', auth()->id())
            ->where('leave_balances.year', $year)
            ->select(
                'leave_types.name as leave_type',
                'leave_balances.initial_days',
                'leave_balances.used_days',
                DB::raw('(leave_balances.initial_days - leave_balances.used_days) as remaining_days')
            )
            ->get();

        return response()->json(['balances' => $balances]);
    }

    public function dashboardData()
    {
        $user = auth()->user();
        $year = now()->year;

        $service = DB::table('services')->where('id', $user->service_id)->value('name');

        $stats = DB::table('leave_requests')
            ->where('user_id', $user->id)
            ->selectRaw("
                SUM(CASE WHEN status = 'approved' THEN days_count ELSE 0 END) as days_approved,
                SUM(CASE WHEN status IN ('pending_supervisor','pending_hr') THEN days_count ELSE 0 END) as days_awaiting
            ")
            ->first();

        $remaining = DB::table('leave_balances')
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->selectRaw('SUM(initial_days - used_days) as remaining')
            ->value('remaining') ?? 0;

        return response()->json([
            'general_info' => [
                'name'    => $user->name,
                'role'    => $user->role,
                'email'   => $user->email,
                'service' => $service ?? 'N/A',
            ],
            'time_off' => [
                'days_approved'  => (int) ($stats->days_approved ?? 0),
                'days_awaiting'  => (int) ($stats->days_awaiting ?? 0),
                'days_remaining' => (int) $remaining,
            ],
        ]);
    }

    public function getTeam()
    {
        $user  = auth()->user();
        $query = DB::table('users')
            ->leftJoin('services', 'users.service_id', '=', 'services.id')
            ->where('users.id', '!=', $user->id)
            ->select('users.id', 'users.name', 'users.email', 'users.role', 'users.supervisor_id', 'services.name as service');

        if ($user->role !== 'hr') {
            $query->where('users.service_id', $user->service_id);
        }

        $team = $query->get()->map(fn($m) => [
            ...(array) $m,
            'is_my_supervisor' => $m->supervisor_id === null ? false : ($m->id === $user->supervisor_id),
        ]);

        return response()->json($team);
    }

    public function holidays()
    {
        $holidays = DB::table('holidays')->orderBy('date')->get();
        return response()->json(['holidays' => $holidays]);
    }

    public function leaveTypes()
    {
        return response()->json(DB::table('leave_types')->get());
    }
}
