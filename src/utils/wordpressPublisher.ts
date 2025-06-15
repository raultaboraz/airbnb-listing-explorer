
import { WordPressCredentials, HomeyListingData, PublishResponse } from '@/types/wordpress';

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  homeyInstalled?: boolean;
  error?: string;
}

export const testWordPressConnection = async (
  credentials: WordPressCredentials
): Promise<TestConnectionResponse> => {
  try {
    console.log('🔍 Probando conexión con WordPress...');
    console.log('Sitio:', credentials.siteUrl);
    console.log('Usuario:', credentials.username);

    // Normalizar URL del sitio
    const siteUrl = credentials.siteUrl.replace(/\/+$/, '');
    const apiUrl = `${siteUrl}/wp-json/wp/v2`;

    // Crear autenticación básica
    const auth = btoa(`${credentials.username}:${credentials.password}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    console.log('📡 Conectando con WordPress API...');
    
    // Hacer llamada real a la API de WordPress para verificar conexión
    const response = await fetch(`${apiUrl}/users/me`, { 
      method: 'GET',
      headers 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de autenticación:', response.status, errorText);
      return {
        success: false,
        message: `Error de autenticación (${response.status}). Verifica las credenciales.`,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const userData = await response.json();
    console.log('✅ Conexión con WordPress establecida. Usuario:', userData.name);

    // Verificar si el plugin Homey está instalado checkeando los tipos de post
    console.log('🔍 Verificando plugin Homey...');
    const typesResponse = await fetch(`${apiUrl}/types`, { headers });
    
    let homeyInstalled = false;
    if (typesResponse.ok) {
      const types = await typesResponse.json();
      homeyInstalled = 'property' in types || 'listing' in types;
    }

    console.log(`${homeyInstalled ? '✅' : '⚠️'} Plugin Homey: ${homeyInstalled ? 'Detectado' : 'No detectado'}`);

    return {
      success: true,
      message: `Conexión exitosa con WordPress. Usuario: ${userData.name}. ${homeyInstalled ? 'Plugin Homey detectado.' : 'Plugin Homey no detectado - se publicará como post estándar.'}`,
      homeyInstalled
    };

  } catch (error) {
    console.error('❌ Error durante el test de conexión:', error);
    return {
      success: false,
      message: 'Error de conexión con WordPress. Verifica la URL y conectividad.',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

export const publishToWordPress = async (
  credentials: WordPressCredentials,
  listingData: HomeyListingData
): Promise<PublishResponse> => {
  try {
    console.log('📝 Iniciando publicación en WordPress...');
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

    // 1. Subir imágenes primero
    console.log('📸 Subiendo imágenes...');
    const uploadedImageIds = await uploadImages(siteUrl, auth, listingData.images);
    
    // 2. Crear el post del listing
    console.log('📝 Creando post del listing...');
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

    // Hacer llamada real a WordPress API
    const response = await fetch(`${apiUrl}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la API:', response.status, errorText);
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Post creado exitosamente:', result);

    const postUrl = `${siteUrl}/?p=${result.id}`;
    
    return {
      success: true,
      postId: result.id,
      message: `Listing publicado exitosamente. Ver en: ${postUrl}`
    };

  } catch (error) {
    console.error('❌ Error durante la publicación:', error);
    return {
      success: false,
      message: 'Error durante la publicación en WordPress',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

const uploadImages = async (siteUrl: string, auth: string, images: string[]): Promise<number[]> => {
  console.log(`📸 Subiendo ${images.length} imágenes...`);
  
  const uploadedIds: number[] = [];
  const mediaUrl = `${siteUrl}/wp-json/wp/v2/media`;
  
  for (let i = 0; i < Math.min(images.length, 10); i++) {
    try {
      console.log(`📸 Subiendo imagen ${i + 1}/${images.length}: ${images[i]}`);
      
      // Descargar la imagen desde la URL
      const imageResponse = await fetch(images[i]);
      if (!imageResponse.ok) {
        console.error(`❌ Error descargando imagen ${i + 1}`);
        continue;
      }
      
      const imageBlob = await imageResponse.blob();
      const fileName = `listing-image-${i + 1}.jpg`;
      
      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('file', imageBlob, fileName);
      
      const uploadResponse = await fetch(mediaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        uploadedIds.push(uploadResult.id);
        console.log(`✅ Imagen ${i + 1} subida con ID: ${uploadResult.id}`);
      } else {
        const errorText = await uploadResponse.text();
        console.error(`❌ Error subiendo imagen ${i + 1}:`, errorText);
      }
      
    } catch (error) {
      console.error(`❌ Error procesando imagen ${i + 1}:`, error);
    }
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
