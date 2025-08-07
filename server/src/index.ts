
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { uploadFileInputSchema, getFileInputSchema } from './schema';
import { uploadFile } from './handlers/upload_file';
import { getFile } from './handlers/get_file';
import { getFileStats } from './handlers/get_file_stats';
import { serveFile } from './handlers/serve_file';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Upload file endpoint
  uploadFile: publicProcedure
    .input(uploadFileInputSchema)
    .mutation(({ input }) => uploadFile(input)),
  
  // Get file metadata endpoint
  getFile: publicProcedure
    .input(getFileInputSchema)
    .query(({ input }) => getFile(input)),
  
  // Get file statistics for homepage
  getFileStats: publicProcedure
    .query(() => getFileStats()),
  
  // Serve file endpoint (for downloading)
  serveFile: publicProcedure
    .input(getFileInputSchema)
    .query(({ input }) => serveFile(input)),
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
  console.log(`Earl Box TRPC server listening at port: ${port}`);
}

start();
