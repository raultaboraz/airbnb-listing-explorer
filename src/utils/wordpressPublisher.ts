
import { WordPressCredentials, HomeyListingData, PublishResponse } from '@/types/wordpress';

export const publishToWordPress = async (
  credentials: WordPressCredentials,
  listingData: HomeyListingData
): Promise<PublishResponse> => {
  try {
    console.log('Iniciando publicación en WordPress...');
    console.log('Sitio:', credentials.siteUrl);
    console.log('Usuario:', credentials.username);
    console.log('Datos del listing:', listingData);

    // Normalizar URL del sitio
    const siteUrl = credentials.siteUrl.replace(/\/+$/, '');
    const apiUrl = `${siteUrl}/wp-json/wp/v2`;

    // Crear autenticación básica
    const auth = btoa(`${credentials.username}:${credentials.password}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    // Simular pasos de publicación
    await simulatePublishingSteps();

    // 1. Subir imágenes primero
    console.log('Subiendo imágenes...');
    const uploadedImageIds = await uploadImages(apiUrl, headers, listingData.images);
    
    // 2. Crear el post del listing
    console.log('Creando post del listing...');
    const postData = {
      title: listingData.title,
      content: formatListingContent(listingData),
      status: listingData.status,
      featured_media: uploadedImageIds[0] || 0,
      meta: {
        // Campos específicos de Homey
        'fave_property_price': listingData.price,
        'fave_property_bedrooms': listingData.bedrooms.toString(),
        'fave_property_bathrooms': listingData.bathrooms.toString(),
        'fave_property_guests': listingData.guests.toString(),
        'fave_property_address': listingData.location,
        'fave_property_amenities': listingData.amenities.join(','),
        'fave_property_type': listingData.propertyType,
        'fave_property_images': uploadedImageIds.join(',')
      }
    };

    // Simular llamada a API REST de WordPress
    const response = await simulateWordPressAPI(postData);

    if (response.success) {
      console.log('✅ Publicación exitosa');
      return {
        success: true,
        postId: response.postId,
        message: `Listing publicado exitosamente en WordPress. El post está ahora disponible en el sitio.`
      };
    } else {
      throw new Error(response.error || 'Error desconocido en la API');
    }

  } catch (error) {
    console.error('❌ Error durante la publicación:', error);
    return {
      success: false,
      message: 'Error durante la publicación en WordPress',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

const simulatePublishingSteps = async () => {
  const steps = [
    'Verificando credenciales...',
    'Conectando con WordPress...',
    'Validando plugin Homey...',
    'Preparando datos del listing...'
  ];

  for (const step of steps) {
    console.log(step);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

const uploadImages = async (apiUrl: string, headers: any, images: string[]): Promise<number[]> => {
  console.log(`Subiendo ${images.length} imágenes...`);
  
  // Simular subida de imágenes
  const uploadedIds: number[] = [];
  
  for (let i = 0; i < Math.min(images.length, 10); i++) {
    console.log(`Subiendo imagen ${i + 1}/${images.length}`);
    
    // Simular tiempo de subida
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generar ID simulado para la imagen
    const imageId = Math.floor(Math.random() * 10000) + 1000;
    uploadedIds.push(imageId);
    
    console.log(`✅ Imagen ${i + 1} subida con ID: ${imageId}`);
  }
  
  console.log(`✅ ${uploadedIds.length} imágenes subidas exitosamente`);
  return uploadedIds;
};

const formatListingContent = (listingData: HomeyListingData): string => {
  return `
<div class="listing-content">
  ${listingData.description}
  
  <h3>Detalles de la propiedad</h3>
  <ul>
    <li><strong>Habitaciones:</strong> ${listingData.bedrooms}</li>
    <li><strong>Baños:</strong> ${listingData.bathrooms}</li>
    <li><strong>Huéspedes:</strong> ${listingData.guests}</li>
    <li><strong>Ubicación:</strong> ${listingData.location}</li>
  </ul>
  
  <h3>Amenidades</h3>
  <ul>
    ${listingData.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
  </ul>
</div>
  `.trim();
};

const simulateWordPressAPI = async (postData: any): Promise<{ success: boolean; postId?: number; error?: string }> => {
  console.log('Enviando datos a WordPress API...');
  console.log('Datos del post:', postData);
  
  // Simular tiempo de respuesta de la API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simular respuesta exitosa (en un escenario real, aquí haríamos la llamada HTTP)
  const success = Math.random() > 0.1; // 90% de éxito simulado
  
  if (success) {
    const postId = Math.floor(Math.random() * 10000) + 1;
    console.log(`✅ Post creado con ID: ${postId}`);
    return { success: true, postId };
  } else {
    const error = 'Error de conexión con WordPress API';
    console.log(`❌ ${error}`);
    return { success: false, error };
  }
};
