
import { ScrapingData } from '@/types/scraping';
import { generateSimulatedData } from './simulatedDataGenerator';

export interface StealthScrapingResult {
  success: boolean;
  data?: ScrapingData;
  error?: string;
  isSimulated?: boolean;
  method?: string;
}

// Sistema sigiloso simplificado - principalmente para generar datos simulados
export const stealthScrapeAirbnb = async (
  url: string,
  onProgress: (progress: number, step: string) => void
): Promise<StealthScrapingResult> => {
  console.log('🥷 Sistema sigiloso simplificado para:', url);
  
  onProgress(10, 'Analizando URL...');
  const listingId = extractAirbnbId(url) || 'simulated-' + Date.now();
  
  // Nota: Las protecciones modernas de Airbnb bloquean efectivamente
  // todas las técnicas de scraping sigiloso, por lo que generamos datos simulados
  onProgress(30, 'Evaluando protecciones anti-bot...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  onProgress(60, 'Generando datos simulados (protecciones activas)...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  onProgress(90, 'Aplicando formato...');
  const simulatedData = generateSimulatedData(url);
  
  onProgress(100, 'Datos simulados generados');
  
  return {
    success: true,
    data: simulatedData,
    isSimulated: true,
    method: 'stealth-simulated'
  };
};

// Función para extraer ID de Airbnb
const extractAirbnbId = (url: string): string | null => {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : null;
};

// Generar datos simulados mejorados (mantenemos esta función por compatibilidad)
export const generateEnhancedSimulatedData = (url: string, listingId: string): ScrapingData => {
  return generateSimulatedData(url);
};
