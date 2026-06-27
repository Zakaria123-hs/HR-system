<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HolidaysSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\Holiday::insert([
            ['name' => 'Manifesto of Independence', 'date' => '2026-01-11'],
            ['name' => 'Labor Day', 'date' => '2026-05-01'],
            ['name' => 'Throne Day', 'date' => '2026-07-30'],
            ['name' => 'Green March', 'date' => '2026-11-06'],
            ['name' => 'Independence Day', 'date' => '2026-11-18'],
        ]);
    }
}