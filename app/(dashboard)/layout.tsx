import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, BookOpen, Settings, Users, ArrowLeft, Edit, Menu } from "lucide-react";
import { redirect } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, username")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.is_admin || false;

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card flex-col hidden md:flex sticky top-0 h-screen">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <BookOpen className="text-primary size-6" />
                        <span>NovelApp<span className="text-primary">.</span></span>
                    </Link>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                        Menu
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                        <LayoutDashboard className="size-4" />
                        Overview
                    </Link>
                    
                    {!isAdmin && (
                        <Link href="/dashboard/write/new" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                            <BookOpen className="size-4" />
                            Write Novel
                        </Link>
                    )}

                    <Link href="/dashboard/blogs" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                        <Edit className="size-4" />
                        Blogs
                    </Link>

                    {isAdmin && (
                        <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                            <Users className="size-4" />
                            Manage Users
                        </Link>
                    )}

                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                        <Settings className="size-4" />
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors text-muted-foreground">
                        <ArrowLeft className="size-4" />
                        Back to Site
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <BookOpen className="text-primary size-5" />
                        <span>NovelApp<span className="text-primary">.</span></span>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 -mr-2 rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <Menu className="size-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuItem>
                                <Link href="/dashboard" className="w-full cursor-pointer flex items-center gap-2">
                                    <LayoutDashboard className="size-4" /> Overview
                                </Link>
                            </DropdownMenuItem>
                            {!isAdmin && (
                                <DropdownMenuItem>
                                    <Link href="/dashboard/write/new" className="w-full cursor-pointer flex items-center gap-2">
                                        <BookOpen className="size-4" /> Write Novel
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                                <Link href="/dashboard/blogs" className="w-full cursor-pointer flex items-center gap-2">
                                    <Edit className="size-4" /> Blogs
                                </Link>
                            </DropdownMenuItem>
                            {isAdmin && (
                                <DropdownMenuItem>
                                    <Link href="/dashboard/users" className="w-full cursor-pointer flex items-center gap-2">
                                        <Users className="size-4" /> Manage Users
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                                <Link href="/dashboard/settings" className="w-full cursor-pointer flex items-center gap-2">
                                    <Settings className="size-4" /> Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/" className="w-full cursor-pointer flex items-center gap-2 text-muted-foreground">
                                    <ArrowLeft className="size-4" /> Back to Site
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
