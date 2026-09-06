import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no 0/O/1/I/l) since users read this off an invite link.
const nanoid = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 8);

export function generateAccessCode(): string {
  return nanoid();
}
