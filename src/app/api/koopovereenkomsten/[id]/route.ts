import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET a specific koopovereenkomst by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const koopovereenkomst = await prisma.koopovereenkomst.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!koopovereenkomst) {
      return NextResponse.json({ error: 'Koopovereenkomst not found' }, { status: 404 });
    }

    // Check if the koopovereenkomst belongs to the user
    if (koopovereenkomst.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(koopovereenkomst);
  } catch (error) {
    console.error('Error fetching koopovereenkomst:', error);
    return NextResponse.json(
      { error: 'Failed to fetch koopovereenkomst' },
      { status: 500 }
    );
  }
}

// PATCH to update JSON data
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const koopovereenkomst = await prisma.koopovereenkomst.findUnique({
      where: { id: params.id },
    });

    if (!koopovereenkomst) {
      return NextResponse.json({ error: 'Koopovereenkomst not found' }, { status: 404 });
    }

    // Check if the koopovereenkomst belongs to the user
    if (koopovereenkomst.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { jsonData } = await request.json();

    const updatedKoopovereenkomst = await prisma.koopovereenkomst.update({
      where: { id: params.id },
      data: { jsonData },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedKoopovereenkomst);
  } catch (error) {
    console.error('Error updating koopovereenkomst:', error);
    return NextResponse.json(
      { error: 'Failed to update koopovereenkomst' },
      { status: 500 }
    );
  }
}

// DELETE a koopovereenkomst
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const koopovereenkomst = await prisma.koopovereenkomst.findUnique({
      where: { id: params.id },
    });

    if (!koopovereenkomst) {
      return NextResponse.json({ error: 'Koopovereenkomst not found' }, { status: 404 });
    }

    // Check if the koopovereenkomst belongs to the user
    if (koopovereenkomst.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.koopovereenkomst.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting koopovereenkomst:', error);
    return NextResponse.json(
      { error: 'Failed to delete koopovereenkomst' },
      { status: 500 }
    );
  }
} 