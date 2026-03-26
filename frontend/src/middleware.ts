import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Logout: biarkan lewat supaya signOut bisa clear session
  if (pathname.startsWith("/logout")) {
    return NextResponse.next();
  }

  // Sudah login tapi akses halaman auth → redirect transactions
  if (
    token &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(new URL("/transactions", req.url));
  }

  // Belum login tapi akses halaman protected → redirect login
  if (
    !token &&
    (pathname.startsWith("/transactions") ||
      pathname.startsWith("/wallets") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/family") ||
      pathname.startsWith("/telegram") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/tutorial"))
  ) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/transactions/:path*",
    "/wallets/:path*",
    "/categories/:path*",
    "/family/:path*",
    "/telegram/:path*",
    "/profile/:path*",
    "/tutorial/:path*",
    "/login",
    "/register",
    "/logout",
  ],
};
