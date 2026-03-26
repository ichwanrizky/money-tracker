<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Helpers\Response as Res;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class JwtMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            $response = new Response();
            return Res::error($response, 'Unauthorized.', 401);
        }

        $token  = substr($authHeader, 7);
        $parts  = explode('.', $token);

        if (count($parts) !== 3) {
            $response = new Response();
            return Res::error($response, 'Token tidak valid.', 401);
        }

        $payload = json_decode(base64_decode($parts[1]), true);
        $secret  = $_ENV['JWT_SECRET'] ?? 'secret';

        // Verify signature
        $expected = base64_encode(hash_hmac('sha256', "{$parts[0]}.{$parts[1]}", $secret, true));

        if (!hash_equals($expected, $parts[2])) {
            $response = new Response();
            return Res::error($response, 'Token tidak valid.', 401);
        }

        // Cek expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            $response = new Response();
            return Res::error($response, 'Token expired.', 401);
        }

        // Inject user_id ke request
        $request = $request->withAttribute('user_id', $payload['sub']);

        return $handler->handle($request);
    }
}