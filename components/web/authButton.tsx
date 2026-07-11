import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { signout } from "@/app/auth/actions/actions";
import { User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";

export default function AuthButton({ user }: { user: SupabaseUser | null }) {

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link href={'/dashboard'}>
                <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-full bg-background">
                    <div className="flex items-center justify-center bg-muted rounded-full p-1.5">
                        <UserIcon className="size-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                </div>
                </Link>
                <form action={signout}>
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