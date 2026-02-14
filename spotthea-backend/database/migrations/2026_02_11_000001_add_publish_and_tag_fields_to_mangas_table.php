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
        Schema::table('mangas', function (Blueprint $table): void {
            $table->string('original_language', 12)->nullable()->after('serialization')->index();
            $table->json('content_warnings')->nullable()->after('original_language');
            $table->json('formats')->nullable()->after('content_warnings');
            $table->boolean('is_published')->default(true)->after('formats')->index();
            $table->timestamp('publish_at')->nullable()->after('is_published')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mangas', function (Blueprint $table): void {
            $table->dropColumn([
                'original_language',
                'content_warnings',
                'formats',
                'is_published',
                'publish_at',
            ]);
        });
    }
};
