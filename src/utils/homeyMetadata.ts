
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

  // Comprehensive Homey metadata mapping with proper data types
  const metadata = {
    // GALERÍA - Campo principal de Homey
    'homey_listings_images': uploadedImageIds,
    'fave_property_images': uploadedImageIds,
    'property_gallery': uploadedImageIds,
    'listing_gallery': uploadedImageIds,
    '_property_gallery': uploadedImageIds,
    
    // PRECIO - Múltiples formatos para compatibilidad
    'fave_property_price': priceNumber,
    'property_price': priceNumber,
    'homey_property_price': priceNumber,
    'listing_price': priceNumber,
    '_price': priceNumber,
    'price': priceNumber,
    
    // PRECIO - Configuración adicional
    'fave_property_price_postfix': 'per night',
    'fave_currency': 'USD',
    'fave_currency_symbol': '$',
    
    // HABITACIONES
    'fave_property_bedrooms': listingData.bedrooms?.toString() || '1',
    'property_bedrooms': listingData.bedrooms?.toString() || '1',
    'homey_property_bedrooms': listingData.bedrooms?.toString() || '1',
    'listing_bedrooms': listingData.bedrooms?.toString() || '1',
    'bedrooms': listingData.bedrooms?.toString() || '1',
    'fave_property_rooms': listingData.bedrooms?.toString() || '1',
    
    // BAÑOS
    'fave_property_bathrooms': listingData.bathrooms?.toString() || '1',
    'property_bathrooms': listingData.bathrooms?.toString() || '1',
    'homey_property_bathrooms': listingData.bathrooms?.toString() || '1',
    'listing_bathrooms': listingData.bathrooms?.toString() || '1',
    'bathrooms': listingData.bathrooms?.toString() || '1',
    
    // HUÉSPEDES
    'fave_property_guests': listingData.guests?.toString() || '2',
    'property_guests': listingData.guests?.toString() || '2',
    'homey_property_guests': listingData.guests?.toString() || '2',
    'listing_guests': listingData.guests?.toString() || '2',
    'guests': listingData.guests?.toString() || '2',
    'max_guests': listingData.guests?.toString() || '2',
    
    // UBICACIÓN - Múltiples campos
    'fave_property_address': location,
    'fave_property_location': location,
    'fave_property_map_address': location,
    'property_location': location,
    'property_address': location,
    'homey_property_location': location,
    'homey_property_address': location,
    'listing_location': location,
    'listing_address': location,
    'address': location,
    'location': location,
    'fave_property_city': location.split(',')[0]?.trim() || location,
    
    // TIPO DE PROPIEDAD
    'fave_property_type': listingData.propertyType || 'apartment',
    'property_type': listingData.propertyType || 'apartment',
    'homey_property_type': listingData.propertyType || 'apartment',
    'listing_type': listingData.propertyType || 'apartment',
    
    // STATUS
    'fave_property_status': 'for-rent',
    'fave_property_listing_type': 'rent',
    'property_status': 'for-rent',
    'listing_status': 'for-rent',
    
    // BOOKING Y DISPONIBILIDAD
    'fave_property_booking': 'yes',
    'fave_property_instant_booking': 'no',
    'fave_property_check_in_time': '15:00',
    'fave_property_check_out_time': '11:00',
    'property_booking': 'yes',
    'booking_enabled': 'yes',
    
    // SEO Y DISPLAY
    'fave_featured': '0',
    'fave_agent_display_option': 'none'
  };

  console.log('✅ Metadatos de Homey creados:', Object.keys(metadata).length, 'campos');
  console.log('🖼️ Campo principal de galería (homey_listings_images):', uploadedImageIds);
  console.log('💰 Precio configurado:', priceNumber);
  console.log('🏠 Huéspedes configurado:', listingData.guests);
  console.log('🛏️ Habitaciones configurado:', listingData.bedrooms);
  
  return metadata;
};
