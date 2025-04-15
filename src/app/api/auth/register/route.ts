import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password, organizationName, organizationDomain } = await request.json();

    if (!name || !email || !password || !organizationName || !organizationDomain) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if organization exists
    let organization = await prisma.organization.findUnique({
      where: { domain: organizationDomain }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (organization) {
      // Organization exists, create user as pending
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          registrationStatus: "PENDING",
          pendingOrganizationId: organization.id
        }
      });

      return NextResponse.json({
        message: "Registration successful. Your account is pending approval.",
        userId: user.id
      });
    } else {
      // Create new organization and user as admin
      const newOrganization = await prisma.organization.create({
        data: {
          name: organizationName,
          domain: organizationDomain
        }
      });

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isAdmin: true,
          registrationStatus: "APPROVED",
          organizationId: newOrganization.id
        }
      });

      return NextResponse.json({
        message: "Registration successful. You are now an admin of your organization.",
        userId: user.id
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 