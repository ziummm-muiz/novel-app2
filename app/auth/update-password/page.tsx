import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { updatePassword } from "../actions/actions";
import { BookOpen } from "lucide-react";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="relative min-h-screen flex w-full bg-background text-foreground">
      {/* LEFT SECTION (Background/Hero) */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-10 border-r border-border/50">
        <div className="absolute inset-0 bg-zinc-950 z-0"></div>
        <div 
          className="absolute inset-0 opacity-40 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2070')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20 z-0"></div>
        
        <div className="relative z-10 flex items-center gap-2 font-bold text-3xl text-white tracking-tight">
          <BookOpen className="text-primary size-8 shrink-0" />
          <span>NovelApp<span className="text-primary">.</span></span>
        </div>
        
        <div className="relative z-10 max-w-xl mb-10">
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white mb-6">
            Secure Your <span className="text-primary">Account.</span>
          </h1>
          <p className="text-xl text-gray-200 drop-shadow">
            Set a new, strong password to protect your stories and readers.
          </p>
        </div>
      </section>

      {/* RIGHT SECTION (Form) */}
      <section className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex lg:hidden items-center gap-2 font-bold text-3xl tracking-tight mb-2">
            <BookOpen className="text-primary size-8 shrink-0" />
            <span>NovelApp<span className="text-primary">.</span></span>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Update Password
            </h2>
            <p className="text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form action={updatePassword} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel className="text-foreground font-medium mb-1.5 block">New Password</FieldLabel>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}"
                  title="Must contain at least 8 characters, including uppercase, lowercase, numbers and symbols."
                  className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, numbers, and symbols.
                </p>
              </Field>

              <Field className="mt-4">
                <FieldLabel className="text-foreground font-medium mb-1.5 block">Confirm New Password</FieldLabel>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}"
                  title="Must contain at least 8 characters, including uppercase, lowercase, numbers and symbols."
                  className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="mt-6 h-12 w-full rounded-xl text-base font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-md"
            >
              Update Password
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
