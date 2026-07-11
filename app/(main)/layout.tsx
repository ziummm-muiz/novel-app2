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
  let unreadMessagesCount = 0;
  let unreadNotificationsCount = 0;

  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;

    // Fetch unread messages
    const { count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    unreadMessagesCount = messagesCount || 0;

    // Fetch unread notifications
    // Supabase will just return 0 or an error if the table doesn't exist yet, which is safe
    const { count: notificationsCount, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    // We ignore error to prevent breaking the layout if the table isn't created yet
    unreadNotificationsCount = notificationsCount || 0;
  }

  return (
    <main className="w-full min-h-screen">
      <Navbar user={user} profile={profile} unreadMessagesCount={unreadMessagesCount} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="pt-24 pb-8 flex flex-col w-full h-full">
        {children}
      </div>
    </main>
  )
}
