import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { scrapingRoutes } from "./routes/scraping";

const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
  },
});

async function start() {
  try {
    // CORS: permitir origen del frontend en desarrollo
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    });

    // Registrar rutas de scraping
    await fastify.register(scrapingRoutes, { prefix: "/api/scraping" });

    // Root endpoint
    fastify.get("/", async () => {
      return {
        service: "Scraping Service",
        version: "1.0.0",
        description: "Microservicio independiente para scraping de SIMA",
        endpoints: {
          courses: "POST /api/scraping/courses",
          schedule: "POST /api/scraping/schedule/:period",
          upcoming: "POST /api/scraping/upcoming/:courseId",
          health: "GET /api/scraping/health",
        },
      };
    });

    const port = parseInt(process.env.SCRAPING_PORT || "3001");
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    console.log(` Scraping Service running at http://${host}:${port}`);
    console.log(` Health check: http://${host}:${port}/api/scraping/health`);
  } catch (error) {
    console.error(" Error starting scraping service:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\n Shutting down scraping service...");
  try {
    await fastify.close();
    console.log(" Scraping service shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error(" Error during shutdown:", error);
    process.exit(1);
  }
});

start();
