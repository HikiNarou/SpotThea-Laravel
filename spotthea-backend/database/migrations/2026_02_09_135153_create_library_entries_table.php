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
        Schema::create('library_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manga_id')->constrained('mangas')->cascadeOnDelete();
            $table->enum('type', ['following', 'bookmark', 'favorites', 'to-read', 'dropped'])->index();
            $table->timestamps();

            $table->unique(['user_id', 'manga_id', 'type']);
            $table->index(['user_id', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('library_entries');
    }
};
