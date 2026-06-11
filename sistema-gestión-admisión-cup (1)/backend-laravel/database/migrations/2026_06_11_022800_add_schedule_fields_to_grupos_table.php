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
        Schema::table('grupos', function (Blueprint $table) {
            $table->string('modulo', 10)->nullable();
            $table->string('aula', 10)->nullable();
            $table->string('hora_inicio', 10)->nullable();
            $table->string('hora_fin', 10)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grupos', function (Blueprint $table) {
            $table->dropColumn(['modulo', 'aula', 'hora_inicio', 'hora_fin']);
        });
    }
};
