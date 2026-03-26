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
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

export default function TelegramPage() {
  const { data: session } = useSession();
  const [telegramId, setTelegramId] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.jwt) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${session.user.jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentId(data.data.user.telegram_id ?? null);
        setTelegramId(data.data.user.telegram_id ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.jwt]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;
    setSaving(true);
    setError("");
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
          body: JSON.stringify({ telegram_id: telegramId }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setSuccess("Telegram ID berhasil disimpan.");
        fetchProfile();
      } else {
        setError(data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const images = [
    { src: "/tutorial_botid/1.jpeg", alt: "Cari userinfobot" },
    { src: "/tutorial_botid/2.jpeg", alt: "Salin Telegram ID" },
    { src: "/tutorial_botid/3.jpeg", alt: "Tap Start" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Telegram</h1>
        <p className="text-sm text-muted-foreground">
          Hubungkan akun kamu dengan Telegram bot
        </p>
      </div>

      <AlertBanner message={error} onClose={() => setError("")} />

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Koneksi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : currentId ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Terhubung</span>
              <Badge variant="secondary">ID: {currentId}</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                Belum terhubung
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Telegram ID</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram_id">Telegram ID</Label>
              <Input
                id="telegram_id"
                type="number"
                placeholder="123456789"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Berupa angka, contoh: 8596115170
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tutorial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Cara Mendapatkan Telegram ID
          </CardTitle>
          <CardDescription>
            Ikuti langkah berikut untuk mendapatkan Telegram ID kamu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                1
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Cari @userinfobot di Telegram
                </p>
                <p className="text-sm text-muted-foreground">
                  Buka Telegram, cari{" "}
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    @userinfobot
                  </a>{" "}
                  di kolom pencarian, lalu tap pada bot yang muncul.
                </p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <button
                onClick={() => setLightbox(images[0].src)}
                className="relative w-44 overflow-hidden rounded-2xl border shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in"
              >
                <Image
                  src={images[0].src}
                  alt={images[0].alt}
                  width={300}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                2
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium">Tap Start</p>
                <p className="text-sm text-muted-foreground">
                  Setelah masuk ke chat @userinfobot, tap tombol{" "}
                  <strong>Start</strong> di bagian bawah.
                </p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <button
                onClick={() => setLightbox(images[1].src)}
                className="relative w-44 overflow-hidden rounded-2xl border shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in"
              >
                <Image
                  src={images[1].src}
                  alt={images[1].alt}
                  width={300}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                3
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium">Salin Telegram ID kamu</p>
                <p className="text-sm text-muted-foreground">
                  Bot akan membalas dengan info akunmu. Cari baris{" "}
                  <strong>Id:</strong> — angka itulah Telegram ID kamu. Salin
                  dan paste di form di bawah.
                </p>
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 mt-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    💡 Contoh: Id: 8596115170 — angka ini yang perlu disalin
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <button
                onClick={() => setLightbox(images[2].src)}
                className="relative w-44 overflow-hidden rounded-2xl border shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in"
              >
                <Image
                  src={images[2].src}
                  alt={images[2].alt}
                  width={300}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-sm w-full">
            <Image
              src={lightbox}
              alt="Preview"
              width={400}
              height={800}
              className="w-full h-auto rounded-2xl"
            />
            <p className="text-center text-xs text-white/60 mt-2">
              Tap di mana saja untuk menutup
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
