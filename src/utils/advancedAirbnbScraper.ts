
import { ScrapingData } from '@/types/scraping';
import { stealthScrapeAirbnb, generateEnhancedSimulatedData } from './stealthScraper';

export interface AirbnbScrapingResult {
  success: boolean;
  data?: ScrapingData;
  error?: string;
  isSimulated?: boolean;
  method?: string;
}

export const scrapeAirbnbListing = async (
  url: string,
  onProgress: (progress: number, step: string) => void
): Promise<AirbnbScrapingResult> => {
  const listingId = extractAirbnbId(url);
  if (!listingId) {
    throw new Error('URL de Airbnb inválida - no se pudo extraer el ID del listing');
  }

  console.log('🚀 Iniciando extracción avanzada de Airbnb para:', url);
  console.log('🥷 Usando nuevo sistema sigiloso anti-detección v2.0');
  
  try {
    // Usar el nuevo sistema de scraping sigiloso mejorado
    const result = await stealthScrapeAirbnb(url, onProgress);
    
    if (result.success && result.data) {
      // Verificar si son datos reales o simulados
      const isRealData = !result.isSimulated && await validateAirbnbData(result.data, url);
      
      if (isRealData) {
        console.log('✅ ¡DATOS REALES EXTRAÍDOS CON ÉXITO!');
        return {
          ...result,
          isSimulated: false
        };
      } else if (result.isSimulated) {
        console.log('🎭 Datos simulados generados como fallback');
        return result;
      } else {
        console.log('❌ Los datos extraídos no son válidos - generando simulados');
        throw new Error('Datos extraídos no válidos');
      }
    } else {
      throw new Error('Falló el sistema sigiloso');
    }
    
  } catch (error) {
    console.log('❌ Sistema sigiloso falló completamente:', error.message);
    
    // Último fallback - generar datos simulados
    onProgress(90, 'Generando datos simulados como último recurso...');
    const simulatedData = generateFallbackSimulatedData(url, listingId);
    onProgress(100, 'Datos simulados generados (extracción bloqueada)');
    
    return {
      success: true,
      data: simulatedData,
      isSimulated: true,
      method: 'final-simulated-fallback'
    };
  }
};

const validateAirbnbData = async (data: ScrapingData, originalUrl: string): Promise<boolean> => {
  const urlId = extractAirbnbId(originalUrl);
  const dataId = data.listingId;
  
  if (urlId !== dataId && urlId !== 'unknown') {
    console.log(`❌ IDs no coinciden: URL=${urlId}, Data=${dataId}`);
    return false;
  }
  
  // Verificar si las imágenes son de nuestros samples
  const hasSimulatedImages = data.images.some(img => 
    img.includes('unsplash.com')
  );
  
  if (hasSimulatedImages) {
    console.log('❌ Imágenes son de muestras simuladas');
    return false;
  }
  
  // Si llegamos aquí, probablemente son datos reales
  return true;
};

const extractAirbnbId = (url: string): string => {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : '';
};

const generateFallbackSimulatedData = (url: string, listingId: string): ScrapingData => {
  console.log('🎭 Generando datos simulados de fallback final');
  
  return generateEnhancedSimulatedData(url, listingId);
};
