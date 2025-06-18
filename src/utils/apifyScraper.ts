
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

// Función principal simplificada con sistema híbrido
export const scrapeWithApify = async (
  url: string,
  config: ApifyConfig,
  onProgress: (progress: number, step: string) => void
): Promise<ApifyScrapingResult> => {
  console.log('🚀 Iniciando scraping con Apify para:', url);
  onProgress(10, 'Validando configuración...');

  const apiKeyToUse = getApiKey(config);
  
  if (!apiKeyToUse || !validateApifyKey(apiKeyToUse)) {
    console.error('❌ No se encontró API key válida');
    throw new Error('NO_VALID_API_KEY');
  }

  console.log('✅ API key válida encontrada');
  onProgress(20, 'Conectando con Apify...');

  // Sistema híbrido simplificado: Netlify primero, luego directo
  try {
    console.log('🔄 Intentando con función de Netlify...');
    onProgress(25, 'Probando función de Netlify...');
    return await scrapeWithNetlifyProxy(url, apiKeyToUse, onProgress);
  } catch (netlifyError) {
    console.log('⚠️ Netlify no disponible, usando acceso directo...');
    onProgress(35, 'Usando acceso directo a Apify...');
    return await scrapeWithDirectApify(url, apiKeyToUse, onProgress);
  }
};

// Obtener API key desde múltiples fuentes
const getApiKey = (config: ApifyConfig): string | null => {
  if (config.apiKey && config.apiKey.trim() !== '') {
    console.log('🔑 Usando API key del config');
    return config.apiKey;
  }
  
  const storageKey = localStorage.getItem('apify_api_key');
  if (storageKey && storageKey.trim() !== '') {
    console.log('🔑 Usando API key de localStorage');
    return storageKey;
  }

  return null;
};

// Estrategia 1: Función de Netlify (simplificada)
const scrapeWithNetlifyProxy = async (
  url: string,
  apiKey: string,
  onProgress: (progress: number, step: string) => void
): Promise<ApifyScrapingResult> => {
  onProgress(30, 'Iniciando actor via Netlify...');
  
  const startResponse = await fetch('/.netlify/functions/apify-scraper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'start_run',
      url: url,
      apiKey: apiKey
    }),
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(`Error Netlify (${startResponse.status}): ${errorText}`);
  }

  const runData = await startResponse.json();
  console.log('✅ Run iniciado via Netlify:', runData);

  return await processApifyRun(runData.data.id, runData.data.defaultDatasetId, url, onProgress, apiKey, 'netlify');
};

// Estrategia 2: Acceso directo a Apify (simplificada)
const scrapeWithDirectApify = async (
  url: string,
  apiKey: string,
  onProgress: (progress: number, step: string) => void
): Promise<ApifyScrapingResult> => {
  console.log('🌐 Acceso directo a Apify API');
  onProgress(40, 'Conectando directamente...');

  const actorId = 'curious_coder/airbnb-scraper';
  const runPayload = {
    startUrls: [{ url }],
    maxRequestRetries: 3,
    maxConcurrency: 1,
    includeReviews: true,
    currency: "USD",
    language: "en",
    proxyConfiguration: { 
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"] 
    }
  };

  const startResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(runPayload)
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(`Error directo (${startResponse.status}): ${errorText}`);
  }

  const runData = await startResponse.json();
  console.log('✅ Run iniciado directamente:', runData);

  return await processApifyRun(runData.data.id, runData.data.defaultDatasetId, url, onProgress, apiKey, 'direct');
};

// Función unificada para procesar runs de Apify
const processApifyRun = async (
  runId: string,
  datasetId: string,
  originalUrl: string,
  onProgress: (progress: number, step: string) => void,
  apiKey: string,
  method: 'netlify' | 'direct'
): Promise<ApifyScrapingResult> => {
  console.log(`✅ Procesando run ${method}:`, runId);
  onProgress(50, 'Ejecutando extracción...');

  // Esperar a que termine la ejecución
  let runStatus = 'RUNNING';
  let attempts = 0;
  const maxAttempts = 60;

  while (runStatus === 'RUNNING' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    attempts++;
    
    const progressPercent = 50 + Math.min(35, attempts * 0.6);
    onProgress(progressPercent, `Extrayendo datos... (${attempts * 10}s)`);

    try {
      if (method === 'netlify') {
        const statusResponse = await fetch('/.netlify/functions/apify-scraper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check_status',
            runId: runId,
            apiKey: apiKey
          }),
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.data.status;
        }
      } else {
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.data.status;
        }
      }
      
      console.log(`📊 Estado: ${runStatus} (${attempts})`);
    } catch (error) {
      console.warn('⚠️ Error verificando estado, continuando...');
    }
  }

  if (runStatus !== 'SUCCEEDED') {
    throw new Error(`Extracción falló: ${runStatus}`);
  }

  onProgress(85, 'Obteniendo resultados...');

  // Obtener resultados
  let results;
  if (method === 'netlify') {
    const resultsResponse = await fetch('/.netlify/functions/apify-scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_results',
        datasetId: datasetId,
        apiKey: apiKey
      }),
    });

    if (!resultsResponse.ok) {
      throw new Error(`Error obteniendo resultados: ${resultsResponse.status}`);
    }

    results = await resultsResponse.json();
  } else {
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!resultsResponse.ok) {
      throw new Error(`Error obteniendo resultados: ${resultsResponse.status}`);
    }

    results = await resultsResponse.json();
  }

  console.log('📄 Resultados obtenidos:', results.length, 'items');
  
  if (!results || results.length === 0) {
    throw new Error('No se obtuvieron datos del listing');
  }

  onProgress(95, 'Procesando datos...');

  const scrapingData = convertApifyToScrapingData(results[0], originalUrl);
  onProgress(100, '¡Datos reales extraídos con Apify!');

  return {
    success: true,
    data: scrapingData,
    creditsUsed: 1
  };
};

// Función para convertir datos de Apify a nuestro formato (simplificada)
const convertApifyToScrapingData = (apifyData: any, originalUrl: string): ScrapingData => {
  console.log('🔄 Convirtiendo datos de Apify');
  
  const listingId = originalUrl.match(/\/rooms\/(\d+)/)?.[1] || 'unknown';
  
  const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.filter(item => item && typeof item === 'string');
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
    return [];
  };

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

  const getReviews = (data: any) => {
    const reviews = data.reviews || [];
    return {
      count: parseInt(data.reviewsCount) || parseInt(data.numberOfReviews) || reviews.length || 0,
      rating: parseFloat(data.rating) || parseFloat(data.reviewScoresRating) || 4.5,
      recent: Array.isArray(reviews) ? 
        reviews.slice(0, 3).map((review: any) => ({
          author: review.author || review.name || 'Usuario',
          text: review.text || review.comment || '',
          rating: review.rating || 5
        })) : []
    };
  };

  return {
    listingId,
    url: originalUrl,
    title: apifyData.name || apifyData.title || 'Título no disponible',
    description: apifyData.description || apifyData.summary || 'Descripción no disponible',
    aboutSpace: apifyData.summary || apifyData.space || apifyData.description || '',
    hostName: apifyData.host?.name || apifyData.hostName || 'Host no disponible',
    guests: parseInt(apifyData.guests) || parseInt(apifyData.accommodates) || 1,
    bedrooms: parseInt(apifyData.bedrooms) || parseInt(apifyData.beds) || 1,
    bathrooms: parseFloat(apifyData.bathrooms) || parseFloat(apifyData.baths) || 1,
    price: apifyData.price?.toString() || apifyData.pricePerNight?.toString() || '0',
    location: apifyData.address || apifyData.location || apifyData.neighborhood || 'Ubicación no disponible',
    amenities: ensureArray(apifyData.amenities),
    reviews: getReviews(apifyData),
    images: getImages(apifyData),
    extractedAt: new Date().toISOString()
  };
};

export const validateApifyKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  return apiKey.startsWith('apify_api_') && apiKey.length > 20;
};

export const estimateApifyCost = (urls: number): string => {
  const costPerListing = 0.02;
  const totalCost = urls * costPerListing;
  return `~$${totalCost.toFixed(3)} USD (${urls} ${urls === 1 ? 'listing' : 'listings'})`;
};
