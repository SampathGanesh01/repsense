import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  return authed ? <AdminDashboard /> : <AdminLogin />;
}
