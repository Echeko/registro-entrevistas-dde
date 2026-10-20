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

// Stats Generales (Cuenta todos los registros para evitar errores de zona horaria)
async function cargarStats() {
  const { count: total, error: e1 } = await supabaseClient
    .from('entrevistas').select('*', { count:'exact', head:true });
    
  const { count: espera, error: e2 } = await supabaseClient
    .from('entrevistas').select('*', { count:'exact', head:true })
    .eq('estado', 'En espera');

  if (!e1 && !e2) {
    document.getElementById('statHoy').textContent = total ?? 0;
    document.getElementById('statEspera').textContent = espera ?? 0;
  } else {
    console.error("Error al cargar stats:", e1 || e2);
  }
}
cargarStats();

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

  // 2. Capturar y formatear la hora
  let horaSeleccionada = document.getElementById('horaAtencion').value;
  if (horaSeleccionada.length === 5) {
      horaSeleccionada = horaSeleccionada + ':00';
  }

  // 3. Validar que la hora esté en el rango de 08:00 a 16:00
  if (horaSeleccionada < "08:00:00" || horaSeleccionada > "16:00:00") {
    msg.className = 'mensaje error';
    msg.textContent = 'La hora debe estar entre las 08:00 y las 16:00.';
    return;
  }

  btn.disabled = true; btn.textContent = 'Guardando...';
  msg.className = 'mensaje'; msg.style.display = 'none';

  // 4. Enviamos los datos a Supabase
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
    if (error.code === '23505') {
      msg.textContent = 'Esa hora ya fue reservada por otra persona. Por favor elige otra.';
    } else {
      msg.textContent = 'Error: ' + error.message;
    }
  } else {
    const row = Array.isArray(data) ? data[0] : data;
    msg.className = 'mensaje ok';
    msg.innerHTML = '<strong>Turno N ' + row.turno + '</strong> registrado.<br>Hora asignada: ' + row.v_hora;
    
    e.target.reset();
    
    // Actualizamos los contadores inmediatamente
    setTimeout(() => {
        cargarStats();
    }, 500); 
  }
});
