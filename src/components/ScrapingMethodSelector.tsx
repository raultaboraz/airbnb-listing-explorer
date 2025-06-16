
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, Globe, AlertTriangle, CheckCircle, PlayCircle, Cloud } from 'lucide-react';

export type ScrapingMethod = 'simulated' | 'internal' | 'apify';

interface ScrapingMethodSelectorProps {
  selectedMethod: ScrapingMethod;
  onMethodChange: (method: ScrapingMethod) => void;
  disabled?: boolean;
}

export const ScrapingMethodSelector: React.FC<ScrapingMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  disabled = false
}) => {
  return (
    <Card className="border-2 border-dashed border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <span>Método de Extracción</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={(value) => onMethodChange(value as ScrapingMethod)}
          disabled={disabled}
          className="space-y-4"
        >
          {/* Datos Simulados */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="simulated" id="simulated" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="simulated" className="flex items-center space-x-2 cursor-pointer">
                <span className="font-medium">Datos Simulados</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Demo
                </Badge>
              </Label>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-1 text-sm text-blue-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Genera datos de demostración instantáneos</span>
                </div>
                <p className="text-sm text-gray-600">
                  Perfecto para probar la funcionalidad sin limitaciones
                </p>
              </div>
            </div>
          </div>

          {/* Scraping Interno */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="internal" id="internal" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="internal" className="flex items-center space-x-2 cursor-pointer">
                <span className="font-medium">Scraping Interno</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Experimental
                </Badge>
              </Label>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-1 text-sm text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Puede ser bloqueado por Airbnb</span>
                </div>
                <p className="text-sm text-gray-600">
                  Intenta extraer datos reales pero con alta probabilidad de fallo
                </p>
              </div>
            </div>
          </div>

          {/* Método Apify */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="apify" id="apify" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="apify" className="flex items-center space-x-2 cursor-pointer">
                <span className="font-medium">Apify Premium</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Cloud className="h-3 w-3 mr-1" />
                  Inteligente
                </Badge>
              </Label>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Garantiza datos reales del listing</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Usa función backend preconfigurada con fallback</span>
                </div>
                <p className="text-sm text-gray-600">
                  Usa proxies profesionales y supera las protecciones de Airbnb
                </p>
                <p className="text-xs text-gray-500">
                  Si la función de Netlify no está disponible, te permitirá usar tu propia API key
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
