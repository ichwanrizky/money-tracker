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
import { NumericFormat } from "react-number-format";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AlertBanner } from "@/components/alert-banner";

type Wallet = {
  id: number;
  name: string;
  initial_balance: number;
  current_balance: number;
  shared_to_family: boolean;
  created_at: string;
};

const emptyForm = {
  name: "",
  initial_balance: "",
  current_balance: "",
  shared_to_family: "0",
};

export default function WalletsPage() {
  const { data: session } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Wallet | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchWallets = useCallback(async () => {
    if (!session?.user?.jwt) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wallets`,
        {
          headers: { Authorization: `Bearer ${session.user.jwt}` },
        },
      );
      const data = await res.json();
      if (data.success) setWallets(data.data.wallets);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.jwt]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (wallet: Wallet) => {
    setEditItem(wallet);
    setForm({
      name: wallet.name,
      initial_balance: wallet.initial_balance.toString(),
      current_balance: wallet.current_balance.toString(),
      shared_to_family: wallet.shared_to_family ? "1" : "0",
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
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/wallets/${editItem.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/wallets`;
    const method = editItem ? "PUT" : "POST";

    const payload: Record<string, unknown> = {
      name: form.name,
      shared_to_family: parseInt(form.shared_to_family),
    };

    if (editItem) {
      payload.current_balance = parseFloat(form.current_balance || "0");
    } else {
      payload.initial_balance = parseFloat(form.initial_balance || "0");
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.jwt}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        fetchWallets();
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/wallets/${deleteId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.user.jwt}` },
      },
    );
    const data = await res.json();
    if (!data.success) {
      setError(data.message);
    } else {
      fetchWallets();
    }
    setDeleteId(null);
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dompet & rekening kamu
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {wallets.map((w) => (
          <div key={w.id} className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-sm text-muted-foreground">{w.name}</p>
            <p
              className={`text-lg font-semibold ${w.current_balance < 0 ? "text-destructive" : ""}`}
            >
              {formatAmount(w.current_balance)}
            </p>
            {w.shared_to_family && (
              <Badge variant="outline" className="text-xs">
                Shared
              </Badge>
            )}
          </div>
        ))}
      </div>

      <AlertBanner message={error} onClose={() => setError("")} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Saldo Awal</TableHead>
              <TableHead className="text-right">Saldo Saat Ini</TableHead>
              <TableHead>Shared</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  Memuat...
                </TableCell>
              </TableRow>
            ) : wallets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  Belum ada wallet
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatAmount(w.initial_balance)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${w.current_balance < 0 ? "text-destructive" : ""}`}
                  >
                    {formatAmount(w.current_balance)}
                  </TableCell>
                  <TableCell>
                    {w.shared_to_family ? (
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
                        onClick={() => openEdit(w)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(w.id)}
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
              {editItem ? "Edit Wallet" : "Tambah Wallet"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Wallet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="BNI, Cash, dll"
                required
              />
            </div>

            {!editItem && (
              <div className="space-y-2">
                <Label>Saldo Awal</Label>
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  placeholder="Rp 0"
                  value={form.initial_balance}
                  onValueChange={(values) =>
                    setForm({ ...form, initial_balance: values.value })
                  }
                />
              </div>
            )}

            {editItem && (
              <div className="space-y-2">
                <Label>Saldo Saat Ini</Label>
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  placeholder="Rp 0"
                  value={form.current_balance}
                  onValueChange={(values) =>
                    setForm({ ...form, current_balance: values.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Selisih akan dicatat sebagai transaksi balancing otomatis.
                </p>
              </div>
            )}

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
            <AlertDialogTitle>Hapus wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              Wallet hanya bisa dihapus jika tidak ada transaksi yang
              menggunakannya.
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
