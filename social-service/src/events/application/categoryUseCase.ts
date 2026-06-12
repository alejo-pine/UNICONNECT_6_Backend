import { Category } from '../domain/entities/category';
import { CategoryRepositoryPort } from '../domain/ports/categoryRepositoryPort';

export class CategoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryConflictError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepositoryPort) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD') // Quitar acentos
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async createCategory(name: string, description?: string): Promise<Category> {
    const slug = this.generateSlug(name);
    
    const existing = await this.categoryRepository.findByNameOrSlug(name, slug);
    if (existing) {
      throw new CategoryConflictError(`La categoría '${existing.name}' ya existe.`);
    }

    return this.categoryRepository.create({ name, slug, description });
  }

  async updateCategory(id: string, name?: string, description?: string): Promise<Category> {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new CategoryNotFoundError('Categoría no encontrada');
    }

    const updates: Partial<Category> = {};
    
    if (name && name.toLowerCase() !== existingCategory.name.toLowerCase()) {
      updates.name = name;
      updates.slug = this.generateSlug(name);
      
      const conflict = await this.categoryRepository.findByNameOrSlug(name, updates.slug);
      if (conflict && conflict.id !== id) {
        throw new CategoryConflictError(`La categoría '${conflict.name}' ya existe.`);
      }
    }

    if (description !== undefined) {
      updates.description = description;
    }

    return this.categoryRepository.update(id, updates);
  }

  async deleteCategory(id: string): Promise<void> {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new CategoryNotFoundError('Categoría no encontrada');
    }

    const activeEventsCount = await this.categoryRepository.countEventsByCategory(id);
    if (activeEventsCount > 0) {
      throw new CategoryConflictError(`No se puede eliminar la categoría porque está siendo usada por ${activeEventsCount} evento(s) activo(s).`);
    }

    await this.categoryRepository.delete(id);
  }
}
