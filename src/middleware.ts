import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Lijst met toegestane IP-adressen
const ALLOWED_IPS = [
  "127.0.0.1", // localhost
  "::1",       // localhost IPv6
  "84.31.27.154", // Toegevoegd IP-adres
  // Voeg hier je toegestane IP-adressen toe
  // "192.168.1.1",
  // "10.0.0.1",
];

// Functie om te controleren of een IP-adres is toegestaan
function isIpAllowed(ip: string): boolean {
  // In ontwikkelomgeving, sta altijd localhost toe
  if (process.env.NODE_ENV === "development") {
    return true; // Sta alle IP-adressen toe in ontwikkelomgeving
  }
  
  return ALLOWED_IPS.includes(ip);
}

// Middleware functie
export async function middleware(request: NextRequest) {
  // Haal het IP-adres van de client op
  const ip = request.ip || request.headers.get("x-real-ip") || "unknown";
  
  // Log het IP-adres voor debugging
  console.log("Client IP:", ip);
  
  // Controleer of het IP-adres is toegestaan
  if (!isIpAllowed(ip)) {
    // Als het IP-adres niet is toegestaan, toon een foutmelding
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Toegang geweigerd. Je IP-adres is niet toegestaan.",
        ip: ip, // Voeg het IP-adres toe aan de foutmelding voor debugging
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  
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