import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";

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

        // Hardcoded user for now - in production this would come from a database
        const user = {
          id: "1",
          email: "a.pietens@springleaf.nl",
          password: await bcrypt.hash("9fe@m3W6.A.K", 10),
        };

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (credentials.email === user.email && isValid) {
          return {
            id: user.id,
            email: user.email,
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 