import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    if (!user.organization) {
      return NextResponse.json({ error: 'Geen organisatie gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.organization.id,
      name: user.organization.name,
      domain: user.organization.domain,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de organisatie' },
      { status: 500 }
    );
  }
} 