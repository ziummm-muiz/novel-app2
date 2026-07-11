import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export default async function FriendsReading() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Hide section entirely if logged out
    if (!user) {
        return null;
    }

    // Get people the user follows
    const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (followsError) {
        // Only log if it's an actual query error, not a missing table error during setup
        if (followsError.code !== '42P01') { 
            console.error("Error fetching follows:", followsError);
        }
        return null;
    }

    const followingIds = follows?.map(f => f.following_id) || [];

    // Empty state if they don't follow anyone
    if (followingIds.length === 0) {
        return (
            <section className="w-full my-8 bg-muted/30 p-8 rounded-2xl border border-border text-center">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                    <UserIcon className="size-12 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">See what your friends are reading!</h2>
                    <p className="text-muted-foreground mb-6">
                        Follow other readers and authors to discover new stories based on what they are currently enjoying.
                    </p>
                    <Link href="/explore">
                        <Button>Explore Community</Button>
                    </Link>
                </div>
            </section>
        );
    }

    // Get recent reading history of followed users
    const { data: history, error: historyError } = await supabase
        .from('reading_history')
        .select(`
            id,
            last_read_at,
            profiles!inner(username, full_name, avatar_url),
            novels!inner(id, title, cover_url)
        `)
        .in('user_id', followingIds)
        .order('last_read_at', { ascending: false })
        .limit(4);

    if (historyError) {
        console.error("Error fetching friends reading history:", historyError);
        return null;
    }

    // If friends haven't read anything yet
    if (!history || history.length === 0) {
        return null; 
    }

    return (
        <section className="w-full my-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <UserIcon className="text-primary size-6" /> 
                Friends are reading
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {history.map((record: any) => (
                    <Link href={`/novel/${record.novels.id}`} key={record.id} className="group block">
                        <Card className="overflow-hidden border-border hover:border-primary hover:shadow-md transition-all duration-200 h-full">
                            <CardContent className="p-0 h-full flex flex-col">
                                {/* Friend Info Banner */}
                                <div className="bg-muted/50 p-3 flex items-center gap-3 border-b border-border">
                                    <div className="size-8 rounded-full bg-background flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
                                        {record.profiles.avatar_url ? (
                                            <img src={record.profiles.avatar_url} alt={record.profiles.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="size-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold line-clamp-1">
                                            {record.profiles.full_name || record.profiles.username || "A Friend"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                            is reading
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Novel Info */}
                                <div className="p-4 flex gap-4 flex-1">
                                    <div className="w-16 aspect-[2/3] bg-muted rounded-md overflow-hidden flex-shrink-0 relative shadow-sm">
                                        {/* Placeholder for cover_url */}
                                        <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                            {record.novels.title}
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
