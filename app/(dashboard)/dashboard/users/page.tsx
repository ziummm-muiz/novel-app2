import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, ShieldAlert, CheckCircle2, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import UserRestrictionToggle from "./user-restriction-toggle"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // 2. Check if current user is admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!currentProfile?.is_admin) {
    redirect("/dashboard")
  }

  // 3. Fetch all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return <div className="p-8 text-destructive">Failed to load users.</div>
  }

  const restrictedUsersCount = users?.filter(u => u.is_restricted).length || 0

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
          <Users className="size-8 text-primary" />
          Manage Users
        </h1>
        <p className="text-muted-foreground">Admin control panel to view registered users and restrict abusive accounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registered Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Restricted Accounts</CardTitle>
            <ShieldAlert className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{restrictedUsersCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>A complete list of all users on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {users?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No users found.</div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 font-semibold border-b bg-muted/50 text-sm">
                <div className="col-span-5 md:col-span-4">User</div>
                <div className="col-span-3 hidden md:block">Joined</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-4 md:col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {users?.map((u) => (
                  <div key={u.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                    <div className="col-span-5 md:col-span-4 flex items-center gap-3 overflow-hidden">
                      <div className="size-10 rounded-full bg-muted border overflow-hidden shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.username || 'User'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                            {(u.username || u.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{u.full_name || 'No Name'}</span>
                        <span className="text-muted-foreground truncate">@{u.username || 'unknown'}</span>
                        {u.is_admin && (
                          <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit mt-1">Admin</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-3 hidden md:flex items-center text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="col-span-3 flex items-center">
                      {u.is_restricted ? (
                        <div className="flex items-center gap-1.5 text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-full text-xs">
                          <ShieldOff className="size-3" />
                          Restricted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-600/10 px-2 py-1 rounded-full text-xs">
                          <CheckCircle2 className="size-3" />
                          Active
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 flex justify-end">
                      <UserRestrictionToggle 
                        userId={u.id} 
                        isRestricted={u.is_restricted || false} 
                        isAdmin={u.is_admin || false} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
