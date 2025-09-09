import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import type { DashboardStats, RouteStats } from '../../../server/src/schema';

export function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [routeStats, setRouteStats] = useState<RouteStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [statsResult, routesResult] = await Promise.all([
        trpc.getDashboardStats.query(),
        trpc.getRouteStats.query()
      ]);
      
      setDashboardStats(statsResult);
      setRouteStats(routesResult);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 max-w-2xl mx-auto">
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Transit Analytics Dashboard
        </h2>
        <p className="text-gray-600">
          Overview of transit delay predictions and system performance
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              📈 Total Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">
                {dashboardStats?.totalQueries.toLocaleString()}
              </div>
            )}
            <p className="text-sm text-blue-600 mt-1">Predictions requested</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              ⏱️ Average Delay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">
                {dashboardStats?.averageDelay.toFixed(1)} min
              </div>
            )}
            <p className="text-sm text-orange-600 mt-1">Across all routes</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              ✅ On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {dashboardStats?.onTimePercentage.toFixed(1)}%
              </div>
            )}
            <p className="text-sm text-green-600 mt-1">Predictions ≤ 2 min delay</p>
          </CardContent>
        </Card>
      </div>

      {/* Route Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            🚌 Route Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {routeStats.map((route: RouteStats) => (
                <div
                  key={route.route}
                  className="flex flex-col md:flex-row md:justify-between md:items-center p-4 border rounded-lg bg-gray-50"
                >
                  <div className="mb-2 md:mb-0">
                    <h3 className="font-semibold text-lg">{route.route}</h3>
                    <p className="text-sm text-gray-600">
                      {route.queryCount} prediction{route.queryCount !== 1 ? 's' : ''} requested
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      Avg: {route.averageDelay.toFixed(1)} min
                    </Badge>
                    <Badge 
                      variant={route.onTimePercentage >= 70 ? "default" : "destructive"}
                      className="bg-white border"
                    >
                      On-time: {route.onTimePercentage.toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      {route.queryCount} queries
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            🕐 Recent Prediction Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardStats?.recentQueries && dashboardStats.recentQueries.length > 0 ? (
            <div className="space-y-3">
              {dashboardStats.recentQueries.map((query) => (
                <div
                  key={query.id}
                  className="flex flex-col md:flex-row md:justify-between md:items-center p-3 border rounded bg-gray-50"
                >
                  <div className="mb-2 md:mb-0">
                    <h4 className="font-semibold">{query.route}</h4>
                    <p className="text-sm text-gray-600">
                      Stop: {query.stop} • {query.datetime.toLocaleString()}
                    </p>
                    {query.weather && (
                      <p className="text-xs text-gray-500">
                        Weather: {query.weather}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={query.prediction <= 2 ? "default" : "destructive"}
                    >
                      {query.prediction} min delay
                    </Badge>
                    <Badge variant="outline">
                      {query.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recent queries available. Make some predictions to see activity here!
            </p>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            🟢 System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <p className="text-green-700 font-medium">All systems operational</p>
              <p className="text-sm text-green-600">
                Prediction API responding normally • Database connected
              </p>
            </div>
            <Badge className="mt-2 md:mt-0 bg-green-100 text-green-800 border-green-300">
              ✅ Healthy
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}