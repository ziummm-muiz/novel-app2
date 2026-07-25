import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Layers, Settings, Trash2, PlusCircle, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteNovelButton } from "./delete-novel-button";

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
        const { count: totalNovels } = await supabase.from("novels").select("*", { count: 'exact', head: true }).is("deleted_at", null);
        const { count: totalChapters } = await supabase.from("chapters").select("*", { count: 'exact', head: true }).is("deleted_at", null);

        // Fetch all novels with author info and chapter count
        const { data: allNovels } = await supabase
            .from("novels")
            .select(`
                id, title, cover_url, genres, created_at,
                profiles ( username, full_name ),
                chapters:chapters!left ( id, deleted_at )
            `)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        return (
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black">Admin Overview</h1>
                        <p className="text-muted-foreground">Platform-wide statistics and content management.</p>
                    </div>
                    <Link href="/dashboard/users">
                        <Button variant="outline" className="gap-2">
                            <Users className="size-4" />
                            Manage Users
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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

                {/* All Novels Table */}
{/* All Novels */}
<div className="mb-4 flex items-center justify-between">
  <h2 className="text-xl font-bold">All Novels</h2>
  <span className="text-sm text-muted-foreground">{allNovels?.length || 0} total</span>
</div>

<div className="rounded-xl border border-border overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full table-fixed min-w-225">
      <colgroup>
        <col className="w-[34%]" />
        <col className="w-[22%]" />
        <col className="w-[10%]" />
        <col className="w-[34%]" />
      </colgroup>

      <thead className="bg-muted/40">
        <tr className="border-b border-border">
          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Novel
          </th>
          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Author
          </th>
          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chapters
          </th>
          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {allNovels?.length ? (
          allNovels.map((novel: any) => {
            const author = Array.isArray(novel.profiles)
              ? novel.profiles[0]
              : novel.profiles;

            return (
              <tr
                key={novel.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                {/* Novel */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-border bg-muted">
                      {novel.cover_url ? (
                        <img
                          src={novel.cover_url}
                          alt={novel.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm">
                        {novel.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(novel.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Author */}
                <td className="px-5 py-4">
                  <span className="block truncate text-sm text-muted-foreground">
                    {author?.username || author?.full_name || "Unknown"}
                  </span>
                </td>

                {/* Chapters */}
                <td className="px-5 py-4">
                  <Link href={`/novel/${novel.id}`}>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 gap-1.5 -ml-3 px-3"
                    >
                        <Layers className="size-3.5" />
                        {novel.chapters?.filter((c: any) => !c.deleted_at).length ?? 0} Chapters
                    </Button>
                  </Link>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex justify-end items-center gap-2 flex-nowrap whitespace-nowrap">


                    {/* <Link href={`/novel/${novel.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 gap-1.5 px-3"
                      >
                        <Layers className="size-3.5" />
                        Chapters
                      </Button>
                    </Link> */}

                    <Link href={`/dashboard/write/${novel.id}/settings`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 gap-1.5 px-3"
                      >
                        <Settings className="size-3.5" />
                        Edit
                      </Button>
                    </Link>

                    <div className="shrink-0">
                      <DeleteNovelButton
                        novelId={novel.id}
                        novelTitle={novel.title}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
              No novels found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
            </div>
        );
    }

    // --- AUTHOR DASHBOARD ---
    const { data: novels } = await supabase
        .from("novels")
        .select("*")
        .eq("author_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    const totalNovels = novels?.length || 0;
    
    const novelIds = novels?.map(n => n.id) || [];
    let totalChapters = 0;
    if (novelIds.length > 0) {
        const { count } = await supabase
            .from("chapters")
            .select("*", { count: 'exact', head: true })
            .in("novel_id", novelIds)
            .is("deleted_at", null);
        totalChapters = count || 0;
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black">Author Studio</h1>
                    <p className="text-muted-foreground">Manage your stories and view your analytics.</p>
                </div>
                <Link href="/dashboard/write/new">
                    <Button className="gap-2">
                        <PlusCircle className="size-4" />
                        New Novel
                    </Button>
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
                    <h3 className="text-lg font-bold mb-2">You haven&apos;t written any novels yet</h3>
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
                            <CardContent className="p-4 flex-1">
                                <h3 className="font-bold text-lg line-clamp-1">{novel.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{novel.synopsis}</p>
                            </CardContent>
                            {/* Action footer */}
                            <div className="px-4 pb-4 pt-0 flex items-center gap-2 border-t border-border mt-auto pt-3">
                                <Link href={`/dashboard/write/${novel.id}/settings`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                                        <Settings className="size-3.5" />
                                        Edit
                                    </Button>
                                </Link>
                                <Link href={`/novel/${novel.id}`}>
                                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                                        <Eye className="size-3.5" />
                                    </Button>
                                </Link>
                                <DeleteNovelButton novelId={novel.id} novelTitle={novel.title} iconOnly />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
