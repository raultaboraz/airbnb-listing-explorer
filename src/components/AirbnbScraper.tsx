
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UrlInput } from './UrlInput';
import { ProgressTracker } from './ProgressTracker';
import { DataDisplay } from './DataDisplay';
import { DownloadSection } from './DownloadSection';
import { WordPressPublisher } from './WordPressPublisher';
import { ScrapingData } from '@/types/scraping';
import { useToast } from '@/hooks/use-toast';
import { translateListingData } from '@/utils/translator';

export const AirbnbScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [scrapingData, setScrapingData] = useState<ScrapingData | null>(null);
  const { toast } = useToast();

  const resetData = () => {
    console.log('🧹 Limpiando datos anteriores...');
    setScrapingData(null);
    setProgress(0);
    setCurrentStep('');
    setIsLoading(false);
  };

  const extractAirbnbId = (url: string): string => {
    const match = url.match(/\/rooms\/(\d+)/);
    return match ? match[1] : '';
  };

  const simulateExtraction = async (url: string) => {
    // Clear previous data first
    resetData();
    
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Starting extraction...');
    
    try {
      const listingId = extractAirbnbId(url);
      
      // Simulate data extraction with progress updates
      setProgress(10);
      setCurrentStep('Extracting basic information...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(30);
      setCurrentStep('Getting property details...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProgress(50);
      setCurrentStep('Collecting amenities...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(70);
      setCurrentStep('Downloading images...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProgress(90);
      setCurrentStep('Processing reviews...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate extracted data (this would come from actual scraping)
      const extractedData: ScrapingData = {
        listingId: listingId,
        url: url,
        title: 'Beautiful Apartment in Downtown',
        description: 'Este es un hermoso apartamento ubicado en el centro de la ciudad con todas las comodidades necesarias para una estancia perfecta.',
        aboutSpace: 'El espacio cuenta con una decoración moderna y elegante, perfecta para viajeros de negocios o turistas.',
        guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        price: '$150/night',
        location: 'Madrid, España',
        amenities: [
          'WiFi',
          'Air conditioning',
          'Kitchen',
          'Washing machine',
          'TV',
          'Parking',
          'Pool'
        ],
        reviews: {
          count: 127,
          rating: 4.8,
          recent: [
            {
              author: 'Sarah Johnson',
              text: 'Amazing place to stay! Very clean and comfortable.',
              rating: 5
            },
            {
              author: 'Miguel Rodriguez',
              text: 'Excelente ubicación y el anfitrión muy amable.',
              rating: 5
            },
            {
              author: 'Emma Wilson',
              text: 'Perfect for our city break. Highly recommended!',
              rating: 4
            }
          ]
        },
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600',
          'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600'
        ],
        extractedAt: new Date().toISOString()
      };

      // Translate data to English and clean price
      console.log('🌐 Traduciendo datos al inglés...');
      setCurrentStep('Translating to English...');
      const translatedData = await translateListingData(extractedData);

      setProgress(100);
      setCurrentStep('Extraction completed successfully!');
      
      setScrapingData(translatedData);
      
      toast({
        title: "Extraction Complete!",
        description: `Successfully extracted data for listing ${listingId}`,
      });

    } catch (error) {
      console.error('Error during extraction:', error);
      toast({
        title: "Extraction Failed",
        description: "There was an error extracting the listing data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <UrlInput 
        onStartScraping={simulateExtraction}
        disabled={isLoading}
        onReset={resetData}
        showReset={scrapingData !== null}
      />
      
      {isLoading && (
        <ProgressTracker 
          progress={progress}
          currentStep={currentStep}
          isComplete={progress === 100}
        />
      )}
      
      {scrapingData && (
        <div className="space-y-6">
          <DataDisplay data={scrapingData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DownloadSection data={scrapingData} />
            <WordPressPublisher data={scrapingData} />
          </div>
        </div>
      )}
    </div>
  );
};
