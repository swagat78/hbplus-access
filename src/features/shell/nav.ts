import type Feather from '@expo/vector-icons/Feather';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

export type AdminTab = 'overview' | 'members' | 'access' | 'audit';

export const ADMIN_TABS: readonly { value: AdminTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'members', label: 'Members' },
  { value: 'access', label: 'Access rules' },
  { value: 'audit', label: 'Audit log' },
];

export function toAdminTab(value: string | string[] | undefined): AdminTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return ADMIN_TABS.some((t) => t.value === tab) ? (tab as AdminTab) : 'overview';
}

export type NavItem = {
  key: string;
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  href: Href;
  isActive: (pathname: string, tab: AdminTab) => boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const adminLink = (tab: AdminTab, label: string, icon: NavItem['icon']): NavItem => ({
  key: `admin-${tab}`,
  label,
  icon,
  href: { pathname: '/admin', params: { tab } },
  isActive: (pathname, current) => pathname === '/admin' && current === tab,
});

export function navSections(isAdmin: boolean): NavSection[] {
  const sections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        {
          key: 'overview',
          label: 'Overview',
          icon: 'grid',
          href: '/dashboard',
          isActive: (pathname) => pathname === '/dashboard',
        },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: 'Admin',
      items: [
        adminLink('overview', 'Admin overview', 'bar-chart-2'),
        adminLink('members', 'Members', 'users'),
        adminLink('access', 'Access rules', 'lock'),
        adminLink('audit', 'Audit log', 'list'),
      ],
    });
  }

  return sections;
}
