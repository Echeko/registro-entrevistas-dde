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
  // Obtenemos la fecha local correcta
  const d = new Date();
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const hoy = `${anio}-${mes}-${dia}`;
  
  // Variables para las consultas del mes y año
  const mesActual = hoy.slice(0, 7);
  const anioActual = hoy.slice(0, 4);

  const base = () => supabaseClient.from('entrevistas').select('*', { count:'exact', head:true });

  async function contar(q) { const { count } = await q; return count ?? 0; }

  document.getElementById('kHoy').textContent      = await contar(base().eq('fecha', hoy));
  document.getElementById('kMes').textContent      = await contar(base().gte('fecha', mesActual+'-01').lte('fecha', mesActual+'-31'));
  document.getElementById('kAnio').textContent     = await contar(base().gte('fecha', anioActual+'-01-01').lte('fecha', anioActual+'-12-31'));
  document.getElementById('kEspera').textContent   = await contar(base().eq('fecha', hoy).eq('estado','En espera'));
  document.getElementById('kAtendido').textContent = await contar(base().eq('fecha', hoy).eq('estado','Atendido'));

  const { data } = await supabaseClient.from('entrevistas')
    .select('*').order('creado_en', { ascending:false }).limit(5);

  const tbody = document.getElementById('tablaUltimos');
  (data || []).forEach(r => {
    const badge = 'b-' + r.estado.toLowerCase().replace(/\s/g,'');
    const horaCorta = r.hora ? r.hora.slice(0, 5) : ''; 
    
    tbody.innerHTML += '<tr>' +
      '<td><strong>#' + r.turno + '</strong></td>' +
      '<td>' + r.fecha + '</td>' +
      '<td>' + horaCorta + '</td>' +
      '<td>' + r.nombre + '</td>' +
      '<td>' + r.motivo + '</td>' +
      '<td><span class="badge ' + badge + '">' + r.estado + '</span></td>' +
      '</tr>';
  });
})();
