"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function LogoutPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      signOut({ redirect: true, callbackUrl: "/auth/login" });
    } else {
      // unauthenticated
      window.location.href = "/login";
    }
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Keluar...</p>
    </div>
  );
}
