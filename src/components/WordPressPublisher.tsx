
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Globe, Lock, User, Wifi, WifiOff } from 'lucide-react';
import { ScrapingData } from '@/types/scraping';
import { WordPressCredentials, HomeyListingData, PublishResponse } from '@/types/wordpress';
import { publishToWordPress, testWordPressConnection } from '@/utils/wordpressPublisher';
import { useToast } from '@/hooks/use-toast';

interface WordPressPublisherProps {
  data: ScrapingData;
}

export const WordPressPublisher: React.FC<WordPressPublisherProps> = ({ data }) => {
  const { toast } = useToast();
  
  const [credentials, setCredentials] = useState<WordPressCredentials>({
    siteUrl: '',
    username: '',
    password: ''
  });

  const [listingData, setListingData] = useState<HomeyListingData>({
    title: data.title,
    description: data.description + '\n\n' + data.aboutSpace,
    price: data.price,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    guests: data.guests,
    location: data.location,
    amenities: data.amenities,
    images: data.images,
    propertyType: 'villa',
    status: 'publish'
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('wordpress-credentials');
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(parsed);
        console.log('✅ Credenciales cargadas desde localStorage');
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, []);

  // Save credentials to localStorage whenever they change
  useEffect(() => {
    if (credentials.siteUrl || credentials.username || credentials.password) {
      localStorage.setItem('wordpress-credentials', JSON.stringify(credentials));
      console.log('💾 Credenciales guardadas en localStorage');
    }
  }, [credentials]);

  const handleCredentialChange = (field: keyof WordPressCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Reset connection status when credentials change
    setIsConnected(null);
  };

  const handleListingDataChange = (field: keyof HomeyListingData, value: string | number) => {
    setListingData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    if (!credentials.siteUrl || !credentials.username || !credentials.password) {
      toast({
        title: "Credenciales incompletas",
        description: "Por favor completa todos los campos de conexión",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setIsConnected(null);

    try {
      const result = await testWordPressConnection(credentials);
      setIsConnected(result.success);
      
      if (result.success) {
        toast({
          title: "✅ Conexión exitosa",
          description: `Conectado a WordPress. Plugin Homey: ${result.homeyInstalled ? 'Instalado' : 'No detectado'}`,
        });
      } else {
        toast({
          title: "❌ Error de conexión",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "❌ Error de conexión",
        description: "No se pudo conectar con WordPress",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const result = await publishToWordPress(credentials, listingData);
      setPublishResult(result);
      
      if (result.success) {
        toast({
          title: "✅ Publicación exitosa",
          description: `Listing publicado con ID: ${result.postId}`,
        });
      } else {
        toast({
          title: "❌ Error en la publicación",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setPublishResult({
        success: false,
        message: 'Error durante la publicación en WordPress',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      toast({
        title: "❌ Error en la publicación",
        description: 'Error durante la publicación en WordPress',
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const isFormValid = credentials.siteUrl && credentials.username && credentials.password && listingData.title;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-purple-600" />
          <span>Publicación en WordPress / Homey</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WordPress Credentials */}
        <div className="bg-white rounded-lg p-4 border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Credenciales de WordPress</span>
            </h4>
            
            {/* Connection Status Indicator */}
            {isConnected !== null && (
              <div className={`flex items-center space-x-1 text-sm ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span>Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Sin conexión</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteUrl">URL del sitio WordPress</Label>
              <Input
                id="siteUrl"
                type="url"
                placeholder="https://misitio.com"
                value={credentials.siteUrl}
                onChange={(e) => handleCredentialChange('siteUrl', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={credentials.username}
                onChange={(e) => handleCredentialChange('username', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="password">Contraseña de aplicación</Label>
            <Input
              id="password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              value={credentials.password}
              onChange={(e) => handleCredentialChange('password', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Se recomienda usar una contraseña de aplicación específica para la API REST
            </p>
          </div>

          {/* Test Connection Button */}
          <Button
            onClick={handleTestConnection}
            disabled={!credentials.siteUrl || !credentials.username || !credentials.password || isTesting}
            variant="outline"
            className="w-full"
          >
            {isTesting ? (
              <>
                <Wifi className="h-4 w-4 mr-2 animate-spin" />
                Probando conexión...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Probar Conexión con WordPress
              </>
            )}
          </Button>
        </div>

        {/* Listing Data */}
        <div className="bg-white rounded-lg p-4 border space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Datos del Listing</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="listingTitle">Título del listing</Label>
              <Input
                id="listingTitle"
                value={listingData.title}
                onChange={(e) => handleListingDataChange('title', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="listingPrice">Precio</Label>
              <Input
                id="listingPrice"
                value={listingData.price}
                onChange={(e) => handleListingDataChange('price', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="listingBedrooms">Habitaciones</Label>
              <Input
                id="listingBedrooms"
                type="number"
                value={listingData.bedrooms}
                onChange={(e) => handleListingDataChange('bedrooms', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="listingBathrooms">Baños</Label>
              <Input
                id="listingBathrooms"
                type="number"
                value={listingData.bathrooms}
                onChange={(e) => handleListingDataChange('bathrooms', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="listingGuests">Huéspedes</Label>
              <Input
                id="listingGuests"
                type="number"
                value={listingData.guests}
                onChange={(e) => handleListingDataChange('guests', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="listingLocation">Ubicación</Label>
              <Input
                id="listingLocation"
                value={listingData.location}
                onChange={(e) => handleListingDataChange('location', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="listingDescription">Descripción</Label>
            <Textarea
              id="listingDescription"
              rows={4}
              value={listingData.description}
              onChange={(e) => handleListingDataChange('description', e.target.value)}
            />
          </div>
          
          <div>
            <Label>Imágenes a publicar</Label>
            <div className="text-sm text-gray-600 mt-1">
              Se publicarán {listingData.images.length} imágenes automáticamente
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {listingData.images.slice(0, 8).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-16 object-cover rounded"
                />
              ))}
            </div>
            {listingData.images.length > 8 && (
              <p className="text-xs text-gray-500 mt-1">
                +{listingData.images.length - 8} imágenes más
              </p>
            )}
          </div>
        </div>

        {/* Publish Button */}
        <Button
          onClick={handlePublish}
          disabled={!isFormValid || isPublishing || isConnected === false}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          size="lg"
        >
          {isPublishing ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Publicando en WordPress...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Publicar Listing en WordPress
            </>
          )}
        </Button>

        {/* Publish Result */}
        {publishResult && (
          <div className={`p-4 rounded-lg border ${
            publishResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <h5 className="font-medium mb-2">
              {publishResult.success ? '✅ Publicación exitosa' : '❌ Error en la publicación'}
            </h5>
            <p className="text-sm">{publishResult.message}</p>
            {publishResult.postId && (
              <p className="text-sm mt-1 font-mono bg-white px-2 py-1 rounded">
                <strong>ID del post:</strong> {publishResult.postId}
              </p>
            )}
            {publishResult.error && (
              <p className="text-sm mt-1 font-mono">{publishResult.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
