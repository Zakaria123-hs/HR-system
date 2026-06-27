<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// Automatically runs the command at midnight on the 1st day of every single month
Schedule::command('leave:accrue-monthly')->monthlyOn(1, '00:00');