import type { User } from '@supabase/supabase-js'

export interface AuthContextUser {
  id: string
  app_metadata?: {
    is_admin?: boolean
    [key: string]: unknown
  }
}

/**
 * Returns true if the user is a verified administrator via JWT claims.
 */
export function checkIsAdmin(user: AuthContextUser | User | null | undefined): boolean {
  return user?.app_metadata?.is_admin === true
}

/**
 * Returns true if the user is authorized to manage (edit/delete) a novel or its chapters.
 * Authorized if the user is the author OR an administrator.
 */
export function canManageNovel(
  user: AuthContextUser | User | null | undefined,
  novelAuthorId: string | null | undefined
): boolean {
  if (!user || !user.id) return false
  if (checkIsAdmin(user)) return true
  return Boolean(novelAuthorId && user.id === novelAuthorId)
}

/**
 * Returns true if the user account has active restrictions preventing posting/engagement.
 */
export function isAccountRestricted(profile: { is_restricted?: boolean | null } | null | undefined): boolean {
  return profile?.is_restricted === true
}

/**
 * Checks if a PostgreSQL error indicates a unique constraint violation (e.g. duplicate review).
 */
export function isUniqueConstraintViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === '23505'
}
