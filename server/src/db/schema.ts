import { serial, text, pgTable, timestamp, integer, real } from 'drizzle-orm/pg-core';

// Queries table to store user prediction requests and results
export const queriesTable = pgTable('queries', {
  id: serial('id').primaryKey(),
  route: text('route').notNull(), // Route number/identifier
  stop: text('stop').notNull(), // Stop ID
  datetime: timestamp('datetime').notNull(), // Requested prediction time
  weather: text('weather'), // Placeholder weather data (nullable)
  prediction: integer('prediction').notNull(), // Predicted delay in minutes
  confidence: real('confidence').notNull(), // Confidence score (70-95)
  created_at: timestamp('created_at').defaultNow().notNull(), // When query was made
});

// TypeScript types for the queries table
export type QueryRecord = typeof queriesTable.$inferSelect; // For SELECT operations
export type NewQueryRecord = typeof queriesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building and relations
export const tables = { 
  queries: queriesTable 
};