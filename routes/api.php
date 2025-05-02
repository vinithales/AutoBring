<?php

use App\Http\Controllers\CrawlerController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::post('/runCrawler', [CrawlerController::class, 'runCrawler']);


