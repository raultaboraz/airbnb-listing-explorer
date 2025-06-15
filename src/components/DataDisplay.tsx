
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrapingData } from '@/types/scraping';

interface DataDisplayProps {
  data: ScrapingData;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Extracted Data</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{data.title}</h3>
              <p className="text-gray-600 mt-2">{data.description}</p>
              {data.aboutSpace && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">About this space:</h4>
                  <p className="text-gray-600 text-sm">{data.aboutSpace}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Guests:</span> {data.guests}
              </div>
              <div>
                <span className="font-medium">Bedrooms:</span> {data.bedrooms}
              </div>
              <div>
                <span className="font-medium">Bathrooms:</span> {data.bathrooms}
              </div>
              <div>
                <span className="font-medium">Price:</span> {data.price}
              </div>
            </div>
            
            <div>
              <span className="font-medium">Location:</span>
              <p className="text-gray-600">{data.location}</p>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({data.reviews.recent.length} shown)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-green-600">
                {data.reviews.rating}/5
              </div>
              <div className="text-sm text-gray-600">
                Based on {data.reviews.count} reviews
              </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.reviews.recent.map((review, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{review.author}</span>
                    <span className="text-yellow-500">★{review.rating}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{review.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Images Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Images ({data.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {data.images.slice(0, 4).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Listing image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
            {data.images.length > 4 && (
              <p className="text-sm text-gray-500 mt-2">
                +{data.images.length - 4} more images in download
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
