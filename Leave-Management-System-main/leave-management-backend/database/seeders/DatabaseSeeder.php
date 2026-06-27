<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Services ───────────────────────────────────────────────────────
        $itId  = DB::table('services')->insertGetId(['name' => 'IT Department',  'min_active_staff' => 2, 'created_at' => now(), 'updated_at' => now()]);
        $hrId  = DB::table('services')->insertGetId(['name' => 'HR Department',  'min_active_staff' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $finId = DB::table('services')->insertGetId(['name' => 'Finance',        'min_active_staff' => 2, 'created_at' => now(), 'updated_at' => now()]);

        // ── 2. Leave types ────────────────────────────────────────────────────
        $annualId     = DB::table('leave_types')->insertGetId(['name' => 'Annual Leave',          'is_paid' => true,  'requires_justification' => false, 'max_days' => 30,  'created_at' => now(), 'updated_at' => now()]);
        $sickId       = DB::table('leave_types')->insertGetId(['name' => 'Sick Leave',            'is_paid' => false, 'requires_justification' => true,  'max_days' => null,'created_at' => now(), 'updated_at' => now()]);
        $maternityId  = DB::table('leave_types')->insertGetId(['name' => 'Maternity/Paternity',   'is_paid' => true,  'requires_justification' => true,  'max_days' => 90,  'created_at' => now(), 'updated_at' => now()]);

        // ── 3. Moroccan public holidays 2025 & 2026 ───────────────────────────
        $holidays = [
            ['name' => 'New Year\'s Day',         'date' => '2025-01-01', 'year' => 2025],
            ['name' => 'Proclamation of Independence', 'date' => '2025-01-11', 'year' => 2025],
            ['name' => 'Labour Day',              'date' => '2025-05-01', 'year' => 2025],
            ['name' => 'Throne Day',              'date' => '2025-07-30', 'year' => 2025],
            ['name' => 'Oued Ed-Dahab Day',       'date' => '2025-08-14', 'year' => 2025],
            ['name' => 'Revolution Day',          'date' => '2025-08-20', 'year' => 2025],
            ['name' => 'Youth Day',               'date' => '2025-08-21', 'year' => 2025],
            ['name' => 'Green March',             'date' => '2025-11-06', 'year' => 2025],
            ['name' => 'Independence Day',        'date' => '2025-11-18', 'year' => 2025],
            ['name' => 'New Year\'s Day',         'date' => '2026-01-01', 'year' => 2026],
            ['name' => 'Proclamation of Independence', 'date' => '2026-01-11', 'year' => 2026],
            ['name' => 'Labour Day',              'date' => '2026-05-01', 'year' => 2026],
            ['name' => 'Throne Day',              'date' => '2026-07-30', 'year' => 2026],
            ['name' => 'Oued Ed-Dahab Day',       'date' => '2026-08-14', 'year' => 2026],
            ['name' => 'Revolution Day',          'date' => '2026-08-20', 'year' => 2026],
            ['name' => 'Youth Day',               'date' => '2026-08-21', 'year' => 2026],
            ['name' => 'Green March',             'date' => '2026-11-06', 'year' => 2026],
            ['name' => 'Independence Day',        'date' => '2026-11-18', 'year' => 2026],
        ];
        foreach ($holidays as &$h) { $h['created_at'] = now(); $h['updated_at'] = now(); }
        DB::table('holidays')->insert($holidays);

        // ── 4. Documents ──────────────────────────────────────────────────────
        DB::table('documents')->insert([
            ['name' => 'Employment Certificate', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Salary Certificate',     'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Work Attestation',       'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── 5. Users ──────────────────────────────────────────────────────────
        // HR (no supervisor)
        $hrUserId = DB::table('users')->insertGetId([
            'name'          => 'Nadia HR',
            'email'         => 'nadia@company.com',
            'password'      => Hash::make('password'),
            'role'          => 'hr',
            'hired_at'      => '2018-03-01',
            'service_id'    => $hrId,
            'supervisor_id' => null,
            'created_at'    => now(), 'updated_at' => now(),
        ]);

        // Supervisors (their supervisor = HR user)
        $supItId = DB::table('users')->insertGetId([
            'name'          => 'Ahmed Supervisor',
            'email'         => 'ahmed@company.com',
            'password'      => Hash::make('password'),
            'role'          => 'supervisor',
            'hired_at'      => '2019-06-15',
            'service_id'    => $itId,
            'supervisor_id' => $hrUserId,
            'created_at'    => now(), 'updated_at' => now(),
        ]);

        $supFinId = DB::table('users')->insertGetId([
            'name'          => 'Kenza Supervisor',
            'email'         => 'kenza@company.com',
            'password'      => Hash::make('password'),
            'role'          => 'supervisor',
            'hired_at'      => '2020-01-10',
            'service_id'    => $finId,
            'supervisor_id' => $hrUserId,
            'created_at'    => now(), 'updated_at' => now(),
        ]);

        // Employees
        $employees = [
            ['name' => 'Sara Employee',    'email' => 'sara@company.com',    'service_id' => $itId,  'supervisor_id' => $supItId,  'hired_at' => '2023-01-15'],
            ['name' => 'Youssef Employee', 'email' => 'youssef@company.com', 'service_id' => $itId,  'supervisor_id' => $supItId,  'hired_at' => '2022-07-01'],
            ['name' => 'Karim Employee',   'email' => 'karim@company.com',   'service_id' => $itId,  'supervisor_id' => $supItId,  'hired_at' => '2021-09-20'],
            ['name' => 'Otman Employee',   'email' => 'otman@company.com',   'service_id' => $finId, 'supervisor_id' => $supFinId, 'hired_at' => '2023-03-05'],
            ['name' => 'Hatim Employee',   'email' => 'hatim@company.com',   'service_id' => $finId, 'supervisor_id' => $supFinId, 'hired_at' => '2022-11-11'],
            ['name' => 'Yasmine Employee', 'email' => 'yasmine@company.com', 'service_id' => $finId, 'supervisor_id' => $supFinId, 'hired_at' => '2024-01-08'],
        ];

        $allUserIds = [$hrUserId, $supItId, $supFinId];
        foreach ($employees as $emp) {
            $allUserIds[] = DB::table('users')->insertGetId(array_merge($emp, [
                'password'   => Hash::make('password'),
                'role'       => 'employee',
                'created_at' => now(), 'updated_at' => now(),
            ]));
        }

        // ── 6. Leave balances (current year, all paid types, all users) ───────
        $year      = now()->year;
        $paidTypes = [$annualId, $maternityId];
        $balances  = [];
        foreach ($allUserIds as $uid) {
            foreach ($paidTypes as $tid) {
                $balances[] = [
                    'user_id'       => $uid,
                    'leave_type_id' => $tid,
                    'year'          => $year,
                    'initial_days'  => 18,
                    'used_days'     => 0,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            }
        }
        DB::table('leave_balances')->insert($balances);
    }
}
