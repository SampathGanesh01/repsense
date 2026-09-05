import { PrismaClient } from "../generated/prisma";
import { customAlphabet } from "nanoid";

const db = new PrismaClient();

// Unambiguous alphabet (no 0/O/1/I/l) since users read this off an invite link.
const generateCode = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 8);

// Edit this list with your actual pilot participants, then run:
//   npx prisma db seed
const PILOT_USERS = ["Alex", "Priya", "Sam"];

async function main() {
  for (const name of PILOT_USERS) {
    const existing = await db.user.findFirst({ where: { name } });
    if (existing) {
      console.log(`${name}: already exists, code ${existing.accessCode}`);
      continue;
    }
    const user = await db.user.create({ data: { name, accessCode: generateCode() } });
    console.log(`${name}: ${user.accessCode}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
