
import { ScrapingData } from '@/types/scraping';

export interface AirbnbScrapingResult {
  success: boolean;
  data?: ScrapingData;
  error?: string;
  isSimulated?: boolean;
  method?: string;
}

// Datos simulados más variados y realistas
const SIMULATED_LISTINGS = [
  {
    location: 'Barcelona, España',
    title: 'Hermoso apartamento en el Barrio Gótico',
    description: 'Encantador apartamento en el corazón de Barcelona, ubicado en el histórico Barrio Gótico. Este espacio único combina elementos arquitectónicos originales con comodidades modernas. Perfecto para explorar a pie las principales atracciones de la ciudad.',
    aboutSpace: 'El apartamento cuenta con techos altos, vigas de madera originales y ventanas que dan a una tranquila calle empedrada. La cocina está completamente equipada y el salón es perfecto para relajarse después de un día explorando la ciudad.',
    hostName: 'María García',
    price: '85',
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['WiFi gratuito', 'Cocina completa', 'Aire acondicionado', 'Calefacción', 'TV con cable', 'Lavadora', 'Plancha', 'Secador de pelo'],
    rating: 4.8,
    reviewCount: 127
  },
  {
    location: 'Madrid, España',
    title: 'Loft moderno cerca del Retiro',
    description: 'Moderno loft ubicado a pocos minutos del Parque del Retiro y del centro de Madrid. Diseñado con un estilo contemporáneo y todas las comodidades necesarias para una estancia perfecta en la capital española.',
    aboutSpace: 'Espacio diáfano con grandes ventanales que aportan mucha luz natural. La cocina está integrada en el salón y cuenta con electrodomésticos de alta gama. El dormitorio en altillo ofrece privacidad y vistas a la ciudad.',
    hostName: 'Carlos Rodríguez',
    price: '110',
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['WiFi gratuito', 'Cocina completa', 'Aire acondicionado', 'Calefacción', 'TV Smart', 'Lavadora', 'Lavavajillas', 'Terraza'],
    rating: 4.6,
    reviewCount: 89
  },
  {
    location: 'Sevilla, España',
    title: 'Casa tradicional andaluza con patio',
    description: 'Auténtica casa andaluza en el centro histórico de Sevilla, con un hermoso patio interior típico de la región. Ubicada a poca distancia de la Catedral y la Giralda, perfecta para descubrir el encanto de Sevilla.',
    aboutSpace: 'La casa mantiene la arquitectura tradicional sevillana con su característico patio central rodeado de habitaciones. Los azulejos originales y la decoración típica andaluza crean un ambiente único y acogedor.',
    hostName: 'Ana Fernández',
    price: '95',
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['WiFi gratuito', 'Cocina completa', 'Aire acondicionado', 'Patio privado', 'TV', 'Lavadora', 'Plancha', 'Productos de limpieza'],
    rating: 4.9,
    reviewCount: 156
  }
];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=800&fit=crop'
];

export const scrapeAirbnbListing = async (
  url: string,
  onProgress: (progress: number, step: string) => void
): Promise<AirbnbScrapingResult> => {
  const listingId = extractAirbnbId(url);
  if (!listingId) {
    throw new Error('URL de Airbnb inválida - no se pudo extraer el ID del listing');
  }

  console.log('🚀 Iniciando extracción de Airbnb para:', url);
  console.log('⚠️ ADVERTENCIA: Airbnb bloquea la extracción automática - los datos serán simulados');
  
  // 1. Intentar con nuestro proxy de Netlify
  onProgress(10, 'Conectando con proxy...');
  try {
    const result = await tryNetlifyProxy(url, onProgress);
    if (result.success && result.data) {
      // Verificar si realmente contiene datos de Airbnb válidos
      const isRealData = await validateAirbnbData(result.data, url);
      if (isRealData) {
        console.log('✅ Datos REALES extraídos exitosamente');
        return {
          ...result,
          isSimulated: false,
          method: 'netlify-proxy'
        };
      } else {
        console.log('❌ Los datos del proxy no son válidos - usando simulados');
      }
    }
  } catch (error) {
    console.log('❌ Proxy falló:', error.message);
  }

  // 2. Intentar con proxies CORS públicos
  onProgress(30, 'Probando proxies alternativos...');
  try {
    const result = await tryPublicProxies(url, onProgress);
    if (result.success && result.data) {
      const isRealData = await validateAirbnbData(result.data, url);
      if (isRealData) {
        console.log('✅ Datos REALES extraídos con proxy público');
        return {
          ...result,
          isSimulated: false,
          method: 'public-proxy'
        };
      }
    }
  } catch (error) {
    console.log('❌ Proxies públicos fallaron:', error.message);
  }

  // 3. Como Airbnb siempre bloquea, generar datos simulados pero ser honesto al respecto
  console.log('🛑 TODOS LOS MÉTODOS BLOQUEADOS POR AIRBNB - Generando datos simulados');
  onProgress(80, 'Airbnb bloqueó la extracción - generando datos simulados...');
  const simulatedData = generateEnhancedSimulatedData(url, listingId);
  onProgress(100, 'Datos simulados generados (no son reales del listing)');
  
  return {
    success: true,
    data: simulatedData,
    isSimulated: true,
    method: 'simulated-fallback'
  };
};

const tryNetlifyProxy = async (
  url: string, 
  onProgress: (progress: number, step: string) => void
): Promise<AirbnbScrapingResult> => {
  const proxyUrl = `/.netlify/functions/proxy-airbnb?url=${encodeURIComponent(url)}`;
  
  onProgress(15, 'Usando proxy Netlify...');
  
  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`Proxy response: ${response.status}`);
  }

  const html = await response.text();
  console.log('📄 HTML recibido del proxy. Longitud:', html.length);
  
  // Verificar si realmente es HTML de Airbnb o solo nuestro propio HTML
  if (html.includes('airbnb-listing-explorer') || html.includes('Lovable Generated')) {
    console.log('❌ El proxy devolvió nuestro propio HTML - no datos de Airbnb');
    throw new Error('Proxy devolvió HTML incorrecto');
  }
  
  // Buscar indicadores reales de Airbnb
  const hasAirbnbContent = html.includes('"@type":"Product"') || 
                          html.includes('data-testid') || 
                          html.includes('airbnb.com') ||
                          html.includes('window.__NEXT_DATA__');
  
  if (!hasAirbnbContent) {
    console.log('❌ HTML no contiene contenido de Airbnb válido');
    throw new Error('No se encontró contenido válido de Airbnb');
  }

  onProgress(25, 'Analizando contenido de Airbnb...');
  const data = await parseAirbnbHTML(html, url, extractAirbnbId(url), onProgress);
  
  return {
    success: true,
    data,
    isSimulated: false,
    method: 'netlify-proxy'
  };
};

const tryPublicProxies = async (
  url: string,
  onProgress: (progress: number, step: string) => void
): Promise<AirbnbScrapingResult> => {
  const proxies = [
    'https://api.allorigins.win/get?url=',
    'https://proxy.cors.sh/',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i];
    onProgress(35 + (i * 8), `Probando proxy ${i + 1}/${proxies.length}...`);
    
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (response.ok) {
        let html;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const json = await response.json();
          html = json.contents || json.data || JSON.stringify(json);
        } else {
          html = await response.text();
        }

        console.log(`📄 Proxy ${i + 1} HTML longitud:`, html.length);
        
        // Verificar contenido real de Airbnb
        const hasRealAirbnbContent = html && 
                                   html.length > 10000 && 
                                   (html.includes('"@type":"Product"') || 
                                    html.includes('window.__NEXT_DATA__') ||
                                    html.includes('data-testid'));
        
        if (hasRealAirbnbContent) {
          onProgress(55, 'Analizando datos reales...');
          const data = await parseAirbnbHTML(html, url, extractAirbnbId(url), onProgress);
          
          return {
            success: true,
            data,
            isSimulated: false,
            method: `public-proxy-${i + 1}`
          };
        }
      }
    } catch (error) {
      console.log(`Proxy ${i + 1} falló:`, error.message);
    }
  }

  throw new Error('Todos los proxies públicos fallaron o fueron bloqueados');
};

const validateAirbnbData = async (data: ScrapingData, originalUrl: string): Promise<boolean> => {
  // Verificar si los datos parecen reales vs simulados
  const urlId = extractAirbnbId(originalUrl);
  const dataId = data.listingId;
  
  // Si los IDs no coinciden, probablemente son datos simulados
  if (urlId !== dataId) {
    console.log(`❌ IDs no coinciden: URL=${urlId}, Data=${dataId}`);
    return false;
  }
  
  // Verificar si el título coincide con alguno de nuestros simulados
  const isSimulatedTitle = SIMULATED_LISTINGS.some(listing => 
    listing.title === data.title || 
    data.title.includes('Hermoso apartamento') ||
    data.title.includes('Loft moderno') ||
    data.title.includes('Casa tradicional')
  );
  
  if (isSimulatedTitle) {
    console.log('❌ Título coincide con datos simulados');
    return false;
  }
  
  // Verificar si las imágenes son de nuestros samples
  const hasSimulatedImages = data.images.some(img => 
    SAMPLE_IMAGES.includes(img) || img.includes('unsplash.com')
  );
  
  if (hasSimulatedImages) {
    console.log('❌ Imágenes son de muestras simuladas');
    return false;
  }
  
  return true;
};

const generateEnhancedSimulatedData = (url: string, listingId: string): ScrapingData => {
  const randomListing = SIMULATED_LISTINGS[Math.floor(Math.random() * SIMULATED_LISTINGS.length)];
  const numImages = 5 + Math.floor(Math.random() * 3);
  const selectedImages = SAMPLE_IMAGES.slice(0, numImages);

  console.log('🎭 GENERANDO DATOS COMPLETAMENTE SIMULADOS para demostración');
  console.log('⚠️ ESTOS NO SON DATOS REALES DEL LISTING');

  return {
    listingId,
    url,
    title: randomListing.title,
    description: randomListing.description,
    aboutSpace: randomListing.aboutSpace,
    hostName: randomListing.hostName,
    guests: randomListing.guests,
    bedrooms: randomListing.bedrooms,
    bathrooms: randomListing.bathrooms,
    price: randomListing.price,
    location: randomListing.location,
    amenities: randomListing.amenities,
    reviews: {
      count: randomListing.reviewCount,
      rating: randomListing.rating,
      recent: [
        { author: 'María S.', text: 'Excelente ubicación y muy limpio. Todo tal como se describe en el anuncio.', rating: 5 },
        { author: 'John D.', text: 'Perfect location and great communication from the host. Highly recommended!', rating: 5 },
        { author: 'Carlos M.', text: 'La casa es preciosa y está en una zona ideal para moverse por la ciudad.', rating: 4 }
      ]
    },
    images: selectedImages,
    extractedAt: new Date().toISOString()
  };
};

const extractAirbnbId = (url: string): string => {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : '';
};

const parseAirbnbHTML = async (
  html: string,
  url: string,
  listingId: string,
  onProgress: (progress: number, step: string) => void
): Promise<ScrapingData> => {
  onProgress(90, 'Procesando contenido HTML...');
  
  console.log('🔍 Intentando extraer datos reales del HTML...');
  
  // Buscar datos JSON estructurados
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
  const nextDataMatch = html.match(/<script[^>]*>window\.__NEXT_DATA__\s*=\s*({.+?})<\/script>/);
  
  if (jsonLdMatch || nextDataMatch) {
    console.log('📊 Encontrados datos estructurados - implementación de parsing pendiente');
    // Aquí iría la implementación real de parsing
    // Por ahora, como es muy complejo, seguimos con simulados pero con mejor detección
  }
  
  // TODO: Implementar parsing real de HTML de Airbnb
  // Esto requeriría analizar la estructura específica de Airbnb
  console.log('⚠️ Parsing real de HTML de Airbnb no implementado - usando datos simulados');
  return generateEnhancedSimulatedData(url, listingId);
};
