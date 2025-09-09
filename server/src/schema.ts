import { z } from 'zod';

// Prediction input schema
export const predictionInputSchema = z.object({
  route: z.string().min(1, 'Route is required'),
  stop: z.string().min(1, 'Stop ID is required'),
  datetime: z.coerce.date(), // Accepts string and converts to Date
});

export type PredictionInput = z.infer<typeof predictionInputSchema>;

// Prediction output schema
export const predictionOutputSchema = z.object({
  id: z.number(),
  route: z.string(),
  stop: z.string(),
  datetime: z.coerce.date(),
  weather: z.string().nullable(), // Placeholder weather data
  prediction: z.number(), // Delay in minutes
  confidence: z.number().min(0).max(100), // Confidence score as percentage
  label: z.enum(['On Time', 'Delayed']), // Simple delay label
  created_at: z.coerce.date(),
});

export type PredictionOutput = z.infer<typeof predictionOutputSchema>;

// Query record schema for database storage
export const queryRecordSchema = z.object({
  id: z.number(),
  route: z.string(),
  stop: z.string(),
  datetime: z.coerce.date(),
  weather: z.string().nullable(),
  prediction: z.number(), // Delay in minutes
  confidence: z.number(), // Confidence score (70-95)
  created_at: z.coerce.date(),
});

export type QueryRecord = z.infer<typeof queryRecordSchema>;

// Dashboard statistics schema
export const dashboardStatsSchema = z.object({
  totalQueries: z.number(),
  averageDelay: z.number(),
  onTimePercentage: z.number(),
  recentQueries: z.array(queryRecordSchema),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Route statistics schema for dashboard charts
export const routeStatsSchema = z.object({
  route: z.string(),
  averageDelay: z.number(),
  queryCount: z.number(),
  onTimePercentage: z.number(),
});

export type RouteStats = z.infer<typeof routeStatsSchema>;