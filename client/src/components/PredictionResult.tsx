import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PredictionOutput } from '../../../server/src/schema';

interface PredictionResultProps {
  result: PredictionOutput;
}

export function PredictionResult({ result }: PredictionResultProps) {
  const getDelayColor = (delayMinutes: number) => {
    if (delayMinutes <= 2) return 'text-green-600';
    if (delayMinutes <= 5) return 'text-yellow-600';
    if (delayMinutes <= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDelayIcon = (delayMinutes: number) => {
    if (delayMinutes <= 2) return '✅';
    if (delayMinutes <= 5) return '⚠️';
    if (delayMinutes <= 10) return '🔶';
    return '🚨';
  };

  const getBadgeVariant = (label: string) => {
    return label === 'On Time' ? 'default' : 'destructive';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Prediction Card */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold">
            {getDelayIcon(result.prediction)} Prediction Results
          </CardTitle>
          <p className="text-blue-100">
            {result.route} • {result.stop}
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Delay Display */}
            <div className="space-y-3">
              <div className={`text-6xl font-bold ${getDelayColor(result.prediction)}`}>
                {result.prediction} min
              </div>
              <Badge 
                variant={getBadgeVariant(result.label)} 
                className="text-lg px-4 py-1 font-semibold"
              >
                {result.label}
              </Badge>
            </div>

            {/* Confidence Score */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-sm font-medium">
                <span>Confidence Level</span>
                <span>{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-3" />
              <p className="text-xs text-gray-500">
                How confident our AI model is in this prediction
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Route Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🚌 Route Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-blue-700">Route:</span>
              <p className="text-blue-900 font-semibold">{result.route}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-700">Stop ID:</span>
              <p className="text-blue-900 font-semibold">{result.stop}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-700">Travel Time:</span>
              <p className="text-blue-900">
                {result.datetime.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weather Info */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🌤️ Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl mb-2">
                {result.weather === 'Clear' ? '☀️' : 
                 result.weather === 'Rainy' ? '🌧️' : 
                 result.weather === 'Cloudy' ? '☁️' : '❄️'}
              </div>
              <p className="text-green-900 font-semibold text-lg">
                {result.weather || 'Unknown'}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Weather conditions can affect transit timing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Info */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🤖 AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-purple-700">Delay:</span>
              <p className="text-purple-900 font-semibold">{result.prediction} minutes</p>
            </div>
            <div>
              <span className="text-sm font-medium text-purple-700">Confidence:</span>
              <p className="text-purple-900 font-semibold">{result.confidence}%</p>
            </div>
            <div>
              <span className="text-sm font-medium text-purple-700">Generated:</span>
              <p className="text-purple-900 text-sm">
                {result.created_at.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            💡 Travel Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">If On Time:</h4>
              <p className="text-yellow-700">
                Great! Your transit should arrive as scheduled. Consider arriving 2-3 minutes early.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">If Delayed:</h4>
              <p className="text-yellow-700">
                Plan extra time for your journey. Check for alternative routes if the delay is significant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}