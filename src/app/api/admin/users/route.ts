import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET: Get all users in the organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        pendingOrganizationId: true,
        pendingOrganization: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Approve or reject a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userId, isAdmin } = await request.json();

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    switch (action) {
      case 'approve':
        const userToApprove = await prisma.user.findUnique({
          where: { id: userId },
          include: { pendingOrganization: true },
        });

        if (!userToApprove?.pendingOrganization) {
          return NextResponse.json({ error: 'User has no pending organization' }, { status: 400 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            organizationId: userToApprove.pendingOrganizationId,
            pendingOrganizationId: null,
          },
        });
        break;

      case 'reject':
        await prisma.user.update({
          where: { id: userId },
          data: { pendingOrganizationId: null },
        });
        break;

      case 'toggleAdmin':
        if (userId === session.user.id) {
          return NextResponse.json({ error: 'Cannot change your own admin status' }, { status: 400 });
        }

        // Check if this is removing admin rights
        if (!isAdmin) {
          // Count total number of admins
          const adminCount = await prisma.user.count({
            where: { isAdmin: true },
          });

          // If this is the last admin, prevent removing admin rights
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: 'Cannot remove admin rights from the last admin user' },
              { status: 400 }
            );
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data: { isAdmin },
        });
        break;

      case 'delete':
        if (userId === session.user.id) {
          return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Check if this is an admin user
        const userToDelete = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        if (userToDelete?.isAdmin) {
          // Count total number of admins
          const adminCount = await prisma.user.count({
            where: { isAdmin: true },
          });

          // If this is the last admin, prevent deletion
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: 'Cannot delete the last admin user' },
              { status: 400 }
            );
          }
        }

        await prisma.user.delete({
          where: { id: userId },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing user action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 