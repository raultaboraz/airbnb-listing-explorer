import { WordPressCredentials, HomeyListingData, PublishResponse } from '@/types/wordpress';

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  homeyInstalled?: boolean;
  homeyEndpoints?: string[];
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

    // Verificar si el plugin Homey está instalado de manera más exhaustiva
    console.log('🔍 Verificando plugin Homey...');
    
    // 1. Verificar tipos de post personalizados
    const typesResponse = await fetch(`${apiUrl}/types`, { headers });
    let homeyInstalled = false;
    let homeyEndpoints: string[] = [];
    
    if (typesResponse.ok) {
      const types = await typesResponse.json();
      console.log('📋 Tipos de post disponibles:', Object.keys(types));
      
      // Buscar tipos de post relacionados con Homey
      const homeyTypes = Object.keys(types).filter(type => 
        ['property', 'listing', 'fave_property', 'homey_listing'].includes(type)
      );
      
      if (homeyTypes.length > 0) {
        homeyInstalled = true;
        homeyEndpoints = homeyTypes;
        console.log('✅ Tipos de post de Homey encontrados:', homeyTypes);
      }
    }

    // 2. Verificar endpoints específicos de Homey
    const homeyTestEndpoints = [
      'property',
      'listings', 
      'fave_property',
      'homey_listing',
      'properties'
    ];

    for (const endpoint of homeyTestEndpoints) {
      try {
        const testResponse = await fetch(`${apiUrl}/${endpoint}?per_page=1`, { 
          method: 'GET',
          headers 
        });
        
        if (testResponse.ok) {
          console.log(`✅ Endpoint /${endpoint} disponible`);
          if (!homeyEndpoints.includes(endpoint)) {
            homeyEndpoints.push(endpoint);
          }
          homeyInstalled = true;
        } else {
          console.log(`❌ Endpoint /${endpoint} no disponible (${testResponse.status})`);
        }
      } catch (error) {
        console.log(`❌ Error probando endpoint /${endpoint}:`, error);
      }
    }

    // 3. Verificar plugins activos mediante REST API
    try {
      const pluginsResponse = await fetch(`${siteUrl}/wp-json/wp/v2/plugins`, { headers });
      if (pluginsResponse.ok) {
        const plugins = await pluginsResponse.json();
        const homeyPlugin = plugins.find((plugin: any) => 
          plugin.name?.toLowerCase().includes('homey') || 
          plugin.description?.toLowerCase().includes('homey')
        );
        if (homeyPlugin) {
          console.log('✅ Plugin Homey detectado en lista de plugins:', homeyPlugin.name);
          homeyInstalled = true;
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar plugins activos:', error);
    }

    console.log(`${homeyInstalled ? '✅' : '⚠️'} Plugin Homey: ${homeyInstalled ? 'Detectado' : 'No detectado'}`);
    console.log('📋 Endpoints de Homey disponibles:', homeyEndpoints);

    return {
      success: true,
      message: `Conexión exitosa con WordPress. Usuario: ${userData.name}. ${homeyInstalled ? `Plugin Homey detectado con endpoints: ${homeyEndpoints.join(', ')}` : 'Plugin Homey no detectado - se publicará como post estándar.'}`,
      homeyInstalled,
      homeyEndpoints
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

    // 1. Verificar qué endpoints de Homey están disponibles
    console.log('🔍 Verificando endpoints de Homey disponibles...');
    const connectionTest = await testWordPressConnection(credentials);
    const availableEndpoints = connectionTest.homeyEndpoints || [];
    
    // 2. Subir imágenes primero
    console.log('📸 Subiendo imágenes...');
    const uploadedImageIds = await uploadImages(siteUrl, auth, listingData.images);
    
    // 3. Crear slug para la URL del listing
    const slug = createListingSlug(listingData.title);
    
    // 4. Preparar datos del Homey Listing
    console.log('🏠 Preparando datos del Homey Listing...');
    const homeyMetadata = createHomeyMetadata(listingData, uploadedImageIds);
    
    // 5. Intentar crear como Homey Listing usando diferentes endpoints
    let createdPost: any = null;
    let usedEndpoint = '';
    
    // Lista de endpoints a probar en orden de preferencia
    const endpointsToTry = [
      'property',
      'listings',
      'fave_property', 
      'homey_listing',
      'properties'
    ].filter(endpoint => availableEndpoints.includes(endpoint));
    
    // Si no hay endpoints de Homey disponibles, añadir algunos para probar
    if (endpointsToTry.length === 0) {
      endpointsToTry.push('property', 'listings');
    }
    
    console.log('🔄 Probando endpoints de Homey:', endpointsToTry);
    
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔄 Intentando crear Homey Listing en /${endpoint}...`);
        
        const listingPostData = {
          title: listingData.title,
          content: formatListingContent(listingData),
          status: listingData.status,
          slug: slug,
          featured_media: uploadedImageIds[0] || 0,
          meta: homeyMetadata
        };
        
        const response = await fetch(`${apiUrl}/${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(listingPostData)
        });
        
        if (response.ok) {
          createdPost = await response.json();
          usedEndpoint = endpoint;
          console.log(`✅ Homey Listing creado exitosamente en /${endpoint}:`, createdPost);
          break;
        } else {
          const errorText = await response.text();
          console.log(`❌ Error en /${endpoint} (${response.status}):`, errorText);
        }
        
      } catch (error) {
        console.log(`❌ Error probando /${endpoint}:`, error);
      }
    }
    
    // 6. Si no se pudo crear como Homey Listing, crear como post estándar con metadatos
    if (!createdPost) {
      console.log('🔄 Creando como post estándar con metadatos de Homey...');
      
      const standardPostData = {
        title: listingData.title,
        content: formatListingContent(listingData),
        status: listingData.status,
        slug: slug,
        featured_media: uploadedImageIds[0] || 0,
        categories: [], // Agregar categoría de propiedades si existe
        meta: homeyMetadata
      };
      
      const response = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(standardPostData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error creando post estándar:', response.status, errorText);
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
      createdPost = await response.json();
      usedEndpoint = 'posts';
      console.log('✅ Post estándar creado con metadatos de Homey:', createdPost);
      
      // Intentar asignar metadatos individualmente si no se guardaron
      await assignMetadataIndividually(siteUrl, auth, createdPost.id, homeyMetadata);
    }

    // 7. Asignar amenidades como taxonomías de Homey
    if (listingData.amenities.length > 0) {
      await assignHomeyAmenities(siteUrl, auth, createdPost.id, listingData.amenities, usedEndpoint);
    }

    // 8. Crear URL del listing
    let listingUrl: string;
    if (usedEndpoint === 'posts') {
      listingUrl = `${siteUrl}/${slug}/`;
    } else {
      listingUrl = `${siteUrl}/listing/${slug}/`;
    }
    
    console.log('✅ URL del listing generada:', listingUrl);
    
    return {
      success: true,
      postId: createdPost.id,
      message: `${usedEndpoint === 'posts' ? 'Post con metadatos de Homey' : 'Homey Listing'} publicado exitosamente usando endpoint /${usedEndpoint}`,
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

const createHomeyMetadata = (listingData: HomeyListingData, uploadedImageIds: number[]) => {
  // Extraer números del precio
  const priceNumber = listingData.price.replace(/[^\d]/g, '');
  
  return {
    // Campos básicos de Homey
    'fave_property_price': priceNumber,
    'fave_property_price_postfix': 'Per Night',
    'fave_property_bedrooms': listingData.bedrooms.toString(),
    'fave_property_bathrooms': listingData.bathrooms.toString(),
    'fave_property_guests': listingData.guests.toString(),
    'fave_property_address': listingData.location,
    'fave_property_city': extractCityFromLocation(listingData.location),
    'fave_property_country': extractCountryFromLocation(listingData.location),
    'fave_property_type': listingData.propertyType,
    'fave_property_status': 'for-rent',
    'fave_property_label': 'featured',
    
    // Configuración de imágenes
    'fave_property_images': uploadedImageIds.join(','),
    
    // Configuración de mapa
    'fave_property_map': '1',
    'fave_property_map_address': listingData.location,
    
    // Estado del listing
    'fave_featured': '1',
    'fave_agent_display_option': 'none',
    
    // Configuración de reservas
    'fave_property_min_days': '1',
    'fave_property_max_days': '365',
    'fave_property_instant_booking': '0',
    'fave_property_checkin': '15:00',
    'fave_property_checkout': '11:00',
    
    // Políticas de la propiedad
    'fave_property_smoking': '0',
    'fave_property_pets': '0',
    'fave_property_party': '0',
    'fave_property_children': '1',
    
    // Precios adicionales
    'fave_property_weekends': priceNumber,
    'fave_property_weekly_discount': '0',
    'fave_property_monthly_discount': '0',
    
    // Campos opcionales vacíos
    'fave_property_size': '',
    'fave_property_size_prefix': 'SqFt',
    'fave_property_year': '',
    'fave_property_garage': '0',
    'fave_property_garage_size': '',
    'fave_property_agent': '',
    'fave_property_zip': '',
    'fave_property_payment_status': '',
    'fave_property_disclaimer': '',
    'fave_property_virtual_tour': '',
    'fave_property_video_url': '',
    'fave_property_energy_class': '',
    'fave_property_energy_global_index': '',
    'fave_property_additional_fees': '',
    'fave_property_sec_deposit': '',
    'fave_property_cleaning_fee': '',
    'fave_property_city_fee': ''
  };
};

const assignMetadataIndividually = async (
  siteUrl: string, 
  auth: string, 
  postId: number, 
  metadata: Record<string, string>
): Promise<void> => {
  console.log('🔄 Asignando metadatos individualmente...');
  
  for (const [key, value] of Object.entries(metadata)) {
    try {
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}/meta`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: key,
          value: value
        })
      });
      
      if (response.ok) {
        console.log(`✅ Metadata ${key} asignado`);
      } else {
        console.log(`❌ Error asignando metadata ${key}`);
      }
    } catch (error) {
      console.log(`❌ Error asignando metadata ${key}:`, error);
    }
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

const assignHomeyAmenities = async (
  siteUrl: string, 
  auth: string, 
  postId: number, 
  amenities: string[], 
  usedEndpoint: string
): Promise<void> => {
  try {
    console.log('🏷️ Asignando amenidades...');
    
    // Intentar diferentes endpoints para amenidades
    const amenityEndpoints = [
      'property_feature',
      'listing_feature', 
      'fave_property_feature',
      'homey_feature'
    ];
    
    let taxonomyEndpoint = '';
    
    // Encontrar el endpoint correcto para amenidades
    for (const endpoint of amenityEndpoints) {
      try {
        const testResponse = await fetch(`${siteUrl}/wp-json/wp/v2/${endpoint}`, {
          headers: { 'Authorization': `Basic ${auth}` }
        });
        
        if (testResponse.ok) {
          taxonomyEndpoint = endpoint;
          console.log(`✅ Endpoint de amenidades encontrado: ${endpoint}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} no disponible`);
      }
    }
    
    if (!taxonomyEndpoint) {
      console.log('⚠️ No se encontró endpoint de amenidades válido');
      return;
    }
    
    // Obtener taxonomías de amenidades existentes
    const taxonomiesUrl = `${siteUrl}/wp-json/wp/v2/${taxonomyEndpoint}`;
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
          console.log(`✅ Amenidad existente encontrada: ${amenity} (ID: ${existingFeature.id})`);
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
              console.log(`✅ Nueva amenidad creada: ${amenity} (ID: ${newFeature.id})`);
            }
          } catch (error) {
            console.error('❌ Error creando amenidad:', amenity, error);
          }
        }
      }

      // Asignar amenidades al post
      if (amenityIds.length > 0) {
        const assignUrl = usedEndpoint === 'posts' ? 
          `${siteUrl}/wp-json/wp/v2/posts/${postId}` : 
          `${siteUrl}/wp-json/wp/v2/${usedEndpoint}/${postId}`;
          
        await fetch(assignUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [taxonomyEndpoint]: amenityIds
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
