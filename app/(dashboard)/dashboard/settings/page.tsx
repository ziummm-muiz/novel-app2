import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-black mb-2">Settings</h1>
            <p className="text-muted-foreground mb-8">Manage your account and profile preferences.</p>

            <SettingsForm profile={profile} email={user.email || ""} />
        </div>
    );
}
