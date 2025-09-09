import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

// Test query records for various scenarios
const testQueries = [
  {
    route: 'Route A',
    stop: 'Stop 001',
    datetime: new Date('2024-01-15T08:00:00Z'),
    weather: 'Sunny',
    prediction: 1, // On time
    confidence: 85.5
  },
  {
    route: 'Route B', 
    stop: 'Stop 002',
    datetime: new Date('2024-01-15T09:00:00Z'),
    weather: 'Rainy',
    prediction: 5, // Delayed
    confidence: 78.0
  },
  {
    route: 'Route C',
    stop: 'Stop 003', 
    datetime: new Date('2024-01-15T10:00:00Z'),
    weather: 'Cloudy',
    prediction: 2, // On time (at threshold)
    confidence: 92.3
  },
  {
    route: 'Route D',
    stop: 'Stop 004',
    datetime: new Date('2024-01-15T11:00:00Z'), 
    weather: null,
    prediction: 12, // Delayed
    confidence: 71.8
  },
  {
    route: 'Route E',
    stop: 'Stop 005',
    datetime: new Date('2024-01-15T12:00:00Z'),
    weather: 'Snowy',
    prediction: 0, // On time
    confidence: 88.9
  }
];

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats when no queries exist', async () => {
    const result = await getDashboardStats();

    expect(result.totalQueries).toEqual(0);
    expect(result.averageDelay).toEqual(0);
    expect(result.onTimePercentage).toEqual(0);
    expect(result.recentQueries).toHaveLength(0);
  });

  it('should calculate correct statistics with sample data', async () => {
    // Insert test data
    await db.insert(queriesTable)
      .values(testQueries.map(q => ({
        ...q,
        confidence: q.confidence // Keep as number for insertion
      })))
      .execute();

    const result = await getDashboardStats();

    // Verify total queries
    expect(result.totalQueries).toEqual(5);

    // Verify average delay calculation: (1 + 5 + 2 + 12 + 0) / 5 = 4
    expect(result.averageDelay).toEqual(4);

    // Verify on-time percentage: 3 out of 5 queries are on time (prediction <= 2)
    // (1, 2, 0) are on time = 3/5 = 60%
    expect(result.onTimePercentage).toEqual(60);

    // Verify recent queries structure
    expect(result.recentQueries).toHaveLength(5);
    
    const firstQuery = result.recentQueries[0];
    expect(typeof firstQuery.id).toBe('number');
    expect(typeof firstQuery.route).toBe('string');
    expect(typeof firstQuery.stop).toBe('string');
    expect(firstQuery.datetime).toBeInstanceOf(Date);
    expect(typeof firstQuery.prediction).toBe('number');
    expect(typeof firstQuery.confidence).toBe('number');
    expect(firstQuery.created_at).toBeInstanceOf(Date);

    // Verify recent queries are ordered by created_at DESC
    const timestamps = result.recentQueries.map(q => q.created_at.getTime());
    const sortedTimestamps = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sortedTimestamps);
  });

  it('should handle single query correctly', async () => {
    // Insert single query
    await db.insert(queriesTable)
      .values({
        route: 'Single Route',
        stop: 'Single Stop',
        datetime: new Date('2024-01-15T08:00:00Z'),
        weather: 'Clear',
        prediction: 3,
        confidence: 80.5
      })
      .execute();

    const result = await getDashboardStats();

    expect(result.totalQueries).toEqual(1);
    expect(result.averageDelay).toEqual(3);
    expect(result.onTimePercentage).toEqual(0); // prediction > 2, so not on time
    expect(result.recentQueries).toHaveLength(1);
  });

  it('should limit recent queries to 5 records', async () => {
    // Insert 7 queries to test limit
    const manyQueries = Array.from({ length: 7 }, (_, i) => ({
      route: `Route ${i}`,
      stop: `Stop ${i}`,
      datetime: new Date(`2024-01-${15 + i}T08:00:00Z`),
      weather: 'Sunny',
      prediction: i,
      confidence: 80 + i
    }));

    await db.insert(queriesTable)
      .values(manyQueries)
      .execute();

    const result = await getDashboardStats();

    expect(result.totalQueries).toEqual(7);
    expect(result.recentQueries).toHaveLength(5); // Should be limited to 5
  });

  it('should handle all on-time queries correctly', async () => {
    const onTimeQueries = [
      {
        route: 'Route X',
        stop: 'Stop X1',
        datetime: new Date('2024-01-15T08:00:00Z'),
        weather: 'Clear',
        prediction: 0,
        confidence: 85.0
      },
      {
        route: 'Route Y', 
        stop: 'Stop Y1',
        datetime: new Date('2024-01-15T09:00:00Z'),
        weather: 'Sunny',
        prediction: 1,
        confidence: 90.0
      },
      {
        route: 'Route Z',
        stop: 'Stop Z1',
        datetime: new Date('2024-01-15T10:00:00Z'),
        weather: 'Cloudy',
        prediction: 2,
        confidence: 88.0
      }
    ];

    await db.insert(queriesTable)
      .values(onTimeQueries)
      .execute();

    const result = await getDashboardStats();

    expect(result.totalQueries).toEqual(3);
    expect(result.averageDelay).toEqual(1); // (0 + 1 + 2) / 3 = 1
    expect(result.onTimePercentage).toEqual(100); // All queries are on time
  });

  it('should handle numeric conversions correctly', async () => {
    await db.insert(queriesTable)
      .values({
        route: 'Test Route',
        stop: 'Test Stop',
        datetime: new Date('2024-01-15T08:00:00Z'),
        weather: 'Clear',
        prediction: 7,
        confidence: 94.75 // Test decimal precision
      })
      .execute();

    const result = await getDashboardStats();

    // Verify confidence is properly converted to number
    expect(typeof result.recentQueries[0].confidence).toEqual('number');
    expect(result.recentQueries[0].confidence).toEqual(94.75);
    
    // Verify prediction remains integer
    expect(typeof result.recentQueries[0].prediction).toEqual('number');
    expect(result.recentQueries[0].prediction).toEqual(7);
  });

  it('should round percentage and average to 2 decimal places', async () => {
    // Create data that will result in repeating decimals
    const queries = [
      { route: 'R1', stop: 'S1', datetime: new Date(), weather: null, prediction: 1, confidence: 80.0 },
      { route: 'R2', stop: 'S2', datetime: new Date(), weather: null, prediction: 2, confidence: 80.0 },
      { route: 'R3', stop: 'S3', datetime: new Date(), weather: null, prediction: 5, confidence: 80.0 }
    ];

    await db.insert(queriesTable).values(queries).execute();

    const result = await getDashboardStats();

    // Average should be (1 + 2 + 5) / 3 = 2.666... -> 2.67
    expect(result.averageDelay).toEqual(2.67);
    
    // On-time percentage should be 2/3 = 0.666... -> 66.67%
    expect(result.onTimePercentage).toEqual(66.67);
  });
});