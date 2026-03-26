<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Response;
use Psr\Http\Message\ResponseInterface as Res;
use Psr\Http\Message\ServerRequestInterface as Req;

class FamilyController
{
    private \mysqli $db;

    public function __construct(\mysqli $db)
    {
        $this->db = $db;
    }

    // GET /family — info family user saat ini
    public function index(Req $request, Res $response): Res
    {
        $userId = $request->getAttribute('user_id');

        // Cari family user
        $stmt = $this->db->prepare("
            SELECT f.id, f.name, f.master_user_id, f.created_at
            FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE fm.user_id = ? AND fm.kicked_at IS NULL
            LIMIT 1
        ");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $family = $stmt->get_result()->fetch_assoc();

        if (!$family) {
            return Response::success($response, ['family' => null]);
        }

        // Ambil members
        $stmt = $this->db->prepare("
            SELECT u.id, u.username, u.display_name, u.email,
                   fm.joined_at, fm.kicked_at,
                   (f.master_user_id = u.id) as is_master
            FROM family_members fm
            JOIN users u ON u.id = fm.user_id
            JOIN families f ON f.id = fm.family_id
            WHERE fm.family_id = ?
            ORDER BY fm.joined_at ASC
        ");
        $stmt->bind_param('i', $family['id']);
        $stmt->execute();
        $result = $stmt->get_result();

        $members = [];
        while ($row = $result->fetch_assoc()) {
            $row['is_master'] = (bool) $row['is_master'];
            $members[] = $row;
        }

        $family['is_master'] = (int) $family['master_user_id'] === (int) $userId;
        $family['members']   = $members;

        return Response::success($response, ['family' => $family]);
    }

    // POST /family — buat family baru
    public function store(Req $request, Res $response): Res
    {
        $userId = $request->getAttribute('user_id');
        $body   = $request->getParsedBody();
        $name   = trim($body['name'] ?? '');

        if (!$name) {
            return Response::error($response, 'Nama family wajib diisi.', 422);
        }

        // Cek sudah punya family
        $stmt = $this->db->prepare("
            SELECT fm.id FROM family_members fm
            WHERE fm.user_id = ? AND fm.kicked_at IS NULL
        ");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return Response::error($response, 'Kamu sudah tergabung dalam sebuah family.', 422);
        }

        $this->db->begin_transaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO families (name, master_user_id) VALUES (?, ?)");
            $stmt->bind_param('si', $name, $userId);
            $stmt->execute();
            $familyId = $this->db->insert_id;

            $stmt = $this->db->prepare("INSERT INTO family_members (family_id, user_id) VALUES (?, ?)");
            $stmt->bind_param('ii', $familyId, $userId);
            $stmt->execute();

            $this->db->commit();
            return Response::message($response, 'Family berhasil dibuat.', 201);
        } catch (\Exception $e) {
            $this->db->rollback();
            return Response::error($response, $e->getMessage(), 500);
        }
    }

    // POST /family/invite — invite member by username
    public function invite(Req $request, Res $response): Res
    {
        $userId = $request->getAttribute('user_id');
        $body   = $request->getParsedBody();
        $input  = trim($body['username'] ?? '');

        if (!$input) {
            return Response::error($response, 'Username atau email wajib diisi.', 422);
        }

        // Cek user adalah master
        $stmt = $this->db->prepare("
            SELECT f.id FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE fm.user_id = ? AND f.master_user_id = ? AND fm.kicked_at IS NULL
        ");
        $stmt->bind_param('ii', $userId, $userId);
        $stmt->execute();
        $family = $stmt->get_result()->fetch_assoc();

        if (!$family) {
            return Response::error($response, 'Kamu bukan master family.', 403);
        }

        // Cari user by username atau email
        if (str_contains($input, '@') && str_contains($input, '.')) {
            // Email
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->bind_param('s', $input);
        } else {
            // Username — strip @ jika ada
            $username = ltrim($input, '@');
            $stmt     = $this->db->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->bind_param('s', $username);
        }

        $stmt->execute();
        $invitedUser = $stmt->get_result()->fetch_assoc();

        if (!$invitedUser) {
            return Response::error($response, 'User tidak ditemukan.', 404);
        }
        if ($invitedUser['id'] === $userId) {
            return Response::error($response, 'Tidak bisa invite diri sendiri.', 422);
        }

        // Cek sudah member
        $stmt = $this->db->prepare("
            SELECT id, kicked_at FROM family_members
            WHERE family_id = ? AND user_id = ?
        ");
        $stmt->bind_param('ii', $family['id'], $invitedUser['id']);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();

        if ($existing) {
            if ($existing['kicked_at'] !== null) {
                // Re-join — null-kan kicked_at
                $stmt = $this->db->prepare("UPDATE family_members SET kicked_at = NULL WHERE id = ?");
                $stmt->bind_param('i', $existing['id']);
                $stmt->execute();
                return Response::message($response, 'Member berhasil ditambahkan kembali.');
            }
            return Response::error($response, 'User sudah menjadi anggota family.', 422);
        }

        $stmt = $this->db->prepare("INSERT INTO family_members (family_id, user_id) VALUES (?, ?)");
        $stmt->bind_param('ii', $family['id'], $invitedUser['id']);
        $stmt->execute();

        return Response::message($response, 'Member berhasil diundang.');
    }

    // DELETE /family/members/{userId} — kick member
    public function kick(Req $request, Res $response, array $args): Res
    {
        $userId       = $request->getAttribute('user_id');
        $targetUserId = (int) $args['userId'];

        // Cek user adalah master
        $stmt = $this->db->prepare("
            SELECT f.id FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE fm.user_id = ? AND f.master_user_id = ? AND fm.kicked_at IS NULL
        ");
        $stmt->bind_param('ii', $userId, $userId);
        $stmt->execute();
        $family = $stmt->get_result()->fetch_assoc();

        if (!$family) {
            return Response::error($response, 'Kamu bukan master family.', 403);
        }

        if ($targetUserId === $userId) {
            return Response::error($response, 'Tidak bisa kick diri sendiri.', 422);
        }

        $stmt = $this->db->prepare("
            UPDATE family_members SET kicked_at = NOW()
            WHERE family_id = ? AND user_id = ? AND kicked_at IS NULL
        ");
        $stmt->bind_param('ii', $family['id'], $targetUserId);
        $stmt->execute();

        if ($this->db->affected_rows === 0) {
            return Response::error($response, 'Member tidak ditemukan.', 404);
        }

        return Response::message($response, 'Member berhasil di-kick.');
    }

    // DELETE /family — keluar dari family
    public function leave(Req $request, Res $response): Res
    {
        $userId = $request->getAttribute('user_id');

        // Cek tidak sedang jadi master
        $stmt = $this->db->prepare("
            SELECT f.id FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE fm.user_id = ? AND f.master_user_id = ? AND fm.kicked_at IS NULL
        ");
        $stmt->bind_param('ii', $userId, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            return Response::error($response, 'Master tidak bisa keluar. Transfer ownership atau hapus family dulu.', 422);
        }

        $stmt = $this->db->prepare("
            UPDATE family_members SET kicked_at = NOW()
            WHERE user_id = ? AND kicked_at IS NULL
        ");
        $stmt->bind_param('i', $userId);
        $stmt->execute();

        return Response::message($response, 'Berhasil keluar dari family.');
    }
}