
import React, { useState } from 'react';
import { AirbnbScraper } from '@/components/AirbnbScraper';
import { Header } from '@/components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AirbnbScraper />
      </main>
    </div>
  );
};

export default Index;
