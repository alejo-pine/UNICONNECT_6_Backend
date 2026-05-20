import { eventLogger } from '../../../utils/eventLogger';
import { supabase } from '../../../utils/supabaseClient';
import { HttpError } from '../../../utils/httpError';

export interface CreateResourceInput {
  groupId: string;
  userId: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  roleRequired: string;
  metadata?: any;
}

export interface IResourceHandler {
  handle(input: CreateResourceInput): Promise<any>;
}

// 1. Core Component
export class SaveResourceHandler implements IResourceHandler {
  async handle(input: CreateResourceInput): Promise<any> {
    const { data, error } = await supabase
      .from('group_resources')
      .insert({
        group_id: input.groupId,
        uploaded_by: input.userId,
        url: input.url,
        title: input.title,
        description: input.description,
        image_url: input.imageUrl,
        role_required: input.roleRequired,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error guardando recurso: ${error.message}`);
    }

    return data;
  }
}

// 2. Base Decorator
export abstract class ResourceDecorator implements IResourceHandler {
  constructor(protected wrapped: IResourceHandler) {}

  abstract handle(input: CreateResourceInput): Promise<any>;
}

// 3. Concrete Decorators

// Auditoría: Criterio 2
export class AuditDecorator extends ResourceDecorator {
  async handle(input: CreateResourceInput): Promise<any> {
    eventLogger.info('ResourceUpload', 'Intento de subida de recurso', {
      userId: input.userId,
      groupId: input.groupId,
      url: input.url,
    });
    
    try {
      const result = await this.wrapped.handle(input);
      eventLogger.info('ResourceUpload', 'Recurso subido con éxito', {
        resourceId: result.id,
      });
      return result;
    } catch (err: unknown) {
      eventLogger.error('ResourceUpload', 'Falló la subida del recurso', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }
}

// Formato: Criterio 2
export class FormatDecorator extends ResourceDecorator {
  async handle(input: CreateResourceInput): Promise<any> {
    // Asegurarse de que la URL empieza con http o https
    let formattedUrl = input.url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const formattedInput = {
      ...input,
      url: formattedUrl,
      title: input.title.trim() || 'Sin título',
      description: input.description.trim() || 'Recurso compartido',
    };

    return this.wrapped.handle(formattedInput);
  }
}

// Permisos: Criterio 2 y Criterio 5
export class PermissionDecorator extends ResourceDecorator {
  async handle(input: CreateResourceInput): Promise<any> {
    // Validar si el usuario es miembro del grupo
    const { data: memberData, error: memberError } = await supabase
      .from('group_member')
      .select('profile_id')
      .eq('group_id', input.groupId)
      .eq('profile_id', input.userId)
      .single();

    if (memberError || !memberData) {
      eventLogger.warn('ResourceUpload', 'Intento denegado: Usuario no es miembro', {
        userId: input.userId,
        groupId: input.groupId,
      });
      throw new HttpError(403, 'No tienes permiso para subir recursos a este grupo. (Requiere ser miembro)');
    }

    // Si el rol_required es admin, verificar que el usuario sea el creador del grupo
    if (input.roleRequired === 'admin') {
      const { data: groupData } = await supabase
        .from('study_group')
        .select('creator_id')
        .eq('id', input.groupId)
        .single();

      if (groupData?.creator_id !== input.userId) {
        eventLogger.warn('ResourceUpload', 'Intento denegado: Usuario no es admin', {
          userId: input.userId,
          groupId: input.groupId,
        });
        throw new HttpError(403, 'No tienes permiso de administrador para crear recursos restringidos.');
      }
    }

    return this.wrapped.handle(input);
  }
}
