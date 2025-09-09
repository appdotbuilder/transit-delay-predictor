import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type QueryRecord } from '../schema';
import { desc } from 'drizzle-orm';

/**
 * Handler for retrieving recent prediction queries
 * This handler fetches the most recent queries from the database
 * to display on the dashboard, showing user activity and predictions.
 */
export const getRecentQueries = async (limit: number = 10): Promise<QueryRecord[]> => {
  try {
    // Query the database for recent queries ordered by created_at DESC
    const results = await db.select()
      .from(queriesTable)
      .orderBy(desc(queriesTable.created_at))
      .limit(limit)
      .execute();

    // Convert numeric fields back to numbers for proper typing
    return results.map(query => ({
      ...query,
      confidence: typeof query.confidence === 'string' ? parseFloat(query.confidence) : query.confidence
    }));
  } catch (error) {
    console.error('Get recent queries failed:', error);
    throw error;
  }
};