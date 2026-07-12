import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { login } from "../actions/actions";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
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
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
            Discover a world of stories
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white mb-6">
            Read Endless <span className="text-primary">Worlds.</span>
          </h1>
          <p className="text-xl text-gray-200 drop-shadow">
            Immerse yourself in thousands of novels from emerging authors, or start writing your own epic journey today.
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
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Please enter your details to sign in.
            </p>
          </div>

          <form action={login} className="space-y-4">
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

              <Field className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <FieldLabel className="text-foreground font-medium">Password</FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="mt-6 h-12 w-full rounded-xl text-base font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-md"
            >
              Sign In
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl bg-transparent hover:bg-muted font-medium"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}