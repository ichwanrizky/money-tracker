"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  WalletCards,
  ArrowLeftRight,
  Tag,
  Users,
  LogOut,
  Menu,
  X,
  Send,
  UserCircle,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/wallets", label: "Wallet", icon: WalletCards },
  { href: "/categories", label: "Kategori", icon: Tag },
  { href: "/family", label: "Family", icon: Users },
  { href: "/telegram", label: "Telegram", icon: Send },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/tutorial", label: "Tutorial", icon: BookOpen },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-card border-r flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <span className="text-lg font-semibold">💸 Cateeet</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                  ${
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{session?.user?.username}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel>Akun saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={() => (window.location.href = "/logout")}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6">
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
