import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type PredictionInput, type QueryRecord } from '../schema';

/**
 * Handler for saving prediction queries to the database
 * This handler persists user queries and AI predictions for
 * analytics, dashboard display, and future model training.
 */
export async function saveQuery(
  input: PredictionInput, 
  prediction: number, 
  confidence: number, 
  weather: string | null = null
): Promise<QueryRecord> {
  try {
    // Insert query record into database
    const result = await db.insert(queriesTable)
      .values({
        route: input.route,
        stop: input.stop,
        datetime: input.datetime,
        weather: weather,
        prediction: prediction,
        confidence: confidence // Real column - no conversion needed
      })
      .returning()
      .execute();

    // Return the saved record
    const savedQuery = result[0];
    return {
      ...savedQuery,
      // Ensure dates are proper Date objects
      datetime: new Date(savedQuery.datetime),
      created_at: new Date(savedQuery.created_at)
    };
  } catch (error) {
    console.error('Query save failed:', error);
    throw error;
  }
}