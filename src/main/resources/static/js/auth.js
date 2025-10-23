// auth.js
// Frontend auth helpers for register / login / logout

function showMessage(msg, type = 'info') {
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

      // *** MODIFIED ERROR HANDLING ***
      // Check if the error response is an object with our 'error' field
      let friendlyMessage = 'An unknown error occurred.';
      if (typeof err === 'object' && err !== null && err.error) {
        friendlyMessage = err.error; // Use the clean message from the server
      } else if (typeof err === 'string') {
        friendlyMessage = err;
      } else if (err.errors) {
        friendlyMessage = err.errors.join(', '); // For validation errors
      }

      showMessage('Registration failed: ' + friendlyMessage);
      // *** END OF MODIFICATION ***
      return;
    }

    showMessage('Registered successfully. You can now sign in.');
    window.location.href = '/login'; // Changed to controller path
  } catch (err) {
    console.error(err);
    showMessage('Registration error: ' + err.message);
  }
}

/* ------------------ Login ------------------ */
async function authLogin() {
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

    try {
      if (data?.token) localStorage.setItem('lankarail_token', data.token);

      let roles = [];
      if (Array.isArray(data?.roles)) {
        roles = data.roles.map(r => {
          if (!r) return '';
          if (typeof r === 'string') return r;
          return r.authority || r.role || JSON.stringify(r);
        }).filter(Boolean);
      } else if (data?.role) {
        roles = [data.role];
      }

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

    const roleStr = (JSON.parse(localStorage.getItem('lankarail_role') || '[]') || []).join(',').toUpperCase();
    if (roleStr.includes('ADMIN')) {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/passenger/dashboard';
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
    window.location.href = '/login';
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

  // This will re-attach to logout buttons on any page (admin or passenger)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e){
      e.preventDefault();
      authLogout();
    });
  }
});