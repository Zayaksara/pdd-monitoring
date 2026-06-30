import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function upsertUser(username: string, name: string, role: "admin" | "user", password: string) {
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { username },
    update: { name, role },
    create: { username, name, role, passwordHash },
  });
  console.log(`seeded ${role}: ${username}`);
}

async function main() {
  const adminUser = process.env.SEED_ADMIN_USER ?? "admin";
  const adminPass = process.env.SEED_ADMIN_PASS ?? "admin123";
  const userPass = process.env.SEED_USER_PASS ?? "user123";
  await upsertUser(adminUser, "Admin", "admin", adminPass);
  await upsertUser("nisa", "Nisa", "user", userPass);
  await upsertUser("fauziyah", "Fauziyah", "user", userPass);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
