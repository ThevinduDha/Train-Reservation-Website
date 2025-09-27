// simple frontend auth helpers for login/signup (used by login.html & signup.html)

// Show toast-style messages (very small)
function showMessage(msg, type = 'info') {
  alert(msg); // simple for now. You can replace with nicer UI.
}

// validate email via simple regex
function isValidEmail(e) {
  return /\S+@\S+\.\S+/.test(e);
}

/* --------- registration --------- */
async function authRegister() {
  const email = document.getElementById('signupEmail').value.trim();
  const pwd = document.getElementById('signupPassword').value;
  const pwd2 = document.getElementById('signupConfirm').value;

  // client-side validation
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

    const data = await resp.json();
    showMessage('Registered successfully. You can now sign in.');
    // redirect to sign-in
    window.location.href = '/login.html';
  } catch (err) {
    console.error(err);
    showMessage('Registration error: ' + err.message);
  }
}

/* --------- login --------- */
async function authLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd = document.getElementById('loginPassword').value;

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
    // if you get token, you can store it: localStorage.setItem('token', data.token)
    showMessage('Login successful.');
    // Redirect to your app landing page — change if you have a dashboard route
    window.location.href = '/';
  } catch (err) {
    console.error(err);
    showMessage('Login error: ' + err.message);
  }
}
