
import "dotenv/config";
import { pool } from "../src/db/pool";
import { hashPassword } from "../src/utils/password";

async function main() {
  const [, , argEmail, argUsername, argPassword] = process.argv;

  const email = argEmail ?? "prueba@correo.com";
  const username = argUsername ?? "Usuario de Prueba";
  const password = argPassword ?? "Prueba123!";

  const passwordHash = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash
     RETURNING id, username, email, created_at`,
    [username, email.toLowerCase().trim(), passwordHash]
  );

  console.log("Usuario de prueba listo:");
  console.log(result.rows[0]);
  console.log(`Contraseña (solo para pruebas locales, no la compartas): ${password}`);

  await pool.end();
}

main().catch((error) => {
  console.error("No se pudo crear el usuario de prueba:", error);
  process.exit(1);
});
