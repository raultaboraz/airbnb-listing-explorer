
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  User, 
  CreditCard, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Clock,
  AlertTriangle 
} from 'lucide-react';
import { testApifyConnection, ApifyConnectionTestResult } from '@/utils/apifyConnectionTest';
import { useToast } from '@/hooks/use-toast';

export const ApifyConnectionTest: React.FC = () => {
  const [apiKey, setApiKey] = useState('apify_api_eN2wFpITbulr40qyF2IeN2wtppxclx0Ei7cB');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<ApifyConnectionTestResult | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor introduce una API key de Apify",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await testApifyConnection(apiKey);
      setTestResult(result);

      if (result.success) {
        toast({
          title: "✅ Conexión Exitosa",
          description: `Conectado como ${result.user?.username} en ${result.responseTime}ms`,
        });
      } else {
        toast({
          title: "❌ Error de Conexión",
          description: result.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error Inesperado",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) => (
    success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  );

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wifi className="h-5 w-5 text-blue-600" />
          <span>Prueba de Conexión Apify</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-api-key">API Key de Apify</Label>
          <Input
            id="test-api-key"
            type="password"
            placeholder="apify_api_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button 
          onClick={handleTest} 
          disabled={isLoading || !apiKey.trim()}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Probando Conexión...' : 'Probar Conexión'}
        </Button>

        {testResult && (
          <div className="space-y-3 mt-4">
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <StatusIcon success={testResult.success} />
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                <strong>
                  {testResult.success ? '✅ Conexión Exitosa' : '❌ Error de Conexión'}
                </strong>
                {testResult.error && `: ${testResult.error}`}
              </AlertDescription>
            </Alert>

            {testResult.success && testResult.user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Usuario */}
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Usuario</span>
                  </div>
                  <p className="text-sm text-gray-700">{testResult.user.username}</p>
                  <p className="text-xs text-gray-500">{testResult.user.email}</p>
                </div>

                {/* Tiempo de respuesta */}
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Respuesta</span>
                  </div>
                  <p className="text-sm text-gray-700">{testResult.responseTime}ms</p>
                  <Badge variant="outline" className="text-xs">
                    {testResult.responseTime! < 1000 ? 'Rápido' : 'Normal'}
                  </Badge>
                </div>

                {/* Créditos */}
                {testResult.credits && (
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-sm">Créditos</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {testResult.credits.current} / {testResult.credits.monthlyLimit}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        testResult.credits.current > testResult.credits.monthlyLimit * 0.8 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}
                    >
                      {Math.round((testResult.credits.current / testResult.credits.monthlyLimit) * 100)}% usado
                    </Badge>
                  </div>
                )}

                {/* Actor */}
                {testResult.actor && (
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Play className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Actor Airbnb</span>
                    </div>
                    <p className="text-sm text-gray-700">{testResult.actor.name}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        testResult.actor.available ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {testResult.actor.available ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {!testResult.success && testResult.error && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Posibles soluciones:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    <li>Verifica que la API key sea correcta</li>
                    <li>Asegúrate de tener conexión a internet</li>
                    <li>Comprueba que tu cuenta de Apify esté activa</li>
                    <li>Verifica que no hayas excedido los límites de tu cuenta</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
