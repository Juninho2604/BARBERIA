import { loadEnv } from "./env.js";
import { buildServer } from "./server.js";

const env = loadEnv();

const app = await buildServer(env);

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info(`Recibido ${signal}, cerrando servidor…`);
    await app.close();
    process.exit(0);
  });
}
