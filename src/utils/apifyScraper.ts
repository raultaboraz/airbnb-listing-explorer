
import { ScrapingData } from '@/types/scraping';

export interface ApifyScrapingResult {
  success: boolean;
  data?: ScrapingData;
  error?: string;
  cost?: number;
  creditsUsed?: number;
}

export interface ApifyConfig {
  apiKey?: string;
  actorId?: string;
}

// Función principal que usa Netlify function como proxy
export const scrapeWithApify = async (
  url: string,
  config: ApifyConfig,
  onProgress: (progress: number, step: string) => void
): Promise<ApifyScrapingResult> => {
  console.log('🚀 Iniciando scraping con Apify para:', url);
  console.log('🔑 Config recibido:', { hasApiKey: !!config.apiKey, apiKeyLength: config.apiKey?.length });
  onProgress(10, 'Conectando con Apify...');

  // Obtener API key de múltiples fuentes
  let apiKeyToUse = null;
  
  // Primero intentar con config.apiKey si existe y no es null/undefined
  if (config.apiKey && config.apiKey.trim() !== '') {
    apiKeyToUse = config.apiKey;
    console.log('🔑 Usando API key del config');
  }
  
  // Si no hay en config, buscar en localStorage
  if (!apiKeyToUse) {
    const storageKey = localStorage.getItem('apify_api_key');
    if (storageKey && storageKey.trim() !== '') {
      apiKeyToUse = storageKey;
      console.log('🔑 Usando API key de localStorage');
    }
  }

  console.log('🔍 API key final para validar:', { 
    hasKey: !!apiKeyToUse, 
    length: apiKeyToUse?.length,
    starts: apiKeyToUse?.substring(0, 10),
    isValid: apiKeyToUse ? validateApifyKey(apiKeyToUse) : false
  });
  
  if (!apiKeyToUse || !validateApifyKey(apiKeyToUse)) {
    console.error('❌ No se encontró API key válida');
    throw new Error('NO_VALID_API_KEY');
  }

  // Usar Netlify function como proxy para evitar CORS
  console.log('✅ API key válida encontrada, usando Netlify function como proxy');
  onProgress(15, 'Conectando a través de Netlify function...');
  return await scrapeWithNetlifyProxy(url, apiKeyToUse, onProgress);
};

// Función para usar Netlify function como proxy
const scrapeWithNetlifyProxy = async (
  url: string,
  apiKey: string,
  onProgress: (progress: number, step: string) => void
): Promise<ApifyScrapingResult> => {
  onProgress(25, 'Iniciando actor de Airbnb...');
  console.log('📤 Starting Apify run via Netlify function');

  // 1. Iniciar el run
  const startResponse = await fetch('/.netlify/functions/apify-scraper', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'start_run',
      url: url,
      apiKey: apiKey
    }),
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(`Error al iniciar Apify vía Netlify (${startResponse.status}): ${errorText}`);
  }

  const runData = await startResponse.json();
  console.log('✅ Apify run started via Netlify:', runData);

  return await processApifyRun(runData.data.id, runData.data.defaultDatasetId, url, onProgress, apiKey);
};

// Función común para procesar el run de Apify
const processApifyRun = async (
  runId: string,
  datasetId: string,
  originalUrl: string,
  onProgress: (progress: number, step: string) => void,
  apiKey: string
): Promise<ApifyScrapingResult> => {
  console.log('✅ Actor iniciado con ID:', runId, 'Dataset ID:', datasetId);
  onProgress(40, 'Ejecutando extracción...');

  // 2. Esperar a que termine la ejecución
  let runStatus = 'RUNNING';
  let attempts = 0;
  const maxAttempts = 60; // 10 minutos máximo

  while (runStatus === 'RUNNING' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
    attempts++;
    
    const progressPercent = 40 + Math.min(45, attempts * 0.75);
    onProgress(progressPercent, `Extrayendo datos... (${attempts * 10}s)`);

    try {
      const statusResponse = await fetch('/.netlify/functions/apify-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_status',
          runId: runId,
          apiKey: apiKey
        }),
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        console.log(`📊 Estado del run: ${runStatus} (intento ${attempts})`);
      }
    } catch (error) {
      console.warn('⚠️ No se pudo verificar estado, continuando...');
    }
  }

  if (runStatus !== 'SUCCEEDED') {
    console.error('❌ Estado final del run:', runStatus);
    throw new Error(`La extracción de Apify falló con estado: ${runStatus}. Tiempo transcurrido: ${attempts * 10}s`);
  }

  onProgress(85, 'Obteniendo resultados...');

  // 3. Obtener los resultados
  console.log('📊 Obteniendo datos del dataset:', datasetId);
  
  const resultsResponse = await fetch('/.netlify/functions/apify-scraper', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get_results',
      datasetId: datasetId,
      apiKey: apiKey
    }),
  });

  if (!resultsResponse.ok) {
    const errorText = await resultsResponse.text();
    throw new Error(`Error al obtener resultados (${resultsResponse.status}): ${errorText}`);
  }

  const results = await resultsResponse.json();

  console.log('📄 Resultados de Apify recibidos:', results.length, 'items');
  
  if (results.length > 0) {
    console.log('🔍 Primer resultado:', JSON.stringify(results[0], null, 2));
  }

  if (!results || results.length === 0) {
    throw new Error('No se obtuvieron datos del listing. Posible problema con la URL o el listing no existe.');
  }

  onProgress(95, 'Procesando datos...');

  // 4. Convertir datos de Apify a nuestro formato
  const apifyData = results[0];
  const scrapingData = convertApifyToScrapingData(apifyData, originalUrl);

  onProgress(100, '¡Datos reales extraídos con Apify!');

  return {
    success: true,
    data: scrapingData,
    creditsUsed: 1
  };
};

const convertApifyToScrapingData = (apifyData: any, originalUrl: string): ScrapingData => {
  console.log('🔄 Convirtiendo datos de Apify a formato interno');
  
  // Extraer ID del listing de la URL
  const listingId = originalUrl.match(/\/rooms\/(\d+)/)?.[1] || 'unknown';
  
  // Función auxiliar para limpiar y convertir arrays
  const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.filter(item => item && typeof item === 'string');
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
    return [];
  };

  // Función auxiliar para obtener imágenes
  const getImages = (data: any): string[] => {
    const imageFields = ['images', 'photos', 'pictureUrls', 'picture_urls'];
    for (const field of imageFields) {
      if (data[field]) {
        const images = ensureArray(data[field]);
        if (images.length > 0) return images;
      }
    }
    return [];
  };

  // Función para procesar reseñas
  const getReviews = (data: any) => {
    const reviews = data.reviews || [];
    return {
      count: parseInt(data.reviewsCount) || parseInt(data.numberOfReviews) || reviews.length || 0,
      rating: parseFloat(data.rating) || parseFloat(data.reviewScoresRating) || 4.5,
      recent: Array.isArray(reviews) ? 
        reviews.slice(0, 3).map((review: any) => ({
          author: review.author || review.name || review.reviewer_name || 'Usuario',
          text: review.text || review.comment || review.review || review.comments || '',
          rating: review.rating || 5
        })) : []
    };
  };

  return {
    listingId,
    url: originalUrl,
    title: apifyData.name || apifyData.title || apifyData.listing_name || 'Título no disponible',
    description: apifyData.description || apifyData.summary || apifyData.listing_description || 'Descripción no disponible',
    aboutSpace: apifyData.summary || apifyData.space || apifyData.description || apifyData.about || '',
    hostName: apifyData.host?.name || apifyData.hostName || apifyData.host_name || 'Host no disponible',
    guests: parseInt(apifyData.guests) || parseInt(apifyData.accommodates) || parseInt(apifyData.person_capacity) || 1,
    bedrooms: parseInt(apifyData.bedrooms) || parseInt(apifyData.beds) || parseInt(apifyData.bedroom_count) || 1,
    bathrooms: parseFloat(apifyData.bathrooms) || parseFloat(apifyData.baths) || parseFloat(apifyData.bathroom_count) || 1,
    price: apifyData.price?.toString() || apifyData.pricePerNight?.toString() || apifyData.price_per_night?.toString() || '0',
    location: apifyData.address || apifyData.location || apifyData.neighborhood || apifyData.city || 'Ubicación no disponible',
    amenities: ensureArray(apifyData.amenities),
    reviews: getReviews(apifyData),
    images: getImages(apifyData),
    extractedAt: new Date().toISOString()
  };
};

export const validateApifyKey = (apiKey: string): boolean => {
  console.log('🔍 Validando API key:', { 
    exists: !!apiKey, 
    type: typeof apiKey,
    length: apiKey?.length, 
    prefix: apiKey?.substring(0, 12)
  });
  
  if (!apiKey || typeof apiKey !== 'string') {
    console.log('❌ API key no es string válido');
    return false;
  }
  
  const hasValidPrefix = apiKey.startsWith('apify_api_');
  const hasValidLength = apiKey.length > 20;
  
  console.log('🔍 Validación detallada:', {
    hasValidPrefix,
    hasValidLength,
    actualLength: apiKey.length
  });
  
  const isValid = hasValidPrefix && hasValidLength;
  console.log('🔍 Resultado de validación:', { isValid });
  
  return isValid;
};

export const estimateApifyCost = (urls: number): string => {
  const costPerListing = 0.02;
  const totalCost = urls * costPerListing;
  return `~$${totalCost.toFixed(3)} USD (${urls} ${urls === 1 ? 'listing' : 'listings'})`;
};
