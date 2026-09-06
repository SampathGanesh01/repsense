import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/AdminLogin";
import { PoseTestTool } from "@/components/PoseTestTool";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PoseTestPage() {
  const authed = await isAdminAuthenticated();
  return authed ? <PoseTestTool /> : <AdminLogin />;
}
