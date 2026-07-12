'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-10 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Something went wrong!</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error while trying to process your request.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={() => reset()} size="lg" className="rounded-full">
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="rounded-full w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}