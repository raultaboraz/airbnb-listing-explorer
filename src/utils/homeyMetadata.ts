
import { HomeyListingData } from '@/types/wordpress';

export const generateHomeyMetadata = (listingData: HomeyListingData) => {
  console.log('🏠 Generando metadatos específicos de Homey...');
  
  // Clean price - ensure it's only numbers
  const cleanPrice = listingData.price.replace(/[^\d]/g, '');
  
  const metadata = {
    // Basic Homey fields
    'homey_listing_type': 'entire_place',
    'homey_listing_status': 'publish',
    'homey_property_type': listingData.propertyType || 'apartment',
    
    // Price fields (multiple variants for compatibility)
    'homey_price': cleanPrice,
    'homey_listing_price': cleanPrice,
    'homey_price_per_night': cleanPrice,
    'homey_nightly_price': cleanPrice,
    'fave_property_price': cleanPrice,
    'property_price': cleanPrice,
    'listing_price': cleanPrice,
    
    // Capacity fields (multiple variants)
    'homey_guests': listingData.guests.toString(),
    'homey_max_guests': listingData.guests.toString(),
    'homey_listing_guests': listingData.guests.toString(),
    'fave_property_guests': listingData.guests.toString(),
    'property_guests': listingData.guests.toString(),
    'max_guests': listingData.guests.toString(),
    
    // Bedroom fields
    'homey_bedrooms': listingData.bedrooms.toString(),
    'homey_listing_bedrooms': listingData.bedrooms.toString(),
    'fave_property_bedrooms': listingData.bedrooms.toString(),
    'property_bedrooms': listingData.bedrooms.toString(),
    'bedrooms': listingData.bedrooms.toString(),
    'rooms': listingData.bedrooms.toString(),
    
    // Bathroom fields
    'homey_bathrooms': listingData.bathrooms.toString(),
    'homey_listing_bathrooms': listingData.bathrooms.toString(),
    'fave_property_bathrooms': listingData.bathrooms.toString(),
    'property_bathrooms': listingData.bathrooms.toString(),
    'bathrooms': listingData.bathrooms.toString(),
    
    // Location fields
    'homey_listing_location': listingData.location,
    'homey_property_address': listingData.location,
    'fave_property_address': listingData.location,
    'property_address': listingData.location,
    'listing_location': listingData.location,
    
    // Status and availability
    'homey_listing_availability': 'available',
    'homey_booking_status': 'instant',
    'property_status': listingData.status || 'publish',
    
    // Additional useful fields
    'homey_min_stay': '1',
    'homey_max_stay': '365',
    'homey_check_in': '15:00',
    'homey_check_out': '11:00',
    
    // SEO and display
    'homey_featured': '0',
    'homey_verified': '1'
  };

  console.log('📋 Metadatos de Homey generados:', Object.keys(metadata).length, 'campos');
  console.log('💰 Precio limpio asignado:', cleanPrice);
  console.log('👥 Huéspedes:', listingData.guests);
  console.log('🛏️ Habitaciones:', listingData.bedrooms);
  console.log('🚿 Baños:', listingData.bathrooms);
  
  return metadata;
};

export const forceAssignHomeyMetadata = async (
  siteUrl: string,
  auth: string,
  postId: number,
  metadata: Record<string, string>,
  usedEndpoint: string
): Promise<void> => {
  console.log('🔧 Forzando asignación de metadatos de Homey...');
  
  // Method 1: Bulk meta assignment using WordPress meta API
  const metaEntries = Object.entries(metadata);
  const batchSize = 5; // Process in smaller batches to avoid timeouts
  
  for (let i = 0; i < metaEntries.length; i += batchSize) {
    const batch = metaEntries.slice(i, i + batchSize);
    console.log(`📦 Procesando lote ${Math.floor(i/batchSize) + 1}: ${batch.length} campos`);
    
    for (const [key, value] of batch) {
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
          console.log(`✅ ${key}: ${value}`);
        } else {
          console.log(`❌ Error ${key}:`, response.status);
        }
      } catch (error) {
        console.log(`❌ Error asignando ${key}:`, error);
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('✅ Asignación de metadatos completada');
};
