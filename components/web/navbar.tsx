'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation';
import AuthButton from './authButton';
import Coins from './coins';

import { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar({ user }: { user: SupabaseUser | null }) {

  const pathname = usePathname()

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Best Seller", href: "/best-seller" },
    { name: "Categories", href: "/categories" },
    { name: "Blog", href: "/blogs" },
  ];

  return (
    <nav className="w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border py-4 px-6 flex items-center justify-between fixed top-0 left-0 z-50">
      {/* Left section: Logo + Links */}
      <div className="flex items-center gap-10">
        {/*  logo  */}
        <Link href={'/'}>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Web Novels</h1>
        </Link>

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
        <Coins/>
        <AuthButton user={user} />    
      </div>
    </nav>
  )
}
