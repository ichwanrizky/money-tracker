"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/alert-banner";
import { Plus, UserMinus, LogOut } from "lucide-react";

type Member = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  joined_at: string;
  kicked_at: string | null;
  is_master: boolean;
};

type Family = {
  id: number;
  name: string;
  master_user_id: number;
  is_master: boolean;
  created_at: string;
  members: Member[];
};

export default function FamilyPage() {
  const { data: session } = useSession();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create family
  const [createOpen, setCreateOpen] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Kick
  const [kickId, setKickId] = useState<number | null>(null);

  // Leave
  const [leaveOpen, setLeaveOpen] = useState(false);

  const fetchFamily = useCallback(async () => {
    if (!session?.user?.jwt) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/family`, {
        headers: { Authorization: `Bearer ${session.user.jwt}` },
      });
      const data = await res.json();
      if (data.success) setFamily(data.data.family);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.jwt]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;
    setCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/family`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.jwt}`,
        },
        body: JSON.stringify({ name: familyName }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateOpen(false);
        setFamilyName("");
        fetchFamily();
      } else {
        setError(data.message);
        setCreateOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;
    setInviting(true);
    setInviteError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/family/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.jwt}`,
          },
          body: JSON.stringify({ username: inviteUsername }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setInviteOpen(false);
        setInviteUsername("");
        fetchFamily();
      } else {
        setInviteError(data.message);
      }
    } finally {
      setInviting(false);
    }
  };

  const handleKick = async () => {
    if (!kickId || !session?.user?.jwt) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/family/members/${kickId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.user.jwt}` },
      },
    );
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
    } else {
      fetchFamily();
    }
    setKickId(null);
  };

  const handleLeave = async () => {
    if (!session?.user?.jwt) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/family`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.user.jwt}` },
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
    } else {
      fetchFamily();
    }
    setLeaveOpen(false);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Family</h1>
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Family</h1>
          <p className="text-sm text-muted-foreground">
            Kelola anggota keluarga
          </p>
        </div>
        {!family && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Family
          </Button>
        )}
        {family && family.is_master && (
          <Button
            size="sm"
            onClick={() => {
              setInviteError("");
              setInviteOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <AlertBanner message={error} onClose={() => setError("")} />

      {!family ? (
        <div className="rounded-lg border bg-card p-10 text-center space-y-2">
          <p className="text-muted-foreground">
            Kamu belum tergabung dalam family.
          </p>
          <p className="text-sm text-muted-foreground">
            Buat family baru atau minta diundang oleh master family.
          </p>
        </div>
      ) : (
        <>
          {/* Family info */}
          <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{family.name}</p>
              <p className="text-sm text-muted-foreground">
                Dibuat {formatDate(family.created_at)} · {family.members.length}{" "}
                anggota
              </p>
            </div>
            {!family.is_master && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setLeaveOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            )}
          </div>

          {/* Members table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {family.members.map((member) => (
                  <TableRow
                    key={member.id}
                    className={member.kicked_at ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      @{member.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {member.is_master && <Badge>Master</Badge>}
                        {member.kicked_at ? (
                          <Badge variant="destructive">Kicked</Badge>
                        ) : (
                          <Badge variant="secondary">Aktif</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(member.joined_at)}
                    </TableCell>
                    <TableCell>
                      {family.is_master &&
                        !member.is_master &&
                        !member.kicked_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setKickId(member.id)}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Create Family Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Family</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Family</Label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Keluarga Ichwan"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Membuat..." : "Buat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>Username atau Email</Label>
              <Input
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="@username atau email@domain.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Gunakan <strong>@username</strong> atau <strong>email</strong>{" "}
                untuk mengundang anggota.
              </p>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Mengundang..." : "Invite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Kick confirmation */}
      <AlertDialog open={!!kickId} onOpenChange={() => setKickId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Data transaksi anggota ini tidak akan terlihat oleh anggota lain
              setelah di-kick.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Kick
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari family?</AlertDialogTitle>
            <AlertDialogDescription>
              Data transaksi kamu tidak akan terlihat oleh anggota lain setelah
              keluar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
