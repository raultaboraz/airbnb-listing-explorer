
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, Info, CheckCircle, XCircle } from 'lucide-react';
import { validateApifyKey, estimateApifyCost } from '@/utils/apifyScraper';

interface ApifyKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  disabled?: boolean;
}

export const ApifyKeyInput: React.FC<ApifyKeyInputProps> = ({
  apiKey,
  onApiKeyChange,
  disabled = false
}) => {
  const [isValid, setIsValid] = useState(false);
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    setIsValid(validateApifyKey(apiKey));
  }, [apiKey]);

  useEffect(() => {
    // Cargar key guardada del localStorage si existe
    const saved = localStorage.getItem('apify_api_key');
    if (saved) {
      setSavedKey(saved);
      setShowSaveOption(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (isValid && apiKey) {
      localStorage.setItem('apify_api_key', apiKey);
      setSavedKey(apiKey);
      setShowSaveOption(true);
    }
  };

  const handleUseSavedKey = () => {
    onApiKeyChange(savedKey);
  };

  const handleClearSavedKey = () => {
    localStorage.removeItem('apify_api_key');
    setSavedKey('');
    setShowSaveOption(false);
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-amber-600" />
          <span>Configuración de Apify</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>API Key requerida:</strong> Necesitas una cuenta de Apify para usar este método.{' '}
            <a 
              href="https://apify.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center underline hover:no-underline"
            >
              Ver precios <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </AlertDescription>
        </Alert>

        {savedKey && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">API Key guardada localmente:</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseSavedKey}
                disabled={disabled}
                className="flex items-center space-x-1"
              >
                <CheckCircle className="h-3 w-3" />
                <span>Usar guardada</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSavedKey}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="h-3 w-3" />
                <span>Eliminar</span>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="apify-key">API Key de Apify</Label>
          <div className="space-y-2">
            <Input
              id="apify-key"
              type="password"
              placeholder="apify_api_..."
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              disabled={disabled}
              className={`transition-colors ${
                apiKey && !isValid ? 'border-red-300 focus:border-red-500' : ''
              } ${
                isValid ? 'border-green-300 focus:border-green-500' : ''
              }`}
            />
            
            {apiKey && !isValid && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <XCircle className="h-3 w-3" />
                <span>API key inválida. Debe comenzar con "apify_api_"</span>
              </p>
            )}
            
            {isValid && (
              <div className="space-y-1">
                <p className="text-sm text-green-600 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>API key válida</span>
                </p>
                {!savedKey && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveKey}
                    className="text-xs"
                  >
                    Guardar para próximas veces
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Costo estimado:</strong> {estimateApifyCost(1)}</p>
          <p className="text-xs">Los costos se cobran directamente en tu cuenta de Apify</p>
        </div>
      </CardContent>
    </Card>
  );
};
