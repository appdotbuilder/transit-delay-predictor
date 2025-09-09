import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { getRouteStats } from '../handlers/get_route_stats';

// Test data setup
const testQueries = [
  // Route A - Good performance (mostly on time)
  { route: 'Route A', stop: 'Stop1', datetime: new Date(), prediction: -2, confidence: 85.0 }, // Early
  { route: 'Route A', stop: 'Stop2', datetime: new Date(), prediction: 0, confidence: 90.0 },   // On time
  { route: 'Route A', stop: 'Stop3', datetime: new Date(), prediction: 1, confidence: 80.0 },   // Slight delay
  { route: 'Route A', stop: 'Stop4', datetime: new Date(), prediction: 0, confidence: 88.0 },   // On time
  
  // Route B - Mixed performance
  { route: 'Route B', stop: 'Stop5', datetime: new Date(), prediction: 5, confidence: 75.0 },   // Delayed
  { route: 'Route B', stop: 'Stop6', datetime: new Date(), prediction: -1, confidence: 92.0 },  // Early
  { route: 'Route B', stop: 'Stop7', datetime: new Date(), prediction: 8, confidence: 70.0 },   // Delayed
  
  // Route C - Poor performance (mostly delayed)
  { route: 'Route C', stop: 'Stop8', datetime: new Date(), prediction: 10, confidence: 75.0 },  // Delayed
  { route: 'Route C', stop: 'Stop9', datetime: new Date(), prediction: 15, confidence: 85.0 },  // Very delayed
  { route: 'Route C', stop: 'Stop10', datetime: new Date(), prediction: 12, confidence: 80.0 }, // Delayed
  { route: 'Route C', stop: 'Stop11', datetime: new Date(), prediction: 8, confidence: 82.0 },  // Delayed
  { route: 'Route C', stop: 'Stop12', datetime: new Date(), prediction: 6, confidence: 78.0 },  // Delayed
];

describe('getRouteStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no queries exist', async () => {
    const results = await getRouteStats();
    expect(results).toEqual([]);
  });

  it('should calculate route statistics correctly', async () => {
    // Insert test data
    await db.insert(queriesTable).values(testQueries).execute();

    const results = await getRouteStats();

    // Should return 3 routes
    expect(results).toHaveLength(3);

    // Find each route in results
    const routeA = results.find(r => r.route === 'Route A');
    const routeB = results.find(r => r.route === 'Route B');
    const routeC = results.find(r => r.route === 'Route C');

    expect(routeA).toBeDefined();
    expect(routeB).toBeDefined();
    expect(routeC).toBeDefined();

    // Verify Route A stats (4 queries: -2, 0, 1, 0 = avg -0.25, 3 on-time)
    expect(routeA!.queryCount).toBe(4);
    expect(routeA!.averageDelay).toBe(-0.2); // Rounded to 1 decimal
    expect(routeA!.onTimePercentage).toBe(75.0); // 3/4 = 75%

    // Verify Route B stats (3 queries: 5, -1, 8 = avg 4.0, 1 on-time)
    expect(routeB!.queryCount).toBe(3);
    expect(routeB!.averageDelay).toBe(4.0);
    expect(routeB!.onTimePercentage).toBe(33.3); // 1/3 = 33.3%

    // Verify Route C stats (5 queries: 10, 15, 12, 8, 6 = avg 10.2, 0 on-time)
    expect(routeC!.queryCount).toBe(5);
    expect(routeC!.averageDelay).toBe(10.2);
    expect(routeC!.onTimePercentage).toBe(0.0); // 0/5 = 0%
  });

  it('should order results by query count descending', async () => {
    // Insert test data
    await db.insert(queriesTable).values(testQueries).execute();

    const results = await getRouteStats();

    // Should be ordered: Route C (5 queries), Route A (4 queries), Route B (3 queries)
    expect(results[0].route).toBe('Route C');
    expect(results[0].queryCount).toBe(5);
    
    expect(results[1].route).toBe('Route A');
    expect(results[1].queryCount).toBe(4);
    
    expect(results[2].route).toBe('Route B');
    expect(results[2].queryCount).toBe(3);
  });

  it('should handle single route with single query', async () => {
    const singleQuery = {
      route: 'Single Route',
      stop: 'Single Stop',
      datetime: new Date(),
      prediction: 3,
      confidence: 85.0
    };

    await db.insert(queriesTable).values([singleQuery]).execute();

    const results = await getRouteStats();

    expect(results).toHaveLength(1);
    expect(results[0].route).toBe('Single Route');
    expect(results[0].queryCount).toBe(1);
    expect(results[0].averageDelay).toBe(3.0);
    expect(results[0].onTimePercentage).toBe(0.0); // 3 minutes delay is not on-time
  });

  it('should handle routes with all on-time predictions', async () => {
    const onTimeQueries = [
      { route: 'Punctual Route', stop: 'Stop1', datetime: new Date(), prediction: 0, confidence: 90.0 },
      { route: 'Punctual Route', stop: 'Stop2', datetime: new Date(), prediction: -1, confidence: 85.0 },
      { route: 'Punctual Route', stop: 'Stop3', datetime: new Date(), prediction: 0, confidence: 88.0 }
    ];

    await db.insert(queriesTable).values(onTimeQueries).execute();

    const results = await getRouteStats();

    expect(results).toHaveLength(1);
    expect(results[0].route).toBe('Punctual Route');
    expect(results[0].queryCount).toBe(3);
    expect(results[0].averageDelay).toBe(-0.3); // (-1 + 0 + 0) / 3 = -0.33...
    expect(results[0].onTimePercentage).toBe(100.0); // All 3 are on-time (≤ 0)
  });

  it('should properly round decimal values', async () => {
    const precisionQueries = [
      { route: 'Precision Route', stop: 'Stop1', datetime: new Date(), prediction: 1, confidence: 85.0 },
      { route: 'Precision Route', stop: 'Stop2', datetime: new Date(), prediction: 2, confidence: 80.0 },
      { route: 'Precision Route', stop: 'Stop3', datetime: new Date(), prediction: 0, confidence: 90.0 }
    ];

    await db.insert(queriesTable).values(precisionQueries).execute();

    const results = await getRouteStats();

    expect(results).toHaveLength(1);
    // Average delay: (1 + 2 + 0) / 3 = 1.0
    expect(results[0].averageDelay).toBe(1.0);
    // On-time percentage: 1/3 = 33.33... → 33.3
    expect(results[0].onTimePercentage).toBe(33.3);
    
    // Verify rounding is working properly
    expect(typeof results[0].averageDelay).toBe('number');
    expect(typeof results[0].onTimePercentage).toBe('number');
  });
});