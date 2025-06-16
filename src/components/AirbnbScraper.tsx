
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const AirbnbScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [scrapingData, setScrapingData] = useState<ScrapingData | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const { toast } = useToast();

  const resetData = () => {
    console.log('🧹 Limpiando datos previos...');
    setScrapingData(null);
    setProgress(0);
    setCurrentStep('');
    setIsLoading(false);
    setIsSimulated(false);
  };

  const extractData = async (url: string) => {
    resetData();
    
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Iniciando extracción...');
    
    try {
      console.log('🚀 Iniciando extracción mejorada de datos de Airbnb para:', url);
      
      // Scraping mejorado con fallback a datos simulados
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
      setIsSimulated(scrapingResult.isSimulated || false);
      
      console.log('✅ Extracción completada:', {
        title: translatedData.title,
        images: translatedData.images.length,
        amenities: translatedData.amenities.length,
        price: translatedData.price,
        description: translatedData.description.length + ' caracteres',
        isSimulated: scrapingResult.isSimulated
      });
      
      if (scrapingResult.isSimulated) {
        toast({
          title: "Datos Simulados Generados",
          description: `Se generaron datos realistas debido a problemas de conectividad. Los datos incluyen ${translatedData.images.length} imágenes de ejemplo.`,
        });
      } else {
        toast({
          title: "¡Extracción Real Completa!",
          description: `Datos reales extraídos exitosamente para el listing ${translatedData.listingId} con ${translatedData.images.length} imágenes`,
        });
      }

    } catch (error) {
      console.error('❌ Error durante la extracción:', error);
      setProgress(0);
      setCurrentStep('');
      
      toast({
        title: "Extracción Fallida",
        description: error instanceof Error ? error.message : "Hubo un error extrayendo los datos del listing. Se generarán datos simulados automáticamente.",
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
      
      {scrapingData && isSimulated && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Datos Simulados:</strong> Se generaron datos realistas debido a problemas de conectividad con Airbnb. 
            Los datos son representativos pero no reales. Intenta de nuevo más tarde para obtener datos reales.
          </AlertDescription>
        </Alert>
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
