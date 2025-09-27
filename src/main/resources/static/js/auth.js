// simple frontend auth helpers for login/signup (used by login.html, admin.html & signup.html)

// Show toast-style messages (very small)
function showMessage(msg, type = 'info') {
  alert(msg);
}

// validate email via simple regex
function isValidEmail(e) {
  return /\S+@\S+\.\S+/.test(e);
}

/* --------- registration (unchanged) --------- */
async function authRegister() {
  const email = document.getElementById('signupEmail').value.trim();
  const pwd = document.getElementById('signupPassword').value;
  const pwd2 = document.getElementById('signupConfirm').value;

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email.');
    return;
  }
  if (pwd.length < 8) {
    showMessage('Password must be at least 8 characters.');
    return;
  }
  if (pwd !== pwd2) {
    showMessage('Passwords do not match.');
    return;
  }

  const payload = { email, password: pwd };

  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      showMessage('Registration failed: ' + txt);
      return;
    }

    showMessage('Registered successfully. You can now sign in.');
    window.location.href = '/login.html';
  } catch (err) {
    console.error(err);
    showMessage('Registration error: ' + err.message);
  }
}

/* --------- login (used by passenger + admin pages) --------- */
async function authLogin() {
  // reads the global inputs with ids loginEmail / loginPassword
  const emailEl = document.getElementById('loginEmail');
  const pwdEl = document.getElementById('loginPassword');
  if (!emailEl || !pwdEl) { showMessage('Login fields not found on page.'); return; }

  const email = emailEl.value.trim();
  const pwd = pwdEl.value;

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email.');
    return;
  }
  if (pwd.length < 8) {
    showMessage('Password must be at least 8 characters.');
    return;
  }

  const payload = { email, password: pwd };

  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      showMessage('Login failed: ' + txt);
      return;
    }

    const data = await resp.json();

    // store token & role for simple client-side use (NOT a secure auth approach)
    try {
      if (data.token) localStorage.setItem('lankarail_token', data.token);
      if (data.role) localStorage.setItem('lankarail_role', JSON.stringify([data.role]));
    } catch(e){ /* ignore localStorage errors */ }

    showMessage('Login successful.');

    // redirect based on role (simple heuristic)
    const role = (data.role || '').toUpperCase();
    if (role.includes('ADMIN')) {
      // admin logged in -> go to admin portal (you should create admin.html / admin dashboard)
      window.location.href = '/admin.html';
    } else {
      // normal passenger -> go to home or dashboard
      window.location.href = '/';
    }
  } catch (err) {
    console.error(err);
    showMessage('Login error: ' + err.message);
  }
}
