import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "student";
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "admin" | "student";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "student";
  }
}
