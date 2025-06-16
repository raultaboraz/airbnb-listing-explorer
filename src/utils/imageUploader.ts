
export const uploadImages = async (siteUrl: string, auth: string, images: string[]): Promise<number[]> => {
  console.log(`📸 Subiendo ${images.length} imágenes...`);
  
  const uploadedIds: number[] = [];
  const mediaUrl = `${siteUrl}/wp-json/wp/v2/media`;
  
  // Upload ALL images, not just first 10
  for (let i = 0; i < images.length; i++) {
    try {
      console.log(`📸 Subiendo imagen ${i + 1}/${images.length}: ${images[i]}`);
      
      // Download image from URL
      const imageResponse = await fetch(images[i]);
      if (!imageResponse.ok) {
        console.error(`❌ Error descargando imagen ${i + 1}: ${imageResponse.status}`);
        continue;
      }
      
      const imageBlob = await imageResponse.blob();
      const fileName = `listing-image-${Date.now()}-${i + 1}.jpg`;
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', imageBlob, fileName);
      formData.append('alt_text', `Property image ${i + 1}`);
      formData.append('caption', `Listing gallery image ${i + 1}`);
      
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
  
  console.log(`✅ ${uploadedIds.length}/${images.length} imágenes subidas exitosamente`);
  return uploadedIds;
};

export const assignImagesToListing = async (
  siteUrl: string,
  auth: string,
  postId: number,
  imageIds: number[],
  usedEndpoint: string
): Promise<void> => {
  try {
    console.log('🖼️ Asignando galería de Homey...');
    
    if (imageIds.length === 0) {
      console.log('⚠️ No hay imágenes para asignar');
      return;
    }

    console.log(`📋 Asignando ${imageIds.length} imágenes al listing ID: ${postId}`);
    console.log('🔗 IDs de imágenes:', imageIds);

    // Method 1: Direct meta update using WordPress meta API
    console.log('🔄 Método 1: Asignando homey_listings_images directamente...');
    
    const metaResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}/meta`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'homey_listings_images',
        value: imageIds
      })
    });

    if (metaResponse.ok) {
      console.log('✅ homey_listings_images asignado correctamente');
    } else {
      const errorText = await metaResponse.text();
      console.log('⚠️ Error asignando homey_listings_images:', metaResponse.status, errorText);
    }

    // Method 2: Try alternative field names
    const alternativeFields = [
      'fave_property_images',
      'property_gallery',
      'listing_gallery',
      '_property_gallery'
    ];

    for (const fieldName of alternativeFields) {
      try {
        const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}/meta`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: fieldName,
            value: imageIds
          })
        });

        if (altResponse.ok) {
          console.log(`✅ ${fieldName} asignado correctamente`);
        } else {
          console.log(`❌ Error asignando ${fieldName}:`, altResponse.status);
        }
      } catch (error) {
        console.log(`❌ Error asignando ${fieldName}:`, error);
      }
    }

    console.log('✅ Proceso de asignación de galería completado');

  } catch (error) {
    console.error('❌ Error asignando imágenes a galería de Homey:', error);
  }
};
