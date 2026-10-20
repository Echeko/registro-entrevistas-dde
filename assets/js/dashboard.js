(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return window.location.href = 'login.html';
  document.getElementById('usuario').textContent = session.user.email;
})();

document.getElementById('btnSalir').addEventListener('click', async (e) => {
  e.preventDefault();
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
});

(async () => {
  const hoy = new Date().toISOString().split('T')[0];
  const mes = hoy.slice(0, 7);
  const anio = hoy.slice(0, 4);
  const base = () => supabaseClient.from('entrevistas').select('*', { count:'exact', head:true });

  async function contar(q) { const { count } = await q; return count ?? 0; }

  document.getElementById('kHoy').textContent      = await contar(base().eq('fecha', hoy));
  document.getElementById('kMes').textContent      = await contar(base().gte('fecha', mes+'-01').lte('fecha', mes+'-31'));
  document.getElementById('kAnio').textContent     = await contar(base().gte('fecha', anio+'-01-01').lte('fecha', anio+'-12-31'));
  document.getElementById('kEspera').textContent   = await contar(base().eq('fecha', hoy).eq('estado','En espera'));
  document.getElementById('kAtendido').textContent = await contar(base().eq('fecha', hoy).eq('estado','Atendido'));

  const { data } = await supabaseClient.from('entrevistas')
    .select('*').order('creado_en', { ascending:false }).limit(5);

  const tbody = document.getElementById('tablaUltimos');
  (data || []).forEach(r => {
    const badge = 'b-' + r.estado.toLowerCase().replace(/\s/g,'');
    tbody.innerHTML += '<tr>' +
      '<td><strong>#' + r.turno + '</strong></td>' +
      '<td>' + r.fecha + '</td>' +
      '<td>' + r.hora.split('.')[0] + '</td>' +
      '<td>' + r.nombre + '</td>' +
      '<td>' + r.motivo + '</td>' +
      '<td><span class="badge ' + badge + '">' + r.estado + '</span></td>' +
      '</tr>';
  });
})();
