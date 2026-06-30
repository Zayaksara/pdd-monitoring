import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";
  if (!hasSession && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL("/board", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
