// Registro público de entrevistas - DDE
// Requiere supabase-client.js cargado antes de este archivo.

const $ = (id) => document.getElementById(id);
const form = $('formRegistro');
const btn = $('btnRegistrar');
const msg = $('mensaje');
const inputFecha = $('fechaAtencion');

function fechaLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mostrarMensaje(texto, tipo = 'error') {
  msg.className = `mensaje ${tipo}`;
  msg.textContent = texto;
  msg.style.display = 'block';
}

function actualizarReloj() {
  const d = new Date();
  if ($('fechaActual')) $('fechaActual').textContent =
    d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  if ($('horaActual')) $('horaActual').textContent =
    d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
actualizarReloj();
setInterval(actualizarReloj, 1000);

if (inputFecha) inputFecha.min = fechaLocalISO();

// Solo se muestran agregados, nunca nombres o datos personales al público.
async function cargarStats() {
  // Se requiere crear la función SQL obtener_estadisticas_publicas() de la migración.
  const { data, error } = await supabaseClient.rpc('obtener_estadisticas_publicas');
  if (error) {
    console.warn('No se pudieron cargar las estadísticas públicas:', error.message);
    if ($('statHoy')) $('statHoy').textContent = '—';
    if ($('statEspera')) $('statEspera').textContent = '—';
    return;
  }
  const stats = Array.isArray(data) ? data[0] : data;
  if ($('statHoy')) $('statHoy').textContent = stats?.registrados ?? 0;
  if ($('statEspera')) $('statEspera').textContent = stats?.en_espera ?? 0;
}
cargarStats();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.style.display = 'none';

  if (!form.reportValidity()) return;

  const nombre = $('nombre').value.trim().replace(/\s+/g, ' ');
  const ci = $('ci').value.trim();
  const telefono = $('telefono').value.trim();
  const motivo = $('motivo').value;
  const rol = $('rol').value;
  const area = $('area').value;
  const fecha = $('fechaAtencion').value;
  let hora = $('horaAtencion').value;
  const observaciones = $('observaciones').value.trim();

  if (nombre.length < 3) return mostrarMensaje('Ingrese el nombre completo (mínimo 3 caracteres).');
  if (!/^\d{6,8}$/.test(ci)) return mostrarMensaje('El CI debe tener entre 6 y 8 números.');
  if (telefono && !/^\d{8}$/.test(telefono)) return mostrarMensaje('El celular debe tener exactamente 8 números.');
  if (!fecha) return mostrarMensaje('Seleccione la fecha deseada.');
  if (fecha < fechaLocalISO()) return mostrarMensaje('La fecha no puede ser anterior a hoy.');

  // Evita problemas de zona horaria al interpretar la fecha seleccionada.
  const [yyyy, mm, dd] = fecha.split('-').map(Number);
  const diaSemana = new Date(yyyy, mm - 1, dd).getDay();
  if (diaSemana === 0 || diaSemana === 6) return mostrarMensaje('Solo se permiten solicitudes de lunes a viernes.');
  if (!hora) return mostrarMensaje('Seleccione la hora deseada.');
  if (hora < '08:00' || hora > '16:00') return mostrarMensaje('La hora debe estar entre las 08:00 y las 16:00.');
  if (observaciones.length < 5) return mostrarMensaje('Describa brevemente su caso (mínimo 5 caracteres).');
  if (observaciones.length > 150) return mostrarMensaje('La descripción no debe superar 150 caracteres.');

  if (hora.length === 5) hora += ':00';

  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Registrando...';

  try {
    const { data, error } = await supabaseClient.rpc('registrar_entrevista', {
      p_nombre: nombre,
      p_ci: ci,
      p_telefono: telefono || null,
      p_motivo: motivo,
      p_funcionario: 'Por asignar',
      p_area: area,
      p_observaciones: observaciones,
      p_hora: hora,
      p_rol: rol,
      p_fecha: fecha
    });

    if (error) {
      console.error('Error al registrar entrevista:', error);
      if (error.code === '23505') {
        mostrarMensaje('Ese horario ya tiene una solicitud. Elija otra hora.');
      } else if (error.code === 'PGRST202' || error.code === '42883') {
        mostrarMensaje('La base de datos necesita actualizarse. Informe al administrador del sistema.');
      } else {
        mostrarMensaje('No se pudo registrar la solicitud. Verifique los datos e inténtelo nuevamente.');
      }
      return;
    }

    const fila = Array.isArray(data) ? data[0] : data;
    if (!fila) {
      mostrarMensaje('La solicitud se envió, pero no se recibió el número de turno. Consulte al administrador.');
      return;
    }

    // textContent evita insertar datos procedentes de usuarios como HTML.
    msg.className = 'mensaje ok';
    msg.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = `Solicitud registrada. Turno N.º ${fila.turno}.`;
    const detalle = document.createElement('p');
    detalle.textContent = `Fecha solicitada: ${fecha} a las ${hora.slice(0, 5)}. La atención queda sujeta a confirmación de la Dirección Distrital.`;
    msg.append(strong, detalle);
    msg.style.display = 'block';
    form.reset();
    if (inputFecha) inputFecha.min = fechaLocalISO();
    await cargarStats();
  } catch (err) {
    console.error('Error inesperado:', err);
    mostrarMensaje('Ocurrió un error de conexión. Revise su internet e inténtelo nuevamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
});
