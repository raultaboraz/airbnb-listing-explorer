
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
    console.log('🧹 Limpiando datos previos...');
    setScrapingData(null);
    setProgress(0);
    setCurrentStep('');
    setIsLoading(false);
  };

  const extractData = async (url: string) => {
    // Limpiar datos previos primero
    resetData();
    
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Iniciando extracción...');
    
    try {
      console.log('🚀 Iniciando extracción real de datos de Airbnb para:', url);
      
      // Scraping real de Airbnb con múltiples proxies y retry logic
      const scrapingResult = await scrapeAirbnbListing(url, (progress, step) => {
        console.log(`📊 Progreso: ${progress}% - ${step}`);
        setProgress(progress);
        setCurrentStep(step);
      });

      if (!scrapingResult.success || !scrapingResult.data) {
        throw new Error(scrapingResult.error || 'Falló la extracción de datos de Airbnb');
      }

      setProgress(95);
      setCurrentStep('Traduciendo al inglés...');

      // Traducir datos al inglés
      console.log('🌐 Traduciendo datos al inglés...');
      const translatedData = await translateListingData(scrapingResult.data);

      setProgress(100);
      setCurrentStep('¡Extracción completada exitosamente!');
      
      setScrapingData(translatedData);
      
      console.log('✅ Extracción completada:', {
        title: translatedData.title,
        images: translatedData.images.length,
        amenities: translatedData.amenities.length,
        price: translatedData.price,
        description: translatedData.description.length + ' caracteres'
      });
      
      toast({
        title: "¡Extracción Completa!",
        description: `Datos extraídos exitosamente para el listing ${translatedData.listingId} con ${translatedData.images.length} imágenes`,
      });

    } catch (error) {
      console.error('❌ Error durante la extracción:', error);
      setProgress(0);
      setCurrentStep('');
      
      toast({
        title: "Extracción Fallida",
        description: error instanceof Error ? error.message : "Hubo un error extrayendo los datos del listing. Intenta de nuevo en unos minutos.",
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
