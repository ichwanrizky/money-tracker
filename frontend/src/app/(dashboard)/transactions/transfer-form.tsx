"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import { ArrowRight } from "lucide-react";

type Wallet = {
  id: number;
  name: string;
  current_balance: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function TransferForm({ open, onClose, onSuccess }: Props) {
  const { data: session } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState({
    from_wallet_id: "",
    to_wallet_id: "",
    amount: "",
    admin_fee: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user?.jwt || !open) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets`, {
      headers: { Authorization: `Bearer ${session.user.jwt}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setWallets(d.data.wallets);
      });
  }, [session?.user?.jwt, open]);

  useEffect(() => {
    if (!open) {
      setForm({
        from_wallet_id: "",
        to_wallet_id: "",
        amount: "",
        admin_fee: "",
        date: new Date().toISOString().split("T")[0],
      });
      setError("");
    }
  }, [open]);

  const fromWallet = wallets.find(
    (w) => w.id.toString() === form.from_wallet_id,
  );
  const toWallet = wallets.find((w) => w.id.toString() === form.to_wallet_id);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.jwt) return;

    if (form.from_wallet_id === form.to_wallet_id) {
      setError("Wallet asal dan tujuan tidak boleh sama.");
      return;
    }

    setLoading(true);
    setError("");

    const amount = parseFloat(form.amount);
    const adminFee =
      form.admin_fee && form.admin_fee !== "" ? parseFloat(form.admin_fee) : 0;
    const fromWalletName = fromWallet?.name ?? "";
    const toWalletName = toWallet?.name ?? "";

    try {
      // OUT dari wallet asal
      const res1 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.jwt}`,
          },
          body: JSON.stringify({
            description: `Transfer ke ${toWalletName}`,
            amount,
            type: "out",
            wallet_id: parseInt(form.from_wallet_id),
            category_id: null,
            date: form.date,
            is_transfer: true,
          }),
        },
      );

      // IN ke wallet tujuan
      const res2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.jwt}`,
          },
          body: JSON.stringify({
            description: `Transfer dari ${fromWalletName}`,
            amount,
            type: "in",
            wallet_id: parseInt(form.to_wallet_id),
            category_id: null,
            date: form.date,
            is_transfer: true,
          }),
        },
      );

      const d1 = await res1.json();
      const d2 = await res2.json();

      if (!d1.success || !d2.success) {
        setError(d1.message || d2.message || "Terjadi kesalahan.");
        return;
      }

      // OUT biaya admin kalau ada
      if (adminFee > 0) {
        const res3 = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/transactions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.jwt}`,
            },
            body: JSON.stringify({
              description: `Biaya admin transfer ke ${toWalletName}`,
              amount: adminFee,
              type: "out",
              wallet_id: parseInt(form.from_wallet_id),
              category_id: null,
              date: form.date,
            }),
          },
        );
        const d3 = await res3.json();
        if (!d3.success) {
          setError(d3.message || "Gagal menyimpan biaya admin.");
          return;
        }
      }

      onSuccess();
      onClose();
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
          <DialogTitle>Transfer Dana</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From → To */}
          <div className="flex items-center gap-2">
            <div className="space-y-2 flex-1">
              <Label>Dari Wallet</Label>
              <Select
                value={form.from_wallet_id}
                onValueChange={(v) => setForm({ ...form, from_wallet_id: v })}
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
              {fromWallet && (
                <p className="text-xs text-muted-foreground">
                  Saldo: {formatAmount(fromWallet.current_balance)}
                </p>
              )}
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground mt-6 shrink-0" />

            <div className="space-y-2 flex-1">
              <Label>Ke Wallet</Label>
              <Select
                value={form.to_wallet_id}
                onValueChange={(v) => setForm({ ...form, to_wallet_id: v })}
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
              {toWallet && (
                <p className="text-xs text-muted-foreground">
                  Saldo: {formatAmount(toWallet.current_balance)}
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Jumlah</Label>
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

          {/* Admin Fee */}
          <div className="space-y-2 ">
            <Label>
              Biaya Admin
              <span className="ml-1 text-xs text-muted-foreground">
                (opsional)
              </span>
            </Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              placeholder="Rp 0"
              value={form.admin_fee}
              onValueChange={(values) =>
                setForm({ ...form, admin_fee: values.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Biaya admin akan dipotong dari wallet asal.
            </p>
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
              {loading ? "Memproses..." : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
