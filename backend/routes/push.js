// routes/push.js — Suscripción a notificaciones push (Web Push) para recibir
// el recordatorio de pago (ver backend/recordatorioPago.js) aunque el
// jugador tenga el navegador minimizado o haya cambiado de app. La clave
// pública VAPID es la única parte que necesita el frontend para armar la
// suscripción; las privadas nunca salen del backend.
//
// A diferencia de BINGOJULIETA, acá el jugador NO tiene sesión/login (no
// hay tabla de usuarios para jugadores, solo `jugadores` con nombre+whatsapp)
// -- se identifica desde la Consulta Pública de Cartas (por número o por
// nombre, ver routes/cartones.js /consulta y /consulta-nombre), que ya
// resuelve un jugador_id sin autenticación. Por eso estas rutas son
// públicas y reciben jugador_id explícito en el body, en vez de sacarlo de
// requireAuth + req.user.id como en BINGOJULIETA.
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// Alta o actualización: si el mismo endpoint (navegador/dispositivo) ya
// estaba suscripto (ej. otra persona consultó antes desde el mismo celular),
// se reasigna al jugador actual en vez de fallar por la restricción
// UNIQUE(endpoint).
router.post('/suscribir', (req, res) => {
  const { jugador_id, endpoint, keys } = req.body || {};
  const jugadorId = Number(jugador_id);
  if (!jugadorId || !endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }
  const jugador = db.prepare('SELECT id FROM jugadores WHERE id = ?').get(jugadorId);
  if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' });
  db.prepare(
    `INSERT INTO push_subscripciones (jugador_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET jugador_id = excluded.jugador_id, p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(jugadorId, endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

router.delete('/suscribir', (req, res) => {
  const { jugador_id, endpoint } = req.body || {};
  if (endpoint && jugador_id) {
    db.prepare('DELETE FROM push_subscripciones WHERE endpoint = ? AND jugador_id = ?').run(endpoint, Number(jugador_id));
  }
  res.json({ ok: true });
});

module.exports = router;
