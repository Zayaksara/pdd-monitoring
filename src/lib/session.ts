import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pdd_session";
type Payload = { sub: string; role: "admin" | "user" };
const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set — refusing to sign/verify session tokens with an empty key.");
  }
  return new TextEncoder().encode(value);
};

export async function createSessionToken(p: Payload): Promise<string> {
  return new SignJWT({ role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<Payload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string") return null;
    const role = payload.role;
    if (role !== "admin" && role !== "user") return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}
