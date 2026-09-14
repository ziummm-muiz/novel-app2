import { describe, it, expect } from 'vitest'
import {
  checkIsAdmin,
  canManageNovel,
  isAccountRestricted,
  isUniqueConstraintViolation,
} from '../auth-helpers'

describe('Authorization & Business Rules', () => {
  const adminUser = {
    id: 'admin-uuid',
    app_metadata: { is_admin: true },
  }

  const regularAuthor = {
    id: 'author-uuid',
    app_metadata: { is_admin: false },
  }

  const otherUser = {
    id: 'other-user-uuid',
    app_metadata: {},
  }

  describe('Admin Authorization via JWT Claims', () => {
    it('grants admin status only when app_metadata.is_admin is strictly true', () => {
      expect(checkIsAdmin(adminUser)).toBe(true)
      expect(checkIsAdmin(regularAuthor)).toBe(false)
      expect(checkIsAdmin(otherUser)).toBe(false)
      expect(checkIsAdmin(null)).toBe(false)
      expect(checkIsAdmin(undefined)).toBe(false)
    })
  })

  describe('Novel & Chapter Ownership Rules', () => {
    const novelAuthorId = 'author-uuid'

    it('allows the author of the novel to manage it', () => {
      expect(canManageNovel(regularAuthor, novelAuthorId)).toBe(true)
    })

    it('allows an administrator to manage any novel regardless of author', () => {
      expect(canManageNovel(adminUser, novelAuthorId)).toBe(true)
      expect(canManageNovel(adminUser, 'unknown-author')).toBe(true)
    })

    it('denies a non-author, non-admin user from managing the novel', () => {
      expect(canManageNovel(otherUser, novelAuthorId)).toBe(false)
    })

    it('denies unauthenticated access', () => {
      expect(canManageNovel(null, novelAuthorId)).toBe(false)
    })
  })

  describe('User Account Restrictions', () => {
    it('correctly identifies restricted profiles', () => {
      expect(isAccountRestricted({ is_restricted: true })).toBe(true)
      expect(isAccountRestricted({ is_restricted: false })).toBe(false)
      expect(isAccountRestricted({ is_restricted: null })).toBe(false)
      expect(isAccountRestricted(null)).toBe(false)
    })
  })

  describe('Duplicate Review Error Handling', () => {
    it('detects Postgres code 23505 as a unique constraint violation', () => {
      expect(isUniqueConstraintViolation({ code: '23505' })).toBe(true)
      expect(isUniqueConstraintViolation({ code: '23514' })).toBe(false)
      expect(isUniqueConstraintViolation(null)).toBe(false)
    })
  })
})
