import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Back Button */}
      <Link
        href="/"
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className:
            "absolute left-6 top-6 z-50 rounded-full border border-border bg-background/50 backdrop-blur-md hover:bg-muted text-muted-foreground",
        })}
      >
        <ArrowLeft className="size-5" />
      </Link>

      {children}
    </div>
  );
}