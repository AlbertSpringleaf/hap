import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { naam, pdfBase64 } = await request.json();

    // Validate input
    if (!naam || !pdfBase64) {
      return NextResponse.json(
        { error: 'Naam en PDF zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate file name
    if (!naam.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Alleen PDF bestanden zijn toegestaan' },
        { status: 400 }
      );
    }

    // Validate base64 string
    try {
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      if (!base64Regex.test(pdfBase64)) {
        return NextResponse.json(
          { error: 'Ongeldig PDF bestand' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Ongeldig PDF bestand' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const koopovereenkomst = await prisma.koopovereenkomst.create({
      data: {
        naam,
        pdfBase64,
        userId: user.id,
      },
    });

    return NextResponse.json({
      id: koopovereenkomst.id,
      naam: koopovereenkomst.naam,
      createdAt: koopovereenkomst.createdAt,
      updatedAt: koopovereenkomst.updatedAt,
    });
  } catch (error) {
    console.error('Error creating koopovereenkomst:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het opslaan van de koopovereenkomst' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        koopovereenkomsten: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.koopovereenkomsten);
  } catch (error) {
    console.error('Error fetching koopovereenkomsten:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 