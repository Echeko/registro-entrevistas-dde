// Reloj en vivo
function actualizarReloj() {
  const d = new Date();
  document.getElementById('fechaActual').textContent =
    d.toLocaleDateString('es-BO', { day:'2-digit', month:'long', year:'numeric' });
  document.getElementById('horaActual').textContent =
    d.toLocaleTimeString('es-BO');
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

// Stats del dia
async function cargarStats() {
  const hoy = new Date().toISOString().split('T')[0];
  const { count: total } = await supabaseClient
    .from('entrevistas').select('*', { count:'exact', head:true })
    .eq('fecha', hoy);
  const { count: espera } = await supabaseClient
    .from('entrevistas').select('*', { count:'exact', head:true })
    .eq('fecha', hoy).eq('estado', 'En espera');
  document.getElementById('statHoy').textContent = total ?? 0;
  document.getElementById('statEspera').textContent = espera ?? 0;
}
cargarStats();

// Envio del formulario
// Envio del formulario
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnRegistrar');
  const msg = document.getElementById('mensaje');
  
  // 1. Validar día de la semana (0=Domingo, 6=Sábado)
  const hoy = new Date();
  if (hoy.getDay() === 0 || hoy.getDay() === 6) {
    msg.className = 'mensaje error';
    msg.textContent = 'Solo se permiten registros de Lunes a Viernes.';
    return;
  }

  // 2. Validar que la hora esté en el rango de 08:00 a 16:00
  let horaSeleccionada = document.getElementById('horaAtencion').value;
// Si la hora tiene formato HH:MM (5 caracteres), le agregamos los segundos
if (horaSeleccionada.length === 5) {
    horaSeleccionada = horaSeleccionada + ':00';
}
  if (horaSeleccionada < "08:00" || horaSeleccionada > "16:00") {
    msg.className = 'mensaje error';
    msg.textContent = 'La hora debe estar entre las 08:00 y las 16:00.';
    return;
  }

  btn.disabled = true; btn.textContent = 'Guardando...';
  msg.className = 'mensaje'; msg.style.display = 'none';

  // 3. Enviamos los datos a Supabase (incluyendo la hora)
  const { data, error } = await supabaseClient.rpc('registrar_entrevista', {
    p_nombre:      document.getElementById('nombre').value.trim(),
    p_ci:          document.getElementById('ci').value.trim(),
    p_telefono:    document.getElementById('telefono').value.trim(),
    p_motivo:      document.getElementById('motivo').value,
    p_funcionario: document.getElementById('funcionario').value.trim(),
    p_area:        document.getElementById('area').value.trim(),
    p_observaciones: document.getElementById('observaciones').value.trim(),
    p_hora:        horaSeleccionada
  });

  btn.disabled = false; btn.textContent = 'Registrar Entrevista';

  if (error) {
    msg.className = 'mensaje error';
    // Si la base de datos dice que la hora está ocupada (el código de error 23505)
    if (error.code === '23505') {
      msg.textContent = 'Esa hora ya fue reservada por otra persona. Por favor elige otra.';
    } else {
      msg.textContent = 'Error: ' + error.message;
    }
  } else {
    const row = Array.isArray(data) ? data[0] : data;
    msg.className = 'mensaje ok';
    msg.innerHTML = '<strong>Turno N ' + row.turno + '</strong> registrado.<br>Hora asignada: ' + row.hora;
    e.target.reset();
    cargarStats();
  }
});
