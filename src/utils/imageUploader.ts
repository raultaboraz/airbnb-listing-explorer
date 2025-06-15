
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
    console.log('🖼️ Asignando imágenes a galería del listing...');
    
    if (imageIds.length === 0) {
      console.log('⚠️ No hay imágenes para asignar');
      return;
    }

    // Method 1: Update post meta directly
    const metaUpdates = [
      { key: 'fave_property_images', value: imageIds.join(',') },
      { key: 'fave_property_gallery', value: imageIds.join(',') },
      { key: '_property_gallery', value: imageIds.join(',') }
    ];

    for (const meta of metaUpdates) {
      try {
        const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}/meta`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meta)
        });
        
        if (response.ok) {
          console.log(`✅ Meta ${meta.key} asignado con ${imageIds.length} imágenes`);
        }
      } catch (error) {
        console.log(`❌ Error asignando meta ${meta.key}:`, error);
      }
    }

    // Method 2: Update post directly with gallery
    const postUpdateUrl = usedEndpoint === 'posts' ? 
      `${siteUrl}/wp-json/wp/v2/posts/${postId}` : 
      `${siteUrl}/wp-json/wp/v2/${usedEndpoint}/${postId}`;

    try {
      const updateResponse = await fetch(postUpdateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured_media: imageIds[0] || 0,
          meta: {
            'fave_property_images': imageIds.join(','),
            'fave_property_gallery': imageIds.join(','),
            '_property_gallery': imageIds.join(',')
          }
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Galería de imágenes asignada al listing');
      }
    } catch (error) {
      console.log('❌ Error actualizando galería del post:', error);
    }

  } catch (error) {
    console.error('❌ Error asignando imágenes a galería:', error);
  }
};
