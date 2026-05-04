import { PaySettingsForm } from "@/components/admin/PaySettingsForm";
import { getAdminUser } from "@/lib/auth-admin";
import { createClient } from "@/lib/supabase/server";
import type { PayConfig } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function PaySettingsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pay_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Could not load pay configuration.
      </div>
    );
  }

  return <PaySettingsForm initial={data as PayConfig} />;
}
