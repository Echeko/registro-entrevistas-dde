// Reloj en vivo
function actualizarReloj() {
// Bloquear fechas pasadas en el selector
const inputFecha = document.getElementById('fechaAtencion');
if (inputFecha) {
  const hoyStr = new Date().toISOString().split('T')[0];
  inputFecha.min = hoyStr; // El usuario no podrá elegir días anteriores a hoy
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

// Stats Generales (Cuenta todos los registros)
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
  
   // 1. Validar día de la semana de la FECHA SELECCIONADA
  const fechaSeleccionada = document.getElementById('fechaAtencion').value;
  if (!fechaSeleccionada) {
    msg.className = 'mensaje error';
    msg.textContent = 'Debe seleccionar una fecha.';
    return;
  }
  
  const [year, month, day] = fechaSeleccionada.split('-');
  const fechaObj = new Date(year, month - 1, day); // Mes en JS empieza en 0
  
  if (fechaObj.getDay() === 0 || fechaObj.getDay() === 6) {
    msg.className = 'mensaje error';
    msg.textContent = 'Solo se permiten registros de Lunes a Viernes.';
    return;
  }

  // 3. Validar que la hora esté en el rango de 08:00 a 16:00
  if (horaSeleccionada < "08:00:00" || horaSeleccionada > "16:00:00") {
    msg.className = 'mensaje error';
    msg.textContent = 'La hora debe estar entre las 08:00 y las 16:00.';
    return;
  }

  // 4. NUEVAS VALIDACIONES: CI y Celular
  const ciVal = document.getElementById('ci').value.trim();
  const telVal = document.getElementById('telefono').value.trim();

  if (!/^\d{6,8}$/.test(ciVal)) {
    msg.className = 'mensaje error';
    msg.textContent = 'El CI debe tener entre 6 y 8 números (sin letras ni espacios).';
    return;
  }

  if (telVal !== '' && !/^\d{8}$/.test(telVal)) {
    msg.className = 'mensaje error';
    msg.textContent = 'El Celular debe tener exactamente 8 números.';
    return;
  }

  btn.disabled = true; btn.textContent = 'Guardando...';
  msg.className = 'mensaje'; msg.style.display = 'none';

  // 5. Enviamos los datos a Supabase (Incluyendo el Rol)
    const { data, error } = await supabaseClient.rpc('registrar_entrevista', {
    p_nombre:      document.getElementById('nombre').value.trim(),
    p_ci:          ciVal,
    p_telefono:    telVal,
    p_motivo:      document.getElementById('motivo').value,
    p_funcionario: document.getElementById('funcionario').value.trim(),
    p_area:        document.getElementById('area').value.trim(),
    p_observaciones: document.getElementById('observaciones').value.trim(),
    p_hora:        horaSeleccionada,
    p_rol:         document.getElementById('rol').value,
    p_fecha:       fechaSeleccionada // <-- NUEVA LÍNEA
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
    
    setTimeout(() => { cargarStats(); }, 500); 
  }
});
