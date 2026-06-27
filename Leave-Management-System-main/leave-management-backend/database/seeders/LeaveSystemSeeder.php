<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LeaveSystemSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Sample Leave Types
        $types = [
            [
                'name' => 'Annual Leave',
                'is_paid' => true,
                'max_days' => 18,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sick Leave',
                'is_paid' => false,
                'max_days' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Maternity/Paternity',
                'is_paid' => true,
                'max_days' => 90,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('leave_types')->insert($types);

        // 2. Assign balances for all users for balance-based leave types
        $balanceBasedTypes = DB::table('leave_types')->where('is_paid', true)->get();
        $users = DB::table('users')->get();

        $balances = [];
        foreach ($users as $user) {
            foreach ($balanceBasedTypes as $type) {
                $balances[] = [
                    'user_id'       => $user->id,
                    'leave_type_id' => $type->id,
                    'initial_days'=> $type->max_days,
                    'used_days'     => 0,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            }
        }

        DB::table('leave_balances')->insert($balances);
    }
}
