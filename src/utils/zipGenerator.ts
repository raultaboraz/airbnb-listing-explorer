
import JSZip from 'jszip';
import { ScrapingData } from '@/types/scraping';

export const generateZipFile = async (data: ScrapingData): Promise<void> => {
  const zip = new JSZip();

  // Create description text file
  const descriptionText = `${data.title}

Location: ${data.location}
Price: ${data.price}
Guests: ${data.guests} | Bedrooms: ${data.bedrooms} | Bathrooms: ${data.bathrooms}

Description:
${data.description}

Amenities:
${data.amenities.map(amenity => `• ${amenity}`).join('\n')}

Reviews (${data.reviews.count} total, ${data.reviews.rating}/5 stars):
${data.reviews.recent.map(review => `${review.author} (${review.rating}★): ${review.text}`).join('\n\n')}

Extracted on: ${new Date(data.extractedAt).toLocaleString()}`;

  zip.file('listing-description.txt', descriptionText);

  // Add JSON data file
  const jsonData = {
    title: data.title,
    description: data.description,
    guests: data.guests,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    price: data.price,
    location: data.location,
    amenities: data.amenities,
    reviews: data.reviews,
    extractedAt: data.extractedAt
  };
  zip.file('listing-data.json', JSON.stringify(jsonData, null, 2));

  // Create images folder and download all images
  const imagesFolder = zip.folder('images');
  
  if (imagesFolder && data.images.length > 0) {
    const imagePromises = data.images.map(async (imageUrl, index) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
        imagesFolder.file(`image-${index + 1}.${extension}`, blob);
      } catch (error) {
        console.error(`Failed to download image ${index + 1}:`, error);
        // Add a text file noting the failed download
        imagesFolder.file(`image-${index + 1}-failed.txt`, `Failed to download: ${imageUrl}`);
      }
    });

    await Promise.all(imagePromises);
  }

  // Generate and download ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `airbnb-listing-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
