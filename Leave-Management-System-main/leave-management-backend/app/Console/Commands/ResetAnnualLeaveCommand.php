<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetAnnualLeaveCommand extends Command
{
    protected $signature   = 'leave:reset-annual';
    protected $description = 'Creates new leave_balances rows for the new year for all active users.';

    public function handle(): void
    {
        $year      = now()->year;
        $users     = DB::table('users')->get();
        $paidTypes = DB::table('leave_types')->where('is_paid', true)->pluck('id');

        $rows = [];
        foreach ($users as $user) {
            foreach ($paidTypes as $typeId) {
                $exists = DB::table('leave_balances')
                    ->where('user_id', $user->id)
                    ->where('leave_type_id', $typeId)
                    ->where('year', $year)
                    ->exists();

                if (!$exists) {
                    $rows[] = [
                        'user_id'       => $user->id,
                        'leave_type_id' => $typeId,
                        'year'          => $year,
                        'initial_days'  => 18,
                        'used_days'     => 0,
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ];
                }
            }
        }

        if ($rows) {
            DB::table('leave_balances')->insert($rows);
        }

        $this->info("Annual leave balances created for {$year}.");
    }
}
