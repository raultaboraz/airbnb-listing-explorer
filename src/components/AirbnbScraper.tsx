
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
import { scrapeAirbnbListing } from '@/utils/airbnbScraper';

export const AirbnbScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [scrapingData, setScrapingData] = useState<ScrapingData | null>(null);
  const { toast } = useToast();

  const resetData = () => {
    console.log('🧹 Cleaning previous data...');
    setScrapingData(null);
    setProgress(0);
    setCurrentStep('');
    setIsLoading(false);
  };

  const extractData = async (url: string) => {
    // Clear previous data first
    resetData();
    
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Starting extraction...');
    
    try {
      console.log('🚀 Starting real Airbnb data extraction for:', url);
      
      // Real Airbnb scraping
      const scrapingResult = await scrapeAirbnbListing(url, (progress, step) => {
        setProgress(progress);
        setCurrentStep(step);
      });

      if (!scrapingResult.success || !scrapingResult.data) {
        throw new Error(scrapingResult.error || 'Failed to extract data from Airbnb');
      }

      setProgress(95);
      setCurrentStep('Translating to English...');

      // Translate data to English and clean price
      console.log('🌐 Translating data to English...');
      const translatedData = await translateListingData(scrapingResult.data);

      setProgress(100);
      setCurrentStep('Extraction completed successfully!');
      
      setScrapingData(translatedData);
      
      console.log('✅ Extraction completed:', {
        title: translatedData.title,
        images: translatedData.images.length,
        amenities: translatedData.amenities.length,
        price: translatedData.price
      });
      
      toast({
        title: "Extraction Complete!",
        description: `Successfully extracted data for listing ${translatedData.listingId}`,
      });

    } catch (error) {
      console.error('❌ Error during extraction:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "There was an error extracting the listing data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <UrlInput 
        onStartScraping={extractData}
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
