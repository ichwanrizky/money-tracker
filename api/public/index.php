<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpMethodNotAllowedException;

require __DIR__ . '/../vendor/autoload.php';

// Load .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

$debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';

// Set error reporting
if ($debug) {
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

date_default_timezone_set('Asia/Jakarta');

// Container
$containerBuilder = new ContainerBuilder();
$containerBuilder->addDefinitions(__DIR__ . '/../src/container.php');
$container = $containerBuilder->build();

// App
AppFactory::setContainer($container);
$app = AppFactory::create();

// Middleware
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();

// Error Middleware
$errorMiddleware = $app->addErrorMiddleware($debug, true, true);

// Custom JSON error handler — hanya saat production
if (!$debug) {
    $errorMiddleware->setDefaultErrorHandler(function (
        $request,
        \Throwable $exception,
        bool $displayErrorDetails
    ) use ($app) {
        $status  = 500;
        $message = 'Terjadi kesalahan pada server.';

        if ($exception instanceof HttpNotFoundException) {
            $status  = 404;
            $message = 'Endpoint tidak ditemukan.';
        } elseif ($exception instanceof HttpMethodNotAllowedException) {
            $allowedMethods = $exception->getAllowedMethods();
            if (count($allowedMethods) === 1 && in_array('OPTIONS', $allowedMethods)) {
                $status  = 404;
                $message = 'Endpoint tidak ditemukan.';
            } else {
                $status  = 405;
                $message = 'Method tidak diizinkan.';
            }
        }

        $payload = ['success' => false, 'message' => $message];
        $response = $app->getResponseFactory()->createResponse($status);
        $response->getBody()->write(json_encode($payload));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    });
}

// CORS
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// Routes
(require __DIR__ . '/../src/Routes/api.php')($app);

$app->run();