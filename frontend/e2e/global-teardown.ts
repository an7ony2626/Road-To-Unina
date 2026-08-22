import { execFileSync } from 'node:child_process';

// Every user created by these tests is named e2e<timestamp><random>
// (see createTestUser in helpers.ts). This runs once, after the whole
// suite, and deletes them all in one shot. Thanks to ON DELETE CASCADE
// on games.user_id and game_steps.game_id (schema.sql), their games and
// game steps disappear with them — nothing else needs to be cleaned up,
// and nothing they touched (leaderboard, completed games) is left behind.
export default function globalTeardown(): void {
  const password = process.env['DB_PASSWORD'];
  if (!password) {
    console.warn(
      '[e2e teardown] DB_PASSWORD non impostata: salto la pulizia degli utenti e2e*. ' +
        'Esegui manualmente: DELETE FROM users WHERE username LIKE \'e2e%\';',
    );
    return;
  }

  try {
    execFileSync('psql', ['-h', 'localhost', '-U', 'postgres', '-d', 'roadtounina', '-c', "DELETE FROM users WHERE username LIKE 'e2e%';"], {
      env: { ...process.env, PGPASSWORD: password },
      stdio: 'pipe',
    });
    console.log('[e2e teardown] Utenti e2e* rimossi (partite e step in cascata).');
  } catch (error) {
    console.warn(
      '[e2e teardown] Pulizia automatica fallita (psql non trovato o connessione non riuscita). ' +
        'Ripulisci manualmente: DELETE FROM users WHERE username LIKE \'e2e%\';',
      error,
    );
  }
}