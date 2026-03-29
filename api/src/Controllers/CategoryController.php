<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Response;
use Psr\Http\Message\ResponseInterface as Res;
use Psr\Http\Message\ServerRequestInterface as Req;

class CategoryController
{
    private \mysqli $db;

    public function __construct(\mysqli $db)
    {
        $this->db = $db;
    }

    public function index(Req $request, Res $response): Res
    {
        $userId = $request->getAttribute('user_id');

        $stmt = $this->db->prepare("
            SELECT DISTINCT c.id, c.name, c.icon, c.type, c.shared_to_family
            FROM categories c
            WHERE c.user_id = ?
            UNION
            SELECT DISTINCT c.id, c.name, c.icon, c.type, c.shared_to_family
            FROM categories c
            JOIN family_members fm1 ON fm1.user_id = c.user_id
            JOIN family_members fm2 ON fm2.family_id = fm1.family_id
            WHERE fm2.user_id = ?
              AND c.shared_to_family = 1
              AND fm1.kicked_at IS NULL
              AND fm2.kicked_at IS NULL
            ORDER BY type, name
        ");
        $stmt->bind_param('ii', $userId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $row['shared_to_family'] = (bool) $row['shared_to_family'];
            $categories[] = $row;
        }

        return Response::success($response, ['categories' => $categories]);
    }

    public function store(Req $request, Res $response): Res
    {
        $userId = $request->getAttribute('user_id');
        $body   = $request->getParsedBody();

        $name   = trim($body['name'] ?? '');
        $icon   = trim($body['icon'] ?? '📦');
        $type   = $body['type']   ?? 'both';
        $shared = (int) ($body['shared_to_family'] ?? 0);

        if (!$name) {
            return Response::error($response, 'Nama kategori wajib diisi.', 422);
        }

        if (!in_array($type, ['in', 'out', 'both'])) {
            return Response::error($response, 'Tipe kategori tidak valid.', 422);
        }

        $stmt = $this->db->prepare("
            INSERT INTO categories (user_id, name, icon, type, shared_to_family)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param('isssi', $userId, $name, $icon, $type, $shared);
        $stmt->execute();

        return Response::message($response, 'Kategori berhasil dibuat.', 201);
    }

    public function update(Req $request, Res $response, array $args): Res
    {
        $userId = $request->getAttribute('user_id');
        $id     = (int) $args['id'];
        $body   = $request->getParsedBody();

        $stmt = $this->db->prepare("SELECT id FROM categories WHERE id = ? AND user_id = ?");
        $stmt->bind_param('ii', $id, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            return Response::error($response, 'Kategori tidak ditemukan.', 404);
        }

        $name   = trim($body['name'] ?? '');
        $icon   = trim($body['icon'] ?? '📦');
        $type   = $body['type']   ?? 'both';
        $shared = (int) ($body['shared_to_family'] ?? 0);

        if (!$name) {
            return Response::error($response, 'Nama kategori wajib diisi.', 422);
        }

        $stmt = $this->db->prepare("
            UPDATE categories SET name = ?, icon = ?, type = ?, shared_to_family = ? WHERE id = ?
        ");
        $stmt->bind_param('sssii', $name, $icon, $type, $shared, $id);
        $stmt->execute();

        return Response::message($response, 'Kategori berhasil diupdate.');
    }

    public function destroy(Req $request, Res $response, array $args): Res
    {
        $userId = $request->getAttribute('user_id');
        $id     = (int) $args['id'];

        $stmt = $this->db->prepare("SELECT id FROM categories WHERE id = ? AND user_id = ?");
        $stmt->bind_param('ii', $id, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            return Response::error($response, 'Kategori tidak ditemukan.', 404);
        }

        $stmt = $this->db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();

        return Response::message($response, 'Kategori berhasil dihapus.');
    }
}