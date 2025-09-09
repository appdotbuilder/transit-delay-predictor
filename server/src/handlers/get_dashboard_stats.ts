import { type DashboardStats } from '../schema';
import { getRecentQueries } from './get_recent_queries';

/**
 * Handler for retrieving dashboard statistics
 * This handler aggregates data from the queries table to provide
 * summary statistics including total queries, average delays,
 * on-time percentage, and recent query activity.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // This is a placeholder implementation! Real code should:
  // 1. Query the database to count total queries
  // 2. Calculate average delay from all predictions
  // 3. Calculate on-time percentage (predictions <= 2 minutes)
  // 4. Fetch recent queries for display
  // 5. Return aggregated statistics
  
  // Get recent queries using existing handler
  const recentQueries = await getRecentQueries(5);
  
  // Placeholder calculations (should be based on actual database data)
  const totalQueries = 156; // Should count all records in queries table
  const averageDelay = 7.3; // Should calculate AVG(prediction) from queries
  const onTimePercentage = 68.5; // Should calculate percentage where prediction <= 2
  
  return {
    totalQueries,
    averageDelay,
    onTimePercentage,
    recentQueries
  };
}