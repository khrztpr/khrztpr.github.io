export const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export function canChangeArea(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

export function isAreaLocked(role) {
  return !canChangeArea(role);
}

