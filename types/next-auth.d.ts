import "next-auth";

declare module "next-auth" {
  // Google access/refresh tokens must never be added to the Session object:
  // it is serialized and sent to the browser. They live only in the
  // encrypted JWT (see next-auth/jwt below), which stays server-readable.
  interface Session {
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string;
    picture?: string;
  }
}
