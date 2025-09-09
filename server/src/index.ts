import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { 
  predictionInputSchema, 
  type DashboardStats, 
  type RouteStats, 
  type QueryRecord 
} from './schema';
import { predictDelay } from './handlers/predict_delay';
import { getRecentQueries } from './handlers/get_recent_queries';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getRouteStats } from './handlers/get_route_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Predict transit delay endpoint
  predict: publicProcedure
    .input(predictionInputSchema)
    .mutation(({ input }) => predictDelay(input)),

  // Get recent queries for dashboard
  getRecentQueries: publicProcedure
    .input(predictionInputSchema.pick({ route: true }).optional()) // Optional route filter
    .query(({ input }) => {
      const limit = 10; // Default limit
      return getRecentQueries(limit);
    }),

  // Get dashboard statistics
  getDashboardStats: publicProcedure
    .query((): Promise<DashboardStats> => getDashboardStats()),

  // Get route-specific statistics for charts
  getRouteStats: publicProcedure
    .query((): Promise<RouteStats[]> => getRouteStats()),

  // Get all queries (for admin/debugging purposes)
  getAllQueries: publicProcedure
    .query((): Promise<QueryRecord[]> => getRecentQueries(100)), // Get more records
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  server.listen(port);
  console.log(`🚌 Transit Delay Predictor TRPC server listening at port: ${port}`);
  console.log(`📊 Available endpoints:`);
  console.log(`  - /predict - Predict transit delays`);
  console.log(`  - /getDashboardStats - Get dashboard statistics`);
  console.log(`  - /getRecentQueries - Get recent prediction queries`);
  console.log(`  - /getRouteStats - Get route-specific statistics`);
  console.log(`  - /healthcheck - Health status`);
}

start();