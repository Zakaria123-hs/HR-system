<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = DB::table('users')
            ->leftJoin('services', 'users.service_id', '=', 'services.id')
            ->leftJoin('users as supervisors', 'users.supervisor_id', '=', 'supervisors.id')
            ->select(
                'users.id', 'users.name', 'users.email', 'users.role',
                'users.hired_at', 'users.level',
                'services.name as service',
                'supervisors.name as supervisor',
            )
            ->orderBy('users.name')
            ->get();

        return response()->json(['employees' => $employees]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:8',
            'role'          => 'required|in:employee,supervisor,hr',
            'hired_at'      => 'nullable|date',
            'level'         => 'nullable|string|max:100',
            'service_id'    => 'required|exists:services,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        // Supervisors must come from the same service
        if (!empty($data['supervisor_id'])) {
            $sup = DB::table('users')->where('id', $data['supervisor_id'])->first();
            if (!$sup || $sup->role !== 'supervisor' || $sup->service_id != $data['service_id']) {
                return response()->json(['error' => 'Supervisor must be a supervisor in the same service.'], 422);
            }
        }

        $userId = DB::table('users')->insertGetId([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => Hash::make($data['password']),
            'role'          => $data['role'],
            'hired_at'      => $data['hired_at'] ?? null,
            'level'         => $data['level'] ?? null,
            'service_id'    => $data['service_id'],
            'supervisor_id' => $data['supervisor_id'] ?? null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Initialize leave balances for current year for all paid leave types
        $year       = now()->year;
        $paidTypes  = DB::table('leave_types')->where('is_paid', true)->get();
        $balances   = [];
        foreach ($paidTypes as $type) {
            $balances[] = [
                'user_id'       => $userId,
                'leave_type_id' => $type->id,
                'year'          => $year,
                'initial_days'  => 18,
                'used_days'     => 0,
                'created_at'    => now(),
                'updated_at'    => now(),
            ];
        }
        if ($balances) {
            DB::table('leave_balances')->insert($balances);
        }

        return response()->json(['message' => 'Employee created.', 'id' => $userId], 201);
    }

    public function show($id)
    {
        $employee = DB::table('users')
            ->leftJoin('services', 'users.service_id', '=', 'services.id')
            ->leftJoin('users as supervisors', 'users.supervisor_id', '=', 'supervisors.id')
            ->where('users.id', $id)
            ->select(
                'users.id', 'users.name', 'users.email', 'users.role',
                'users.hired_at', 'users.level', 'users.service_id', 'users.supervisor_id',
                'services.name as service',
                'supervisors.name as supervisor',
            )
            ->first();

        if (!$employee) {
            return response()->json(['error' => 'Employee not found.'], 404);
        }

        return response()->json(['employee' => $employee]);
    }

    public function update(Request $request, $id)
    {
        $employee = DB::table('users')->where('id', $id)->first();
        if (!$employee) {
            return response()->json(['error' => 'Employee not found.'], 404);
        }

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => "sometimes|email|unique:users,email,{$id}",
            'role'          => 'sometimes|in:employee,supervisor,hr',
            'hired_at'      => 'nullable|date',
            'level'         => 'nullable|string|max:100',
            'service_id'    => 'sometimes|exists:services,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        $serviceId = $data['service_id'] ?? $employee->service_id;

        if (!empty($data['supervisor_id'])) {
            $sup = DB::table('users')->where('id', $data['supervisor_id'])->first();
            if (!$sup || $sup->role !== 'supervisor' || $sup->service_id != $serviceId) {
                return response()->json(['error' => 'Supervisor must be a supervisor in the same service.'], 422);
            }
        }

        DB::table('users')->where('id', $id)->update(array_merge($data, ['updated_at' => now()]));

        return response()->json(['message' => 'Employee updated.']);
    }

    public function destroy($id)
    {
        $deleted = DB::table('users')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['error' => 'Employee not found.'], 404);
        }
        return response()->json(['message' => 'Employee deleted.']);
    }

    public function supervisorsForService($serviceId)
    {
        $supervisors = DB::table('users')
            ->where('service_id', $serviceId)
            ->where('role', 'supervisor')
            ->select('id', 'name')
            ->get();

        return response()->json(['supervisors' => $supervisors]);
    }
}
