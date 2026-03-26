import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      username: string;
      jwt: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email: string;
    username: string;
    jwt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email: string;
    jwt: string;
  }
}
