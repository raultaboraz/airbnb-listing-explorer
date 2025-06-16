
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader } from 'lucide-react';
import { ScrapingMethodSelector, ScrapingMethod } from './ScrapingMethodSelector';
import { ApifyKeyInput } from './ApifyKeyInput';

interface UrlInputProps {
  onStartScraping: (url: string, method: ScrapingMethod, apifyKey?: string) => void;
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
  const [scrapingMethod, setScrapingMethod] = useState<ScrapingMethod>('internal');
  const [apifyKey, setApifyKey] = useState('');

  const validateUrl = (inputUrl: string) => {
    const airbnbRegex = /^https:\/\/(www\.)?airbnb\.(com|ca|co\.uk|fr|de|es|it|com\.au|jp)\/rooms\/\d+/;
    return airbnbRegex.test(inputUrl);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setIsValid(validateUrl(inputUrl));
  };

  const canStartScraping = () => {
    if (!isValid || disabled) return false;
    if (scrapingMethod === 'apify') {
      return apifyKey && apifyKey.startsWith('apify_api_');
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canStartScraping()) {
      onStartScraping(url, scrapingMethod, scrapingMethod === 'apify' ? apifyKey : undefined);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>Airbnb Listing URL</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://www.airbnb.com/rooms/12345678"
                value={url}
                onChange={handleUrlChange}
                disabled={disabled}
                className={`transition-colors ${
                  url && !isValid ? 'border-red-300 focus:border-red-500' : ''
                } ${
                  isValid ? 'border-green-300 focus:border-green-500' : ''
                }`}
              />
              {url && !isValid && (
                <p className="text-sm text-red-600">
                  Please enter a valid Airbnb listing URL
                </p>
              )}
              <p className="text-sm text-gray-500">
                Enter the URL of an Airbnb listing (e.g., https://www.airbnb.com/rooms/12345678)
              </p>
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
                    <span>Start Extraction</span>
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

      {scrapingMethod === 'apify' && (
        <ApifyKeyInput
          apiKey={apifyKey}
          onApiKeyChange={setApifyKey}
          disabled={disabled}
        />
      )}
    </div>
  );
};
