
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, AlertTriangle } from 'lucide-react';

interface ApifyKeyFallbackProps {
  onApiKeyProvided: (apiKey: string) => void;
  onCancel: () => void;
}

export const ApifyKeyFallback: React.FC<ApifyKeyFallbackProps> = ({
  onApiKeyProvided,
  onCancel
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateApiKey = (key: string) => {
    const valid = key.startsWith('apify_api_') && key.length > 20;
    setIsValid(valid);
    return valid;
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    validateApiKey(key);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onApiKeyProvided(apiKey);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <span>Función de Netlify No Disponible</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Key className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Solución Temporal:</strong> Para usar Apify mientras se despliega la función de Netlify, 
            proporciona tu API key de Apify. Esta se usará solo para esta sesión y no se almacenará.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apify-key" className="text-sm font-medium text-gray-700">
              API Key de Apify
            </label>
            <Input
              id="apify-key"
              type="password"
              placeholder="apify_api_..."
              value={apiKey}
              onChange={handleApiKeyChange}
              className={`transition-colors ${
                apiKey && !isValid ? 'border-red-300 focus:border-red-500' : ''
              } ${
                isValid ? 'border-green-300 focus:border-green-500' : ''
              }`}
            />
            {apiKey && !isValid && (
              <p className="text-sm text-red-600">
                La API key debe comenzar con "apify_api_" y tener más de 20 caracteres
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={!isValid}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Key className="h-4 w-4 mr-2" />
              Usar API Key
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>

        <Alert className="border-gray-200">
          <ExternalLink className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700">
            <strong>¿No tienes una API key?</strong> Puedes obtener una gratis en{' '}
            <a 
              href="https://console.apify.com/account/integrations" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Apify Console
            </a>
            . La cuenta gratuita incluye $5 USD de créditos.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
