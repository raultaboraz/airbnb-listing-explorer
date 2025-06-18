import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';

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

  useEffect(() => {
    // Intentar cargar API key guardada automáticamente
    const savedKey = localStorage.getItem('apify_api_key');
    if (savedKey && validateApiKey(savedKey)) {
      console.log('🔑 API key guardada encontrada, usando automáticamente...');
      onApiKeyProvided(savedKey);
      return;
    }
  }, [onApiKeyProvided]);

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
      // Guardar la API key para próximas veces
      localStorage.setItem('apify_api_key', apiKey);
      onApiKeyProvided(apiKey);
    }
  };

  const handleUseSavedKey = () => {
    const savedKey = localStorage.getItem('apify_api_key');
    if (savedKey) {
      onApiKeyProvided(savedKey);
    }
  };

  const savedKey = localStorage.getItem('apify_api_key');

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <Wifi className="h-5 w-5" />
          <span>Sistema Apify Simplificado</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Sistema Híbrido Optimizado:</strong> El sistema ahora usa un enfoque simplificado
            pero robusto que automáticamente cambia entre función Netlify y acceso directo.
            {savedKey && " Se detectó una API key guardada."}
          </AlertDescription>
        </Alert>

        {savedKey && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>API Key Detectada:</strong> Se encontró una API key guardada localmente.
                El sistema probará tanto Netlify como acceso directo automáticamente.
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleUseSavedKey}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Usar API Key Guardada
              </Button>
              <Button 
                onClick={() => localStorage.removeItem('apify_api_key')}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                Eliminar Key Guardada
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apify-key" className="text-sm font-medium text-gray-700">
              {savedKey ? "O introduce una nueva API Key" : "API Key de Apify"}
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
              Usar Nueva API Key
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

        <Alert className="border-purple-200 bg-purple-50">
          <Wifi className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>✨ Sistema Optimizado:</strong> Código más limpio y confiable
            con mejor manejo de errores y experiencia de usuario mejorada.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
