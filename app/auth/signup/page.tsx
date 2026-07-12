"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { signup, checkUsername } from "../actions/actions";
import { BookOpen, CalendarIcon, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const [date, setDate] = useState<Date>();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!username || username.trim() === "") {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      const res = await checkUsername(username);
      setUsernameAvailable(res.available);
      setIsCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculateStrength(password);
  
  let strengthColor = "bg-border";
  if (strength > 0 && strength <= 25) strengthColor = "bg-red-500";
  else if (strength > 25 && strength <= 75) strengthColor = "bg-yellow-500";
  else if (strength === 100) strengthColor = "bg-emerald-500";

  return (
    <main className="relative min-h-screen flex w-full bg-background text-foreground">
      {/* LEFT SECTION (Form) */}
      <section className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10 order-2 lg:order-1">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="flex lg:hidden items-center gap-2 font-bold text-3xl tracking-tight mb-2">
            <BookOpen className="text-primary size-8 shrink-0" />
            <span>NovelApp<span className="text-primary">.</span></span>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Create an account
            </h2>
            <p className="text-muted-foreground">
              Start writing your next masterpiece today.
            </p>
          </div>

          <form action={signup} className="space-y-4">
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="full_name" className="text-foreground font-medium mb-1.5 block">Full Name</FieldLabel>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="John Doe"
                    className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="username" className="text-foreground font-medium mb-1.5 block">Username</FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    placeholder="@johndoe"
                    className={cn(
                      "h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary",
                      usernameAvailable === false && "border-red-500 focus-visible:ring-red-500",
                      usernameAvailable === true && "border-emerald-500 focus-visible:ring-emerald-500"
                    )}
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {username && (
                    <div className="mt-1.5 flex items-center text-xs">
                      {isCheckingUsername ? (
                        <span className="text-muted-foreground flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Checking availability...</span>
                      ) : usernameAvailable === true ? (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="size-3" /> Username is available</span>
                      ) : usernameAvailable === false ? (
                        <span className="text-red-500 flex items-center gap-1"><XCircle className="size-3" /> Username is taken</span>
                      ) : null}
                    </div>
                  )}
                </Field>
              </div>

              <Field className="mt-4">
                <FieldLabel htmlFor="email" className="text-foreground font-medium mb-1.5 block">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                  required
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <Field>
                  <FieldLabel htmlFor="phone" className="text-foreground font-medium mb-1.5 block">Phone Number</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+234..."
                    className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="dob" className="text-foreground font-medium mb-1.5 block">Date of Birth</FieldLabel>
                  <input type="hidden" name="dob" value={date ? format(date, "yyyy-MM-dd") : ""} />
                  <Popover>
                    <PopoverTrigger className={cn("w-full justify-start text-left font-normal h-12 rounded-xl bg-background border border-border shadow-xs hover:bg-muted/50 transition-colors flex items-center px-3", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        captionLayout="dropdown"
                        startMonth={new Date(1900, 0)}
                        endMonth={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </div>

              <Field className="mt-4">
                <FieldLabel htmlFor="password" className="text-foreground font-medium mb-1.5 block">
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}"
                    title="Must contain at least 8 characters, including uppercase, lowercase, numbers and symbols."
                    className="h-12 rounded-xl bg-background border-border shadow-xs focus-visible:ring-primary pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-300 ease-in-out", strengthColor)} 
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Strength</span>
                    <span>{strength === 100 ? "Strong" : strength > 25 ? "Fair" : strength > 0 ? "Weak" : ""}</span>
                  </div>
                </div>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              disabled={usernameAvailable === false || isCheckingUsername}
              className="mt-6 h-12 w-full rounded-xl text-base font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              Create Account
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
              variant="outline"
              type="button"
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
              Already have an account?{" "}
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

      {/* RIGHT SECTION (Background/Hero) */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-10 border-l border-border/50 order-1 lg:order-2">
        <div className="absolute inset-0 bg-zinc-950 z-0"></div>
        <div 
          className="absolute inset-0 opacity-40 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1455390582262-044cdead27d8?q=80&w=2070')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20 z-0"></div>
        
        <div className="relative z-10 flex items-center gap-2 font-bold text-3xl text-white tracking-tight justify-end">
          <span>NovelApp<span className="text-primary">.</span></span>
          <BookOpen className="text-primary size-8 shrink-0" />
        </div>
        
        <div className="relative z-10 max-w-xl mb-10 self-end text-right">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
            Join the community
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white mb-6">
            Write Your <span className="text-primary">Legacy.</span>
          </h1>
          <p className="text-xl text-gray-200 drop-shadow ml-auto max-w-md">
            Unleash your creativity. Build an audience, publish your novels, and connect with passionate readers worldwide.
          </p>
        </div>
      </section>
    </main>
  );
}