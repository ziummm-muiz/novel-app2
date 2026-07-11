import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCircle2, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // If table doesn't exist yet, we will just get an error, so we handle it gracefully.
  const hasNotifications = !error && notifications && notifications.length > 0;
  const unreadCount = hasNotifications ? notifications.filter(n => !n.is_read).length : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <form action={async () => {
            "use server"
            await markAllNotificationsAsRead("/notifications");
          }}>
            <Button variant="outline" type="submit" size="sm">
              <Check className="size-4 mr-2" />
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {!hasNotifications && (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-card/50 border-dashed">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Bell className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-2">No notifications yet</h3>
            <p className="text-muted-foreground max-w-sm">
              When you get updates about novels or your account, they will appear here.
            </p>
          </div>
        )}

        {hasNotifications && notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-5 rounded-2xl border transition-all ${
              notification.is_read 
                ? "bg-card border-border opacity-70" 
                : "bg-primary/5 border-primary/20 shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h4 className={`font-semibold ${!notification.is_read ? 'text-primary' : ''}`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {notification.content}
                </p>
                <div className="flex items-center gap-4 mt-2 pt-2">
                  <span className="text-xs text-muted-foreground flex items-center">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                  
                  {notification.link && (
                    <Link href={notification.link} className="text-xs font-medium text-primary hover:underline">
                      View details
                    </Link>
                  )}
                </div>
              </div>

              {!notification.is_read && (
                <form action={async () => {
                  "use server"
                  await markNotificationAsRead(notification.id, "/notifications");
                }}>
                  <Button variant="ghost" size="icon" type="submit" className="shrink-0 rounded-full h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Mark as read">
                    <CheckCircle2 className="size-5" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
