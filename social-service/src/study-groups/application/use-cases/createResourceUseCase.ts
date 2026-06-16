import { ServiceResult } from '../../../shared/application/serviceResult';
import { 
  SaveResourceHandler, 
  AuditDecorator, 
  FormatDecorator, 
  PermissionDecorator, 
  CreateResourceInput 
} from '../decorators/resourceDecorators';
import { RecursoBase, RecursoConEtiquetas, RecursoConValoracion, RecursoConComentarios } from '../../domain/resourceDecorators';

export class CreateResourceUseCase {
  async execute(input: CreateResourceInput): Promise<ServiceResult<any>> {
    try {
      // Configuramos el patrón Decorator
      // 1. Core handler (Guarda en DB)
      const coreHandler = new SaveResourceHandler();

      // 2. Envuelto por el validador de Permisos (Criterio 5)
      const permissionHandler = new PermissionDecorator(coreHandler);

      // 3. Envuelto por el formateador (Criterio 2)
      const formatHandler = new FormatDecorator(permissionHandler);

      // 4. Envuelto por el auditor (Criterio 2 y 5)
      const auditHandler = new AuditDecorator(formatHandler);

      // 5. Criterio 2: Utilizamos los decoradores de dominio para enriquecer la metadata
      let recursoDomain: any = new RecursoBase({
        contenido: { url: input.url, title: input.title, description: input.description, imageUrl: input.imageUrl },
        metadata: { roleRequired: input.roleRequired }
      });
      // Los aplicamos según el payload enviado desde el frontend
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

      // Extraemos la metadata enriquecida para guardarla
      const finalPayload = recursoDomain.getPayload();
      
      const inputWithMetadata = {
        ...input,
        metadata: finalPayload.metadata
      };

      // Ejecutamos la cadena de pipeline
      const result = await auditHandler.handle(inputWithMetadata);

      return { data: result, error: null, statusCode: 201 };
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return { 
        data: null, 
        error: error.message || 'Error interno al crear el recurso', 
        statusCode 
      };
    }
  }
}
