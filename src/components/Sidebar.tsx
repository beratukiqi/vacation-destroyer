'use client';

import { Avatar } from './ui/Avatar';
import { Icon, type IconName } from './ui/Icon';
import type { Employee, Role } from '@/lib/types';
import styles from './Sidebar.module.scss';

export type EmployeeRoute = 'home' | 'new' | 'overview' | 'support';
export type ChefRoute =
  | 'decisions'
  | 'overview'
  | 'support'
  | 'team';

export type Route = EmployeeRoute | ChefRoute;

interface SidebarProps {
  role: Role;
  route: Route;
  setRoute: (r: Route) => void;
  currentUser: Employee;
  pendingCount: number;
  onSignOut?: () => void;
}

interface NavItem {
  id: Route;
  label: string;
  icon: IconName;
  badge?: number;
}

export function Sidebar({
  role,
  route,
  setRoute,
  currentUser,
  pendingCount,
  onSignOut,
}: SidebarProps) {
  const employeeNav: NavItem[] = [
    { id: 'home',     label: 'Min översikt',      icon: 'home' },
    { id: 'new',      label: 'Ny ansökan',        icon: 'plus' },
    { id: 'overview', label: 'Översiktskalender', icon: 'calendar' },
    { id: 'support',  label: 'Supportkalender',   icon: 'leaf' },
  ];
  const managerNav: NavItem[] = [
    { id: 'decisions', label: 'Att besluta', icon: 'inbox', badge: pendingCount },
    { id: 'overview',  label: 'Översiktskalender', icon: 'calendar' },
    { id: 'support',   label: 'Supportkalender', icon: 'leaf' },
    { id: 'team',      label: 'Anställda', icon: 'users' },
  ];
  const items = role === 'chef' ? managerNav : employeeNav;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>S</div>
        <div>
          <div className={styles.brandName}>Semester</div>
          <div className={styles.brandSub}>Domstolsverket IT</div>
        </div>
      </div>

      <div className={styles.navSection}>
        <div className={styles.navLabel}>
          {role === 'chef' ? 'Chefsvy' : 'Min semester'}
        </div>
        {items.map((it) => (
          <div
            key={it.id}
            className={`${styles.navItem} ${route === it.id ? styles.active : ''}`}
            onClick={() => setRoute(it.id)}
          >
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.badge != null && it.badge > 0 && (
              <span className={styles.navBadge}>{it.badge}</span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.roleCard}>
        <Avatar name={currentUser.name} initials={currentUser.initials} size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className={styles.roleName}>{currentUser.name}</div>
          <div className={styles.roleMeta}>
            {role === 'chef' ? 'IT-direktör' : 'Anställd'}
          </div>
        </div>
        {onSignOut && (
          <button
            type="button"
            className={styles.signOut}
            onClick={onSignOut}
            title="Logga ut"
            aria-label="Logga ut"
          >
            <Icon name="logout" />
          </button>
        )}
      </div>
    </aside>
  );
}
