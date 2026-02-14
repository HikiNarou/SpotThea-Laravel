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
        Schema::create('mangas', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('alt_title')->nullable();
            $table->longText('synopsis');
            $table->enum('status', ['ongoing', 'completed', 'hiatus'])->default('ongoing')->index();
            $table->enum('type', ['manga', 'manhwa', 'manhua'])->default('manga')->index();
            $table->enum('content_rating', ['safe', 'mature'])->default('safe')->index();
            $table->unsignedSmallInteger('year')->nullable()->index();
            $table->string('author')->nullable();
            $table->string('artist')->nullable();
            $table->string('serialization')->nullable();
            $table->string('cover_url');
            $table->string('banner_url');
            $table->unsignedInteger('chapter_count')->default(0);
            $table->decimal('base_rating', 3, 2)->default(0);
            $table->unsignedInteger('base_rating_count')->default(0);
            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('followers')->default(0);
            $table->unsignedInteger('featured_rank')->nullable()->index();
            $table->unsignedInteger('popular_rank')->default(999)->index();
            $table->timestamp('updated_content_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mangas');
    }
};
