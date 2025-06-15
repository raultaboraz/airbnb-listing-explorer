
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

  // Create separate reviews file
  const reviewsText = `Reviews for ${data.title}
Total Reviews: ${data.reviews.count}
Average Rating: ${data.reviews.rating}/5 stars

Recent Reviews:
${data.reviews.recent.map(review => `
Author: ${review.author}
Rating: ${review.rating}/5 stars
Comment: ${review.text}
${'='.repeat(50)}
`).join('')}`;

  zip.file('reviews.txt', reviewsText);

  // Create images folder and download all images as JPG files
  const imagesFolder = zip.folder('images');
  
  if (imagesFolder && data.images.length > 0) {
    console.log(`Starting download of ${data.images.length} images...`);
    
    const imagePromises = data.images.map(async (imageUrl, index) => {
      try {
        console.log(`Downloading image ${index + 1}/${data.images.length}: ${imageUrl}`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        
        // Always save as JPG with proper filename (padded numbers for sorting)
        const fileName = `image-${String(index + 1).padStart(3, '0')}.jpg`;
        imagesFolder.file(fileName, blob);
        
        console.log(`Successfully downloaded and saved: ${fileName}`);
        return true;
      } catch (error) {
        console.error(`Failed to download image ${index + 1}:`, error);
        // Add a text file noting the failed download
        const errorFileName = `image-${String(index + 1).padStart(3, '0')}-failed.txt`;
        imagesFolder.file(errorFileName, `Failed to download: ${imageUrl}\nError: ${error}`);
        return false;
      }
    });

    // Wait for all image downloads to complete
    const results = await Promise.all(imagePromises);
    const successCount = results.filter(result => result).length;
    console.log(`Image download complete: ${successCount}/${data.images.length} images successfully downloaded`);
  }

  // Generate and download ZIP file
  console.log('Generating ZIP file...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `airbnb-listing-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  console.log('ZIP file download initiated');
};
