<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['service']); // old string column, replaced by service_id FK
        });

        Schema::table('users', function (Blueprint $table) {
            // Change role from plain string to enum
            $table->enum('role', ['employee', 'supervisor', 'hr'])->default('employee')->change();

            $table->date('hired_at')->nullable()->after('password');
            $table->string('level')->nullable()->after('role');
            $table->foreignId('service_id')->nullable()->after('level')->constrained('services')->nullOnDelete();
            $table->foreignId('supervisor_id')->nullable()->after('service_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn(['hired_at', 'level', 'service_id', 'supervisor_id']);
            $table->string('role')->change();
            $table->string('service')->nullable();
        });
    }
};
