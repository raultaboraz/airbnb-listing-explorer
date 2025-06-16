
import { ScrapingData } from '@/types/scraping';

export interface ApifyScrapingResult {
  success: boolean;
  data?: ScrapingData;
  error?: string;
  cost?: number;
  creditsUsed?: number;
}

export interface ApifyConfig {
  apiKey: string;
  actorId?: string;
}

const DEFAULT_ACTOR_ID = 'dtrungtin/airbnb-scraper'; // Popular Airbnb scraper actor

export const scrapeWithApify = async (
  url: string,
  config: ApifyConfig,
  onProgress: (progress: number, step: string) => void
): Promise<ApifyScrapingResult> => {
  const { apiKey, actorId = DEFAULT_ACTOR_ID } = config;
  
  if (!apiKey || !apiKey.startsWith('apify_api_')) {
    throw new Error('API key de Apify inválida. Debe comenzar con "apify_api_"');
  }

  console.log('🚀 Iniciando scraping con Apify para:', url);
  onProgress(10, 'Conectando con Apify...');

  try {
    // 1. Iniciar el actor de Apify
    onProgress(20, 'Iniciando actor de Airbnb...');
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxListings: 1,
        extendOutputFunction: '',
        proxyConfiguration: { useApifyProxy: true }
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Error al iniciar Apify: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log('✅ Actor iniciado con ID:', runId);
    onProgress(40, 'Ejecutando extracción...');

    // 2. Esperar a que termine la ejecución
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutos máximo

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
      attempts++;
      
      onProgress(40 + (attempts * 2), `Extrayendo datos... (${attempts * 10}s)`);

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        console.log(`📊 Estado del run: ${runStatus}`);
      }
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`La extracción de Apify falló con estado: ${runStatus}`);
    }

    onProgress(80, 'Obteniendo resultados...');

    // 3. Obtener los resultados
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!resultsResponse.ok) {
      throw new Error(`Error al obtener resultados: ${resultsResponse.status}`);
    }

    const results = await resultsResponse.json();
    console.log('📄 Resultados de Apify:', results.length, 'items');

    if (!results || results.length === 0) {
      throw new Error('No se obtuvieron datos del listing');
    }

    onProgress(90, 'Procesando datos...');

    // 4. Convertir datos de Apify a nuestro formato
    const apifyData = results[0];
    const scrapingData = convertApifyToScrapingData(apifyData, url);

    onProgress(100, '¡Datos reales extraídos con Apify!');

    return {
      success: true,
      data: scrapingData,
      creditsUsed: runData.data.stats?.computeUnits || 1
    };

  } catch (error) {
    console.error('❌ Error en Apify scraping:', error);
    throw error;
  }
};

const convertApifyToScrapingData = (apifyData: any, originalUrl: string): ScrapingData => {
  console.log('🔄 Convirtiendo datos de Apify a formato interno');
  
  // Extraer ID del listing de la URL
  const listingId = originalUrl.match(/\/rooms\/(\d+)/)?.[1] || 'unknown';
  
  return {
    listingId,
    url: originalUrl,
    title: apifyData.name || apifyData.title || 'Título no disponible',
    description: apifyData.description || 'Descripción no disponible',
    aboutSpace: apifyData.summary || apifyData.space || apifyData.description || '',
    hostName: apifyData.host?.name || apifyData.hostName || 'Host no disponible',
    guests: parseInt(apifyData.guests) || parseInt(apifyData.accommodates) || 1,
    bedrooms: parseInt(apifyData.bedrooms) || parseInt(apifyData.beds) || 1,
    bathrooms: parseFloat(apifyData.bathrooms) || parseFloat(apifyData.baths) || 1,
    price: apifyData.price?.toString() || apifyData.pricePerNight?.toString() || '0',
    location: apifyData.address || apifyData.location || apifyData.neighborhood || 'Ubicación no disponible',
    amenities: Array.isArray(apifyData.amenities) ? apifyData.amenities : 
               apifyData.amenities ? apifyData.amenities.split(',').map((a: string) => a.trim()) : [],
    reviews: {
      count: parseInt(apifyData.reviewsCount) || parseInt(apifyData.numberOfReviews) || 0,
      rating: parseFloat(apifyData.rating) || parseFloat(apifyData.reviewScoresRating) || 0,
      recent: Array.isArray(apifyData.reviews) ? 
        apifyData.reviews.slice(0, 3).map((review: any) => ({
          author: review.author || review.name || 'Usuario',
          text: review.text || review.comment || review.review || '',
          rating: review.rating || 5
        })) : []
    },
    images: Array.isArray(apifyData.images) ? 
      apifyData.images.filter((img: string) => img && img.startsWith('http')) :
      apifyData.photos ? apifyData.photos.filter((img: string) => img && img.startsWith('http')) : [],
    extractedAt: new Date().toISOString()
  };
};

export const validateApifyKey = (apiKey: string): boolean => {
  return apiKey && apiKey.startsWith('apify_api_') && apiKey.length > 20;
};

export const estimateApifyCost = (urls: number): string => {
  const costPerListing = 0.01; // Estimación aproximada
  const totalCost = urls * costPerListing;
  return `~$${totalCost.toFixed(3)} USD (${urls} ${urls === 1 ? 'listing' : 'listings'})`;
};
