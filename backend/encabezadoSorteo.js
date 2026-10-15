// encabezadoSorteo.js — Arma el encabezado de la Lista Completa ("Todo") de
// WhatsApp a partir de los datos del sorteo: nombre del bingo, fecha y hora,
// costo del cartón y las figuras a jugar con su monto. Se usa cuando el sorteo
// tiene activada la opción "Usar la información del sorteo" (columna
// sorteos.encabezado_auto); así el texto siempre refleja el sorteo actual -- si
// cambian la fecha, el costo, las figuras o (en premio por porcentaje) lo
// vendido, el encabezado cambia solo.
//
// Los números van con el MISMO formato que los de la lista de cartones (dígitos
// en emoji: 1️⃣0️⃣), y el color del cartón no se menciona.

// Nombre del bingo (el de este sistema; cada sistema define el suyo acá).
const NOMBRE_BINGO = "Bingo JY";

const EMOJI_DIGITS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

// Convierte los dígitos de un texto a emoji (deja intacto lo demás: ":" "." ",").
function conEmojis(texto) {
  return String(texto).replace(/\d/g, (d) => EMOJI_DIGITS[+d]);
}

// Monto en Bs: sin decimales si es entero (50 -> 5️⃣0️⃣), con 2 si no (37.5 -> 3️⃣7️⃣.5️⃣0️⃣).
function montoEmoji(n) {
  const v = Number(n) || 0;
  return `Bs ${conEmojis(Number.isInteger(v) ? v : v.toFixed(2))}`;
}

// fecha_hora viene como "YYYY-MM-DDTHH:mm" sin zona: se interpreta tal cual,
// sin convertir (la hora que escribió el admin es la que se muestra).
function fechaHoraTexto(fechaHora) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(fechaHora || '');
  if (!m) return { fecha: '', hora: '' };
  const [, y, mo, d, h, mi] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const dia = dt.toLocaleDateString('es-VE', { weekday: 'long', timeZone: 'UTC' });
  const mes = dt.toLocaleDateString('es-VE', { month: 'long', timeZone: 'UTC' });
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return {
    fecha: `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${conEmojis(d)} de ${mes}`,
    hora: `${conEmojis(`${h12}:${String(mi).padStart(2, '0')}`)} ${h >= 12 ? 'PM' : 'AM'}`,
  };
}

// sorteo: fila de la tabla sorteos. figuras: [{ label, premio, porcentaje }] (premio en Bs ya calculado).
function armarEncabezado(sorteo, figuras) {
  const { fecha, hora } = fechaHoraTexto(sorteo.fecha_hora);
  // Premio de cada figura: el monto en Bs; si todavía no hay (sorteo por porcentaje
  // sin ventas, o sin montos definidos) se muestra el porcentaje o "por definir"
  // en vez de dejar la figura sin premio al lado.
  const textoPremio = (f) => {
    if (sorteo.modo_premio !== 'sin_premio') {
      if (f.premio > 0) return montoEmoji(f.premio);
      if (sorteo.modo_premio === 'porcentaje' && f.porcentaje > 0) return `${conEmojis(f.porcentaje)}% del premio`;
    }
    return 'premio por definir';
  };
  const venta = sorteo.tipo_venta > 1 ? `Combo x${conEmojis(sorteo.tipo_venta)}` : 'Cartón';
  const cabecera = [
    `🎰 *${NOMBRE_BINGO.toUpperCase()}* 🎰`,
    sorteo.nombre ? `*${String(sorteo.nombre).toUpperCase()}*` : '',
    fecha ? `📅 ${fecha} · ⏰ ${hora}` : '',
    `💰 ${venta}: ${montoEmoji(sorteo.costo)}`,
  ].filter(Boolean);
  const lineasFiguras = figuras.map((f) => `🏆 *${f.label}* — ${textoPremio(f)}`);
  return (lineasFiguras.length ? [...cabecera, '', ...lineasFiguras] : cabecera).join('\n');
}

module.exports = { armarEncabezado };
