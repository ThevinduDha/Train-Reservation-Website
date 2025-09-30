// passenger-dashboard.js
// Fetch and display bookings, allow create and logout

// Utility: show a simple message
function showMsg(msg) { alert(msg); }

// Read stored role/email if set by your auth.js
const savedRole = (() => {
  try { return JSON.parse(localStorage.getItem('lankarail_role') || 'null'); } catch(e){ return null; }
})();
const savedEmail = localStorage.getItem('lankarail_email') || null; // optional store in auth.js

// update topbar user info
document.addEventListener('DOMContentLoaded', function() {
  const userInfo = document.getElementById('userInfo');
  if (savedEmail) userInfo.textContent = savedEmail + (savedRole ? ' • ' + savedRole.join(', ') : '');
  else if (savedRole) userInfo.textContent = savedRole.join(', ');
  else userInfo.textContent = '';

  // attach handlers
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('newBookingBtn').addEventListener('click', openCreateModal);

  // form submit
  document.getElementById('createBookingForm').addEventListener('submit', handleCreateBooking);

  // load bookings
  loadBookings();
});

async function loadBookings() {
  const area = document.getElementById('bookingsArea');
  const loading = document.getElementById('loadingMsg');
  area.innerHTML = '';
  loading && (loading.style.display = 'block');

  try {
    // adjust endpoint if different
    const res = await fetch('/api/bookings', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin' // send session cookie for Spring session-based login
    });

    if (!res.ok) {
      const txt = await res.text();
      loading.textContent = 'Failed to load: ' + txt;
      return;
    }

    const bookings = await res.json();
    renderBookings(bookings);
  } catch (err) {
    area.innerHTML = '<div class="text-danger">Error loading bookings: ' + err.message + '</div>';
  } finally {
    loading && (loading.style.display = 'none');
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

    // simple markup; adjust fields according to your Booking model
    card.innerHTML = `
      <div class="d-flex justify-content-between">
        <div>
          <strong>Booking #${b.id || '(n/a)'}</strong>
          <div class="muted-small">Train: ${b.trainId || b.train || '—'} • Seats: ${b.seats || 1}</div>
          <div class="muted-small">Date: ${b.date || b.travelDate || '—'}</div>
        </div>
        <div class="text-end">
          <button class="btn btn-sm btn-outline-danger" data-id="${b.id}" onclick="cancelBooking(this)">Cancel</button>
        </div>
      </div>
    `;

    col.appendChild(card);
    container.appendChild(col);
  });

  area.innerHTML = '';
  area.appendChild(container);
}

async function cancelBooking(btn) {
  const id = btn.getAttribute('data-id');
  if (!confirm('Cancel booking #' + id + '?')) return;

  try {
    const res = await fetch('/api/bookings/' + encodeURIComponent(id), {
      method: 'DELETE',
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
}

/* ---------- Create booking ---------- */
function openCreateModal() {
  const bsModal = new bootstrap.Modal(document.getElementById('createBookingModal'));
  bsModal.show();
}

async function handleCreateBooking(e) {
  e.preventDefault();
  const trainId = document.getElementById('trainId').value.trim();
  const date = document.getElementById('travelDate').value;
  const seats = parseInt(document.getElementById('seats').value, 10) || 1;

  if (!trainId || !date) { showMsg('Train and date required'); return; }

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ trainId, date, seats })
    });

    if (!res.ok) {
      const txt = await res.text();
      showMsg('Create failed: ' + txt);
      return;
    }

    showMsg('Booking created');
    // hide modal
    const modalEl = document.getElementById('createBookingModal');
    bootstrap.Modal.getInstance(modalEl).hide();

    // clear form
    document.getElementById('createBookingForm').reset();

    // refresh
    loadBookings();
  } catch (err) {
    showMsg('Error: ' + err.message);
  }
}

/* ---------- Logout ---------- */
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch(e) {
    // ignore network error; still clear client state
  } finally {
    localStorage.removeItem('lankarail_role');
    localStorage.removeItem('lankarail_token');
    localStorage.removeItem('lankarail_email');
    window.location.href = '/login.html';
  }
}
