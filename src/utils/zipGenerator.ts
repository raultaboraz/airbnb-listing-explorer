
import { ScrapingData } from '@/types/scraping';

export const generateZipFile = async (data: ScrapingData): Promise<void> => {
  // For now, we'll create a simple JSON download
  // In a real implementation, this would create a proper ZIP file with images
  const jsonData = {
    ...data,
    // Convert to a more readable format
    exportedData: {
      basicInfo: {
        title: data.title,
        description: data.description,
        guests: data.guests,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        price: data.price,
        location: data.location,
        extractedAt: data.extractedAt
      },
      amenities: data.amenities,
      reviews: data.reviews,
      images: data.images
    }
  };

  // Create and download JSON file
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `airbnb-listing-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};
