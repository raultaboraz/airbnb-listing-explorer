
export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  password: string;
}

export interface HomeyListingData {
  title: string;
  description: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  location: string;
  amenities: string[];
  images: string[];
  propertyType: string;
  status: string;
}

export interface PublishResponse {
  success: boolean;
  postId?: number;
  message: string;
  error?: string;
}
