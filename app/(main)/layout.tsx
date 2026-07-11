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

  return (
    <main className="w-full min-h-screen">
      <Navbar user={user} />
      <div className="pt-24 pb-8 flex flex-col w-full h-full">
        {children}
      </div>
    </main>
  )
}
