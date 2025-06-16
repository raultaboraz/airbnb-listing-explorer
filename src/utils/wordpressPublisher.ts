
import { WordPressCredentials, HomeyListingData, PublishResponse } from '@/types/wordpress';
import { uploadImages, assignImagesToListing } from './imageUploader';
import { generateHomeyMetadata, forceAssignHomeyMetadata } from './homeyMetadata';
import { translateListingData } from './translator';

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

    const siteUrl = credentials.siteUrl.replace(/\/+$/, '');
    const apiUrl = `${siteUrl}/wp-json/wp/v2`;

    const auth = btoa(`${credentials.username}:${credentials.password}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    console.log('📡 Conectando con WordPress API...');
    
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

    console.log('🔍 Verificando plugin Homey...');
    
    const typesResponse = await fetch(`${apiUrl}/types`, { headers });
    let homeyInstalled = false;
    let homeyEndpoints: string[] = [];
    
    if (typesResponse.ok) {
      const types = await typesResponse.json();
      console.log('📋 Tipos de post disponibles:', Object.keys(types));
      
      const homeyTypes = Object.keys(types).filter(type => 
        ['property', 'listing', 'fave_property', 'homey_listing'].includes(type)
      );
      
      if (homeyTypes.length > 0) {
        homeyInstalled = true;
        homeyEndpoints = homeyTypes;
        console.log('✅ Tipos de post de Homey encontrados:', homeyTypes);
      }
    }

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
    const { siteUrl, username, password } = credentials;
    const auth = btoa(`${username}:${password}`);

    console.log('🚀 Iniciando publicación en WordPress...');
    console.log('📋 Datos del listing:', {
      title: listingData.title,
      price: listingData.price, // Should be clean number now
      guests: listingData.guests,
      bedrooms: listingData.bedrooms,
      bathrooms: listingData.bathrooms,
      location: listingData.location
    });

    // 1. Test connection first
    const connectionTest = await testWordPressConnection(credentials);
    if (!connectionTest.success) {
      throw new Error(connectionTest.message);
    }

    // 2. Translate data to English if needed
    console.log('🌐 Verificando traducción...');
    const translatedData = await translateListingData(listingData);
    console.log('✅ Datos traducidos:', {
      originalTitle: listingData.title,
      translatedTitle: translatedData.title,
      cleanPrice: translatedData.price
    });

    // 3. Generate Homey metadata with clean price
    const homeyMetadata = generateHomeyMetadata(translatedData);

    // 4. Upload images first
    let uploadedImageIds: number[] = [];
    if (translatedData.images && translatedData.images.length > 0) {
      console.log(`📸 Subiendo ${translatedData.images.length} imágenes...`);
      uploadedImageIds = await uploadImages(siteUrl, auth, translatedData.images);
      console.log(`✅ ${uploadedImageIds.length} imágenes subidas`);
    }

    // 5. Determine which endpoint to use
    const usedEndpoint = connectionTest.homeyEndpoints?.includes('listing') ? 'listing' : 'posts';
    console.log(`📡 Usando endpoint: ${usedEndpoint}`);

    // 6. Create the listing post
    const slug = translatedData.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const postData: any = {
      title: translatedData.title,
      content: `${translatedData.description}\n\n${translatedData.aboutSpace || ''}`,
      status: 'publish',
      slug: slug,
      meta: homeyMetadata
    };

    // Add featured image if available
    if (uploadedImageIds.length > 0) {
      postData.featured_media = uploadedImageIds[0];
    }

    const createUrl = usedEndpoint === 'posts' ? 
      `${siteUrl}/wp-json/wp/v2/posts` : 
      `${siteUrl}/wp-json/wp/v2/${usedEndpoint}`;

    console.log('📝 Creando post con metadatos...');
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Error creating post: ${createResponse.status} - ${errorText}`);
    }

    const createdPost = await createResponse.json();
    console.log('✅ Post creado:', createdPost.id);

    // 7. Force assign metadata after creation
    console.log('🔄 Forzando asignación de metadatos...');
    await forceAssignHomeyMetadata(siteUrl, auth, createdPost.id, homeyMetadata, usedEndpoint);

    // 8. Assign images to listing gallery
    if (uploadedImageIds.length > 0) {
      await assignImagesToListing(siteUrl, auth, createdPost.id, uploadedImageIds, usedEndpoint);
    }

    // 9. Assign amenities
    if (translatedData.amenities.length > 0) {
      await assignHomeyAmenities(siteUrl, auth, createdPost.id, translatedData.amenities, usedEndpoint);
    }

    // 10. Generate listing URL
    let listingUrl: string;
    if (usedEndpoint === 'posts') {
      listingUrl = `${siteUrl}/${slug}/`;
    } else {
      listingUrl = `${siteUrl}/listing/${slug}/`;
    }

    console.log('✅ Publicación completada exitosamente');
    return {
      success: true,
      postId: createdPost.id,
      message: `Listing published successfully! Post ID: ${createdPost.id}`,
      url: listingUrl
    };

  } catch (error) {
    console.error('❌ Error durante publicación:', error);
    return {
      success: false,
      message: `Publication failed: ${error}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
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
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
    
    const amenityEndpoints = [
      'property_feature',
      'listing_feature', 
      'fave_property_feature',
      'homey_feature'
    ];
    
    let taxonomyEndpoint = '';
    
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
    
    const taxonomiesUrl = `${siteUrl}/wp-json/wp/v2/${taxonomyEndpoint}`;
    const response = await fetch(taxonomiesUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (response.ok) {
      const existingFeatures = await response.json();
      const amenityIds: number[] = [];

      for (const amenity of amenities) {
        const existingFeature = existingFeatures.find((f: any) => 
          f.name.toLowerCase() === amenity.toLowerCase()
        );

        if (existingFeature) {
          amenityIds.push(existingFeature.id);
          console.log(`✅ Amenidad existente encontrada: ${amenity} (ID: ${existingFeature.id})`);
        } else {
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

const forceAssignHomeyMetadata = async (
  siteUrl: string, 
  auth: string, 
  postId: number, 
  metadata: Record<string, any>,
  usedEndpoint: string
): Promise<void> => {
  console.log('🔄 Forzando asignación individual de metadatos críticos...');
  
  // Critical metadata fields that MUST be set
  const criticalFields = {
    'homey_listings_images': metadata['homey_listings_images'],
    'fave_property_price': metadata['fave_property_price'],
    'fave_property_guests': metadata['fave_property_guests'],
    'fave_property_bedrooms': metadata['fave_property_bedrooms'],
    'fave_property_bathrooms': metadata['fave_property_bathrooms'],
    'fave_property_location': metadata['fave_property_location'],
    'fave_property_address': metadata['fave_property_address']
  };
  
  for (const [key, value] of Object.entries(criticalFields)) {
    if (value !== undefined && value !== null) {
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
          console.log(`✅ Metadata crítico ${key} asignado: ${value}`);
        } else {
          console.log(`❌ Error asignando metadata crítico ${key}:`, response.status);
        }
      } catch (error) {
        console.log(`❌ Error asignando metadata crítico ${key}:`, error);
      }
    }
  }
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
    <li><strong>Price per night:</strong> $${listingData.price}</li>
  </ul>
  
  <h3>Amenities</h3>
  <ul>
    ${listingData.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
  </ul>
</div>
  `.trim();
};
