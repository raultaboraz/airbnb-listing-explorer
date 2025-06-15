
import { HomeyListingData } from '@/types/wordpress';

export const createHomeyMetadata = (listingData: HomeyListingData, uploadedImageIds: number[]) => {
  console.log('🏠 Creando metadatos completos de Homey...');
  
  // Use the clean price number (already extracted)
  const priceNumber = listingData.price || '0';
  
  // Ensure location is always included
  const location = listingData.location || 'Location not specified';
  
  console.log('📋 Metadatos a crear:');
  console.log('- Precio:', priceNumber);
  console.log('- Ubicación:', location);
  console.log('- Habitaciones:', listingData.bedrooms);
  console.log('- Baños:', listingData.bathrooms);
  console.log('- Huéspedes:', listingData.guests);
  console.log('- Imágenes galería:', uploadedImageIds.length);

  // Comprehensive Homey metadata mapping
  const metadata = {
    // Core Homey fields
    'fave_property_price': priceNumber,
    'fave_property_price_postfix': 'per night',
    'fave_property_bedrooms': listingData.bedrooms?.toString() || '1',
    'fave_property_bathrooms': listingData.bathrooms?.toString() || '1',
    'fave_property_guests': listingData.guests?.toString() || '2',
    'fave_property_rooms': listingData.bedrooms?.toString() || '1',
    
    // Location fields - VERY IMPORTANT
    'fave_property_address': location,
    'fave_property_location': location,
    'fave_property_map_address': location,
    'fave_property_city': location.split(',')[0]?.trim() || location,
    
    // Property details
    'fave_property_type': listingData.propertyType || 'apartment',
    'fave_property_status': 'for-rent',
    'fave_property_listing_type': 'rent',
    
    // Gallery images
    'fave_property_images': uploadedImageIds.join(','),
    'property_gallery': uploadedImageIds.join(','),
    'homey_gallery': uploadedImageIds.join(','),
    
    // Additional Homey-specific fields
    'property_bedrooms': listingData.bedrooms?.toString() || '1',
    'property_bathrooms': listingData.bathrooms?.toString() || '1',
    'property_guests': listingData.guests?.toString() || '2',
    'property_price': priceNumber,
    'property_location': location,
    'property_address': location,
    
    // Alternative field names that some Homey themes use
    'homey_property_price': priceNumber,
    'homey_property_bedrooms': listingData.bedrooms?.toString() || '1',
    'homey_property_bathrooms': listingData.bathrooms?.toString() || '1',
    'homey_property_guests': listingData.guests?.toString() || '2',
    'homey_property_location': location,
    'homey_property_address': location,
    
    // Booking and availability
    'fave_property_booking': 'yes',
    'fave_property_instant_booking': 'no',
    'fave_property_check_in_time': '15:00',
    'fave_property_check_out_time': '11:00',
    
    // SEO and display
    'fave_featured': '0',
    'fave_agent_display_option': 'none',
    
    // Currency
    'fave_currency': 'USD',
    'fave_currency_symbol': '$'
  };

  console.log('✅ Metadatos de Homey creados:', Object.keys(metadata).length, 'campos');
  return metadata;
};
