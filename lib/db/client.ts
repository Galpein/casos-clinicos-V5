/**
 * Conexión a Postgres.
 *
 * Si no hay DATABASE_URL la aplicación NO se cae: el repositorio usa un
 * almacén en memoria (ver cases.repo.ts). Así el proyecto sigue arrancando
 * en local o en una demo sin base de datos, que es como ha vivido hasta ahora.
 */

import postgres from "postgres";

let client: postgres.Sql | null | undefined;

export function db(): postgres.Sql | null {
  if (client !== undefined) return client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[db] Sin DATABASE_URL: los casos se guardan sólo en memoria.");
    client = null;
    return client;
  }

  client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  return client;
}

export function hasDb(): boolean {
  return db() !== null;
}
