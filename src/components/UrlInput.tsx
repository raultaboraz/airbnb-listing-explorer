
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader } from 'lucide-react';
import { ScrapingMethodSelector, ScrapingMethod } from './ScrapingMethodSelector';

interface UrlInputProps {
  onStartScraping: (url: string, method: ScrapingMethod) => void;
  disabled: boolean;
  onReset: () => void;
  showReset: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ 
  onStartScraping, 
  disabled, 
  onReset, 
  showReset 
}) => {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [urlType, setUrlType] = useState<'airbnb' | 'vrbo' | 'unknown'>('unknown');
  const [scrapingMethod, setScrapingMethod] = useState<ScrapingMethod>('simulated');

  const validateUrl = (inputUrl: string) => {
    const airbnbRegex = /^https:\/\/(www\.)?airbnb\.(com|ca|co\.uk|fr|de|es|it|com\.au|jp)\/rooms\/\d+/;
    const vrboRegex = /^https:\/\/(www\.)?vrbo\.com\/[^\/]+\/p\d+/;
    
    const isAirbnb = airbnbRegex.test(inputUrl);
    const isVrbo = vrboRegex.test(inputUrl);
    
    if (isAirbnb) {
      setUrlType('airbnb');
      return true;
    } else if (isVrbo) {
      setUrlType('vrbo');
      return true;
    } else {
      setUrlType('unknown');
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setIsValid(validateUrl(inputUrl));
  };

  const canStartScraping = () => {
    if (disabled) return false;
    
    // Para datos simulados, cualquier URL sirve
    if (scrapingMethod === 'simulated') {
      return url.length > 0;
    }
    
    // Para VRBO, debe ser URL de VRBO
    if (scrapingMethod === 'vrbo') {
      return isValid && urlType === 'vrbo';
    }
    
    // Para otros métodos (internal/apify), debe ser URL de Airbnb
    return isValid && urlType === 'airbnb';
  };

  const getPlaceholder = () => {
    if (scrapingMethod === 'vrbo') {
      return 'https://www.vrbo.com/es-es/p6950877';
    }
    return 'https://www.airbnb.com/rooms/12345678';
  };

  const getUrlValidationMessage = () => {
    if (!url) return null;
    
    if (scrapingMethod === 'simulated') {
      return (
        <p className="text-sm text-blue-600">
          Para datos simulados, cualquier URL sirve como referencia
        </p>
      );
    }
    
    if (scrapingMethod === 'vrbo') {
      if (urlType === 'vrbo') {
        return (
          <p className="text-sm text-green-600">
            ✅ URL de VRBO válida detectada
          </p>
        );
      } else if (urlType === 'airbnb') {
        return (
          <p className="text-sm text-amber-600">
            ⚠️ Esta es una URL de Airbnb. Para VRBO, cambia el método o usa una URL de VRBO
          </p>
        );
      } else {
        return (
          <p className="text-sm text-red-600">
            ❌ Ingresa una URL válida de VRBO (ej: https://www.vrbo.com/es-es/p6950877)
          </p>
        );
      }
    }
    
    // Para métodos de Airbnb (internal/apify)
    if (urlType === 'airbnb') {
      return (
        <p className="text-sm text-green-600">
          ✅ URL de Airbnb válida detectada
        </p>
      );
    } else if (urlType === 'vrbo') {
      return (
        <p className="text-sm text-amber-600">
          ⚠️ Esta es una URL de VRBO. Cambia el método a "Sistema VRBO" o usa una URL de Airbnb
        </p>
      );
    } else {
      return (
        <p className="text-sm text-red-600">
          ❌ Ingresa una URL válida de Airbnb (ej: https://www.airbnb.com/rooms/12345678)
        </p>
      );
    }
  };

  const getButtonText = () => {
    if (scrapingMethod === 'simulated') return 'Generar Datos';
    if (scrapingMethod === 'vrbo') return 'Extraer de VRBO';
    if (scrapingMethod === 'apify') return 'Extraer con Apify';
    return 'Intentar Extracción';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canStartScraping()) {
      onStartScraping(url, scrapingMethod);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>URL del Listing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder={getPlaceholder()}
                value={url}
                onChange={handleUrlChange}
                disabled={disabled}
                className={`transition-colors ${
                  url && !canStartScraping() && scrapingMethod !== 'simulated' ? 'border-red-300 focus:border-red-500' : ''
                } ${
                  (isValid || scrapingMethod === 'simulated') && canStartScraping() ? 'border-green-300 focus:border-green-500' : ''
                }`}
              />
              {getUrlValidationMessage()}
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={!canStartScraping()}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                {disabled ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{getButtonText()}</span>
                  </>
                )}
              </Button>
              
              {showReset && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onReset}
                  className="border-gray-300 hover:border-gray-400"
                >
                  New Extraction
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ScrapingMethodSelector
        selectedMethod={scrapingMethod}
        onMethodChange={setScrapingMethod}
        disabled={disabled}
      />
    </div>
  );
};
