export interface Category {
	id: number;
	name: string;
	slug: string;
	description?: string | null;
	imageUrl?: string | null;
	parentCategoryId?: number | null;
	sortOrder: number;
	isActive: boolean;
	children?: Category[];
}

export interface CreateCategory {
	name: string;
	slug: string;
	description?: string | null;
	imageUrl?: string | null;
	parentCategoryId?: number | null;
	sortOrder: number;
	isActive: boolean;
}

export type UpdateCategory = CreateCategory;
