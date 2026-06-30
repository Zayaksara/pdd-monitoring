import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/session";

beforeAll(() => { process.env.SESSION_SECRET = "test-secret-test-secret-test-secret"; });

describe("session token", () => {
  it("round-trips a valid payload", async () => {
    const token = await createSessionToken({ sub: "u1", role: "admin" });
    const decoded = await verifySessionToken(token);
    expect(decoded).toEqual({ sub: "u1", role: "admin" });
  });
  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ sub: "u1", role: "user" });
    expect(await verifySessionToken(token + "x")).toBeNull();
  });
});
