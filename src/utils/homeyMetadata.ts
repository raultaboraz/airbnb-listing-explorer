
import { HomeyListingData } from '@/types/wordpress';

export const createHomeyMetadata = (listingData: HomeyListingData, uploadedImageIds: number[]) => {
  // Extract numbers from price
  const priceNumber = listingData.price.replace(/[^\d]/g, '');
  
  return {
    // Basic Homey fields
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
    
    // Image Gallery - Critical for Homey
    'fave_property_images': uploadedImageIds.map(id => id.toString()).join(','),
    'fave_property_gallery': uploadedImageIds.map(id => id.toString()).join(','),
    '_property_gallery': uploadedImageIds.map(id => id.toString()).join(','),
    
    // Map configuration
    'fave_property_map': '1',
    'fave_property_map_address': listingData.location,
    
    // Featured settings
    'fave_featured': '1',
    'fave_agent_display_option': 'none',
    
    // Booking configuration
    'fave_property_min_days': '1',
    'fave_property_max_days': '365',
    'fave_property_instant_booking': '0',
    'fave_property_checkin': '15:00',
    'fave_property_checkout': '11:00',
    
    // Property policies
    'fave_property_smoking': '0',
    'fave_property_pets': '0',
    'fave_property_party': '0',
    'fave_property_children': '1',
    
    // Pricing
    'fave_property_weekends': priceNumber,
    'fave_property_weekly_discount': '0',
    'fave_property_monthly_discount': '0',
    
    // Additional fields
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

export const extractCityFromLocation = (location: string): string => {
  return location.split(',')[0].trim();
};

export const extractCountryFromLocation = (location: string): string => {
  const parts = location.split(',');
  return parts[parts.length - 1].trim();
};
