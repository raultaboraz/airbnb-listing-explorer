
exports.handler = async (event, context) => {
  // Solo permitir POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Manejar OPTIONS request para CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { apiKey } = JSON.parse(event.body);
    
    if (!apiKey) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'API key is required' 
        }),
      };
    }

    console.log('Testing Apify connection...');

    // 1. Probar conexión básica y obtener datos del usuario
    const userResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      let errorMessage = 'Unknown error';
      if (userResponse.status === 401) {
        errorMessage = 'API key inválida o expirada';
      } else if (userResponse.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos de tu API key';
      } else {
        errorMessage = `Error de conexión: ${userResponse.status} ${userResponse.statusText}`;
      }
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
      };
    }

    const userData = await userResponse.json();

    // 2. Obtener información de créditos
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
    }

    // 3. Verificar disponibilidad del actor de Airbnb
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
    } else {
      actor = {
        available: false,
        id: actorId,
        name: 'Airbnb Scraper',
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        user: {
          id: userData.data.id,
          username: userData.data.username,
          email: userData.data.email,
        },
        credits,
        actor,
      }),
    };

  } catch (error) {
    console.error('Error in Apify connection test:', error);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido' 
      }),
    };
  }
};
