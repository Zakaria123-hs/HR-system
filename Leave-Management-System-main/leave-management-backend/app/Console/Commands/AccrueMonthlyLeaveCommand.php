<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AccrueMonthlyLeaveCommand extends Command
{
    protected $signature   = 'leave:accrue-monthly';
    protected $description = 'Monthly accrual: 1.5 days base + seniority bonuses (Moroccan Labor Code).';

    public function handle(): void
    {
        $now   = Carbon::now();
        $users = DB::table('users')->whereNotNull('hired_at')->get();

        foreach ($users as $user) {
            $hired   = Carbon::parse($user->hired_at);
            $months  = $hired->diffInMonths($now);
            $years   = $hired->diffInYears($now);

            if ($months < 6) continue;

            $days = 1.5;

            // Seniority bonus applied once a year in the hiring anniversary month
            if ($hired->month === $now->month) {
                if ($years >= 10)     $days += 3.0;
                elseif ($years >= 5)  $days += 1.5;
            }

            DB::table('leave_balances')
                ->where('user_id', $user->id)
                ->where('year', $now->year)
                ->whereIn('leave_type_id',
                    DB::table('leave_types')->where('is_paid', true)->pluck('id')
                )
                ->increment('initial_days', $days);
        }

        $this->info('Monthly accrual done.');
    }
}
