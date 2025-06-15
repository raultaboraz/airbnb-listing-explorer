
import React from 'react';
import { Download } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Download className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Airbnb Data Extractor</h1>
            <p className="text-gray-600">Extract listing data and download as ZIP</p>
          </div>
        </div>
      </div>
    </header>
  );
};
