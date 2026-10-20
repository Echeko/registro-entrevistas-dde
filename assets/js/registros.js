let cacheRegistros = [];

// Validar sesión al cargar
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return window.location.href = 'login.html';
})();

// Cerrar sesión
document.getElementById('btnSalir').addEventListener('click', async (e) => {
  e.preventDefault();
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
});

// Establecer fechas por defecto
const hoy = new Date().toISOString().split('T')[0];
document.getElementById('fechaDia').value = hoy;
document.getElementById('fechaMes').value = hoy.slice(0,7);
document.getElementById('fechaAnio').value = hoy.slice(0,4);

// Función principal para cargar la tabla
async function cargar() {
  const tipo = document.getElementById('tipo').value;
  let q = supabaseClient.from('entrevistas')
    .select('*')
    .order('fecha', { ascending:false })
    .order('hora', { ascending:false })
    .limit(500);

  if (tipo === 'dia') {
    q = q.eq('fecha', document.getElementById('fechaDia').value);
  } else if (tipo === 'mes') {
    const m = document.getElementById('fechaMes').value;
    q = q.gte('fecha', m+'-01').lte('fecha', m+'-31');
  } else if (tipo === 'anio') {
    const a = document.getElementById('fechaAnio').value;
    q = q.gte('fecha', a+'-01-01').lte('fecha', a+'-12-31');
  }

  const { data, error } = await q;
  if (error) return alert(error.message);
  
  cacheRegistros = data || [];
  document.getElementById('total').textContent = cacheRegistros.length;

  const tbody = document.getElementById('tablaRegistros');
  tbody.innerHTML = '';
  
  cacheRegistros.forEach(r => {
    // Formato de hora limpio HH:MM
    const horaCorta = r.hora ? r.hora.split('.')[0].slice(0, 5) : ''; 
    const obs = r.observaciones || '-';
    
    tbody.innerHTML += '<tr>' +
      '<td><strong>#' + r.turno + '</strong></td>' +
      '<td>' + r.fecha + '</td>' +
      '<td>' + horaCorta + '</td>' +
      '<td>' + r.nombre + '</td>' +
      '<td>' + r.ci + '</td>' +
      '<td>' + (r.telefono || '-') + '</td>' +
      '<td>' + (r.rol || '-') + '</td>' + 
      '<td>' + r.motivo + '</td>' +
      '<td>' + r.funcionario + '</td>' +
      '<td style="white-space: normal; word-wrap: break-word; min-width: 200px; text-align: justify;">' + obs + '</td>' +
      '<td>' +
        '<select onchange="cambiarEstado(' + r.id + ', this.value, this)" style="margin-bottom:5px;">' +
          '<option value="En espera" ' + (r.estado==='En espera'?'selected':'') + '>En espera</option>' +
          '<option value="Atendido" ' + (r.estado==='Atendido'?'selected':'') + '>Atendido</option>' +
          '<option value="Derivado" ' + (r.estado==='Derivado'?'selected':'') + '>Derivado</option>' +
          '<option value="Cancelado" ' + (r.estado==='Cancelado'?'selected':'') + '>Cancelado</option>' +
        '</select> ' +
        '<button onclick="eliminarRegistro(' + r.id + ')" style="background:#d32f2f; padding: 4px 8px; font-size:11px; margin-left: 5px;">Eliminar</button>' +
      '</td>' +
      '</tr>';
  });
}

// Función para actualizar el estado
window.cambiarEstado = async function(id, nuevoEstado, selectElement) {
  selectElement.disabled = true;
  const { error } = await supabaseClient.from('entrevistas').update({ estado: nuevoEstado }).eq('id', id);
  if (error) {
    alert('Error al cambiar estado: ' + error.message);
    cargar();
  } else {
    selectElement.disabled = false;
  }
}

// Función para eliminar un registro
window.eliminarRegistro = async function(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este registro permanentemente?')) return;
  
  const { error } = await supabaseClient.from('entrevistas').delete().eq('id', id);
  if (error) {
    alert('Error al eliminar: ' + error.message);
  } else {
    cargar(); // Recarga la tabla
  }
}

// Filtros
document.getElementById('formFiltros').addEventListener('submit', (e) => {
  e.preventDefault(); 
  cargar();
});

// Exportar a CSV
document.getElementById('btnExportar').addEventListener('click', () => {
  if (!cacheRegistros.length) return alert('No hay registros.');
  const head = 'Turno,Fecha,Hora,Nombre,CI,Celular,Rol,Motivo,Funcionario,Observaciones,Estado\n';
  const filas = cacheRegistros.map(r =>
    [
      r.turno, r.fecha, r.hora ? r.hora.split('.')[0] : '', r.nombre, r.ci, r.telefono || '',
      r.rol || '', r.motivo, r.funcionario, r.observaciones || '', r.estado
    ]
    .map(v => '"' + (v==null?'':v).toString().replace(/"/g,'""') + '"').join(',')
  ).join('\n');
  
  const blob = new Blob([head+filas], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'registros_' + hoy + '.csv';
  a.click();
});

// Iniciar la carga de datos
cargar();
