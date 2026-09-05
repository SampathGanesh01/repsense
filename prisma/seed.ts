import { PrismaClient } from "../generated/prisma";
import { customAlphabet } from "nanoid";

const db = new PrismaClient();

// Unambiguous alphabet (no 0/O/1/I/l) since users read this off an invite link.
const generateCode = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 8);

// Edit this list with your actual pilot participants, then run:
//   npx prisma db seed
const PILOT_USERS = ["Alex", "Priya", "Sam"];

// Set to your deployed URL (no trailing slash) so the printed output is a
// ready-to-send one-click link instead of a bare code.
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

async function main() {
  for (const name of PILOT_USERS) {
    const existing = await db.user.findFirst({ where: { name } });
    const user = existing ?? (await db.user.create({ data: { name, accessCode: generateCode() } }));
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
