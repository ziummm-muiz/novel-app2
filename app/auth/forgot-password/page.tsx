import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <h1 className="text-2xl font-bold">Forgot Password</h1>
      <p className="text-muted-foreground">
        This feature is currently under construction.
      </p>
      <Link href="/auth/login">
        <Button variant="outline">Back to Login</Button>
      </Link>
    </div>
  );
}
