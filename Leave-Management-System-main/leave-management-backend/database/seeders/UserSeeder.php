<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */

    public function run(): void
    {
        // Step 1: Insert supervisors first (no supervisor_id dependency)
        $ahmed = DB::table('users')->insertGetId([
            'name'         => 'Ahmed supervisor',
            'email'        => 'ahmed@supervisor.com',
            'password'     => Hash::make('password'),
            'role'         => 'supervisor',
            'service_id'   => 2,
            'supervisor_id'=> null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $kenza = DB::table('users')->insertGetId([
            'name'         => 'Kenza supervisor',
            'email'        => 'kenza@supervisor.com',
            'password'     => Hash::make('password'),
            'role'         => 'supervisor',
            'service_id'   => 2,
            'supervisor_id'=> null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // Step 2: Insert an HR user
        DB::table('users')->insert([
            'name'         => 'HR Manager',
            'email'        => 'hr@company.com',
            'password'     => Hash::make('password'),
            'role'         => 'hr',
            'service_id'   => 1,
            'supervisor_id'=> null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // Step 3: Insert employees referencing real supervisor IDs
        DB::table('users')->insert([
            [
                'name'         => 'Sara employee',
                'email'        => 'sara@employee.com',
                'password'     => Hash::make('password'),
                'role'         => 'employee',
                'service_id'   => 1,
                'supervisor_id'=> $ahmed,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'name'         => 'Youssef Employee',
                'email'        => 'youssef@employee.com',
                'password'     => Hash::make('password'),
                'role'         => 'employee',
                'service_id'   => 2,
                'supervisor_id'=> $ahmed,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'name'         => 'Karim Employee',
                'email'        => 'karim@employee.com',
                'password'     => Hash::make('password'),
                'role'         => 'employee',
                'service_id'   => 2,
                'supervisor_id'=> $ahmed,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'name'         => 'Otman employee',
                'email'        => 'otman@employee.com',
                'password'     => Hash::make('password'),
                'role'         => 'employee',
                'service_id'   => 1,
                'supervisor_id'=> $kenza,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'name'         => 'Hatim Employee',
                'email'        => 'hatim@employee.com',
                'password'     => Hash::make('password'),
                'role'         => 'employee',
                'service_id'   => 2,
                'supervisor_id'=> $kenza,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'name'         => 'Yassmin Employee',
                'email'        => 'yassmin@employee.com',
                'password'     => Hash::make('password'),
                'role'         => 'employee',
                'service_id'   => 2,
                'supervisor_id'=> $kenza,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
        ]);
    }
}

