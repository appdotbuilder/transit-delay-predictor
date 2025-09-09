import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { sql, count, avg, desc } from 'drizzle-orm';

/**
 * Handler for retrieving dashboard statistics
 * This handler aggregates data from the queries table to provide
 * summary statistics including total queries, average delays,
 * on-time percentage, and recent query activity.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // 1. Get total queries count
    const totalQueriesResult = await db
      .select({ count: count() })
      .from(queriesTable)
      .execute();
    
    const totalQueries = totalQueriesResult[0]?.count || 0;

    // If no queries exist, return empty stats
    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        averageDelay: 0,
        onTimePercentage: 0,
        recentQueries: []
      };
    }

    // 2. Calculate average delay
    const averageDelayResult = await db
      .select({ avgDelay: avg(queriesTable.prediction) })
      .from(queriesTable)
      .execute();
    
    const averageDelay = parseFloat(averageDelayResult[0]?.avgDelay || '0');

    // 3. Calculate on-time percentage (predictions <= 2 minutes)
    const onTimeCountResult = await db
      .select({ count: count() })
      .from(queriesTable)
      .where(sql`${queriesTable.prediction} <= 2`)
      .execute();
    
    const onTimeCount = onTimeCountResult[0]?.count || 0;
    const onTimePercentage = totalQueries > 0 ? (onTimeCount / totalQueries) * 100 : 0;

    // 4. Fetch recent queries (last 5)
    const recentQueriesResult = await db
      .select()
      .from(queriesTable)
      .orderBy(desc(queriesTable.created_at))
      .limit(5)
      .execute();

    // Convert database records to match schema format
    const recentQueries = recentQueriesResult.map(query => ({
      ...query,
      confidence: parseFloat(query.confidence.toString()), // Convert real to number
      datetime: query.datetime instanceof Date ? query.datetime : new Date(query.datetime),
      created_at: query.created_at instanceof Date ? query.created_at : new Date(query.created_at)
    }));

    return {
      totalQueries,
      averageDelay: Math.round(averageDelay * 100) / 100, // Round to 2 decimal places
      onTimePercentage: Math.round(onTimePercentage * 100) / 100, // Round to 2 decimal places
      recentQueries
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}