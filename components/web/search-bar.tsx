'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-sm">
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search novels, authors..."
        className="pl-9 pr-4 rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-ring transition-colors"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  )
}
