"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react"
import { toggleUserRestriction } from "@/app/actions/admin"

export default function UserRestrictionToggle({ 
  userId, 
  isRestricted,
  isAdmin
}: { 
  userId: string, 
  isRestricted: boolean,
  isAdmin: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (isAdmin) {
      alert("You cannot restrict another admin.")
      return
    }
    
    const action = isRestricted ? "unrestrict" : "restrict"
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    setIsLoading(true)
    try {
      await toggleUserRestriction(userId, !isRestricted)
    } catch (error: any) {
      alert(error.message || "Failed to update user.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isAdmin) {
    return <Button variant="ghost" size="sm" disabled>Admin</Button>
  }

  return (
    <Button 
      variant={isRestricted ? "outline" : "destructive"} 
      size="sm" 
      onClick={handleToggle}
      disabled={isLoading}
      className={isRestricted ? "text-green-600 hover:text-green-700 hover:bg-green-50" : ""}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isRestricted ? (
        <>
          <ShieldCheck className="size-4 mr-2" />
          Unrestrict
        </>
      ) : (
        <>
          <ShieldAlert className="size-4 mr-2" />
          Restrict
        </>
      )}
    </Button>
  )
}
