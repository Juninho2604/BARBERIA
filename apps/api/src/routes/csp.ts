import type { FastifyPluginAsync } from "fastify";

/**
 * Recibe reportes de violaciones de la CSP report-only de la web y los deja
 * en el log (`docker compose logs api | grep csp-violation`). Sirve para
 * ajustar la política antes de pasarla a enforcing. Público por diseño: lo
 * llama el navegador; por eso va truncado y con rate limit.
 */
export const cspRoutes: FastifyPluginAsync = async (app) => {
  for (const type of ["application/csp-report", "application/reports+json"]) {
    app.addContentTypeParser(type, { parseAs: "string", bodyLimit: 16_384 }, (_req, body, done) =>
      done(null, body),
    );
  }

  app.post(
    "/",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? "");
      req.log.warn({ cspViolation: raw.slice(0, 2000) }, "csp-violation");
      return reply.status(204).send();
    },
  );
};
