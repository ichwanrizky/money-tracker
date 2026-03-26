import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";

type JwtCallbackParams = {
  token: JWT;
  user?: User;
};

type SessionCallbackParams = {
  session: Session;
  token: JWT;
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            return {
              id: data.data.id,
              name: data.data.display_name,
              username: data.data.username,
              email: data.data.email,
              jwt: data.data.jwt,
            };
          }

          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: JwtCallbackParams) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email ?? "";
        token.jwt = user.jwt;
      }
      return token;
    },
    async session({ session, token }: SessionCallbackParams) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.jwt = token.jwt;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60, // 1 jam
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getSession = () => getServerSession(authOptions);
