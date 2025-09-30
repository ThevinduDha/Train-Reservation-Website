// auth.js
// Simple frontend helpers for registration + login used by login.html, signup.html and admin.html

function showMessage(msg, type = 'info') {
  // Very small/replaceable notification helper
  // type currently unused but kept for future UI improvements (success/error).
  alert(msg);
}

function isValidEmail(e) {
  return /\S+@\S+\.\S+/.test(e);
}

async function authRegister() {
  const emailEl = document.getElementById('signupEmail');
  const pwdEl = document.getElementById('signupPassword');
  const pwd2El = document.getElementById('signupConfirm');

  if (!emailEl || !pwdEl || !pwd2El) {
    showMessage('Registration form not found on page.');
    return;
  }

  const email = emailEl.value.trim();
  const pwd = pwdEl.value;
  const pwd2 = pwd2El.value;

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
      // try to read JSON or text error
      let errTxt;
      try { errTxt = await resp.text(); } catch(e){ errTxt = resp.statusText; }
      showMessage('Registration failed: ' + errTxt);
      return;
    }

    showMessage('Registered successfully. You can now sign in.');
    window.location.href = '/login.html';
  } catch (err) {
    console.error(err);
    showMessage('Registration error: ' + err.message);
  }
}

async function authLogin() {
  const emailEl = document.getElementById('loginEmail');
  const pwdEl = document.getElementById('loginPassword');
  if (!emailEl || !pwdEl) {
    showMessage('Login fields not found on page.');
    return;
  }

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
      let txt;
      try { txt = await resp.text(); } catch(e){ txt = resp.statusText; }
      showMessage('Login failed: ' + txt);
      return;
    }

    const data = await resp.json();

    // Normalise role(s):
    // Backends differ — some return `role`, some return `roles` as collection, some return authorities.
    let roles = [];

    if (data.role) {
      // single role string like "ROLE_ADMIN"
      roles = [data.role];
    } else if (Array.isArray(data.roles)) {
      // roles array (maybe of strings or authority objects)
      roles = data.roles.map(r => {
        if (typeof r === 'string') return r;
        if (r && r.authority) return r.authority;
        return String(r);
      });
    } else if (data.roles && typeof data.roles === 'object') {
      // maybe it's a Set/collection stringified — try to derive
      roles = [String(data.roles)];
    } else if (data.authorities) {
      // Spring Security principal often returns authorities
      roles = data.authorities.map(a => (a.authority || String(a)));
    } else if (data.message && data.email && data.roles) {
      // older shape: {message,email,roles}
      roles = Array.isArray(data.roles) ? data.roles : [data.roles];
    } else {
      // last fallback: try to read any "roles" key
      if (typeof data === 'object') {
        for (const k of ['roles', 'authorities', 'authority']) {
          if (data[k]) {
            if (Array.isArray(data[k])) roles = data[k].map(x => (x.authority || x));
            else roles = [data[k]];
            break;
          }
        }
      }
    }

    // Save token if provided (you said you currently don't use JWTs, but keep support)
    try {
      if (data.token) localStorage.setItem('lankarail_token', data.token);
      if (roles && roles.length) localStorage.setItem('lankarail_role', JSON.stringify(roles));
      localStorage.setItem('lankarail_email', data.email || email);
    } catch (e) {
      // ignore localStorage errors
    }

    showMessage('Login successful.');

    // Redirect logic:
    const roleUpper = (roles.join(',') || '').toUpperCase();
    if (roleUpper.includes('ADMIN')) {
      window.location.href = '/admin.html';
    } else {
      // passenger dashboard page (create passenger-dashboard.html)
      window.location.href = '/passenger-dashboard.html';
    }
  } catch (err) {
    console.error(err);
    showMessage('Login error: ' + err.message);
  }
}

// optional small logout helper used by dashboards
async function authLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (e) {
    // ignore network errors
  } finally {
    try {
      localStorage.removeItem('lankarail_token');
      localStorage.removeItem('lankarail_role');
      localStorage.removeItem('lankarail_email');
    } catch (e) { /* ignore */ }
    window.location.href = '/login.html';
  }
}

// expose functions globally if needed
window.authRegister = authRegister;
window.authLogin = authLogin;
window.authLogout = authLogout;
