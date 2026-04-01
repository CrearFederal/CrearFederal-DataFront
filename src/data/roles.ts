import type { NavigationState } from '../types/types';

export type UserRole = 'coa' | 'province' | 'club';

export interface UserRoleConfig {
  role: UserRole;
  /** For province role: the province the user belongs to */
  provinciaId?: number;
  /** For club role: the club the user belongs to */
  clubId?: number;
}

/** Get the initial navigation state based on role */
export function getInitialNavigation(config: UserRoleConfig): NavigationState {
  switch (config.role) {
    case 'province':
      return { level: 'province', provinciaId: config.provinciaId };
    case 'club':
      return { level: 'country' }; // will be overridden once club data loads
    default:
      return { level: 'country' };
  }
}

/** Check if a navigation action is allowed for the role */
export function isNavigationAllowed(config: UserRoleConfig, target: NavigationState): boolean {
  switch (config.role) {
    case 'coa':
      return true;
    case 'province':
      // Cannot go to country level or another province
      if (target.level === 'country') return false;
      if (target.provinciaId && target.provinciaId !== config.provinciaId) return false;
      return true;
    case 'club':
      // Club users can only view their club
      return false;
    default:
      return true;
  }
}

/** Check if province clicking is allowed */
export function canClickProvince(config: UserRoleConfig): boolean {
  return config.role === 'coa';
}
