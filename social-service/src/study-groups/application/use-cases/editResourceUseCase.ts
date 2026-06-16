import { ServiceResult } from '../../../shared/application/serviceResult';
import { supabase } from '../../../utils/supabaseClient';
import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { RecursoBase, RecursoConEtiquetas, RecursoConValoracion, RecursoConComentarios } from '../../domain/resourceDecorators';

export interface EditResourceInput {
  resourceId: string;
  groupId: string;
  userId: string;
  title?: string;
  description?: string;
  roleRequired?: string;
  metadata?: any;
}

export class EditResourceUseCase {
  async execute(input: EditResourceInput): Promise<ServiceResult<any>> {
    try {
      // 1. Obtener el recurso actual y verificar permisos (Criterio 3)
      const { data: resource, error: fetchError } = await supabase
        .from('group_resources')
        .select('uploaded_by, group_id')
        .eq('id', input.resourceId)
        .eq('group_id', input.groupId)
        .single();

      if (fetchError || !resource) {
        throw new HttpError(404, 'Recurso no encontrado en este grupo');
      }

      let hasPermission = false;
      if (resource.uploaded_by === input.userId) {
        hasPermission = true;
      } else {
        // Verificar si es administrador/creador del grupo
        const { data: groupData } = await supabase
          .from('study_group')
          .select('creator_id')
          .eq('id', input.groupId)
          .single();
          
        if (groupData && groupData.creator_id === input.userId) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        eventLogger.warn('ResourceEdit', 'Intento denegado: Usuario no es propietario ni admin', {
          userId: input.userId,
          resourceId: input.resourceId,
        });
        throw new HttpError(403, 'Criterio 3: Solo el propietario o el administrador del grupo pueden editar este recurso');
      }

      // 2. Aplicar decoradores de dominio a la metadata actualizada      
      let recursoDomain: any = new RecursoBase({
        contenido: {},
        metadata: { roleRequired: input.roleRequired }
      });

      const passedTags = input.metadata?.etiquetas || [];
      if (passedTags.length > 0) {
        recursoDomain = new RecursoConEtiquetas(recursoDomain, passedTags);
      }
      if (input.metadata?.valoracion) {
        recursoDomain = new RecursoConValoracion(recursoDomain, input.metadata.valoracion);
      }
      if (input.metadata?.comentario) {
        recursoDomain = new RecursoConComentarios(recursoDomain, input.metadata.comentario);
      }

      const finalPayload = recursoDomain.getPayload();

      // 3. Actualizar
      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.roleRequired !== undefined) updates.role_required = input.roleRequired;
      if (input.metadata !== undefined) updates.metadata = finalPayload.metadata;
      
      updates.updated_at = new Date().toISOString();

      const { data: updatedResource, error: updateError } = await supabase
        .from('group_resources')
        .update(updates)
        .eq('id', input.resourceId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error actualizando recurso: ${updateError.message}`);
      }

      eventLogger.info('ResourceEdit', 'Recurso editado con éxito', {
        resourceId: updatedResource.id,
        userId: input.userId
      });

      return { data: updatedResource, error: null, statusCode: 200 };
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return { 
        data: null, 
        error: error.message || 'Error interno al editar el recurso', 
        statusCode 
      };
    }
  }
}
