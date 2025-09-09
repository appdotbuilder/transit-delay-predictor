import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type PredictionInput } from '../schema';
import { predictDelay } from '../handlers/predict_delay';
import { eq, gte } from 'drizzle-orm';

// Test input for delay prediction
const testInput: PredictionInput = {
  route: 'Route_101',
  stop: 'STOP_12345',
  datetime: new Date('2024-12-07T14:30:00Z')
};

describe('predictDelay', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should predict delay and return structured response', async () => {
    const result = await predictDelay(testInput);

    // Validate basic structure and required fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.route).toEqual('Route_101');
    expect(result.stop).toEqual('STOP_12345');
    expect(result.datetime).toEqual(testInput.datetime);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.weather).toBeDefined();
    expect(result.weather).not.toBeNull();

    // Validate prediction logic
    expect(typeof result.prediction).toBe('number');
    expect(result.prediction).toBeGreaterThanOrEqual(0);
    expect(result.prediction).toBeLessThanOrEqual(15);

    // Validate confidence score
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.confidence).toBeLessThanOrEqual(95);

    // Validate delay label logic
    expect(['On Time', 'Delayed']).toContain(result.label);
    if (result.prediction <= 2) {
      expect(result.label).toBe('On Time');
    } else {
      expect(result.label).toBe('Delayed');
    }
  });

  it('should store prediction in database', async () => {
    const result = await predictDelay(testInput);

    // Query database to verify record was created
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, result.id))
      .execute();

    expect(queries).toHaveLength(1);
    const queryRecord = queries[0];

    // Verify stored data matches returned data
    expect(queryRecord.route).toBe('Route_101');
    expect(queryRecord.stop).toBe('STOP_12345');
    expect(queryRecord.datetime).toEqual(testInput.datetime);
    expect(queryRecord.weather).toBe(result.weather);
    expect(queryRecord.prediction).toBe(result.prediction);
    expect(queryRecord.confidence).toBe(result.confidence);
    expect(queryRecord.created_at).toBeInstanceOf(Date);
  });

  it('should generate valid weather placeholders', async () => {
    // Test multiple predictions to ensure weather variety
    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = await predictDelay({
        ...testInput,
        stop: `STOP_${i}` // Vary stop to create unique records
      });
      results.push(result);
    }

    const weatherValues = results.map(r => r.weather);
    const validWeatherOptions = ['Clear', 'Rainy', 'Cloudy', 'Snowy'];
    
    // All weather values should be valid
    weatherValues.forEach(weather => {
      expect(validWeatherOptions).toContain(weather);
    });
  });

  it('should handle different datetime inputs correctly', async () => {
    const futureDateTime = new Date('2024-12-15T09:15:00Z');
    const pastDateTime = new Date('2024-11-01T18:45:00Z');

    const futureResult = await predictDelay({
      ...testInput,
      datetime: futureDateTime,
      stop: 'STOP_FUTURE'
    });

    const pastResult = await predictDelay({
      ...testInput,
      datetime: pastDateTime,
      stop: 'STOP_PAST'
    });

    // Verify datetime handling
    expect(futureResult.datetime).toEqual(futureDateTime);
    expect(pastResult.datetime).toEqual(pastDateTime);

    // Both should have valid predictions
    expect(futureResult.prediction).toBeGreaterThanOrEqual(0);
    expect(pastResult.prediction).toBeGreaterThanOrEqual(0);
  });

  it('should create multiple distinct predictions', async () => {
    const input1: PredictionInput = {
      route: 'Route_A',
      stop: 'STOP_A',
      datetime: new Date('2024-12-07T08:00:00Z')
    };

    const input2: PredictionInput = {
      route: 'Route_B',
      stop: 'STOP_B',
      datetime: new Date('2024-12-07T17:30:00Z')
    };

    const result1 = await predictDelay(input1);
    const result2 = await predictDelay(input2);

    // Should have different IDs
    expect(result1.id).not.toBe(result2.id);

    // Should have correct route/stop mapping
    expect(result1.route).toBe('Route_A');
    expect(result1.stop).toBe('STOP_A');
    expect(result2.route).toBe('Route_B');
    expect(result2.stop).toBe('STOP_B');

    // Verify both records exist in database
    const allQueries = await db.select()
      .from(queriesTable)
      .where(gte(queriesTable.id, Math.min(result1.id, result2.id)))
      .execute();

    expect(allQueries.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle special route and stop identifiers', async () => {
    const specialInput: PredictionInput = {
      route: 'Express-99X',
      stop: 'TERMINAL_001',
      datetime: new Date('2024-12-07T12:00:00Z')
    };

    const result = await predictDelay(specialInput);

    expect(result.route).toBe('Express-99X');
    expect(result.stop).toBe('TERMINAL_001');
    expect(result.id).toBeDefined();

    // Verify database storage
    const query = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, result.id))
      .execute();

    expect(query[0].route).toBe('Express-99X');
    expect(query[0].stop).toBe('TERMINAL_001');
  });
});