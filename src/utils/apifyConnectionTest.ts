
export interface ApifyConnectionTestResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  credits?: {
    current: number;
    monthlyLimit: number;
  };
  actor?: {
    available: boolean;
    id: string;
    name: string;
  };
  responseTime?: number;
  error?: string;
}

export const testApifyConnection = async (apiKey: string): Promise<ApifyConnectionTestResult> => {
  console.log('🔍 Iniciando prueba de conexión con Apify...');
  const startTime = Date.now();
  
  try {
    // Validar formato de API key
    if (!apiKey || !apiKey.startsWith('apify_api_') || apiKey.length < 20) {
      throw new Error('Formato de API key inválido');
    }

    console.log('📡 Conectando con proxy de Netlify...');
    
    // Usar la función proxy de Netlify para evitar problemas de CORS
    const response = await fetch('/.netlify/functions/apify-connection-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    });

    if (!response.ok) {
      throw new Error(`Error en la función proxy: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const responseTime = Date.now() - startTime;

    if (!result.success) {
      console.error('❌ Error en prueba de conexión:', result.error);
      return {
        success: false,
        responseTime,
        error: result.error,
      };
    }

    console.log(`✅ Prueba de conexión completada en ${responseTime}ms`);
    console.log('✅ Datos de usuario obtenidos:', result.user);
    console.log('💰 Créditos obtenidos:', result.credits);
    console.log('🎭 Actor disponible:', result.actor);

    return {
      success: true,
      user: result.user,
      credits: result.credits,
      actor: result.actor,
      responseTime,
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Error en prueba de conexión:', error);
    
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};
