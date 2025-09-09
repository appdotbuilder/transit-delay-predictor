import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictionForm } from '@/components/PredictionForm';
import { PredictionResult } from '@/components/PredictionResult';
import { Dashboard } from '@/components/Dashboard';
import type { PredictionOutput } from '../../server/src/schema';

function App() {
  const [currentResult, setCurrentResult] = useState<PredictionOutput | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const handlePredictionResult = (result: PredictionOutput) => {
    setCurrentResult(result);
    setActiveTab('result');
  };

  const handleBackToHome = () => {
    setActiveTab('home');
    setCurrentResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚌 Transit Delay Predictor
          </h1>
          <p className="text-gray-600 text-lg">
            Get real-time predictions for transit delays and stay on schedule
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="home" className="text-sm sm:text-base">
              🏠 Home
            </TabsTrigger>
            <TabsTrigger value="result" className="text-sm sm:text-base" disabled={!currentResult}>
              📊 Results
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-sm sm:text-base">
              📈 Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Home Tab - Prediction Form */}
          <TabsContent value="home" className="space-y-6">
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Check Transit Delays</CardTitle>
                <p className="text-blue-100">Enter your route details to get a delay prediction</p>
              </CardHeader>
              <CardContent className="p-6">
                <PredictionForm onResult={handlePredictionResult} />
              </CardContent>
            </Card>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="text-center p-6 bg-green-50 border-green-200">
                <div className="text-green-600 text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-green-800">Accurate Predictions</h3>
                <p className="text-green-600 text-sm">AI-powered delay forecasting</p>
              </Card>
              <Card className="text-center p-6 bg-blue-50 border-blue-200">
                <div className="text-blue-600 text-3xl mb-2">⚡</div>
                <h3 className="font-semibold text-blue-800">Real-time Data</h3>
                <p className="text-blue-600 text-sm">Up-to-date transit information</p>
              </Card>
              <Card className="text-center p-6 bg-purple-50 border-purple-200">
                <div className="text-purple-600 text-3xl mb-2">📱</div>
                <h3 className="font-semibold text-purple-800">Easy to Use</h3>
                <p className="text-purple-600 text-sm">Simple interface, instant results</p>
              </Card>
            </div>
          </TabsContent>

          {/* Result Tab - Show Prediction */}
          <TabsContent value="result" className="space-y-6">
            {currentResult && (
              <>
                <div className="flex justify-center mb-4">
                  <Button 
                    onClick={handleBackToHome}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    ← Back to Home
                  </Button>
                </div>
                <PredictionResult result={currentResult} />
              </>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;