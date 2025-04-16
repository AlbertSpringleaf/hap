import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
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
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    const koopovereenkomst = await prisma.koopovereenkomst.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organizationId: true,
          },
        },
      },
    });

    if (!koopovereenkomst) {
      return NextResponse.json({ error: 'Koopovereenkomst not found' }, { status: 404 });
    }

    // Check if the koopovereenkomst belongs to a user in the same organization
    if (koopovereenkomst.user.organizationId !== user.organizationId) {
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
    console.log('PATCH request received for koopovereenkomst:', params.id);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User authenticated:', session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('User found:', user.id);

    if (!user.organizationId) {
      console.log('User has no organization');
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    const koopovereenkomst = await prisma.koopovereenkomst.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organizationId: true,
          },
        },
      },
    });

    if (!koopovereenkomst) {
      console.log('Koopovereenkomst not found:', params.id);
      return NextResponse.json({ error: 'Koopovereenkomst not found' }, { status: 404 });
    }
    console.log('Koopovereenkomst found:', koopovereenkomst.id);

    // Check if the koopovereenkomst belongs to a user in the same organization
    if (koopovereenkomst.user.organizationId !== user.organizationId) {
      console.log('User is not in same organization. User organization:', user.organizationId, 'Koopovereenkomst organization:', koopovereenkomst.user.organizationId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { jsonData, status } = await request.json();
    console.log('Request body received:', { hasJsonData: !!jsonData, status });

    const updateData: any = {};
    if (jsonData !== undefined) {
      updateData.jsonData = jsonData;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    console.log('Update data prepared:', updateData);

    const updatedKoopovereenkomst = await prisma.koopovereenkomst.update({
      where: { id: params.id },
      data: updateData,
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
    console.log('Koopovereenkomst updated successfully');

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