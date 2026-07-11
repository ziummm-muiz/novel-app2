import Navbar from "@/components/web/navbar";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <main className="w-full min-h-screen">
      <Navbar user={user} profile={profile} />
      <div className="pt-24 pb-8 flex flex-col w-full h-full">
        {children}
      </div>
    </main>
  )
}
