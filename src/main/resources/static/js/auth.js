// auth.js — handles login & signup forms, client validations, animations.
// Save this to: src/main/resources/static/js/auth.js

(function () {
  // Helpers
  function el(id){ return document.getElementById(id); }
  function showAlert(targetId, type, message) {
    const container = el(targetId);
    if (!container) return;
    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }

  function setButtonLoading(btn, loading){
    const spinner = btn.querySelector('.spinner-border');
    const text = btn.querySelector('.btn-text');
    if (loading) {
      spinner.classList.remove('d-none');
      btn.disabled = true;
      if (text) text.style.opacity = '0.8';
    } else {
      spinner.classList.add('d-none');
      btn.disabled = false;
      if (text) text.style.opacity = '1';
    }
  }

  // POST JSON helper
  async function postJson(url, payload){
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch(e) { parsed = body; }
    return { ok: res.ok, status: res.status, body: parsed };
  }

  // Login form
  const loginForm = el('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = el('email').value.trim();
      const password = el('password').value;

      if (!email || !password) {
        showAlert('alert-placeholder', 'warning', 'Please enter email and password.');
        return;
      }

      const btn = el('loginBtn');
      setButtonLoading(btn, true);

      const result = await postJson('/api/auth/login', { email, password });

      setButtonLoading(btn, false);

      if (result.ok) {
        // expected: { token: "...", email: "...", role: "ROLE_MEMBER" }
        const token = result.body && result.body.token ? result.body.token : null;
        if (token) {
          // store token localStorage (you can later send it in Authorization header)
          localStorage.setItem('lr_token', token);
        }
        showAlert('alert-placeholder', 'success', 'Login successful!');
        // optional: redirect to dashboard/home after short delay
        setTimeout(()=>{ window.location.href = '/'; }, 900);
      } else {
        let message = 'Login failed';
        if (result.body) {
          if (typeof result.body === 'string') message = result.body;
          else if (result.body.message) message = result.body.message;
          else if (result.body.error) message = result.body.error;
        }
        showAlert('alert-placeholder', 'danger', message);
      }
    });
  }

  // Signup form
  const signupForm = el('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = el('su-email').value.trim();
      const password = el('su-password').value;

      // client validations
      if (!email || !password) {
        showAlert('alert-placeholder', 'warning', 'Email and password are required.');
        return;
      }
      if (password.length < 8) {
        showAlert('alert-placeholder', 'warning', 'Password must be at least 8 characters.');
        return;
      }

      const btn = el('signupBtn');
      setButtonLoading(btn, true);

      const result = await postJson('/api/auth/register', { email, password });

      setButtonLoading(btn, false);

      if (result.ok) {
        showAlert('alert-placeholder', 'success', 'Account created — you can sign in now.');
        setTimeout(()=>{ window.location.href = '/login.html'; }, 1000);
      } else {
        let message = 'Registration failed';
        if (result.body) {
          if (typeof result.body === 'string') message = result.body;
          else if (result.body.message) message = result.body.message;
          else if (result.body.errors) message = (Array.isArray(result.body.errors) ? result.body.errors.join(', ') : JSON.stringify(result.body.errors));
        }
        showAlert('alert-placeholder', 'danger', message);
      }
    });
  }

  // attach Authorization header helper for other pages:
  window.getAuthHeaders = function(){
    const tok = localStorage.getItem('lr_token');
    return tok ? { 'Authorization': 'Bearer ' + tok } : {};
  };

})();
