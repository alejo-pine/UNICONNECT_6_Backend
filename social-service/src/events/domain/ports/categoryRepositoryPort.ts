import { Category } from '../entities/category';

export interface CategoryRepositoryPort {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByNameOrSlug(name: string, slug: string): Promise<Category | null>;
  create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>;
  update(id: string, category: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category>;
  delete(id: string): Promise<void>;
  countEventsByCategory(categoryId: string): Promise<number>;
}
