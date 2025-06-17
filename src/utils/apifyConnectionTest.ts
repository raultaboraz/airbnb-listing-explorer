
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

    console.log('📡 Conectando directamente con Apify API...');
    
    // 1. Probar conexión básica y obtener datos del usuario
    const userResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      let errorMessage = 'Error desconocido';
      if (userResponse.status === 401) {
        errorMessage = 'API key inválida o expirada';
      } else if (userResponse.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos de tu API key';
      } else {
        errorMessage = `Error de conexión: ${userResponse.status} ${userResponse.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const userData = await userResponse.json();

    // 2. Obtener información de créditos
    let credits = undefined;
    try {
      const accountResponse = await fetch('https://api.apify.com/v2/users/me/usage/monthly', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        credits = {
          current: accountData.data?.current || 0,
          monthlyLimit: accountData.data?.limit || 0,
        };
      }
    } catch (error) {
      console.warn('No se pudieron obtener los créditos:', error);
    }

    // 3. Verificar disponibilidad del actor de Airbnb
    let actor = undefined;
    try {
      const actorId = 'curious_coder/airbnb-scraper';
      const actorResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (actorResponse.ok) {
        const actorData = await actorResponse.json();
        actor = {
          available: true,
          id: actorData.data.id,
          name: actorData.data.name,
        };
      } else {
        actor = {
          available: false,
          id: actorId,
          name: 'Airbnb Scraper',
        };
      }
    } catch (error) {
      console.warn('No se pudo verificar el actor:', error);
      actor = {
        available: false,
        id: 'curious_coder/airbnb-scraper',
        name: 'Airbnb Scraper',
      };
    }

    const responseTime = Date.now() - startTime;

    console.log(`✅ Prueba de conexión completada en ${responseTime}ms`);
    console.log('✅ Datos de usuario obtenidos:', userData.data);
    console.log('💰 Créditos obtenidos:', credits);
    console.log('🎭 Actor disponible:', actor);

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
