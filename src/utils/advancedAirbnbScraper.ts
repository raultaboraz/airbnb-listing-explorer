
import { ScrapingData } from '@/types/scraping';
import { generateSimulatedData } from './simulatedDataGenerator';

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

  console.log('🚀 Iniciando extracción de Airbnb para:', url);
  onProgress(10, 'Analizando URL de Airbnb...');
  
  // Sistema simplificado: directamente usar datos simulados
  // ya que las protecciones modernas bloquean efectivamente el scraping directo
  onProgress(50, 'Generando datos simulados (scraping bloqueado)...');
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simular procesamiento
  
  onProgress(80, 'Aplicando formato de datos...');
  const simulatedData = generateSimulatedData(url);
  
  onProgress(100, 'Datos simulados generados (usar Apify para datos reales)');
  
  return {
    success: true,
    data: simulatedData,
    isSimulated: true,
    method: 'simulated-fallback'
  };
};

const extractAirbnbId = (url: string): string => {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : '';
};
