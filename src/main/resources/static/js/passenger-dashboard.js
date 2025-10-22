// passenger-dashboard.js
// Fetch and display bookings, allow create and logout

function showMsg(msg) { alert(msg); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

// Store the logged-in user's ID
let currentUserId = null;

document.addEventListener('DOMContentLoaded', function() {
  const userInfo = document.getElementById('userInfo');
  const storedEmail = localStorage.getItem('lankarail_email') || '';
  if (userInfo) userInfo.textContent = storedEmail;

  // Fetch current user's ID
  fetchUserInfo();

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

async function authHeaders() {
  const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
  // We use Spring Security sessions (JSESSIONID cookie), so we don't need the token.
  return headers;
}

// Fetch and store the user's ID
async function fetchUserInfo() {
  try {
    const res = await fetch('/api/users/me', {
      method: 'GET',
      headers: await authHeaders(),
      credentials: 'same-origin'
    });
    if (!res.ok) {
      throw new Error('Not logged in');
    }
    const user = await res.json();
    currentUserId = user.id; // Store the user ID globally
  } catch (err) {
    console.error('Failed to fetch user info:', err);
    window.location.href = '/login';
  }
}

async function loadBookings() {
  const area = document.getElementById('bookingsArea');
  const loading = document.getElementById('loadingMsg');
  if (!area) return;
  area.innerHTML = '';
  if (loading) loading.style.display = 'block';

  try {
    const res = await fetch('/api/bookings/my-bookings', { // CALL THE NEW ENDPOINT
      method: 'GET',
      headers: await authHeaders(),
      credentials: 'same-origin'
    });

    if (res.status === 401) {
      window.location.href = '/login';
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

// This function needs to fetch schedule details to be useful
// We'll pre-fetch all schedules for this
async function renderBookings(bookings) {
  const area = document.getElementById('bookingsArea');
  if (!bookings || bookings.length === 0) {
    area.innerHTML = '<div class="alert alert-light booking-card">No bookings yet — click "Create booking".</div>';
    return;
  }

  // Fetch all schedules to cross-reference
  const scheduleRes = await fetch('/api/schedules');
  const schedules = await scheduleRes.json();
  const scheduleMap = new Map(schedules.map(s => [s.id, s]));

  const container = document.createElement('div');
  container.className = 'row g-3';

  bookings.forEach(b => {
    const col = document.createElement('div');
    col.className = 'col-12';
    const card = document.createElement('div');
    card.className = 'p-3 booking-card';

    const schedule = scheduleMap.get(b.scheduleId);
    const scheduleInfo = schedule
        ? `${schedule.departureStation} to ${schedule.arrivalStation}`
        : `Schedule ID #${b.scheduleId}`;

    const departureTime = schedule
        ? new Date(schedule.departureTime).toLocaleString()
        : 'N/A';

    const status = b.status ?? 'PENDING';

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>Booking #${escapeHtml(b.id)}</strong>
          <div class="muted-small">Journey: ${escapeHtml(scheduleInfo)}</div>
          <div class="muted-small">Departure: ${escapeHtml(departureTime)}</div>
          <div class="muted-small">Seats: ${escapeHtml(b.seats)}</div>
          <div class="muted-small">Status: ${escapeHtml(status)} (Payment: ${b.paymentStatus})</div>
        </div>
        <div class="text-end">
          ${b.paymentStatus === 'CONFIRMED'
        ? `<a class="btn btn-sm btn-outline-primary" href="#">View Ticket</a>` // Placeholder
        : `<button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${escapeHtml(b.id)}">Cancel</button>`}
        </div>
      </div>
    `;
    col.appendChild(card);
    container.appendChild(col);
  });

  area.innerHTML = '';
  area.appendChild(container);

  // Attach cancel handlers
  [...area.querySelectorAll('.cancel-btn')].forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Cancel booking #' + id + '?')) return;
      try {
        const res = await fetch('/api/bookings/' + encodeURIComponent(id), { // Passenger cancel endpoint
          method: 'DELETE',
          headers: await authHeaders(),
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

async function openCreateModal() {
  const modalEl = document.getElementById('createBookingModal');
  if (!modalEl) return;

  const select = document.getElementById('scheduleSelect');
  // Set loading state immediately
  select.innerHTML = '<option value="" selected disabled>Loading schedules...</option>';
  select.disabled = true; // Disable dropdown while loading

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show(); // Show modal while loading

  // Fetch schedules and trains to populate the dropdown
  try {
    // Use Promise.all for potentially faster loading
    const [schedulesRes, trainsRes] = await Promise.all([
      fetch('/api/schedules'),         // Public endpoint (Correct)
      fetch('/api/trains')             // *** CHANGED TO PUBLIC TRAIN ENDPOINT ***
    ]);

    if (!schedulesRes.ok || !trainsRes.ok) {
      throw new Error('Failed to fetch schedules or trains.');
    }

    const schedules = await schedulesRes.json();
    const trains = await trainsRes.json();
    const trainMap = new Map(trains.map(t => [t.id, t.name]));

    select.innerHTML = '<option value="" selected disabled>Select a journey</option>'; // Clear loading text
    if (schedules.length === 0) {
      select.innerHTML = '<option value="" disabled>No journeys available currently.</option>';
      select.disabled = true;
      return; // Stop if no schedules
    }

    schedules.forEach(s => {
      const trainName = trainMap.get(s.trainId) || 'Unknown Train';
      const option = document.createElement('option');
      option.value = s.id;
      // Format time for display (optional but nice)
      const departureTimeFormatted = new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      option.textContent = `${s.departureStation} ➔ ${s.arrivalStation} @ ${departureTimeFormatted} (${trainName}) - LKR ${s.price.toFixed(2)}`;
      select.appendChild(option);
    });
    select.disabled = false; // Re-enable dropdown

  } catch (err) {
    console.error('Failed to load schedules for modal', err);
    select.innerHTML = '<option value="" disabled>Failed to load schedules</option>';
    select.disabled = true;
  }
}

async function handleCreateBooking(e) {
  e.preventDefault();
  if (!currentUserId) {
    showMsg('Error: User not identified. Please try logging in again.');
    return;
  }

  const scheduleId = (document.getElementById('scheduleSelect')?.value || '').trim();
  const seats = parseInt(document.getElementById('seats')?.value || '1', 10) || 1;

  if (!scheduleId) { showMsg('Please select a journey.'); return; }

  try {
    const res = await fetch('/api/bookings', { // Passenger create endpoint
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({
        scheduleId: parseInt(scheduleId),
        userId: currentUserId,
        seats: seats
      })
    });

    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    if (!res.ok) {
      const txt = await res.text();
      showMsg('Booking failed: ' + txt);
      return;
    }

    showMsg('Booking created successfully! Your booking is confirmed.');
    const modalEl = document.getElementById('createBookingModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    document.getElementById('createBookingForm').reset();
    loadBookings(); // Refresh the "My Bookings" list
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
    window.location.href = '/login';
  }
}