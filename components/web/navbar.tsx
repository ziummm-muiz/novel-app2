'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation';
import AuthButton from './authButton';
// import Coins from './coins';

import { User as SupabaseUser } from "@supabase/supabase-js";
import { BookOpen, Bell, MessageSquare, Menu } from 'lucide-react';
import SearchBar from './search-bar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Navbar({ 
  user, 
  profile,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0
}: { 
  user: SupabaseUser | null, 
  profile?: any,
  unreadMessagesCount?: number,
  unreadNotificationsCount?: number
}) {

  const pathname = usePathname()

  const navLinks = [
    { name: "Home", href: "/" },
    // { name: "Best Seller", href: "/best-seller" },
    { name: "Categories", href: "/categories" },
    { name: "Blog", href: "/blogs" },
  ];

  if (user) {
    navLinks.push({ name: "Library", href: "/library" });
  }

  return (
    <nav className="w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border py-3 px-4 md:px-6 flex items-center justify-between fixed top-0 left-0 z-50">
      {/* Left section: Logo + Links */}
      <div className="flex items-center gap-4 lg:gap-8">
        
        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 -ml-2 rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Menu className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 mt-2">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.name}>
                  <Link href={link.href} className="w-full cursor-pointer">
                    {link.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
            <BookOpen className="text-primary size-5 md:size-6 shrink-0" />
            <span className="hidden sm:inline-block">NovelApp<span className="text-primary">.</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
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

      {/* Right section: Search + Coins + Auth */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <div className="hidden lg:block w-64 xl:w-80">
          <SearchBar />
        </div>
        {user && (
          <div className="flex items-center gap-2 sm:gap-4 text-muted-foreground">
            <Link href="/chats" className="relative hover:text-primary transition-colors hover:scale-110 active:scale-95" title="Messages">
              <MessageSquare className="size-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-background shadow-sm">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </Link>
            <Link href="/notifications" className="relative hover:text-primary transition-colors hover:scale-110 active:scale-95" title="Notifications">
              <Bell className="size-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-background shadow-sm">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </Link>
          </div>
        )}
        <div className="hidden sm:block">
          {/* <Coins/> */}
        </div>
        <AuthButton user={user} profile={profile} />    
      </div>
    </nav>
  )
}
