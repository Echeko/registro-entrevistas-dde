document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('mensaje');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    msg.className = 'mensaje error';
    msg.textContent = 'Error: ' + error.message;
  } else {
    window.location.href = 'dashboard.html';
  }
});
