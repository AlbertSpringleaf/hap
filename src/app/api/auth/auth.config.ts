import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
          });

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
            isAdmin: user.isAdmin
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