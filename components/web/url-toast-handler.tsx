"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

export default function UrlToastHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const error = searchParams.get("error")
    const message = searchParams.get("message")

    if (error || message) {
      if (error) {
        toast.error(error)
      }
      if (message) {
        toast.success(message)
      }

      // Remove the parameters from the URL without a full page reload
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("error")
      newSearchParams.delete("message")
      
      const newUrl = pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : "")
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, pathname, router])

  return null
}
