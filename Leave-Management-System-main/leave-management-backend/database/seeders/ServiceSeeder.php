<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
     public function run(): void
    {
        DB::table('services')->insert([
            ['name' => 'Human Resources',      'min_active_staff' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Information Technology','min_active_staff' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Finance',               'min_active_staff' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Marketing',             'min_active_staff' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Operations',            'min_active_staff' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
