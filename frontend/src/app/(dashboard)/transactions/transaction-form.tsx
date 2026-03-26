"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumericFormat } from "react-number-format";

type Transaction = {
  id: number;
  description: string;
  amount: number;
  type: "in" | "out";
  date: string;
  wallet_name: string;
  category_name: string;
};

type Wallet = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  icon: string;
  type: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
};

export function TransactionForm({
  open,
  onClose,
  onSuccess,
  transaction,
}: Props) {
  const { data: session } = useSession();
  const isEdit = !!transaction;

  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "out",
    wallet_id: "",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user?.jwt) return;

    // Fetch wallets
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets`, {
      headers: { Authorization: `Bearer ${session.user.jwt}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setWallets(d.data.wallets);
      });

    // Fetch categories
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
      headers: { Authorization: `Bearer ${session.user.jwt}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data.categories);
      });
  }, [session?.user?.jwt]);

  useEffect(() => {
    if (transaction) {
      // Cari wallet_id dan category_id dari nama
      const wallet = wallets.find((w) => w.name === transaction.wallet_name);
      const category = categories.find(
        (c) => c.name === transaction.category_name,
      );
      setForm({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        wallet_id: wallet?.id.toString() ?? "",
        category_id: category?.id.toString() ?? "",
        date: transaction.date,
      });
    } else {
      setForm({
        description: "",
        amount: "",
        type: "out",
        wallet_id: "",
        category_id: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setError("");
  }, [transaction, open, wallets, categories]);

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === "both",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;

    if (!form.wallet_id) {
      setError("Wallet wajib dipilih.");
      return;
    }

    if (!form.category_id) {
      setError("Kategori wajib dipilih.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      description: form.description,
      amount: parseFloat(form.amount),
      type: form.type,
      wallet_id: parseInt(form.wallet_id),
      category_id: parseInt(form.category_id),
      date: form.date,
    };

    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${transaction!.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/transactions`;
    const method = isEdit ? "PUT" : "POST";

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
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Terjadi kesalahan.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Jenis</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm({ ...form, type: v, category_id: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="out">💸 Pengeluaran</SelectItem>
                <SelectItem value="in">💰 Pemasukan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Input
              placeholder="makan siang"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Jumlah (Rp)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              placeholder="Rp 0"
              value={form.amount}
              onValueChange={(values) =>
                setForm({ ...form, amount: values.value })
              }
              required
            />
          </div>

          {/* Wallet */}
          <div className="space-y-2">
            <Label>Wallet</Label>
            <Select
              value={form.wallet_id}
              onValueChange={(v) => setForm({ ...form, wallet_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id.toString()}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
