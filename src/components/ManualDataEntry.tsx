
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { ScrapingData } from '@/types/scraping';

interface ManualDataEntryProps {
  onDataSubmit: (data: ScrapingData) => void;
  initialUrl?: string;
}

export const ManualDataEntry: React.FC<ManualDataEntryProps> = ({ onDataSubmit, initialUrl = '' }) => {
  const [formData, setFormData] = useState({
    url: initialUrl,
    title: '',
    description: '',
    aboutSpace: '',
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    price: '',
    location: '',
    amenities: ['WiFi gratuito', 'Cocina'],
    images: ['']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const listingId = extractIdFromUrl(formData.url) || 'manual-' + Date.now();
    
    const scrapingData: ScrapingData = {
      listingId,
      url: formData.url,
      title: formData.title,
      description: formData.description,
      aboutSpace: formData.aboutSpace,
      guests: formData.guests,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      price: formData.price,
      location: formData.location,
      amenities: formData.amenities.filter(a => a.trim() !== ''),
      reviews: {
        count: 0,
        rating: 4.5,
        recent: []
      },
      images: formData.images.filter(img => img.trim() !== ''),
      extractedAt: new Date().toISOString()
    };

    onDataSubmit(scrapingData);
  };

  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, '']
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => i === index ? value : amenity)
    }));
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const extractIdFromUrl = (url: string): string => {
    const match = url.match(/\/rooms\/(\d+)/);
    return match ? match[1] : '';
  };

  return (
    <Card className="border-2 border-dashed border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit3 className="h-5 w-5 text-amber-600" />
          <span>Entrada Manual de Datos</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Introduce los datos del listing manualmente como alternativa al scraping automático
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL del Listing</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://www.airbnb.com/rooms/12345678"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Barcelona, España"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Hermoso apartamento en el centro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción detallada del alojamiento..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutSpace">Sobre el Espacio</Label>
            <Textarea
              id="aboutSpace"
              value={formData.aboutSpace}
              onChange={(e) => setFormData(prev => ({ ...prev, aboutSpace: e.target.value }))}
              placeholder="Información adicional sobre el espacio..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guests">Huéspedes</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Habitaciones</Label>
              <Input
                id="bedrooms"
                type="number"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input
                id="bathrooms"
                type="number"
                min="1"
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Precio (€/noche)</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="120"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Amenidades</Label>
              <Button type="button" onClick={addAmenity} size="sm" variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {formData.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={amenity}
                    onChange={(e) => updateAmenity(index, e.target.value)}
                    placeholder="Ej: WiFi gratuito"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>URLs de Imágenes</Label>
              <Button type="button" onClick={addImage} size="sm" variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
            <Edit3 className="h-4 w-4 mr-2" />
            Crear Listing con Datos Manuales
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
