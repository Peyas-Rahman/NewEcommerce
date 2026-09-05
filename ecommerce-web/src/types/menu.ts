export interface MenuItem {
  id: number;
  title: string;
  url: string | null;
  icon: string | null;
  badgeText: string | null;
  badgeType: string | null;
  categoryId: number | null;
  categoryName: string | null;
  parentMenuItemId: number | null;
  sortOrder: number;
  isActive: boolean;
  showInHeader: boolean;
  openInNewTab: boolean;
  children: MenuItem[];
}

export interface CreateMenuItem {
  title: string;
  url?: string | null;
  icon?: string | null;
  badgeText?: string | null;
  badgeType?: string | null;
  categoryId?: number | null;
  parentMenuItemId?: number | null;
  sortOrder: number;
  isActive: boolean;
  showInHeader: boolean;
  openInNewTab: boolean;
}

export type UpdateMenuItem = CreateMenuItem;