"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertBanner } from "@/components/alert-banner";
import { CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type User = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  telegram_id: string | null;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile form
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    email: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.jwt) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${session.user.jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setProfileForm({
          display_name: data.data.user.display_name ?? "",
          email: data.data.user.email ?? "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.jwt]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;
    setSavingProfile(true);
    setProfileError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.jwt}`,
          },
          body: JSON.stringify({
            display_name: profileForm.display_name,
            email: profileForm.email,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setSuccess("Profile berhasil diupdate.");
        fetchProfile();
      } else {
        setProfileError(data.message);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Password baru tidak cocok.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.jwt}`,
          },
          body: JSON.stringify({
            old_password: passwordForm.old_password,
            new_password: passwordForm.new_password,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess("Password berhasil diupdate.");
        setPasswordForm({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        setPasswordError(data.message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi akun kamu
        </p>
      </div>

      <AlertBanner message={error} onClose={() => setError("")} />

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Info akun */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Akun</CardTitle>
          <CardDescription>Username tidak bisa diubah</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 mb-4">
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">@{user?.username}</p>
          </div>
          <Separator className="mb-4" />
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={profileForm.display_name}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    display_name: e.target.value,
                  })
                }
                placeholder="Ichwan Rizky"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                placeholder="ichwan@email.com"
                required
              />
            </div>
            {profileError && (
              <p className="text-sm text-destructive">{profileError}</p>
            )}
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ganti password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ganti Password</CardTitle>
          <CardDescription>
            Pastikan password baru minimal 6 karakter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400 mb-4">
              <CheckCircle className="h-4 w-4" />
              {passwordSuccess}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Password Lama</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordForm.old_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    old_password: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    new_password: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirm_password: e.target.value,
                  })
                }
                required
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Menyimpan..." : "Ganti Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
