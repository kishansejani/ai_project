<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectAnalyzerController;
use App\Http\Controllers\Api\PatelChatController;
use App\Http\Controllers\Api\CodeGeneratorController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Projects API
Route::apiResource('projects', ProjectController::class);
Route::post('projects/analyze', [ProjectAnalyzerController::class, 'analyze']);
Route::post('projects/file-content', [ProjectAnalyzerController::class, 'getFileContent']);

// Patel Chat API
Route::get('conversations', [PatelChatController::class, 'getConversations']);
Route::post('conversations', [PatelChatController::class, 'createConversation']);
Route::get('conversations/{id}/messages', [PatelChatController::class, 'getMessages']);
Route::post('chat', [PatelChatController::class, 'chat']);

// Code Generator API
Route::post('generate-crud', [CodeGeneratorController::class, 'generateCrud']);
