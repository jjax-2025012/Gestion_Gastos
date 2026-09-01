import dotenv from "dotenv";

dotenv.config();

/**
 * Lee una variable de entorno obligatoria.
 * Si no está definida, detiene la aplicación con un mensaje claro,
 * en lugar de continuar con un valor "quemado" o undefined.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Falta la variable de entorno "${name}". Revisa tu archivo .env (puedes basarte en .env.example).`
    );
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",

  db: {
    host: requireEnv("DB_HOST"),
    port: parseInt(requireEnv("DB_PORT"), 10),
    database: requireEnv("DB_NAME"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
  },

    jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  },
};
