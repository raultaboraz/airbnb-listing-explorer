
import React, { useState } from 'react';
import { UrlInput } from './UrlInput';
import { ProgressTracker } from './ProgressTracker';
import { DataDisplay } from './DataDisplay';
import { DownloadSection } from './DownloadSection';
import { ScrapingData } from '@/types/scraping';

export const AirbnbScraper = () => {
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [extractedData, setExtractedData] = useState<ScrapingData | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleStartScraping = async (url: string) => {
    setIsScrapingActive(true);
    setScrapingProgress(0);
    setExtractedData(null);
    setIsComplete(false);

    // Simulate scraping process with realistic steps
    const steps = [
      { message: 'Connecting to Airbnb...', duration: 1000 },
      { message: 'Loading listing page...', duration: 1500 },
      { message: 'Extracting basic information...', duration: 2000 },
      { message: 'Gathering amenities data...', duration: 1500 },
      { message: 'Processing reviews...', duration: 2000 },
      { message: 'Collecting images...', duration: 1800 },
      { message: 'Finalizing data extraction...', duration: 1000 }
    ];

    let progress = 0;
    const progressStep = 100 / steps.length;

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].message);
      
      // Smooth progress animation
      const targetProgress = (i + 1) * progressStep;
      const animationDuration = steps[i].duration;
      const animationSteps = 20;
      const stepDuration = animationDuration / animationSteps;
      const progressIncrement = (targetProgress - progress) / animationSteps;

      for (let j = 0; j < animationSteps; j++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        progress += progressIncrement;
        setScrapingProgress(Math.min(progress, targetProgress));
      }
    }

    // Generate mock extracted data with 20 images and 20 reviews
    const mockData: ScrapingData = {
      listingId: "12345678",
      url: url,
      title: "Beautiful Oceanview Villa in Malibu",
      description: "Stunning 4-bedroom villa with panoramic ocean views, private pool, and direct beach access. Perfect for families and groups looking for a luxury getaway.",
      aboutSpace: "Acerca de este espacio: Esta magnífica villa frente al océano ofrece una experiencia única de lujo y tranquilidad. Con vistas panorámicas al Pacífico, la propiedad cuenta con amplios espacios interiores y exteriores diseñados para el máximo confort. La villa incluye una piscina infinita privada, acceso directo a la playa, y está equipada con todas las comodidades modernas. Los huéspedes pueden disfrutar de espectaculares amaneceres y atardeceres desde la terraza principal, mientras que el diseño arquitectónico contemporáneo se integra perfectamente con el entorno natural. La cocina gourmet está completamente equipada para preparar comidas mientras se disfruta de las vistas al mar, y cada habitación ha sido cuidadosamente diseñada para maximizar la comodidad y la privacidad.",
      guests: 8,
      bedrooms: 4,
      bathrooms: 3,
      price: "$450/night",
      location: "Malibu, California, United States",
      amenities: [
        "WiFi", "Pool", "Kitchen", "Parking", "Air conditioning", 
        "Beach access", "Hot tub", "BBQ grill", "Washer/Dryer"
      ],
      reviews: {
        count: 127,
        rating: 4.8,
        recent: [
          { author: "Sarah M.", text: "Absolutely incredible place! The views are breathtaking and the amenities are top-notch.", rating: 5 },
          { author: "Mike R.", text: "Perfect for our family vacation. Great amenities and beautiful location.", rating: 5 },
          { author: "Lisa K.", text: "Beautiful property, exactly as described. Would definitely stay again!", rating: 4 },
          { author: "David L.", text: "Amazing ocean views and very clean. The host was very responsive.", rating: 5 },
          { author: "Emma T.", text: "Great place for a romantic getaway. The sunset views are unforgettable.", rating: 5 },
          { author: "Carlos G.", text: "Excellent location and facilities. The pool area is fantastic.", rating: 5 },
          { author: "Jennifer W.", text: "Wonderful stay! Everything was perfect from check-in to check-out.", rating: 4 },
          { author: "Tom H.", text: "Beautiful villa with all the amenities you could want. Highly recommend!", rating: 5 },
          { author: "Maria S.", text: "The beach access is amazing and the house is very comfortable.", rating: 5 },
          { author: "John D.", text: "Great for groups! Plenty of space and beautiful common areas.", rating: 4 },
          { author: "Anna P.", text: "Stunning property with incredible attention to detail.", rating: 5 },
          { author: "Robert K.", text: "Perfect location for exploring Malibu. Great restaurants nearby.", rating: 4 },
          { author: "Nicole B.", text: "The hot tub and pool were amazing after long days at the beach.", rating: 5 },
          { author: "Chris M.", text: "Beautiful home with everything you need for a perfect vacation.", rating: 5 },
          { author: "Sandra F.", text: "Exceptional property with world-class amenities and service.", rating: 5 },
          { author: "Alex J.", text: "Great place for special occasions. The views alone are worth it.", rating: 4 },
          { author: "Rachel C.", text: "Immaculate property with stunning architecture and design.", rating: 5 },
          { author: "Kevin S.", text: "Perfect for a luxury getaway. Every detail was thoughtfully planned.", rating: 5 },
          { author: "Linda R.", text: "Amazing experience! The property exceeded all our expectations.", rating: 5 },
          { author: "Steven T.", text: "Beautiful location with easy access to Malibu's best attractions.", rating: 4 }
        ]
      },
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        "https://images.unsplash.com/photo-1565623833408-d77e39b88af6?w=800",
        "https://images.unsplash.com/photo-1615874694520-474822394e73?w=800",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
        "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        "https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=800",
        "https://images.unsplash.com/photo-1594736797933-d0601ba3fe65?w=800",
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800"
      ],
      extractedAt: new Date().toISOString()
    };

    setExtractedData(mockData);
    setCurrentStep('Extraction complete!');
    setScrapingProgress(100);
    setIsComplete(true);
    setIsScrapingActive(false);
  };

  const handleReset = () => {
    setIsScrapingActive(false);
    setScrapingProgress(0);
    setCurrentStep('');
    setExtractedData(null);
    setIsComplete(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <UrlInput 
        onStartScraping={handleStartScraping} 
        disabled={isScrapingActive}
        onReset={handleReset}
        showReset={isComplete}
      />
      
      {(isScrapingActive || isComplete) && (
        <ProgressTracker 
          progress={scrapingProgress}
          currentStep={currentStep}
          isComplete={isComplete}
        />
      )}

      {extractedData && (
        <>
          <DataDisplay data={extractedData} />
          <DownloadSection data={extractedData} />
        </>
      )}
    </div>
  );
};
