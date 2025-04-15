import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Hardcoded credentials
const VALID_CREDENTIALS = {
  email: "a.pietens@springleaf.nl",
  password: "9fe@m3W6.A.K"
};

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

        if (credentials.email === VALID_CREDENTIALS.email && 
            credentials.password === VALID_CREDENTIALS.password) {
          
          // Check if organization exists
          let organization = await prisma.organization.findUnique({
            where: { domain: "springleafautomation" }
          });

          // If organization doesn't exist, create it
          if (!organization) {
            organization = await prisma.organization.create({
              data: {
                domain: "springleafautomation",
                name: "Springleaf Automation"
              }
            });
          }

          // Check if user exists in database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // If user doesn't exist, create them
          if (!user) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                password: hashedPassword,
                name: "Albert Pietens",
                organizationId: organization.id
              }
            });
          }

          return {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            organizationId: user.organizationId || ''
          } as const;
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.organizationId = token.organizationId as string;
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
}; 