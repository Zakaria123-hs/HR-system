<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UpdateUserHiringDatesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get all your existing users from the database
        $users = DB::table('users')->get();

        if ($users->isEmpty()) {
            $this->command->info('No users found to update. Run your UserSeeder first!');
            return;
        }

        // 2. Loop through users and assign different dates to test different laws
        foreach ($users as $index => $user) {
            
            if ($index === 0) {
                // ❌ Test Case 1: New employee (Hired 2 months ago) -> Should be blocked by the 6-month rule
                $hiredAt = Carbon::now()->subMonths(2)->format('Y-m-d');
            } 
            elseif ($index === 1) {
                //  Test Case 2: Mid-senior employee (Hired 6 years ago) -> Qualifies for 5-year seniority bonus
                $hiredAt = Carbon::now()->subYears(6)->format('Y-m-d');
            } 
            elseif ($index === 2) {
                // 🌟 Test Case 3: Very senior employee (Hired 12 years ago) -> Qualifies for 10-year seniority bonus
                $hiredAt = Carbon::now()->subYears(12)->format('Y-m-d');
            } 
            else {
                // Normal Employee (Hired 1.5 years ago) -> Clear of 6-month rule, no seniority bonus yet
                $hiredAt = Carbon::now()->subMonths(18)->format('Y-m-d');
            }

            // 3. Update the specific user row with raw SQL/Query Builder
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'hired_at' => $hiredAt,
                    'updated_at' => now(),
                ]);
        }

        $this->command->info('Successfully updated user hiring dates with Moroccan Labor Code test cases!');
    }
}