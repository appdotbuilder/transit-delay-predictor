import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type PredictionInput } from '../schema';
import { saveQuery } from '../handlers/save_query';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: PredictionInput = {
  route: '101',
  stop: 'STOP_001',
  datetime: new Date('2024-01-15T09:30:00.000Z')
};

const testPrediction = 5; // 5 minutes delay
const testConfidence = 85.5; // 85.5% confidence
const testWeather = 'Sunny, 20°C';

describe('saveQuery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a query with all fields', async () => {
    const result = await saveQuery(testInput, testPrediction, testConfidence, testWeather);

    // Verify returned data structure
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.route).toEqual('101');
    expect(result.stop).toEqual('STOP_001');
    expect(result.datetime).toBeInstanceOf(Date);
    expect(result.datetime.toISOString()).toEqual('2024-01-15T09:30:00.000Z');
    expect(result.weather).toEqual('Sunny, 20°C');
    expect(result.prediction).toEqual(5);
    expect(result.confidence).toEqual(85.5);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save a query with null weather', async () => {
    const result = await saveQuery(testInput, testPrediction, testConfidence, null);

    // Verify weather is properly handled as null
    expect(result.weather).toBeNull();
    expect(result.route).toEqual('101');
    expect(result.stop).toEqual('STOP_001');
    expect(result.prediction).toEqual(5);
    expect(result.confidence).toEqual(85.5);
  });

  it('should save query to database correctly', async () => {
    const result = await saveQuery(testInput, testPrediction, testConfidence, testWeather);

    // Query database directly to verify data was saved
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, result.id))
      .execute();

    expect(queries).toHaveLength(1);
    const savedQuery = queries[0];
    
    expect(savedQuery.route).toEqual('101');
    expect(savedQuery.stop).toEqual('STOP_001');
    expect(savedQuery.datetime).toBeInstanceOf(Date);
    expect(savedQuery.datetime.toISOString()).toEqual('2024-01-15T09:30:00.000Z');
    expect(savedQuery.weather).toEqual('Sunny, 20°C');
    expect(savedQuery.prediction).toEqual(5);
    expect(savedQuery.confidence).toEqual(85.5);
    expect(savedQuery.created_at).toBeInstanceOf(Date);
  });

  it('should handle edge case values correctly', async () => {
    // Test with extreme but valid values
    const edgeCaseInput: PredictionInput = {
      route: 'R-999-X',
      stop: 'COMPLEX_STOP_ID_WITH_UNDERSCORES_123',
      datetime: new Date('2025-12-31T23:59:59.999Z')
    };

    const result = await saveQuery(
      edgeCaseInput, 
      -10, // Negative delay (early arrival)
      95.0, // High confidence
      'Extreme weather conditions with special chars: -40°C, 100% humidity'
    );

    expect(result.route).toEqual('R-999-X');
    expect(result.stop).toEqual('COMPLEX_STOP_ID_WITH_UNDERSCORES_123');
    expect(result.datetime.toISOString()).toEqual('2025-12-31T23:59:59.999Z');
    expect(result.prediction).toEqual(-10);
    expect(result.confidence).toEqual(95.0);
    expect(result.weather).toEqual('Extreme weather conditions with special chars: -40°C, 100% humidity');
  });

  it('should auto-generate id and created_at timestamp', async () => {
    const result1 = await saveQuery(testInput, testPrediction, testConfidence);
    
    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await saveQuery(testInput, testPrediction + 1, testConfidence);

    // IDs should be different and auto-generated
    expect(result1.id).not.toEqual(result2.id);
    expect(typeof result1.id).toBe('number');
    expect(typeof result2.id).toBe('number');

    // Timestamps should be different and recent
    expect(result1.created_at).toBeInstanceOf(Date);
    expect(result2.created_at).toBeInstanceOf(Date);
    expect(result2.created_at.getTime()).toBeGreaterThan(result1.created_at.getTime());
    
    // Both timestamps should be recent (within last few seconds)
    const now = new Date();
    expect(now.getTime() - result1.created_at.getTime()).toBeLessThan(5000); // Less than 5 seconds ago
    expect(now.getTime() - result2.created_at.getTime()).toBeLessThan(5000);
  });

  it('should handle multiple queries correctly', async () => {
    // Create multiple queries with different data
    const queries = await Promise.all([
      saveQuery({ ...testInput, route: 'A1' }, 3, 88.0, 'Clear'),
      saveQuery({ ...testInput, route: 'B2' }, 7, 92.5, 'Rainy'),
      saveQuery({ ...testInput, route: 'C3' }, 0, 75.0, null)
    ]);

    expect(queries).toHaveLength(3);
    
    // Verify all queries have unique IDs
    const ids = queries.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(3);

    // Verify each query has correct data
    expect(queries[0].route).toEqual('A1');
    expect(queries[0].prediction).toEqual(3);
    expect(queries[0].confidence).toEqual(88.0);
    expect(queries[0].weather).toEqual('Clear');

    expect(queries[1].route).toEqual('B2');
    expect(queries[1].prediction).toEqual(7);
    expect(queries[1].confidence).toEqual(92.5);
    expect(queries[1].weather).toEqual('Rainy');

    expect(queries[2].route).toEqual('C3');
    expect(queries[2].prediction).toEqual(0);
    expect(queries[2].confidence).toEqual(75.0);
    expect(queries[2].weather).toBeNull();
  });
});