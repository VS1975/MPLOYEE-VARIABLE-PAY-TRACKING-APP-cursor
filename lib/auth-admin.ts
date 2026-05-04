import { createClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) return null;

  return { user, email: profile.email ?? user.email ?? "" };
}
