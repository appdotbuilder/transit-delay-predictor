import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { getRecentQueries } from '../handlers/get_recent_queries';

// Test data setup
const createTestQuery = (overrides: Partial<any> = {}) => ({
  route: 'Bus 42',
  stop: 'STOP_001',
  datetime: new Date('2024-01-15T10:00:00Z'),
  weather: 'Clear',
  prediction: 5,
  confidence: 85.5,
  ...overrides
});

describe('getRecentQueries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recent queries ordered by created_at DESC', async () => {
    // Create test queries with different created_at times
    const oldQuery = createTestQuery({
      route: 'Bus 1',
      created_at: new Date('2024-01-01T10:00:00Z')
    });
    
    const middleQuery = createTestQuery({
      route: 'Bus 2',
      created_at: new Date('2024-01-02T10:00:00Z')
    });
    
    const recentQuery = createTestQuery({
      route: 'Bus 3',
      created_at: new Date('2024-01-03T10:00:00Z')
    });

    // Insert queries in random order
    await db.insert(queriesTable).values([
      middleQuery,
      oldQuery,
      recentQuery
    ]).execute();

    const result = await getRecentQueries();

    // Should return queries in DESC order by created_at
    expect(result).toHaveLength(3);
    expect(result[0].route).toEqual('Bus 3'); // Most recent
    expect(result[1].route).toEqual('Bus 2'); // Middle
    expect(result[2].route).toEqual('Bus 1'); // Oldest
    
    // Verify confidence is properly converted to number
    expect(typeof result[0].confidence).toBe('number');
    expect(result[0].confidence).toEqual(85.5);
  });

  it('should respect the limit parameter', async () => {
    // Create 5 test queries
    const queries = Array.from({ length: 5 }, (_, index) => 
      createTestQuery({
        route: `Bus ${index + 1}`,
        created_at: new Date(`2024-01-0${index + 1}T10:00:00Z`)
      })
    );

    await db.insert(queriesTable).values(queries).execute();

    // Test with limit of 3
    const result = await getRecentQueries(3);

    expect(result).toHaveLength(3);
    // Should return the 3 most recent (Bus 5, Bus 4, Bus 3)
    expect(result[0].route).toEqual('Bus 5');
    expect(result[1].route).toEqual('Bus 4');
    expect(result[2].route).toEqual('Bus 3');
  });

  it('should use default limit of 10 when no limit specified', async () => {
    // Create 15 test queries
    const queries = Array.from({ length: 15 }, (_, index) => 
      createTestQuery({
        route: `Bus ${index + 1}`,
        created_at: new Date(`2024-01-${String(index + 1).padStart(2, '0')}T10:00:00Z`)
      })
    );

    await db.insert(queriesTable).values(queries).execute();

    const result = await getRecentQueries();

    // Should return default limit of 10
    expect(result).toHaveLength(10);
    // Should start with most recent (Bus 15)
    expect(result[0].route).toEqual('Bus 15');
    expect(result[9].route).toEqual('Bus 6');
  });

  it('should return empty array when no queries exist', async () => {
    const result = await getRecentQueries();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle queries with null weather', async () => {
    const queryWithNullWeather = createTestQuery({
      weather: null
    });

    await db.insert(queriesTable).values(queryWithNullWeather).execute();

    const result = await getRecentQueries();

    expect(result).toHaveLength(1);
    expect(result[0].weather).toBeNull();
    expect(result[0].route).toEqual('Bus 42');
    expect(result[0].confidence).toEqual(85.5);
  });

  it('should return all fields correctly formatted', async () => {
    const testQuery = createTestQuery({
      route: 'Train A',
      stop: 'STATION_101',
      datetime: new Date('2024-01-15T14:30:00Z'),
      weather: 'Rainy',
      prediction: 12,
      confidence: 78.9
    });

    const inserted = await db.insert(queriesTable).values(testQuery).returning().execute();

    const result = await getRecentQueries(1);

    expect(result).toHaveLength(1);
    const query = result[0];
    
    expect(query.id).toBeDefined();
    expect(query.route).toEqual('Train A');
    expect(query.stop).toEqual('STATION_101');
    expect(query.datetime).toBeInstanceOf(Date);
    expect(query.datetime).toEqual(testQuery.datetime);
    expect(query.weather).toEqual('Rainy');
    expect(query.prediction).toEqual(12);
    expect(typeof query.confidence).toBe('number');
    expect(query.confidence).toEqual(78.9);
    expect(query.created_at).toBeInstanceOf(Date);
  });

  it('should handle limit of 0', async () => {
    const testQuery = createTestQuery();

    await db.insert(queriesTable).values(testQuery).execute();

    const result = await getRecentQueries(0);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle limit greater than available records', async () => {
    // Create only 2 queries with explicit created_at times
    const queries = [
      createTestQuery({ 
        route: 'Bus 1',
        created_at: new Date('2024-01-01T10:00:00Z')
      }),
      createTestQuery({ 
        route: 'Bus 2',
        created_at: new Date('2024-01-02T10:00:00Z')
      })
    ];

    await db.insert(queriesTable).values(queries).execute();

    // Request 10 queries but only 2 exist
    const result = await getRecentQueries(10);

    expect(result).toHaveLength(2);
    expect(result[0].route).toEqual('Bus 2'); // More recent
    expect(result[1].route).toEqual('Bus 1'); // Older
  });
});