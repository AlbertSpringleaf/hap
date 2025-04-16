import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";

// Define the organization type with the fields we need
interface OrganizationWithAccess {
  id: string;
  name: string;
  domain: string;
  hasKoopovereenkomstenAccess: boolean;
}

// GET: Get organization settings (no admin required)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Use type assertion to handle the TypeScript error
    const orgWithAccess = organization as unknown as OrganizationWithAccess;

    // Return only the fields we need
    return NextResponse.json({
      id: orgWithAccess.id,
      name: orgWithAccess.name,
      domain: orgWithAccess.domain,
      hasKoopovereenkomstenAccess: orgWithAccess.hasKoopovereenkomstenAccess,
    });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 