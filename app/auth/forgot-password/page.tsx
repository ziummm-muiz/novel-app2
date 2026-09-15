import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { forgotPassword } from "../actions/actions";
import { BookOpen } from "lucide-react";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const { message, error } = await searchParams;

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
          <span>Mi Novaria<span className="text-primary">.</span></span>
        </div>
        
        <div className="relative z-10 max-w-xl mb-10">
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white mb-6">
            Get Back To <span className="text-primary">Writing.</span>
          </h1>
          <p className="text-xl text-gray-200 drop-shadow">
            Don't let a forgotten password stop your creative flow. Recover your account and continue your epic journey.
          </p>
        </div>
      </section>

      {/* RIGHT SECTION (Form) */}
      <section className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex lg:hidden items-center gap-2 font-bold text-3xl tracking-tight mb-2">
            <BookOpen className="text-primary size-8 shrink-0" />
            <span>Mi Novaria<span className="text-primary">.</span></span>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Reset Password
            </h2>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm font-medium">
              {message}
            </div>
          )}

          <form action={forgotPassword} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel className="text-foreground font-medium mb-1.5 block">Email</FieldLabel>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="mt-6 h-12 w-full rounded-xl text-base font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-md"
            >
              Send Reset Link
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Remembered your password?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
