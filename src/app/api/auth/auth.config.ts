import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma, User as PrismaUser } from "@prisma/client";

// Extend the built-in types
declare module "next-auth" {
  interface User {
    id: string;
    email: string | null;
    name: string | null;
    organizationId: string | null;
    isAdmin: boolean;
    registrationStatus: string;
  }

  interface Session {
    user: User & {
      id: string;
      organizationId: string | null;
      isAdmin: boolean;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string | null;
    isAdmin: boolean;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email with all necessary fields
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email 
            }
          }) as PrismaUser | null;

          if (!user) {
            return null;
          }

          // Check if user is approved
          if (user.registrationStatus !== "APPROVED") {
            throw new Error("Your registration is pending approval");
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            organizationId: user.organizationId || '',
            isAdmin: user.isAdmin,
            registrationStatus: user.registrationStatus
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.organizationId = token.organizationId as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 