
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
    console.log('📝 Iniciando publicación en WordPress como Homey Listing...');
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
    
    // 2. Crear slug para la URL del listing
    const slug = createListingSlug(listingData.title);
    
    // 3. Crear el Homey Listing (Custom Post Type)
    console.log('🏠 Creando Homey Listing...');
    const listingPostData = {
      title: listingData.title,
      content: formatListingContent(listingData),
      status: listingData.status,
      slug: slug,
      featured_media: uploadedImageIds[0] || 0,
      // Usar el endpoint específico de Homey para listings
      type: 'property', // Tipo de post personalizado de Homey
      meta: {
        // Campos específicos de Homey Listings
        'fave_property_price': listingData.price.replace(/[^\d]/g, ''), // Solo números
        'fave_property_price_postfix': 'Per Night',
        'fave_property_bedrooms': listingData.bedrooms.toString(),
        'fave_property_bathrooms': listingData.bathrooms.toString(),
        'fave_property_guests': listingData.guests.toString(),
        'fave_property_address': listingData.location,
        'fave_property_city': extractCityFromLocation(listingData.location),
        'fave_property_country': extractCountryFromLocation(listingData.location),
        'fave_property_zip': '',
        'fave_property_type': listingData.propertyType,
        'fave_property_status': 'for-rent',
        'fave_property_label': 'featured',
        'fave_property_size': '',
        'fave_property_size_prefix': 'SqFt',
        'fave_property_year': '',
        'fave_property_garage': '0',
        'fave_property_garage_size': '',
        'fave_property_agent': '',
        'fave_property_images': uploadedImageIds.join(','),
        'fave_property_map': '1',
        'fave_property_map_address': listingData.location,
        'fave_featured': '1',
        'fave_agent_display_option': 'none',
        'fave_property_payment_status': '',
        'fave_property_disclaimer': '',
        'fave_property_virtual_tour': '',
        'fave_property_video_url': '',
        'fave_property_energy_class': '',
        'fave_property_energy_global_index': '',
        'fave_property_min_days': '1',
        'fave_property_max_days': '365',
        'fave_property_instant_booking': '0',
        'fave_property_checkin': '15:00',
        'fave_property_checkout': '11:00',
        'fave_property_smoking': '0',
        'fave_property_pets': '0',
        'fave_property_party': '0',
        'fave_property_children': '1',
        'fave_property_additional_fees': '',
        'fave_property_sec_deposit': '',
        'fave_property_cleaning_fee': '',
        'fave_property_city_fee': '',
        'fave_property_weekends': listingData.price.replace(/[^\d]/g, ''),
        'fave_property_weekly_discount': '0',
        'fave_property_monthly_discount': '0'
      }
    };

    // Intentar publicar como Homey Listing primero
    let response = await fetch(`${apiUrl}/property`, {
      method: 'POST',
      headers,
      body: JSON.stringify(listingPostData)
    });

    // Si falla, intentar con el endpoint estándar pero con type property
    if (!response.ok) {
      console.log('🔄 Intentando con endpoint alternativo...');
      response = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(listingPostData)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la API:', response.status, errorText);
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Homey Listing creado exitosamente:', result);

    // 4. Asignar amenidades como taxonomías de Homey
    if (listingData.amenities.length > 0) {
      await assignHomeyAmenities(siteUrl, auth, result.id, listingData.amenities);
    }

    // 5. Crear URL del listing con formato Homey
    const listingUrl = `${siteUrl}/listing/${slug}/`;
    
    return {
      success: true,
      postId: result.id,
      message: `Homey Listing publicado exitosamente. Ver en: ${listingUrl}`,
      url: listingUrl
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

const createListingSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones al inicio/final
};

const extractCityFromLocation = (location: string): string => {
  // Extraer ciudad de la ubicación (primer elemento antes de coma)
  return location.split(',')[0].trim();
};

const extractCountryFromLocation = (location: string): string => {
  // Extraer país de la ubicación (último elemento después de coma)
  const parts = location.split(',');
  return parts[parts.length - 1].trim();
};

const assignHomeyAmenities = async (siteUrl: string, auth: string, postId: number, amenities: string[]): Promise<void> => {
  try {
    console.log('🏷️ Asignando amenidades...');
    
    // Obtener taxonomías de amenidades existentes
    const taxonomiesUrl = `${siteUrl}/wp-json/wp/v2/property_feature`;
    const response = await fetch(taxonomiesUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (response.ok) {
      const existingFeatures = await response.json();
      const amenityIds: number[] = [];

      for (const amenity of amenities) {
        // Buscar si la amenidad ya existe
        const existingFeature = existingFeatures.find((f: any) => 
          f.name.toLowerCase() === amenity.toLowerCase()
        );

        if (existingFeature) {
          amenityIds.push(existingFeature.id);
        } else {
          // Crear nueva amenidad si no existe
          try {
            const createResponse = await fetch(taxonomiesUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: amenity,
                slug: createListingSlug(amenity)
              })
            });

            if (createResponse.ok) {
              const newFeature = await createResponse.json();
              amenityIds.push(newFeature.id);
            }
          } catch (error) {
            console.error('Error creando amenidad:', amenity, error);
          }
        }
      }

      // Asignar amenidades al post
      if (amenityIds.length > 0) {
        await fetch(`${siteUrl}/wp-json/wp/v2/property/${postId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            property_feature: amenityIds
          })
        });
        console.log('✅ Amenidades asignadas:', amenityIds);
      }
    }
  } catch (error) {
    console.error('❌ Error asignando amenidades:', error);
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
  
  <h3>Property Details</h3>
  <ul>
    <li><strong>Bedrooms:</strong> ${listingData.bedrooms}</li>
    <li><strong>Bathrooms:</strong> ${listingData.bathrooms}</li>
    <li><strong>Guests:</strong> ${listingData.guests}</li>
    <li><strong>Location:</strong> ${listingData.location}</li>
    <li><strong>Price:</strong> ${listingData.price}</li>
  </ul>
  
  <h3>Amenities</h3>
  <ul>
    ${listingData.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
  </ul>
</div>
  `.trim();
};
