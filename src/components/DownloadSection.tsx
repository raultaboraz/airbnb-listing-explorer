
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileArchive } from 'lucide-react';
import { ScrapingData } from '@/types/scraping';
import { generateZipFile } from '@/utils/zipGenerator';

interface DownloadSectionProps {
  data: ScrapingData;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateZipFile(data);
    } catch (error) {
      console.error('Error generating ZIP file:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileArchive className="h-5 w-5 text-green-600" />
          <span>Download Extracted Data</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Download all extracted data including images, amenities, reviews, and detailed information as a ZIP file.
        </p>
        
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-medium mb-2">ZIP Contents:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• listing-description.txt - Formatted listing description</li>
            <li>• listing-data.json - Complete listing information</li>
            <li>• reviews.txt - All reviews with ratings and comments</li>
            <li>• images/ - All property images as JPG files</li>
          </ul>
        </div>

        <Button 
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Download className="h-4 w-4 mr-2 animate-spin" />
              Generating ZIP file...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download ZIP File
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
