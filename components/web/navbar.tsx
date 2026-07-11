'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation';
import AuthButton from './authButton';
import Coins from './coins';

import { User as SupabaseUser } from "@supabase/supabase-js";
import { BookOpen, Bell, MessageSquare } from 'lucide-react';

export default function Navbar({ user, profile }: { user: SupabaseUser | null, profile?: any }) {

  const pathname = usePathname()

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Best Seller", href: "/best-seller" },
    { name: "Categories", href: "/categories" },
    { name: "Blog", href: "/blogs" },
  ];

  if (user) {
    navLinks.push({ name: "Library", href: "/library" });
  }

  return (
    <nav className="w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border py-4 px-6 flex items-center justify-between fixed top-0 left-0 z-50">
      {/* Left section: Logo + Links */}
      <div className="flex items-center gap-10">
        {/*  logo  */}
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <BookOpen className="text-primary size-6" />
                        <span>NovelApp<span className="text-primary">.</span></span>
                    </Link>
                </div>

        {/* Nav Links */}
        <ul className="flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (pathname.startsWith(link.href) && link.href !== "/");

            return (
              <Link
                key={link.name}
                className={`transition-colors hover:text-primary ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
                href={link.href}
              >
                {link.name}
              </Link>
            );
          })}
        </ul>
      </div>

      {/* Right section: Coins + Auth */}
      <div className="flex items-center gap-6">
        {user && (
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link href="/chats" className="hover:text-primary transition-colors hover:scale-110 active:scale-95" title="Messages">
              <MessageSquare className="size-5" />
            </Link>
            <Link href="/notifications" className="hover:text-primary transition-colors hover:scale-110 active:scale-95" title="Notifications">
              <Bell className="size-5" />
            </Link>
          </div>
        )}
        <Coins/>
        <AuthButton user={user} profile={profile} />    
      </div>
    </nav>
  )
}
