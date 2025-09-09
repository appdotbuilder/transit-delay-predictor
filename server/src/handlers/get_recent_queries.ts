import { type QueryRecord } from '../schema';

/**
 * Handler for retrieving recent prediction queries
 * This handler fetches the most recent queries from the database
 * to display on the dashboard, showing user activity and predictions.
 */
export async function getRecentQueries(limit: number = 10): Promise<QueryRecord[]> {
  // This is a placeholder implementation! Real code should:
  // 1. Query the database for recent queries ordered by created_at DESC
  // 2. Apply the limit parameter to control result count
  // 3. Return the formatted query records
  
  // Placeholder data for development
  const placeholderQueries: QueryRecord[] = [
    {
      id: 1,
      route: "Bus 42",
      stop: "STOP_001",
      datetime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      weather: "Clear",
      prediction: 5,
      confidence: 85,
      created_at: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 2,
      route: "Train A",
      stop: "STOP_102",
      datetime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      weather: "Rainy",
      prediction: 12,
      confidence: 78,
      created_at: new Date(Date.now() - 1000 * 60 * 60)
    }
  ];
  
  return placeholderQueries.slice(0, limit);
}