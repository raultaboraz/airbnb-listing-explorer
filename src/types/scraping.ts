
export interface Review {
  author: string;
  text: string;
  rating: number;
}

export interface ReviewsData {
  count: number;
  rating: number;
  recent: Review[];
}

export interface ScrapingData {
  title: string;
  description: string;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  price: string;
  location: string;
  amenities: string[];
  reviews: ReviewsData;
  images: string[];
  extractedAt: string;
}
