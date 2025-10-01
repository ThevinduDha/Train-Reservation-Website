// passenger-dashboard.js
// Fetch and display bookings, allow create and logout

function showMsg(msg) { alert(msg); }

document.addEventListener('DOMContentLoaded', function() {
  const userInfo = document.getElementById('userInfo');
  const storedEmail = localStorage.getItem('lankarail_email') || '';
  const storedRoles = JSON.parse(localStorage.getItem('lankarail_role') || '[]');
  if (userInfo) userInfo.textContent = storedEmail ? (storedEmail + (storedRoles.length ? ' • ' + storedRoles.join(', ') : '')) : (storedRoles.join(', ') || '');

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const newBookingBtn = document.getElementById('newBookingBtn');
  if (newBookingBtn) newBookingBtn.addEventListener('click', openCreateModal);

  const createForm = document.getElementById('createBookingForm');
  if (createForm) createForm.addEventListener('submit', handleCreateBooking);

  if (document.getElementById('bookingsArea')) {
    loadBookings();
  }
});

function authHeaders() {
  const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
  const token = localStorage.getItem('lankarail_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

async function loadBookings() {
  const area = document.getElementById('bookingsArea');
  const loading = document.getElementById('loadingMsg');
  if (!area) return;
  area.innerHTML = '';
  if (loading) loading.style.display = 'block';

  try {
    const res = await fetch('/api/bookings', {
      method: 'GET',
      headers: authHeaders(),
      credentials: 'same-origin'
    });

    if (res.status === 401) {
      // not authenticated — go to login
      window.location.href = '/login.html';
      return;
    }

    if (!res.ok) {
      const txt = await res.text();
      area.innerHTML = `<div class="text-danger">Failed to load: ${txt}</div>`;
      return;
    }

    const bookings = await res.json();
    renderBookings(bookings);
  } catch (err) {
    area.innerHTML = `<div class="text-danger">Error loading bookings: ${err.message}</div>`;
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderBookings(bookings) {
  const area = document.getElementById('bookingsArea');
  if (!bookings || bookings.length === 0) {
    area.innerHTML = '<div class="alert alert-light booking-card">No bookings yet — click "Create booking".</div>';
    return;
  }

  const container = document.createElement('div');
  container.className = 'row g-3';

  bookings.forEach(b => {
    const col = document.createElement('div');
    col.className = 'col-12';

    const card = document.createElement('div');
    card.className = 'p-3 booking-card';

    const id = b.id ?? '(n/a)';
    const train = b.trainId ?? b.train ?? '—';
    const seats = b.seats ?? 1;
    const date = b.date ?? b.travelDate ?? '—';
    const status = b.status ?? 'PENDING';

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>Booking #${escapeHtml(id)}</strong>
          <div class="muted-small">Train: ${escapeHtml(train)} • Seats: ${escapeHtml(seats)}</div>
          <div class="muted-small">Date: ${escapeHtml(date)}</div>
          <div class="muted-small">Status: ${escapeHtml(status)}</div>
        </div>
        <div class="text-end">
          ${status === 'CONFIRMED'
        ? `<a class="btn btn-sm btn-outline-primary" href="/ticket.html?id=${encodeURIComponent(id)}">View</a>`
        : `<button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${escapeHtml(id)}">Cancel</button>`}
        </div>
      </div>
    `;

    col.appendChild(card);
    container.appendChild(col);
  });

  area.innerHTML = '';
  area.appendChild(container);

  // attach cancel handlers
  [...area.querySelectorAll('.cancel-btn')].forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Cancel booking #' + id + '?')) return;
      try {
        const res = await fetch('/api/bookings/' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'same-origin'
        });
        if (!res.ok) {
          const txt = await res.text();
          showMsg('Cancel failed: ' + txt);
          return;
        }
        showMsg('Booking cancelled');
        loadBookings();
      } catch (err) {
        showMsg('Error: ' + err.message);
      }
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

function openCreateModal() {
  const modalEl = document.getElementById('createBookingModal');
  if (!modalEl) return;
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();
}

async function handleCreateBooking(e) {
  e.preventDefault();
  const trainId = (document.getElementById('trainId')?.value || '').trim();
  const date = (document.getElementById('travelDate')?.value || '').trim();
  const seats = parseInt(document.getElementById('seats')?.value || '1', 10) || 1;

  if (!trainId || !date) { showMsg('Train and date required'); return; }

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ trainId, date, seats })
    });

    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }

    if (!res.ok) {
      const txt = await res.text();
      showMsg('Create failed: ' + txt);
      return;
    }

    showMsg('Booking created');
    const modalEl = document.getElementById('createBookingModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    document.getElementById('createBookingForm').reset();
    loadBookings();
  } catch (err) {
    showMsg('Error: ' + err.message);
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch(e) { /* ignore */ }
  finally {
    localStorage.removeItem('lankarail_role');
    localStorage.removeItem('lankarail_token');
    localStorage.removeItem('lankarail_email');
    window.location.href = '/login.html';
  }
}
