
// admin-dashboard.js

function showMsg(msg) { alert(msg); }

document.addEventListener('DOMContentLoaded', () => {
  const adminInfo = document.getElementById('adminInfo');
  const email = localStorage.getItem('lankarail_email') || 'Admin';
  const roles = JSON.parse(localStorage.getItem('lankarail_role') || '[]');
  adminInfo.textContent = email + ' • ' + roles.join(', ');

  document.getElementById('logoutBtn').addEventListener('click', authLogout);
});

async function loadUsers() {
  loadSection('/api/users', 'Users');
}
async function loadTrains() {
  loadSection('/api/trains', 'Trains');
}
async function loadSchedules() {
  loadSection('/api/schedules', 'Schedules');
}
async function loadBookings() {
  loadSection('/api/bookings', 'Bookings');
}

async function loadSection(url, label) {
  const content = document.getElementById('adminContent');
  content.innerHTML = `<div class="text-muted">Loading ${label}...</div>`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (!res.ok) {
      const txt = await res.text();
      content.innerHTML = `<div class="text-danger">Failed to load ${label}: ${txt}</div>`;
      return;
    }
    const data = await res.json();
    renderTable(data, label);
  } catch (err) {
    content.innerHTML = `<div class="text-danger">Error loading ${label}: ${err.message}</div>`;
  }
}

function renderTable(items, label) {
  const content = document.getElementById('adminContent');
  if (!items || items.length === 0) {
    content.innerHTML = `<div class="alert alert-light">No ${label} available.</div>`;
    return;
  }

  const keys = Object.keys(items[0]);

  let html = `<h5 class="mb-3">${label}</h5>`;
  html += `<div class="table-responsive"><table class="table table-sm table-bordered table-striped bg-white">
    <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
    <tbody>
    ${items.map(item =>
      `<tr>${keys.map(k => `<td>${escapeHtml(item[k])}</td>`).join('')}</tr>`
  ).join('')}
    </tbody></table></div>`;

  content.innerHTML = html;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}
