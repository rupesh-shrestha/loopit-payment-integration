<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application.
|
*/

// Loopit Payment Method SDK Integration Guide
Route::get('/', function () {
    return view('integration.index');
});

// Live Demo
Route::get('/demo', function () {
    return view('integration.demo');
});
