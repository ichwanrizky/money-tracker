<?php

declare(strict_types=1);

use Slim\App;
use App\Middleware\JwtMiddleware;

return function (App $app) {

    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Telegram webhook (public, tanpa auth)
    $app->post('/webhook/telegram', \App\Controllers\TelegramController::class . ':handle');
    $app->post('/api/auth/register', \App\Controllers\AuthController::class . ':register');
    $app->post('/api/auth/login', \App\Controllers\AuthController::class . ':login');

    $app->group('/api', function ($group) {
        // Transactions
        $group->get('/transactions',       \App\Controllers\TransactionController::class . ':index');
        $group->post('/transactions',      \App\Controllers\TransactionController::class . ':store');
        $group->put('/transactions/{id}',  \App\Controllers\TransactionController::class . ':update');
        $group->delete('/transactions/{id}', \App\Controllers\TransactionController::class . ':destroy');

        // Wallets
        $group->get('/wallets',              \App\Controllers\WalletController::class . ':index');
        $group->post('/wallets',             \App\Controllers\WalletController::class . ':store');
        $group->put('/wallets/{id}',         \App\Controllers\WalletController::class . ':update');
        $group->delete('/wallets/{id}',      \App\Controllers\WalletController::class . ':destroy');

        // Categories
        $group->get('/categories',           \App\Controllers\CategoryController::class . ':index');
        $group->post('/categories',          \App\Controllers\CategoryController::class . ':store');
        $group->put('/categories/{id}',      \App\Controllers\CategoryController::class . ':update');
        $group->delete('/categories/{id}',   \App\Controllers\CategoryController::class . ':destroy');

        // Family
        $group->get('/family',                      \App\Controllers\FamilyController::class . ':index');
        $group->post('/family',                     \App\Controllers\FamilyController::class . ':store');
        $group->post('/family/invite',              \App\Controllers\FamilyController::class . ':invite');
        $group->delete('/family/members/{userId}',  \App\Controllers\FamilyController::class . ':kick');
        $group->delete('/family',                   \App\Controllers\FamilyController::class . ':leave');

        // Profile
        $group->get('/me',       \App\Controllers\AuthController::class . ':me');
        $group->put('/profile',  \App\Controllers\AuthController::class . ':updateProfile');
        $group->put('/password', \App\Controllers\AuthController::class . ':updatePassword');
        
    })->add(new JwtMiddleware());
};