import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FileQuestion className="size-10 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find the page you were looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="/">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
