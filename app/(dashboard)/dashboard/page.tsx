import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.is_admin || false;

    if (isAdmin) {
        // --- ADMIN DASHBOARD ---
        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
        const { count: totalNovels } = await supabase.from("novels").select("*", { count: 'exact', head: true });
        const { count: totalChapters } = await supabase.from("chapters").select("*", { count: 'exact', head: true });

        return (
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black">Admin Overview</h1>
                    <p className="text-muted-foreground">Platform-wide statistics and management.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalUsers || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Novels</CardTitle>
                            <BookOpen className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalNovels || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Published Chapters</CardTitle>
                            <Layers className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalChapters || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // --- AUTHOR DASHBOARD ---
    const { data: novels } = await supabase
        .from("novels")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

    const totalNovels = novels?.length || 0;
    
    const novelIds = novels?.map(n => n.id) || [];
    let totalChapters = 0;
    if (novelIds.length > 0) {
        const { count } = await supabase
            .from("chapters")
            .select("*", { count: 'exact', head: true })
            .in("novel_id", novelIds);
        totalChapters = count || 0;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black">Author Studio</h1>
                    <p className="text-muted-foreground">Manage your stories and view your analytics.</p>
                </div>
                <Link href="/dashboard/write/new">
                    <Button>Create New Novel</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">My Novels</CardTitle>
                        <BookOpen className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalNovels}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Published Chapters</CardTitle>
                        <Layers className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalChapters}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Readers</CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Analytics coming soon</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-bold mb-6">My Works</h2>
            {totalNovels === 0 ? (
                <div className="text-center py-20 bg-muted/30 border border-border rounded-xl">
                    <BookOpen className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold mb-2">You haven't written any novels yet</h3>
                    <p className="text-muted-foreground mb-6">Start your author journey today.</p>
                    <Link href="/dashboard/write/new">
                        <Button>Start Writing</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {novels?.map(novel => (
                        <Card key={novel.id} className="overflow-hidden flex flex-col group hover:border-primary transition-colors">
                            <div className="aspect-[2/1] relative bg-muted overflow-hidden">
                                {novel.cover_url && <img src={novel.cover_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/dashboard/write/${novel.id}/chapters`}>
                                        <Button variant="secondary">Manage Chapters</Button>
                                    </Link>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-bold text-lg line-clamp-1">{novel.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{novel.synopsis}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
