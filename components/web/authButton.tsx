import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { signout } from "@/app/auth/actions/actions";
import { User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";

export default function AuthButton({ user, profile }: { user: SupabaseUser | null, profile?: any }) {

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link href={'/dashboard'}>
                <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-full bg-background hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center bg-muted rounded-full overflow-hidden size-8 shrink-0 border border-border">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="size-4 text-muted-foreground" />
                        )}
                    </div>
                    <span className="hidden sm:inline-block text-sm font-medium text-foreground pr-1 whitespace-nowrap truncate max-w-[120px]">
                        {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                    </span>
                </div>
                </Link>
                <form action={signout} className="hidden sm:block">
                    <Button type="submit" variant="secondary" size="sm" className="rounded-full">Sign Out</Button>
                </form>
            </div>
        )
    }

    return (
        <div className="flex flex-row gap-4 justify-between">
            <Link href={'/auth/signup'} className="py-2 px-4 text-sm font-medium items-center flex justify-center rounded-full hover:bg-muted transition-colors">Sign Up</Link>
            <Link href={'/auth/login'} className="py-2 bg-primary text-primary-foreground text-sm font-medium px-4 items-center flex justify-center rounded-full hover:bg-primary/90 transition-colors">Login</Link>
        </div>
    )
}