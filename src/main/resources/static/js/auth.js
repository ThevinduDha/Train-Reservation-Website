// auth.js
// Frontend auth helpers for register / login / logout
// Uses credentials: 'same-origin' so browser keeps the JSESSIONID cookie
// Stores simple role/email in localStorage for client UI (NOT secure auth)

function showMessage(msg, type = 'info') {
  // Basic notification (replace with better UI if you want)
  alert(msg);
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

async function parseErrorResponse(resp) {
  try {
    const txt = await resp.text();
    try {
      return JSON.parse(txt);
    } catch (e) {
      return txt || resp.statusText;
    }
  } catch (e) {
    return resp.statusText || 'Unknown error';
  }
}

/* ------------------ Register ------------------ */
async function authRegister() {
  const email = (document.getElementById('signupEmail')?.value || '').trim();
  const pwd = document.getElementById('signupPassword')?.value || '';
  const pwd2 = document.getElementById('signupConfirm')?.value || '';

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
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await parseErrorResponse(resp);
      showMessage('Registration failed: ' + (typeof err === 'string' ? err : JSON.stringify(err)));
      return;
    }

    showMessage('Registered successfully. You can now sign in.');
    window.location.href = '/login.html';
  } catch (err) {
    console.error(err);
    showMessage('Registration error: ' + err.message);
  }
}

/* ------------------ Login ------------------ */
async function authLogin() {
  // Support both passenger and admin pages (ids may differ)
  const emailEl = document.getElementById('loginEmail') || document.getElementById('adminEmail');
  const pwdEl = document.getElementById('loginPassword') || document.getElementById('adminPassword');

  if (!emailEl || !pwdEl) {
    showMessage('Login fields not found on page.');
    return;
  }

  const email = (emailEl.value || '').trim();
  const password = pwdEl.value || '';

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email.');
    return;
  }
  if (password.length < 8) {
    showMessage('Password must be at least 8 characters.');
    return;
  }

  const payload = { email, password };

  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await parseErrorResponse(resp);
      const errMsg = (typeof err === 'string') ? err : (err.error || JSON.stringify(err));
      showMessage('Login failed: ' + errMsg);
      return;
    }

    const data = await resp.json().catch(() => null);

    // store minimal client state for UI (not secure)
    try {
      // token may be blank if you use sessions; store if present
      if (data?.token) localStorage.setItem('lankarail_token', data.token);

      // robust role parsing:
      let roles = [];
      if (Array.isArray(data?.roles)) {
        // roles array may contain strings or objects
        roles = data.roles.map(r => {
          if (!r) return '';
          if (typeof r === 'string') return r;
          // object shape: { authority: 'ROLE_ADMIN' } or similar
          return r.authority || r.role || JSON.stringify(r);
        }).filter(Boolean);
      } else if (data?.role) {
        roles = [data.role];
      }

      // backend might return roles inside nested objects — try to normalize fallback
      if (!roles.length && data?.roles && typeof data.roles === 'object') {
        try {
          roles = Object.values(data.roles).map(v => (typeof v === 'string' ? v : (v.authority || v.role || ''))).filter(Boolean);
        } catch (e) { /* ignore */ }
      }

      if (roles.length) localStorage.setItem('lankarail_role', JSON.stringify(roles));
      localStorage.setItem('lankarail_email', email);
    } catch (e) {
      // ignore localStorage errors
    }

    showMessage('Login successful.');

    // Redirect: admin -> admin.html (or admin-dashboard.html), else passenger -> passenger-dashboard.html
    const roleStr = (JSON.parse(localStorage.getItem('lankarail_role') || '[]') || []).join(',').toUpperCase();
    if (roleStr.includes('ADMIN')) {
      // admin logged in
      window.location.href = '/admin-dashboard.html';
    } else {
      // passenger logged in
      window.location.href = '/passenger-dashboard.html';
    }
  } catch (err) {
    console.error(err);
    showMessage('Login error: ' + err.message);
  }
}

/* ------------------ Logout ------------------ */
async function authLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (e) {
    // ignore
  } finally {
    localStorage.removeItem('lankarail_token');
    localStorage.removeItem('lankarail_role');
    localStorage.removeItem('lankarail_email');
    window.location.href = '/login.html';
  }
}

/* ------------------ Auto attach handlers ------------------ */
document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e){
      e.preventDefault();
      authRegister();
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      authLogin();
    });
  }

  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', function(e){
      e.preventDefault();
      authLogin();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e){
      e.preventDefault();
      authLogout();
    });
  }
});
