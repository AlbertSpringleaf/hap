import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";

// GET: Get organization settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization ID found' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        domain: true,
        billingName: true,
        billingAddress: true,
        billingPostalCode: true,
        billingCity: true,
        billingCountry: true,
        billingVATNumber: true,
        billingEmail: true,
        hasKoopovereenkomstenAccess: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update organization settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization ID found' }, { status: 400 });
    }

    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId as string },
      data: {
        billingName: data.billingName,
        billingAddress: data.billingAddress,
        billingPostalCode: data.billingPostalCode,
        billingCity: data.billingCity,
        billingCountry: data.billingCountry,
        billingVATNumber: data.billingVATNumber,
        billingEmail: data.billingEmail,
        hasKoopovereenkomstenAccess: data.hasKoopovereenkomstenAccess,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 