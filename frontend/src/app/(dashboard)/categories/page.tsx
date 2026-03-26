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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AlertBanner } from "@/components/alert-banner";

type Category = {
  id: number;
  name: string;
  icon: string;
  type: "in" | "out" | "both";
  shared_to_family: boolean;
};

const emptyForm = {
  name: "",
  icon: "📦",
  type: "both",
  shared_to_family: "0",
};

export default function CategoriesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    if (!session?.user?.jwt) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
        {
          headers: { Authorization: `Bearer ${session.user.jwt}` },
        },
      );
      const data = await res.json();
      if (data.success) setCategories(data.data.categories);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.jwt]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setForm({
      name: cat.name,
      icon: cat.icon,
      type: cat.type,
      shared_to_family: cat.shared_to_family ? "1" : "0",
    });
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;
    setSaving(true);
    setError("");

    const url = editItem
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editItem.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/categories`;
    const method = editItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.jwt}`,
        },
        body: JSON.stringify({
          name: form.name,
          icon: form.icon,
          type: form.type,
          shared_to_family: parseInt(form.shared_to_family),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        fetchCategories();
      } else {
        setError(data.message || "Terjadi kesalahan.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !session?.user?.jwt) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${deleteId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.user.jwt}` },
      },
    );
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
    } else {
      fetchCategories();
    }
    setDeleteId(null);
  };

  const typeLabel = (type: string) => {
    if (type === "in") return <Badge variant="default">Pemasukan</Badge>;
    if (type === "out") return <Badge variant="destructive">Pengeluaran</Badge>;
    return <Badge variant="secondary">Keduanya</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kategori transaksi
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      <AlertBanner message={error} onClose={() => setError("")} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Shared</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  Memuat...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  Belum ada kategori
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <span className="font-medium">
                      {cat.icon} {cat.name}
                    </span>
                  </TableCell>
                  <TableCell>{typeLabel(cat.type)}</TableCell>
                  <TableCell>
                    {cat.shared_to_family ? (
                      <Badge variant="outline">Shared</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="space-y-2 w-20">
                <Label>Icon</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="📦"
                  className="text-center text-lg"
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Nama</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Makan & Minum"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="out">💸 Pengeluaran</SelectItem>
                  <SelectItem value="in">💰 Pemasukan</SelectItem>
                  <SelectItem value="both">↕️ Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shared ke Family</Label>
              <Select
                value={form.shared_to_family}
                onValueChange={(v) => setForm({ ...form, shared_to_family: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tidak</SelectItem>
                  <SelectItem value="1">Ya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : editItem ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi yang menggunakan kategori ini tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
