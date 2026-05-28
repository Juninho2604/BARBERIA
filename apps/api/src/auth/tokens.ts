import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role } from "@prisma/client";
import type { Env } from "../env.js";

const ISSUER = "barberia-api";

export interface AccessPayload extends JWTPayload {
  sub: string;
  role: Role;
  typ: "access";
}

export interface RefreshPayload extends JWTPayload {
  sub: string;
  typ: "refresh";
}

function secret(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export async function signAccessToken(
  env: Env,
  userId: string,
  role: Role,
): Promise<string> {
  return new SignJWT({ role, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(secret(env.JWT_ACCESS_SECRET));
}

export async function signRefreshToken(env: Env, userId: string): Promise<string> {
  return new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_TTL)
    .sign(secret(env.JWT_REFRESH_SECRET));
}

export async function verifyAccessToken(env: Env, token: string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, secret(env.JWT_ACCESS_SECRET), {
    issuer: ISSUER,
  });
  if (payload.typ !== "access" || typeof payload.sub !== "string") {
    throw new Error("Token inválido");
  }
  return payload as AccessPayload;
}

export async function verifyRefreshToken(env: Env, token: string): Promise<RefreshPayload> {
  const { payload } = await jwtVerify(token, secret(env.JWT_REFRESH_SECRET), {
    issuer: ISSUER,
  });
  if (payload.typ !== "refresh" || typeof payload.sub !== "string") {
    throw new Error("Token inválido");
  }
  return payload as RefreshPayload;
}
