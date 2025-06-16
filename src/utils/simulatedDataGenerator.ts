
import { ScrapingData } from '@/types/scraping';

export const generateSimulatedData = (url: string): ScrapingData => {
  // Extraer ID del listing de la URL si es posible
  const listingId = url.match(/\/rooms\/(\d+)/)?.[1] || Math.random().toString().slice(2, 10);
  
  const titles = [
    "Cozy Downtown Apartment with City Views",
    "Modern Loft in Historic District", 
    "Charming Studio Near Beach",
    "Spacious Family Home with Garden",
    "Luxury Penthouse with Rooftop Terrace",
    "Rustic Cabin in the Mountains",
    "Stylish Flat in Arts Quarter"
  ];

  const locations = [
    "Downtown Barcelona, Spain",
    "SoHo, New York, NY",
    "Trastevere, Rome, Italy", 
    "Montmartre, Paris, France",
    "Camden, London, UK",
    "Mission District, San Francisco, CA",
    "Shibuya, Tokyo, Japan"
  ];

  const amenities = [
    "WiFi", "Kitchen", "Washer", "Dryer", "Air conditioning", "Heating",
    "Dedicated workspace", "TV", "Hair dryer", "Iron", "Pool", "Hot tub",
    "Free parking", "Gym", "Breakfast", "Laptop-friendly workspace",
    "Self check-in", "Smoke alarm", "Carbon monoxide alarm"
  ];

  const hosts = [
    "Maria", "John", "Sofia", "Ahmed", "Emma", "Carlos", "Yuki", "Anna"
  ];

  const reviews = [
    {
      author: "Jennifer",
      text: "Amazing place! Very clean and exactly as described. The host was super responsive and helpful.",
      rating: 5
    },
    {
      author: "Michael", 
      text: "Great location and beautiful space. Would definitely stay here again!",
      rating: 5
    },
    {
      author: "Sarah",
      text: "Perfect for our weekend getaway. Everything we needed was provided.",
      rating: 4
    }
  ];

  const images = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800"
  ];

  // Seleccionar datos aleatorios
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const randomHost = hosts[Math.floor(Math.random() * hosts.length)];
  const randomAmenities = amenities
    .sort(() => 0.5 - Math.random())
    .slice(0, 8 + Math.floor(Math.random() * 8));

  console.log('🎭 Generando datos simulados para:', url);

  return {
    listingId,
    url,
    title: randomTitle,
    description: `Experience the best of the city in this ${randomTitle.toLowerCase()}. This beautifully designed space offers everything you need for a comfortable stay, whether you're here for business or pleasure. Located in a vibrant neighborhood with easy access to local attractions, restaurants, and public transportation.`,
    aboutSpace: `This thoughtfully decorated space features modern amenities and comfortable furnishings. The space is perfect for both relaxation and productivity, with plenty of natural light and a welcoming atmosphere. You'll have access to all the essentials plus some special touches that make this place feel like home.`,
    hostName: randomHost,
    guests: 2 + Math.floor(Math.random() * 6), // 2-8 guests
    bedrooms: 1 + Math.floor(Math.random() * 3), // 1-4 bedrooms  
    bathrooms: 1 + Math.floor(Math.random() * 2), // 1-3 bathrooms
    price: `$${50 + Math.floor(Math.random() * 200)}`, // $50-$250
    location: randomLocation,
    amenities: randomAmenities,
    reviews: {
      count: 15 + Math.floor(Math.random() * 85), // 15-100 reviews
      rating: 4.2 + Math.random() * 0.8, // 4.2-5.0 rating
      recent: reviews
    },
    images,
    extractedAt: new Date().toISOString()
  };
};
