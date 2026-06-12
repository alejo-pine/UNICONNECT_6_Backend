import { eventDatabaseHandler } from '../../config/eventDatabaseHandler';
import { eventLogger } from '../../utils/eventLogger';
import { Category } from '../domain/entities/category';
import { CategoryRepositoryPort } from '../domain/ports/categoryRepositoryPort';

const TABLE = 'event_category';

export class SupabaseCategoryRepository implements CategoryRepositoryPort {
  async findAll(): Promise<Category[]> {
    const db = eventDatabaseHandler.getClient();
    const { data, error } = await db
      .from(TABLE)
      .select('id, name, slug, description, created_at')
      .order('name', { ascending: true });

    if (error) {
      eventLogger.error('SupabaseCategoryRepository.findAll', 'Supabase query failed', { error: error.message });
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      createdAt: row.created_at,
    }));
  }

  async findById(id: string): Promise<Category | null> {
    const db = eventDatabaseHandler.getClient();
    const { data, error } = await db
      .from(TABLE)
      .select('id, name, slug, description, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      eventLogger.error('SupabaseCategoryRepository.findById', 'Supabase query failed', { error: error.message, id });
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: data.created_at,
    };
  }

  async findByNameOrSlug(name: string, slug: string): Promise<Category | null> {
    const db = eventDatabaseHandler.getClient();
    const { data, error } = await db
      .from(TABLE)
      .select('id, name, slug, description, created_at')
      .or(`name.ilike.${name},slug.eq.${slug}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      eventLogger.error('SupabaseCategoryRepository.findByNameOrSlug', 'Supabase query failed', { error: error.message, name, slug });
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: data.created_at,
    };
  }

  async create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const db = eventDatabaseHandler.getClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        name: category.name,
        slug: category.slug,
        description: category.description,
      })
      .select('id, name, slug, description, created_at')
      .single();

    if (error) {
      eventLogger.error('SupabaseCategoryRepository.create', 'Supabase query failed', { error: error.message });
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: data.created_at,
    };
  }

  async update(id: string, category: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category> {
    const db = eventDatabaseHandler.getClient();
    const { data, error } = await db
      .from(TABLE)
      .update({
        name: category.name,
        slug: category.slug,
        description: category.description,
      })
      .eq('id', id)
      .select('id, name, slug, description, created_at')
      .single();

    if (error) {
      eventLogger.error('SupabaseCategoryRepository.update', 'Supabase query failed', { error: error.message, id });
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: data.created_at,
    };
  }

  async delete(id: string): Promise<void> {
    const db = eventDatabaseHandler.getClient();
    const { error } = await db.from(TABLE).delete().eq('id', id);

    if (error) {
      eventLogger.error('SupabaseCategoryRepository.delete', 'Supabase query failed', { error: error.message, id });
      throw new Error(error.message);
    }
  }

  async countEventsByCategory(categoryId: string): Promise<number> {
    const db = eventDatabaseHandler.getClient();
    const { count, error } = await db
      .from('event')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) {
      eventLogger.error('SupabaseCategoryRepository.countEventsByCategory', 'Supabase query failed', { error: error.message, categoryId });
      throw new Error(error.message);
    }

    return count ?? 0;
  }
}
