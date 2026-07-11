import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import NovelCard from "@/components/web/novel-card"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''
  
  if (!query) {
    redirect('/')
  }

  const supabase = await createClient()

  // 1. Search Novels
  const { data: novels, error: novelsError } = await supabase
    .from('novels')
    .select('*, author:profiles(username, full_name)')
    .ilike('title', `%${query}%`)
    .limit(20)

  // 2. Search Users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .ilike('username', `%${query}%`)
    .limit(20)

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 pt-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      <p className="text-muted-foreground mb-10">Showing results for &quot;<span className="font-semibold text-foreground">{query}</span>&quot;</p>

      {/* Novels Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Novels</h2>
        {(!novels || novels.length === 0) ? (
          <p className="text-muted-foreground">No novels found matching your query.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </section>

      <div className="w-full h-px bg-border mb-12"></div>

      {/* Users Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Users</h2>
        {(!users || users.length === 0) ? (
          <p className="text-muted-foreground">No users found matching your query.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <Link href={`/user/${user.id}`} key={user.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      {(user.username || user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold truncate">{user.username || 'Anonymous'}</span>
                  {user.full_name && (
                    <span className="text-xs text-muted-foreground truncate">{user.full_name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
