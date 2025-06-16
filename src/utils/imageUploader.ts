
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
    console.log('🖼️ Asignando imágenes a galería de Homey Listing...');
    
    if (imageIds.length === 0) {
      console.log('⚠️ No hay imágenes para asignar');
      return;
    }

    console.log(`📋 Asignando ${imageIds.length} imágenes al listing ID: ${postId}`);
    console.log('🔗 IDs de imágenes:', imageIds);

    // Method 1: Assign Homey gallery field directly
    const homeyGalleryField = 'homey_listings_images';
    
    try {
      // First, try to update the homey_listings_images field with the array of image IDs
      const homeyGalleryResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meta: {
            [homeyGalleryField]: imageIds
          }
        })
      });

      if (homeyGalleryResponse.ok) {
        console.log(`✅ Campo ${homeyGalleryField} asignado con ${imageIds.length} imágenes`);
      } else {
        console.log(`⚠️ Error asignando ${homeyGalleryField}:`, homeyGalleryResponse.status);
      }
    } catch (error) {
      console.log(`❌ Error actualizando ${homeyGalleryField}:`, error);
    }

    // Method 2: Try alternative Homey gallery field names
    const alternativeFields = [
      'fave_property_images',
      'property_gallery',
      'listing_gallery',
      '_property_gallery'
    ];

    for (const fieldName of alternativeFields) {
      try {
        const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            meta: {
              [fieldName]: imageIds
            }
          })
        });
        
        if (response.ok) {
          console.log(`✅ Campo alternativo ${fieldName} asignado`);
        }
      } catch (error) {
        console.log(`❌ Error asignando campo ${fieldName}:`, error);
      }
    }

    // Method 3: Set featured image
    try {
      const featuredImageResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured_media: imageIds[0]
        })
      });

      if (featuredImageResponse.ok) {
        console.log(`✅ Imagen destacada asignada: ${imageIds[0]}`);
      }
    } catch (error) {
      console.log('❌ Error asignando imagen destacada:', error);
    }

    console.log('✅ Proceso de asignación de galería completado');

  } catch (error) {
    console.error('❌ Error asignando imágenes a galería de Homey:', error);
  }
};
