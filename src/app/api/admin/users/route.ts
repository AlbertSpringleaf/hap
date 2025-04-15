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

    // Get the admin's organization ID
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!adminUser?.organizationId) {
      return NextResponse.json({ error: 'Admin user has no organization' }, { status: 400 });
    }

    // Only fetch users from the admin's organization
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { organizationId: adminUser.organizationId },
          { pendingOrganizationId: adminUser.organizationId }
        ]
      },
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

    // Get the admin's organization ID
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!adminUser?.organizationId) {
      return NextResponse.json({ error: 'Admin user has no organization' }, { status: 400 });
    }

    const { action, userId, isAdmin } = await request.json();

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the target user to check if they belong to the admin's organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        pendingOrganization: true,
        organization: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user belongs to the admin's organization
    const belongsToAdminOrg = 
      targetUser.organizationId === adminUser.organizationId || 
      targetUser.pendingOrganizationId === adminUser.organizationId;

    if (!belongsToAdminOrg) {
      return NextResponse.json({ error: 'You can only manage users from your own organization' }, { status: 403 });
    }

    switch (action) {
      case 'approve':
        if (!targetUser.pendingOrganization) {
          return NextResponse.json({ error: 'User has no pending organization' }, { status: 400 });
        }

        // Verify the pending organization is the admin's organization
        if (targetUser.pendingOrganizationId !== adminUser.organizationId) {
          return NextResponse.json({ error: 'You can only approve users for your own organization' }, { status: 403 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            organizationId: targetUser.pendingOrganizationId,
            pendingOrganizationId: null,
          },
        });
        break;

      case 'reject':
        // Verify the pending organization is the admin's organization
        if (targetUser.pendingOrganizationId !== adminUser.organizationId) {
          return NextResponse.json({ error: 'You can only reject users for your own organization' }, { status: 403 });
        }

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
          // Count total number of admins in the organization
          const adminCount = await prisma.user.count({
            where: { 
              isAdmin: true,
              organizationId: adminUser.organizationId
            },
          });

          // If this is the last admin, prevent removing admin rights
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: 'Cannot remove admin rights from the last admin user in your organization' },
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
        if (targetUser.isAdmin) {
          // Count total number of admins in the organization
          const adminCount = await prisma.user.count({
            where: { 
              isAdmin: true,
              organizationId: adminUser.organizationId
            },
          });

          // If this is the last admin, prevent deletion
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: 'Cannot delete the last admin user in your organization' },
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