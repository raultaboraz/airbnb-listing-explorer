
import { ScrapingData } from '@/types/scraping';

export const generateZipFile = async (data: ScrapingData): Promise<void> => {
  // Create a simplified ZIP-like structure using browser APIs
  const files: { [key: string]: string | Blob } = {};

  // Generate listing data JSON
  const listingData = {
    title: data.title,
    description: data.description,
    guests: data.guests,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    price: data.price,
    location: data.location,
    extractedAt: data.extractedAt
  };

  files['listing-data.json'] = JSON.stringify(listingData, null, 2);

  // Generate reviews JSON
  files['reviews.json'] = JSON.stringify(data.reviews, null, 2);

  // Generate amenities text file
  files['amenities.txt'] = data.amenities.join('\n');

  // For demo purposes, we'll create a simple download of the JSON data
  // In a real implementation, you would use a library like JSZip
  const dataStr = JSON.stringify({
    ...listingData,
    amenities: data.amenities,
    reviews: data.reviews,
    images: data.images,
    note: "This is a demo version. In production, images would be downloaded and included."
  }, null, 2);

  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `airbnb-listing-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);

  console.log('Download initiated for Airbnb listing data');
};
