// Panel administrativo de registros.
// Las políticas RLS de Supabase deben limitar la lectura/escritura a administradores.

let cacheRegistros = [];
const $ = (id) => document.getElementById(id);
const estadosPermitidos = ['En espera', 'Atendido', 'Derivado', 'Cancelado'];

(async function iniciar() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session) {
    window.location.href = 'login.html';
    return;
  }
  establecerFechas();
  $('btnSalir').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
  $('formFiltros').addEventListener('submit', (e) => {
    e.preventDefault();
    cargar();
  });
  $('btnExportar').addEventListener('click', exportarCSV);
  await cargar();
})();

function fechaLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function establecerFechas() {
  const hoy = fechaLocalISO();
  $('fechaDia').value = hoy;
  $('fechaMes').value = hoy.slice(0, 7);
  $('fechaAnio').value = hoy.slice(0, 4);
}

function crearCelda(fila, valor, opciones = {}) {
  const td = document.createElement('td');
  td.textContent = valor == null || valor === '' ? '—' : String(valor);
  if (opciones.clase) td.className = opciones.clase;
  if (opciones.estilo) Object.assign(td.style, opciones.estilo);
  fila.appendChild(td);
  return td;
}

async function cargar() {
  const tipo = $('tipo').value;
  let q = supabaseClient.from('entrevistas').select('*')
    .order('fecha_atencion', { ascending: false })
    .order('hora_atencion', { ascending: false })
    .limit(500);

  if (tipo === 'dia') {
    const f = $('fechaDia').value;
    if (f) q = q.eq('fecha_atencion', f);
  } else if (tipo === 'mes') {
    const m = $('fechaMes').value;
    if (m) {
      const [anio, mes] = m.split('-').map(Number);
      const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const finDate = new Date(anio, mes, 0);
      const fin = `${anio}-${String(mes).padStart(2, '0')}-${String(finDate.getDate()).padStart(2, '0')}`;
      q = q.gte('fecha_atencion', inicio).lte('fecha_atencion', fin);
    }
  } else if (tipo === 'anio') {
    const a = $('fechaAnio').value;
    if (a) q = q.gte('fecha_atencion', `${a}-01-01`).lte('fecha_atencion', `${a}-12-31`);
  }

  const { data, error } = await q;
  if (error) {
    console.error(error);
    alert('No se pudieron cargar los registros. Verifique sesión y permisos de Supabase.');
    return;
  }
  cacheRegistros = data || [];
  $('total').textContent = String(cacheRegistros.length);
  renderTabla();
}

function renderTabla() {
  const tbody = $('tablaRegistros');
  tbody.replaceChildren();

  for (const r of cacheRegistros) {
    const tr = document.createElement('tr');
    crearCelda(tr, `#${r.turno}`);
    crearCelda(tr, r.fecha_atencion || r.fecha);
    crearCelda(tr, (r.hora_atencion || r.hora || '').toString().slice(0, 5));
    crearCelda(tr, r.nombre);
    crearCelda(tr, r.ci);
    crearCelda(tr, r.telefono);
    crearCelda(tr, r.rol);
    crearCelda(tr, r.motivo);
    crearCelda(tr, r.area || r.funcionario);
    crearCelda(tr, r.observaciones, { estilo: { whiteSpace: 'normal', overflowWrap: 'anywhere', minWidth: '200px' } });

    const acciones = document.createElement('td');
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Estado del turno ${r.turno}`);
    for (const estado of estadosPermitidos) {
      const op = document.createElement('option');
      op.value = estado;
      op.textContent = estado;
      op.selected = r.estado === estado;
      select.appendChild(op);
    }
    select.addEventListener('change', () => cambiarEstado(r.id, select.value, select, r.estado));
    acciones.appendChild(select);

    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.textContent = 'Eliminar';
    eliminar.style.cssText = 'background:#d32f2f;padding:4px 8px;font-size:11px;margin-top:5px';
    eliminar.addEventListener('click', () => eliminarRegistro(r.id));
    acciones.appendChild(document.createElement('br'));
    acciones.appendChild(eliminar);
    tr.appendChild(acciones);
    tbody.appendChild(tr);
  }
}

async function cambiarEstado(id, nuevoEstado, control, estadoAnterior) {
  if (!estadosPermitidos.includes(nuevoEstado)) return;
  control.disabled = true;
  const { error } = await supabaseClient.from('entrevistas').update({ estado: nuevoEstado }).eq('id', id);
  control.disabled = false;
  if (error) {
    console.error(error);
    alert('No se pudo actualizar el estado. Verifique permisos.');
    control.value = estadoAnterior;
    return;
  }
  const fila = cacheRegistros.find(x => x.id === id);
  if (fila) fila.estado = nuevoEstado;
}

async function eliminarRegistro(id) {
  if (!confirm('¿Desea eliminar permanentemente este registro? Esta acción no se puede deshacer.')) return;
  const { error } = await supabaseClient.from('entrevistas').delete().eq('id', id);
  if (error) {
    console.error(error);
    alert('No se pudo eliminar el registro. Verifique permisos.');
    return;
  }
  cacheRegistros = cacheRegistros.filter(x => x.id !== id);
  renderTabla();
  $('total').textContent = String(cacheRegistros.length);
}

function exportarCSV() {
  if (!cacheRegistros.length) {
    alert('No hay registros para exportar.');
    return;
  }
  const encabezados = ['Turno','Fecha de atención','Hora de atención','Nombre','CI','Celular','Rol','Motivo','Área','Descripción','Estado'];
  const filas = cacheRegistros.map(r => [
    r.turno, r.fecha_atencion || r.fecha, r.hora_atencion || r.hora, r.nombre, r.ci,
    r.telefono, r.rol, r.motivo, r.area, r.observaciones, r.estado
  ]);
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [encabezados, ...filas].map(f => f.map(escapar).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `entrevistas_${fechaLocalISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
