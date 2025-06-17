
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

    // 1. Probar conexión básica y obtener datos del usuario
    console.log('📡 Probando conexión básica...');
    const userResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      if (userResponse.status === 401) {
        throw new Error('API key inválida o expirada');
      } else if (userResponse.status === 403) {
        throw new Error('Acceso denegado. Verifica los permisos de tu API key');
      } else {
        throw new Error(`Error de conexión: ${userResponse.status} ${userResponse.statusText}`);
      }
    }

    const userData = await userResponse.json();
    console.log('✅ Datos de usuario obtenidos:', userData.data);

    // 2. Obtener información de créditos
    console.log('💰 Obteniendo información de créditos...');
    const accountResponse = await fetch('https://api.apify.com/v2/users/me/usage/monthly', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    let credits = undefined;
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      credits = {
        current: accountData.data?.current || 0,
        monthlyLimit: accountData.data?.limit || 0,
      };
      console.log('💰 Créditos obtenidos:', credits);
    }

    // 3. Verificar disponibilidad del actor de Airbnb
    console.log('🎭 Verificando actor de Airbnb...');
    const actorId = 'curious_coder/airbnb-scraper';
    const actorResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    let actor = undefined;
    if (actorResponse.ok) {
      const actorData = await actorResponse.json();
      actor = {
        available: true,
        id: actorData.data.id,
        name: actorData.data.name,
      };
      console.log('🎭 Actor disponible:', actor);
    } else {
      actor = {
        available: false,
        id: actorId,
        name: 'Airbnb Scraper',
      };
      console.warn('⚠️ Actor no disponible o sin permisos');
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Prueba de conexión completada en ${responseTime}ms`);

    return {
      success: true,
      user: {
        id: userData.data.id,
        username: userData.data.username,
        email: userData.data.email,
      },
      credits,
      actor,
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
