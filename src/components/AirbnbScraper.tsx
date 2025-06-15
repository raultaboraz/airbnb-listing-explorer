
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

    // Generate mock extracted data with more images
    const mockData: ScrapingData = {
      title: "Beautiful Oceanview Villa in Malibu",
      description: "Stunning 4-bedroom villa with panoramic ocean views, private pool, and direct beach access. Perfect for families and groups looking for a luxury getaway.",
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
          { author: "Sarah M.", text: "Absolutely incredible place! The views are breathtaking.", rating: 5 },
          { author: "Mike R.", text: "Perfect for our family vacation. Great amenities.", rating: 5 },
          { author: "Lisa K.", text: "Beautiful property, exactly as described.", rating: 4 }
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
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800"
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
