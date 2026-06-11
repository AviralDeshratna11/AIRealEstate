import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMockUserByEmail, MOCK_COOKIE, type AppUser } from "@/lib/auth/mock";
import { isAuthRole } from "@/lib/auth/roles";

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const mockEmail = cookieStore.get(MOCK_COOKIE)?.value;
  const mockUser = getMockUserByEmail(mockEmail);
  if (mockUser) return mockUser;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser?.email) return null;
  const role = authUser.user_metadata?.role;
  const safeRole = isAuthRole(role) ? role : "buyer";
  return {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
    avatar_url: authUser.user_metadata?.avatar_url,
    role: safeRole,
    primary_role: safeRole,
    onboarding_completed: Boolean(authUser.user_metadata?.onboarding_completed),
    organization_id: authUser.user_metadata?.organization_id ?? null,
  };
}

