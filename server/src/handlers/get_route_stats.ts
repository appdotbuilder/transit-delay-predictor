import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type RouteStats } from '../schema';
import { sql } from 'drizzle-orm';

/**
 * Handler for retrieving route-specific statistics
 * This handler aggregates delay data by route for dashboard charts,
 * showing which routes have the highest delays and query volumes.
 */
export async function getRouteStats(): Promise<RouteStats[]> {
  try {
    // Query database to aggregate statistics by route
    const results = await db
      .select({
        route: queriesTable.route,
        averageDelay: sql<number>`AVG(${queriesTable.prediction})`,
        queryCount: sql<number>`COUNT(*)`,
        onTimeQueries: sql<number>`COUNT(CASE WHEN ${queriesTable.prediction} <= 0 THEN 1 END)`
      })
      .from(queriesTable)
      .groupBy(queriesTable.route)
      .orderBy(sql`COUNT(*) DESC`) // Order by query count descending
      .execute();

    // Transform results and calculate on-time percentage
    return results.map(result => {
      // Convert string results to numbers
      const queryCount = Number(result.queryCount);
      const averageDelay = Number(result.averageDelay);
      const onTimeQueries = Number(result.onTimeQueries);
      
      const onTimePercentage = queryCount > 0 
        ? (onTimeQueries / queryCount) * 100 
        : 0;

      return {
        route: result.route,
        averageDelay: Math.round(averageDelay * 10) / 10, // Round to 1 decimal place
        queryCount: queryCount,
        onTimePercentage: Math.round(onTimePercentage * 10) / 10 // Round to 1 decimal place
      };
    });
  } catch (error) {
    console.error('Route stats retrieval failed:', error);
    throw error;
  }
}