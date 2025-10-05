// admin-dashboard.js
// Single-file admin dashboard front-end helpers: load sections, render table with action icons,
// edit/delete handlers (prompt-based), auth logout hook, and safe escaping.

// small UX helper
function showMsg(msg) { alert(msg); }

// ---------- DOM ready ----------
document.addEventListener('DOMContentLoaded', () => {
  // set admin info from localStorage (safe parsing)
  const adminInfo = document.getElementById('adminInfo');
  const email = localStorage.getItem('lankarail_email') || 'Admin';
  let rolesRaw = localStorage.getItem('lankarail_role');
  let roles = [];
  try {
    if (rolesRaw) {
      const parsed = JSON.parse(rolesRaw);
      roles = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (err) {
    // if parsing fails, treat as plain string
    roles = rolesRaw ? [rolesRaw] : [];
  }
  if (adminInfo) adminInfo.textContent = email + (roles.length ? ' • ' + roles.join(', ') : '');

  // logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', authLogout);

  // optional: initial load of users panel
  loadUsers();
});

// ---------- Loading sections ----------
async function loadUsers() {
  await loadSection('/api/users', 'Users');
}
async function loadTrains() {
  await loadSection('/api/trains', 'Trains');
}
async function loadSchedules() {
  await loadSection('/api/schedules', 'Schedules');
}
async function loadBookings() {
  await loadSection('/api/bookings', 'Bookings');
}

async function loadSection(url, label) {
  const content = document.getElementById('adminContent');
  const tableBody = document.getElementById('adminTableBody');
  const title = document.getElementById('adminPanelTitle');
  if (title) title.textContent = label;
  if (content) content.innerHTML = `<div class="text-muted">Loading ${label}...</div>`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (!res.ok) {
      const txt = await res.text();
      if (content) content.innerHTML = `<div class="text-danger">Failed to load ${label}: ${escapeHtml(txt)}</div>`;
      return;
    }
    const data = await res.json();

    // prefer the newer renderTable (which expects a tbody with id=adminTableBody)
    if (typeof renderTableWithActions === 'function') {
      renderTableWithActions(data, label);
    } else {
      // fallback to older renderer
      renderTable(data, label);
    }
  } catch (err) {
    if (content) content.innerHTML = `<div class="text-danger">Error loading ${label}: ${escapeHtml(err.message)}</div>`;
  }
}

// ---------- Older simple render (kept for fallback) ----------
function renderTable(items, label) {
  const content = document.getElementById('adminContent');
  if (!content) return;

  if (!items || items.length === 0) {
    content.innerHTML = `<div class="alert alert-light">No ${escapeHtml(label)} available.</div>`;
    return;
  }

  const keys = Object.keys(items[0] || {});
  let html = `<h5 class="mb-3">${escapeHtml(label)}</h5>`;
  html += `<div class="table-responsive"><table class="table table-sm table-bordered table-striped bg-white">
    <thead><tr>${keys.map(k => `<th>${escapeHtml(k)}</th>`).join('')}</tr></thead>
    <tbody>
    ${items.map(item =>
      `<tr>${keys.map(k => `<td>${escapeHtml(item[k])}</td>`).join('')}</tr>`
  ).join('')}
    </tbody></table></div>`;

  content.innerHTML = html;
}

// ---------- Improved renderer with action icons ----------
function renderTableWithActions(items, label) {
  const content = document.getElementById('adminContent');
  const title = document.getElementById('adminPanelTitle');
  const tbody = document.getElementById('adminTableBody');

  if (title) title.textContent = label;

  // if there is no dedicated tbody, render a default container so the UI still appears
  if (!tbody) {
    // build a full table in adminContent (so it works even if HTML doesn't have adminTableBody)
    if (!content) return;
    if (!items || items.length === 0) {
      content.innerHTML = `<div class="alert alert-light">No ${escapeHtml(label)} available.</div>`;
      return;
    }
    const keys = Object.keys(items[0] || {});
    let html = `<h5 id="adminPanelTitle" class="mb-3">${escapeHtml(label)}</h5>`;
    html += `<div class="table-responsive"><table class="table table-sm table-bordered table-striped bg-white">
      <thead><tr><th>id</th><th>email</th><th>role(s)</th><th style="text-align:right;padding-right:18px">actions</th></tr></thead>
      <tbody>`;
    items.forEach(item => {
      const id = item.id ?? item.userId ?? '';
      const email = item.email ?? item.username ?? item.userEmail ?? '';
      const role = item.role ?? (item.roles ? (Array.isArray(item.roles) ? item.roles.join(',') : item.roles) : '');
      html += `<tr>
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(email)}</td>
        <td>${escapeHtml(role)}</td>
        <td style="text-align:right;padding-right:18px">
          <button class="icon-btn edit" data-id="${escapeHtml(id)}" title="Edit">
            <!-- edit svg --> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.439 1.439-2.121-2.121 1.439-1.439a.5.5 0 0 1 .707 0l1.414 1.414z"/>
              <path d="M13.135 3.305 4 12.44V15h2.56l9.135-9.135-2.56-2.56z"/>
            </svg>
          </button>
          <button class="icon-btn delete" data-id="${escapeHtml(id)}" title="Delete">
            <!-- trash svg --> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5V6H5v-.5z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 1 1 0-2h3.2L6.9.6A1 1 0 0 1 7.8 0h0a1 1 0 0 1 .9.6L10.3 2h3.2A1 1 0 0 1 14.5 3z"/>
            </svg>
          </button>
        </td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    content.innerHTML = html;

    // attach handlers to the newly created elements
    const newTbody = content.querySelector('tbody');
    if (newTbody) attachActionHandlersToTbody(newTbody);
    return;
  }

  // If we have a tbody element to populate:
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="padding:18px;">No ${escapeHtml(label)} available.</td></tr>`;
    return;
  }

  tbody.innerHTML = ''; // clear existing rows

  items.forEach(item => {
    const tr = document.createElement('tr');

    const id = item.id ?? item.userId ?? '';
    const email = item.email ?? item.username ?? item.userEmail ?? '';
    const role = item.role ?? (item.roles ? (Array.isArray(item.roles) ? item.roles.join(',') : item.roles) : '');

    tr.innerHTML = `
      <td>${escapeHtml(id)}</td>
      <td>${escapeHtml(email)}</td>
      <td>${escapeHtml(role)}</td>
      <td style="text-align:right;padding-right:18px">
        <button class="icon-btn edit" data-id="${escapeHtml(id)}" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.439 1.439-2.121-2.121 1.439-1.439a.5.5 0 0 1 .707 0l1.414 1.414z"/>
            <path d="M13.135 3.305 4 12.44V15h2.56l9.135-9.135-2.56-2.56z"/>
          </svg>
        </button>
        <button class="icon-btn delete" data-id="${escapeHtml(id)}" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5V6H5v-.5z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 1 1 0-2h3.2L6.9.6A1 1 0 0 1 7.8 0h0a1 1 0 0 1 .9.6L10.3 2h3.2A1 1 0 0 1 14.5 3z"/>
          </svg>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // attach handlers
  attachActionHandlersToTbody(tbody);
}

// attach handlers utility
function attachActionHandlersToTbody(tbody) {
  Array.from(tbody.querySelectorAll('.icon-btn.edit')).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      onEditRow(id);
    });
  });
  Array.from(tbody.querySelectorAll('.icon-btn.delete')).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      onDeleteRow(id);
    });
  });
}

// ---------- Escaping ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- Actions (basic implementations) ----------
function onEditRow(id) {
  // simple prompt-based edit (replace with modal in future)
  const newEmail = prompt('Edit email for user id ' + id + ':');
  if (!newEmail) return;

  fetch('/api/users/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email: newEmail })
  }).then(async res => {
    if (!res.ok) {
      const txt = await res.text();
      alert('Update failed: ' + txt);
      return;
    }
    alert('User updated');
    // reload current panel: try to call loadUsers (if present)
    if (typeof loadUsers === 'function') loadUsers();
  }).catch(err => alert('Error: ' + err.message));
}

async function onDeleteRow(id) {
  if (!confirm('Delete user #' + id + '?')) return;
  try {
    const res = await fetch('/api/users/' + encodeURIComponent(id), {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (!res.ok) {
      const txt = await res.text();
      alert('Delete failed: ' + txt);
      return;
    }
    alert('User deleted');
    if (typeof loadUsers === 'function') loadUsers();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ---------- Auth helpers (example) ----------
function authLogout() {
  // clear any stored auth info (customize as needed)
  localStorage.removeItem('lankarail_email');
  localStorage.removeItem('lankarail_role');
  // redirect to login page (adjust path)
  window.location.href = '/login.html';
}
