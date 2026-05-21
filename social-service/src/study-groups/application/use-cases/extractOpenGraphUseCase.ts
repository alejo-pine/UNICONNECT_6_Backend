import * as cheerio from 'cheerio';
import { ServiceResult } from '../../../shared/application/serviceResult';

export interface OpenGraphData {
  title?: string;
  description?: string;
  imageUrl?: string;
  url: string;
}

export class ExtractOpenGraphUseCase {
  async execute(url: string): Promise<ServiceResult<OpenGraphData>> {
    try {
      if (!url) {
        return { data: null, error: 'URL requerida', statusCode: 400 };
      }

      // Validar URL (previene peticiones a URLs inválidas o locales)
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return { data: null, error: 'Protocolo inválido', statusCode: 400 };
        }
      } catch (e) {
        return { data: null, error: 'URL inválida', statusCode: 400 };
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
      });

      if (!response.ok) {
        return { data: null, error: `Error al hacer fetch a la URL (${response.status})`, statusCode: 502 };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content') || '';

      const data: OpenGraphData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        url,
      };

      return { data, error: null, statusCode: 200 };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Error interno procesando URL', 
        statusCode: 500 
      };
    }
  }
}
