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
        Schema::table('chapters', function (Blueprint $table) {
            $table->boolean('is_oneshot')->default(false)->after('title')->index();
            $table->decimal('volume_number', 8, 2)->nullable()->after('is_oneshot');
            $table->string('translation_language', 10)->default('id')->after('volume_number')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            $table->dropIndex(['is_oneshot']);
            $table->dropIndex(['translation_language']);
            $table->dropColumn(['is_oneshot', 'volume_number', 'translation_language']);
        });
    }
};
