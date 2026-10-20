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
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnRegistrar');
  const msg = document.getElementById('mensaje');
  btn.disabled = true; btn.textContent = 'Guardando...';
  msg.className = 'mensaje'; msg.style.display = 'none';

  const { data, error } = await supabaseClient.rpc('registrar_entrevista', {
    p_nombre:      document.getElementById('nombre').value.trim(),
    p_ci:          document.getElementById('ci').value.trim(),
    p_telefono:    document.getElementById('telefono').value.trim(),
    p_motivo:      document.getElementById('motivo').value,
    p_funcionario: document.getElementById('funcionario').value.trim(),
    p_area:        document.getElementById('area').value.trim(),
    p_observaciones: document.getElementById('observaciones').value.trim()
  });

  btn.disabled = false; btn.textContent = 'Registrar Entrevista';

  if (error) {
    msg.className = 'mensaje error';
    if (error.code === '23505') {
      msg.textContent = 'Ya existe un registro con esa hora exacta. Espere 1 segundo.';
    } else {
      msg.textContent = 'Error: ' + error.message;
    }
  } else {
    const row = Array.isArray(data) ? data[0] : data;
    msg.className = 'mensaje ok';
    msg.innerHTML = '<strong>Turno N ' + row.turno + '</strong> registrado.<br>Hora: ' + row.hora;
    e.target.reset();
    cargarStats();
  }
});
