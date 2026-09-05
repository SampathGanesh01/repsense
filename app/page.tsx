import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { AccessCodeForm } from "@/components/AccessCodeForm";

export default async function EntryPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/dashboard");

  return <AccessCodeForm />;
}
