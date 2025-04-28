<?php

use App\Http\Controllers\CrawlerController;

Route::post('/run-crawler', [CrawlerController::class, 'runCrawler']);
