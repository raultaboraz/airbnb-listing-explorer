
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, Globe, Database, Home } from 'lucide-react';

export type ScrapingMethod = 'simulated' | 'internal' | 'apify' | 'vrbo';

interface ScrapingMethodSelectorProps {
  selectedMethod: ScrapingMethod;
  onMethodChange: (method: ScrapingMethod) => void;
  disabled: boolean;
}

export const ScrapingMethodSelector: React.FC<ScrapingMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  disabled
}) => {
  const methods = [
    {
      id: 'simulated' as ScrapingMethod,
      icon: Database,
      title: 'Datos Simulados',
      description: 'Genera datos realistas de ejemplo instantáneamente',
      badge: 'Instantáneo',
      badgeVariant: 'secondary' as const,
      pros: ['Siempre funciona', 'Datos realistas', 'Sin limitaciones'],
      cons: ['No son datos reales']
    },
    {
      id: 'internal' as ScrapingMethod,
      icon: Globe,
      title: 'Sistema Interno (Airbnb)',
      description: 'Extracción sigilosa con múltiples proxies y técnicas anti-detección',
      badge: 'Avanzado',
      badgeVariant: 'default' as const,
      pros: ['Gratis', 'Múltiples técnicas', 'Headers camuflados'],
      cons: ['Puede ser bloqueado', 'Éxito variable']
    },
    {
      id: 'apify' as ScrapingMethod,
      icon: Zap,
      title: 'Apify (Airbnb)',
      description: 'Servicio profesional de scraping con alta tasa de éxito',
      badge: 'Premium',
      badgeVariant: 'destructive' as const,
      pros: ['Alta fiabilidad', 'Datos actualizados', 'Soporte profesional'],
      cons: ['Requiere API key', 'Coste por uso']
    },
    {
      id: 'vrbo' as ScrapingMethod,
      icon: Home,
      title: 'Sistema VRBO',
      description: 'Extracción especializada para propiedades de VRBO/HomeAway',
      badge: 'Nuevo',
      badgeVariant: 'secondary' as const,
      pros: ['Especializado en VRBO', 'Múltiples técnicas', 'Gratis'],
      cons: ['Nuevo sistema', 'Puede ser bloqueado']
    }
  ];

  return (
    <Card className="border-2 border-dashed border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Método de Extracción
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={onMethodChange}
          disabled={disabled}
          className="space-y-4"
        >
          {methods.map((method) => {
            const IconComponent = method.icon;
            return (
              <div key={method.id} className="flex items-start space-x-3">
                <RadioGroupItem 
                  value={method.id} 
                  id={method.id}
                  disabled={disabled}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label 
                    htmlFor={method.id} 
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{method.title}</span>
                    <Badge variant={method.badgeVariant}>{method.badge}</Badge>
                  </Label>
                  <p className="text-sm text-gray-600 mt-1 ml-7">
                    {method.description}
                  </p>
                  
                  {selectedMethod === method.id && (
                    <div className="mt-3 ml-7 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-green-700 mb-1">✅ Ventajas:</p>
                        <ul className="text-xs text-green-600 space-y-1">
                          {method.pros.map((pro, index) => (
                            <li key={index}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1">⚠️ Limitaciones:</p>
                        <ul className="text-xs text-amber-600 space-y-1">
                          {method.cons.map((con, index) => (
                            <li key={index}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
