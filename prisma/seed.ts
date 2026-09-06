import { PrismaClient } from "../generated/prisma";
import { generateAccessCode } from "../lib/accessCode";

const db = new PrismaClient();

// Edit this list with your actual pilot participants, then run:
//   npx prisma db seed
const PILOT_USERS = ["Alex", "Priya", "Sam"];

// Set to your deployed URL (no trailing slash) so the printed output is a
// ready-to-send one-click link instead of a bare code.
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

async function main() {
  for (const name of PILOT_USERS) {
    const existing = await db.user.findFirst({ where: { name } });
    const user = existing ?? (await db.user.create({ data: { name, accessCode: generateAccessCode() } }));
    const label = existing ? "already exists" : "created";
    console.log(`${name} (${label}): ${APP_BASE_URL}/api/auth/join?code=${user.accessCode}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
