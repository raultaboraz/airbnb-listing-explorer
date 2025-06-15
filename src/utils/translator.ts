
export const detectAndTranslateText = async (text: string): Promise<string> => {
  try {
    // Simple language detection - if contains non-English characters, translate
    const hasNonEnglish = /[^\x00-\x7F]/.test(text) || 
                         /\b(el|la|los|las|un|una|de|del|en|con|por|para|que|es|son|está|están)\b/i.test(text) ||
                         /\b(le|la|les|des|du|dans|avec|pour|que|est|sont)\b/i.test(text) ||
                         /\b(der|die|das|den|dem|in|mit|für|und|ist|sind)\b/i.test(text) ||
                         /\b(il|la|i|le|di|del|in|con|per|che|è|sono)\b/i.test(text);

    if (!hasNonEnglish) {
      console.log('✅ Texto ya está en inglés');
      return text;
    }

    console.log('🔄 Traduciendo texto a inglés...');
    
    // Use Google Translate API (free tier)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
    
    if (response.ok) {
      const data = await response.json();
      const translatedText = data[0]?.map((item: any[]) => item[0]).join('') || text;
      console.log('✅ Texto traducido exitosamente');
      return translatedText;
    } else {
      console.log('⚠️ Error en traducción, usando texto original');
      return text;
    }
  } catch (error) {
    console.error('❌ Error durante traducción:', error);
    return text; // Return original text if translation fails
  }
};

export const extractPriceNumber = (priceText: string): string => {
  // Extract only numbers from price text like "$450/night" -> "450"
  const numbers = priceText.replace(/[^\d]/g, '');
  console.log(`💰 Precio extraído: "${priceText}" -> "${numbers}"`);
  return numbers || '0';
};

export const translateListingData = async (listingData: any): Promise<any> => {
  console.log('🌐 Iniciando traducción de datos del listing...');
  
  try {
    // Ensure location is always included and translated
    const locationText = listingData.location || 'Location not specified';
    
    const [translatedTitle, translatedDescription, translatedLocation] = await Promise.all([
      detectAndTranslateText(listingData.title),
      detectAndTranslateText(listingData.description),
      detectAndTranslateText(locationText)
    ]);

    // Extract clean price number
    const cleanPrice = extractPriceNumber(listingData.price);

    console.log('✅ Traducción completada:');
    console.log('- Título:', translatedTitle);
    console.log('- Precio limpio:', cleanPrice);
    console.log('- Ubicación:', translatedLocation);

    return {
      ...listingData,
      title: translatedTitle,
      description: translatedDescription,
      location: translatedLocation,
      price: cleanPrice // Clean price number only
    };
  } catch (error) {
    console.error('❌ Error durante traducción del listing:', error);
    return listingData; // Return original data if translation fails
  }
};
