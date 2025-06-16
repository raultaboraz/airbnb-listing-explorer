
export const detectAndTranslateText = async (text: string): Promise<string> => {
  try {
    // Simple language detection - if contains non-English characters, translate
    const hasNonEnglish = /[^\x00-\x7F]/.test(text) || 
                         /\b(el|la|los|las|un|una|de|del|en|con|por|para|que|es|son|está|están|este|esta|estos|estas|muy|más|todo|toda|todos|todas)\b/i.test(text) ||
                         /\b(le|la|les|des|du|dans|avec|pour|que|est|sont|très|plus|tout|toute|tous|toutes)\b/i.test(text) ||
                         /\b(der|die|das|den|dem|in|mit|für|und|ist|sind|sehr|mehr|alle|alles)\b/i.test(text) ||
                         /\b(il|la|i|le|di|del|in|con|per|che|è|sono|molto|più|tutto|tutta|tutti|tutte)\b/i.test(text);

    if (!hasNonEnglish) {
      console.log('✅ Text is already in English');
      return text;
    }

    console.log('🔄 Translating text to English...');
    
    // Use Google Translate API (free tier)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
    
    if (response.ok) {
      const data = await response.json();
      const translatedText = data[0]?.map((item: any[]) => item[0]).join('') || text;
      console.log('✅ Text translated successfully');
      console.log('Original:', text.substring(0, 100) + '...');
      console.log('Translated:', translatedText.substring(0, 100) + '...');
      return translatedText;
    } else {
      console.log('⚠️ Translation error, using original text');
      return text;
    }
  } catch (error) {
    console.error('❌ Error during translation:', error);
    return text; // Return original text if translation fails
  }
};

export const extractPriceNumber = (priceText: string): string => {
  // Extract only numbers from price text like "$450/night" -> "450"
  const numbers = priceText.replace(/[^\d]/g, '');
  console.log(`💰 Price extracted: "${priceText}" -> "${numbers}"`);
  return numbers || '0';
};

export const translateListingData = async (listingData: any): Promise<any> => {
  console.log('🌐 Starting translation of listing data...');
  
  try {
    // Ensure location is always included and translated
    const locationText = listingData.location || 'Location not specified';
    
    const [translatedTitle, translatedDescription, translatedAboutSpace, translatedLocation] = await Promise.all([
      detectAndTranslateText(listingData.title),
      detectAndTranslateText(listingData.description),
      detectAndTranslateText(listingData.aboutSpace || ''),
      detectAndTranslateText(locationText)
    ]);

    // Extract clean price number (only digits)
    const cleanPrice = extractPriceNumber(listingData.price);

    console.log('✅ Translation completed:');
    console.log('- Title:', translatedTitle);
    console.log('- Clean price:', cleanPrice);
    console.log('- Location:', translatedLocation);

    return {
      ...listingData,
      title: translatedTitle,
      description: translatedDescription,
      aboutSpace: translatedAboutSpace,
      location: translatedLocation,
      price: cleanPrice // Clean price number only
    };
  } catch (error) {
    console.error('❌ Error during listing translation:', error);
    return listingData; // Return original data if translation fails
  }
};
