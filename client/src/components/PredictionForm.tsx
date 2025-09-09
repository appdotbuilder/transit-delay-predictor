import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { PredictionInput, PredictionOutput } from '../../../server/src/schema';

interface PredictionFormProps {
  onResult: (result: PredictionOutput) => void;
}

export function PredictionForm({ onResult }: PredictionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PredictionInput>({
    route: '',
    stop: '',
    datetime: new Date()
  });

  // Format date for datetime-local input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await trpc.predict.mutate(formData);
      onResult(result);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError('Failed to get prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="route" className="text-sm font-medium">
            Route Number/Name
          </Label>
          <Input
            id="route"
            placeholder="e.g., Bus 42, Train A"
            value={formData.route}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: PredictionInput) => ({ ...prev, route: e.target.value }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-gray-500">Enter the bus or train route</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stop" className="text-sm font-medium">
            Stop ID
          </Label>
          <Input
            id="stop"
            placeholder="e.g., STOP_001"
            value={formData.stop}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: PredictionInput) => ({ ...prev, stop: e.target.value }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-gray-500">Enter the stop identifier</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="datetime" className="text-sm font-medium">
          Date & Time
        </Label>
        <Input
          id="datetime"
          type="datetime-local"
          value={formatDateForInput(formData.datetime)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: PredictionInput) => ({ 
              ...prev, 
              datetime: new Date(e.target.value) 
            }))
          }
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">Select when you plan to travel</p>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Predicting...
          </div>
        ) : (
          '🔮 Get Delay Prediction'
        )}
      </Button>

      {/* Example routes for user guidance */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Example Routes:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>🚌 Bus routes: "Bus 42", "Bus 15", "Route 101"</div>
            <div>🚊 Train routes: "Train A", "Train B", "Metro Red"</div>
            <div>🚏 Stop IDs: "STOP_001", "STATION_102", "BUS_STOP_456"</div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}