export interface Category {
	id: number;
	name: string;
	slug: string;
	description?: string | null;
	imageUrl?: string | null;
	parentCategoryId?: number | null;
	sortOrder: number;
	isActive: boolean;
	isFeatured: boolean;
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
	isFeatured: boolean;
}

export type UpdateCategory = CreateCategory;
