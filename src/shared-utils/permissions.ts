// ============================================================
// Permissions Hook — بررسی دسترسی کاربر بر اساس نقش و مجوزها
// ============================================================

import { useMemo } from 'react';
import type { User } from '@/src/shared-types';

export interface PermissionChecker {
  /** Check if user has a specific permission (e.g. 'users.create') */
  can: (permission: string) => boolean;
  /** Check if user has any of the given permissions */
  canAny: (permissions: string[]) => boolean;
  /** Check if user has all of the given permissions */
  canAll: (permissions: string[]) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Check if user has any of the given roles */
  hasAnyRole: (roles: string[]) => boolean;
  /** Get all permissions */
  permissions: string[];
  /** Get all roles */
  roles: string[];
}

/**
 * Hook for checking user permissions throughout the app.
 *
 * Usage:
 * ```tsx
 * const { can, hasRole } = usePermissions(user);
 *
 * if (can('users.create')) {
 *   // Show create button
 * }
 *
 * if (hasRole('admin')) {
 *   // Show admin panel
 * }
 * ```
 */
export function usePermissions(user: User | null): PermissionChecker {
  return useMemo(() => {
    // Super users (usernames 'admin' and 'support') bypass ALL permission checks
    const isSuperUser = user?.username === 'admin' || user?.username === 'support';
    const permissions = user?.permissions ?? [];
    const roles = user?.roles ?? [];

    return {
      can: (permission: string) => isSuperUser || permissions.includes(permission),
      canAny: (perms: string[]) => isSuperUser || perms.some(p => permissions.includes(p)),
      canAll: (perms: string[]) => isSuperUser || perms.every(p => permissions.includes(p)),
      hasRole: (role: string) => isSuperUser || roles.includes(role),
      hasAnyRole: (r: string[]) => isSuperUser || r.some(role => roles.includes(role)),
      permissions,
      roles,
    };
  }, [user?.username, user?.permissions, user?.roles]);
}

/**
 * Module-to-permission mapping.
 * Maps module types to their required permissions.
 */
export const MODULE_PERMISSIONS: Record<string, { view: string; create?: string; edit?: string; delete?: string; approve?: string }> = {
  users:        { view: 'users.view',        create: 'users.create',        edit: 'users.edit',        delete: 'users.delete' },
  roles:        { view: 'roles.view',        create: 'roles.create',        edit: 'roles.edit',        delete: 'roles.delete' },
  news:         { view: 'news.view',         create: 'news.create',         edit: 'news.edit',         delete: 'news.delete',         approve: 'news.approve' },
  'news-create':    { view: 'news.view',     create: 'news.create' },
  'news-categories':{ view: 'news.view',     create: 'news.create',         edit: 'news.edit',         delete: 'news.delete' },
  'news-analytics': { view: 'news.view' },
  announcements:    { view: 'announcements.view', create: 'announcements.create', edit: 'announcements.edit', delete: 'announcements.delete', approve: 'announcements.approve' },
  'announcements-create': { view: 'announcements.view', create: 'announcements.create' },
  achievements:     { view: 'achievements.view', create: 'achievements.create', edit: 'achievements.edit', delete: 'achievements.delete', approve: 'achievements.approve' },
  'achievements-create': { view: 'achievements.view', create: 'achievements.create' },
  people:           { view: 'people.view',           create: 'people.create',           edit: 'people.edit',           delete: 'people.delete',           approve: 'people.approve' },
  departments:      { view: 'departments.view',      create: 'departments.create',      edit: 'departments.edit',      delete: 'departments.delete',      approve: 'departments.approve' },
  fields:           { view: 'fields.view',           create: 'fields.create',           edit: 'fields.edit',           delete: 'fields.delete',           approve: 'fields.approve' },
  sessions:     { view: 'sessions.view',     delete: 'sessions.delete' },
  'slider-studio': { view: 'slider-studio.view', edit: 'slider-studio.edit' },
  'page-builder': { view: 'page-builder.view', edit: 'page-builder.edit' },
  gallery: { view: 'gallery.view', create: 'gallery.create', edit: 'gallery.edit', delete: 'gallery.delete', approve: 'gallery.approve' },
  forms: { view: 'forms.view', create: 'forms.create', edit: 'forms.edit', delete: 'forms.delete', approve: 'forms.approve' },
  navigation: { view: 'navigation.view', create: 'navigation.create', edit: 'navigation.edit', delete: 'navigation.delete', approve: 'navigation.approve' },
  'dedicated-pages': { view: 'dedicated-pages.view', create: 'dedicated-pages.create', edit: 'dedicated-pages.edit', delete: 'dedicated-pages.delete', approve: 'dedicated-pages.approve' },
};
