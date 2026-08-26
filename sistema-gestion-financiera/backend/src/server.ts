import { app } from "./app";
import { env } from "./config/env";
import { checkDatabaseConnection } from "./db/pool";

async function start() {
  try {
    await checkDatabaseConnection();
    console.log("Conexión a PostgreSQL verificada correctamente.");
  } catch (error) {
    console.error(
      "No se pudo conectar a PostgreSQL. Verifica que esté corriendo y que las variables " +
        "de entorno en tu archivo .env sean correctas."
    );
    console.error(error);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${env.port}`);
  });
}

start();
