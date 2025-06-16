import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UrlInput } from './UrlInput';
import { ProgressTracker } from './ProgressTracker';
import { DataDisplay } from './DataDisplay';
import { DownloadSection } from './DownloadSection';
import { WordPressPublisher } from './WordPressPublisher';
import { ManualDataEntry } from './ManualDataEntry';
import { ScrapingData } from '@/types/scraping';
import { useToast } from '@/hooks/use-toast';
import { translateListingData } from '@/utils/translator';
import { scrapeAirbnbListing } from '@/utils/advancedAirbnbScraper';
import { scrapeWithApify } from '@/utils/apifyScraper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { ScrapingMethod } from './ScrapingMethodSelector';

export const AirbnbScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [scrapingData, setScrapingData] = useState<ScrapingData | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentMethod, setCurrentMethod] = useState<ScrapingMethod>('internal');
  const { toast } = useToast();

  const resetData = () => {
    console.log('🧹 Limpiando datos previos...');
    setScrapingData(null);
    setProgress(0);
    setCurrentStep('');
    setIsLoading(false);
    setIsSimulated(false);
    setExtractionMethod('');
    setShowManualEntry(false);
  };

  const extractData = async (url: string, method: ScrapingMethod, apifyKey?: string) => {
    resetData();
    setCurrentUrl(url);
    setCurrentMethod(method);
    
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Iniciando extracción...');
    
    try {
      console.log(`🚀 Iniciando extracción de Airbnb para: ${url} usando método: ${method}`);
      
      let scrapingResult;
      
      if (method === 'apify' && apifyKey) {
        // Usar Apify para extracción premium
        setCurrentStep('Conectando con Apify...');
        const apifyResult = await scrapeWithApify(url, { apiKey: apifyKey }, (progress, step) => {
          console.log(`📊 Apify - Progreso: ${progress}% - ${step}`);
          setProgress(progress);
          setCurrentStep(step);
        });
        
        if (!apifyResult.success || !apifyResult.data) {
          throw new Error('Falló la extracción con Apify');
        }
        
        scrapingResult = {
          success: true,
          data: apifyResult.data,
          isSimulated: false,
          method: 'apify',
          cost: apifyResult.creditsUsed
        };
      } else {
        // Usar sistema interno
        scrapingResult = await scrapeAirbnbListing(url, (progress, step) => {
          console.log(`📊 Sistema interno - Progreso: ${progress}% - ${step}`);
          setProgress(progress);
          setCurrentStep(step);
        });
      }

      if (!scrapingResult.success || !scrapingResult.data) {
        throw new Error('Falló la extracción');
      }

      setProgress(95);
      setCurrentStep('Traduciendo al inglés...');

      console.log('🌐 Traduciendo datos al inglés...');
      const translatedData = await translateListingData(scrapingResult.data);

      setProgress(100);
      setCurrentStep(method === 'apify' ? 
        '¡Datos reales extraídos con Apify!' : 
        (scrapingResult.isSimulated ? '¡Datos simulados generados!' : '¡Extracción real completada!')
      );
      
      setScrapingData(translatedData);
      setIsSimulated(scrapingResult.isSimulated || false);
      setExtractionMethod(scrapingResult.method || method);
      
      console.log('✅ Proceso completado:', {
        title: translatedData.title,
        images: translatedData.images.length,
        amenities: translatedData.amenities.length,
        price: translatedData.price,
        method: scrapingResult.method || method,
        isSimulated: scrapingResult.isSimulated,
        cost: scrapingResult.cost
      });
      
      if (method === 'apify') {
        toast({
          title: "✅ ¡Datos Reales Extraídos con Apify!",
          description: `Extracción exitosa. Créditos usados: ${scrapingResult.cost || 'N/A'}`,
        });
      } else if (scrapingResult.isSimulated) {
        toast({
          title: "⚠️ Datos Simulados Generados",
          description: "Airbnb bloquea la extracción automática. Se generaron datos de demostración. Usa Apify para datos reales.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ ¡Datos Reales Extraídos!",
          description: `Extracción exitosa usando: ${scrapingResult.method}`,
        });
      }

    } catch (error) {
      console.error('❌ Error durante la extracción:', error);
      setProgress(0);
      setCurrentStep('');
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (method === 'apify') {
        toast({
          title: "❌ Error en Apify",
          description: `Error al extraer con Apify: ${errorMessage}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Extracción Bloqueada",
          description: "Airbnb bloquea todas las extracciones automáticas. Usa Apify para datos reales.",
          variant: "destructive",
        });
      }
      
      if (method !== 'apify') {
        setShowManualEntry(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualDataSubmit = async (manualData: ScrapingData) => {
    try {
      setProgress(50);
      setCurrentStep('Procesando datos manuales...');
      
      const translatedData = await translateListingData(manualData);
      
      setProgress(100);
      setCurrentStep('¡Datos manuales procesados!');
      
      setScrapingData(translatedData);
      setIsSimulated(false);
      setExtractionMethod('manual');
      setShowManualEntry(false);
      
      toast({
        title: "✅ Datos Manuales Procesados",
        description: "Los datos reales han sido procesados y traducidos exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error al Procesar Datos Manuales",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Advertencia actualizada */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>⚠️ IMPORTANTE:</strong> Airbnb bloquea las extracciones automáticas gratuitas. 
          Usa <strong>Apify Premium</strong> para datos reales o <strong>entrada manual</strong> como alternativa.
        </AlertDescription>
      </Alert>

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
      
      {showManualEntry && !scrapingData && (
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>💡 Entrada Manual Recomendada:</strong> Para obtener datos reales del listing, 
              introduce la información manualmente desde la página de Airbnb.
            </AlertDescription>
          </Alert>
          
          <ManualDataEntry 
            onDataSubmit={handleManualDataSubmit}
            initialUrl={currentUrl}
          />
          
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowManualEntry(false)}
              variant="outline"
              size="sm"
            >
              Ocultar Entrada Manual
            </Button>
          </div>
        </div>
      )}
      
      {scrapingData && isSimulated && currentMethod === 'internal' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>🎭 DATOS SIMULADOS:</strong> Estos son datos de demostración completamente inventados. 
            NO son del listing real. Para datos reales, usa Apify Premium o entrada manual.
          </AlertDescription>
        </Alert>
      )}
      
      {scrapingData && !isSimulated && (
        <Alert className="border-green-200 bg-green-50">
          <RefreshCw className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>✅ Datos Reales:</strong> {
              extractionMethod === 'apify' ? 'Extraídos con Apify Premium' :
              extractionMethod === 'manual' ? 'Introducidos manualmente' : 
              `Extraídos usando: ${extractionMethod}`
            }
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
      
      {!scrapingData && !isLoading && !showManualEntry && (
        <div className="text-center py-8">
          <Button 
            onClick={() => setShowManualEntry(true)}
            variant="outline"
            className="border-blue-300 hover:border-blue-400"
          >
            <Settings className="h-4 w-4 mr-2" />
            Usar Entrada Manual (Alternativa)
          </Button>
        </div>
      )}
    </div>
  );
};
