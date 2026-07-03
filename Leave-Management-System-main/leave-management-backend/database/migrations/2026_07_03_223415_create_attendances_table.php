<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('attendances', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->date('date');
        $table->timestamp('check_in')->nullable();
        $table->timestamp('check_out')->nullable();
        $table->unsignedInteger('worked_minutes')->default(0);
        $table->string('status')->default('present'); // present, late, absent
        $table->timestamps();

        // One entry per user per day to keep data integrity clean
        $table->unique(['user_id', 'date']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
