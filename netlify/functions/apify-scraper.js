
const https = require('https');

exports.handler = async (event, context) => {
  console.log('🚀 Apify scraper function called:', event.httpMethod);
  
  // Solo permitir POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { action, url, runId, datasetId, apiKey } = JSON.parse(event.body || '{}');
    
    // Usar API key del request o la del environment como fallback
    const apiKeyToUse = apiKey || process.env.APIFY_API_KEY;
    
    if (!apiKeyToUse) {
      console.error('❌ No API key available');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'No API key provided. Please provide an API key in the request or contact administrator.' 
        })
      };
    }
    
    console.log(`🚀 Apify action: ${action} with API key: ${apiKeyToUse.substring(0, 15)}...`);

    switch (action) {
      case 'start_run':
        return await startApifyRun(url, apiKeyToUse);
      
      case 'check_status':
        return await checkRunStatus(runId, apiKeyToUse);
      
      case 'get_results':
        return await getResults(datasetId, apiKeyToUse);
      
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('❌ Apify scraper error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

async function startApifyRun(url, apiKey) {
  const actorId = 'curious_coder/airbnb-scraper';
  
  const runPayload = {
    startUrls: [{ url }],
    maxRequestRetries: 3,
    maxConcurrency: 1,
    includeReviews: true,
    currency: "USD",
    language: "en",
    proxyConfiguration: { 
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"] 
    }
  };

  console.log('📤 Starting Apify run with payload:', JSON.stringify(runPayload, null, 2));

  const response = await makeApifyRequest(
    `https://api.apify.com/v2/acts/${actorId}/runs`,
    'POST',
    apiKey,
    runPayload
  );

  console.log('✅ Apify run started:', response);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
  };
}

async function checkRunStatus(runId, apiKey) {
  console.log(`📊 Checking status for run: ${runId}`);

  const response = await makeApifyRequest(
    `https://api.apify.com/v2/actor-runs/${runId}`,
    'GET',
    apiKey
  );

  console.log('📊 Run status:', response.data?.status);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
  };
}

async function getResults(datasetId, apiKey) {
  console.log(`📄 Getting results for dataset: ${datasetId}`);

  const response = await makeApifyRequest(
    `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true`,
    'GET',
    apiKey
  );

  console.log('📄 Results count:', response.length);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
  };
}

function makeApifyRequest(url, method, apiKey, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0'
      }
    };

    console.log(`🌐 Making ${method} request to: ${url}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 Response status: ${res.statusCode}`);
        console.log(`📥 Response data length: ${data.length}`);
        
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            console.error(`❌ Apify API error (${res.statusCode}):`, data);
            reject(new Error(`Apify API error (${res.statusCode}): ${data}`));
          }
        } catch (error) {
          console.error('❌ Invalid JSON response:', data);
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (body) {
      const bodyString = JSON.stringify(body);
      console.log('📤 Request body:', bodyString);
      req.write(bodyString);
    }
    
    req.end();
  });
}
