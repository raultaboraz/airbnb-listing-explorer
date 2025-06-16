
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
    console.log('🖼️ Asignando galería completa de Homey...');
    
    if (imageIds.length === 0) {
      console.log('⚠️ No hay imágenes para asignar');
      return;
    }

    console.log(`📋 Asignando ${imageIds.length} imágenes al listing ID: ${postId}`);
    console.log('🔗 IDs de imágenes:', imageIds);

    // Update the listing with gallery metadata using the correct endpoint
    const updateUrl = usedEndpoint === 'posts' ? 
      `${siteUrl}/wp-json/wp/v2/posts/${postId}` : 
      `${siteUrl}/wp-json/wp/v2/${usedEndpoint}/${postId}`;

    // Method 1: Update using the listing endpoint with meta fields
    const galleryMetadata = {
      homey_listings_images: imageIds,
      fave_property_images: imageIds,
      property_gallery: imageIds,
      listing_gallery: imageIds,
      _property_gallery: imageIds
    };

    console.log('📝 Actualizando metadatos de galería:', galleryMetadata);

    const metaResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meta: galleryMetadata,
        featured_media: imageIds[0]
      })
    });

    if (metaResponse.ok) {
      console.log('✅ Metadatos de galería asignados correctamente');
    } else {
      const errorText = await metaResponse.text();
      console.log('⚠️ Error en asignación de metadatos:', metaResponse.status, errorText);
    }

    // Method 2: Try using WordPress meta API directly
    for (const [metaKey, metaValue] of Object.entries(galleryMetadata)) {
      try {
        const directMetaResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}/meta`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: metaKey,
            value: metaValue
          })
        });

        if (directMetaResponse.ok) {
          console.log(`✅ Meta directo ${metaKey} asignado`);
        } else {
          console.log(`❌ Error meta directo ${metaKey}:`, directMetaResponse.status);
        }
      } catch (error) {
        console.log(`❌ Error asignando meta ${metaKey}:`, error);
      }
    }

    console.log('✅ Proceso de asignación de galería completado');

  } catch (error) {
    console.error('❌ Error asignando imágenes a galería de Homey:', error);
  }
};
