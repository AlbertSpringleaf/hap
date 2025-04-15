import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware functie
export async function middleware(request: NextRequest) {
  // Controleer of de gebruiker is ingelogd
  const token = await getToken({ req: request });
  
  // Als de gebruiker niet is ingelogd en niet op de login pagina is, stuur door naar de login pagina
  if (!token && !request.nextUrl.pathname.startsWith("/login")) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  
  // Als alles goed is, ga door met de normale flow
  return NextResponse.next();
}

// Configuratie voor de middleware
export const config = {
  matcher: [
    /*
     * Match alle routes behalve:
     * 1. /api/auth/* (authenticatie routes)
     * 2. /_next/* (Next.js systeem routes)
     * 3. /favicon.ico, /sitemap.xml, etc.
     */
    "/((?!api/auth|_next|favicon.ico|sitemap.xml).*)",
  ],
}; 