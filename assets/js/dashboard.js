// Panel de estadísticas administrativas.
const $ = (id) => document.getElementById(id);

(async function iniciarDashboard() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session) {
    window.location.href = 'login.html';
    return;
  }
  $('usuario').textContent = session.user.email || 'Administrador';
  $('btnSalir').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
  await cargarDashboard();
})();

function fechaLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function contar(consulta) {
  const { count, error } = await consulta;
  if (error) {
    console.error('Error al contar registros:', error);
    return '—';
  }
  return count ?? 0;
}

async function cargarDashboard() {
  const hoy = fechaLocalISO();
  const mes = hoy.slice(0, 7);
  const anio = hoy.slice(0, 4);
  const base = () => supabaseClient.from('entrevistas').select('id', { count: 'exact', head: true });

  $('kHoy').textContent = await contar(base().eq('fecha_atencion', hoy));
  $('kMes').textContent = await contar(base().gte('fecha_atencion', `${mes}-01`).lte('fecha_atencion', `${mes}-31`));
  $('kAnio').textContent = await contar(base().gte('fecha_atencion', `${anio}-01-01`).lte('fecha_atencion', `${anio}-12-31`));
  $('kEspera').textContent = await contar(base().eq('fecha_atencion', hoy).eq('estado', 'En espera'));
  $('kAtendido').textContent = await contar(base().eq('fecha_atencion', hoy).eq('estado', 'Atendido'));

  const { data, error } = await supabaseClient.from('entrevistas')
    .select('turno,fecha_atencion,hora_atencion,nombre,motivo,estado')
    .order('creado_en', { ascending: false }).limit(5);

  const tbody = $('tablaUltimos');
  tbody.replaceChildren();
  if (error) {
    console.error(error);
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'No se pudieron cargar los últimos registros.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const r of data || []) {
    const tr = document.createElement('tr');
    const valores = [
      `#${r.turno}`,
      r.fecha_atencion,
      (r.hora_atencion || '').slice(0, 5),
      r.nombre,
      r.motivo,
      r.estado
    ];
    for (const valor of valores) {
      const td = document.createElement('td');
      td.textContent = valor ?? '—';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}
