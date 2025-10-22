// passenger-dashboard.js V3 (with Search and Station Directory)

// ---= UTILITIES =---
function showMsg(msg, type = 'info') {
  // Replace with a nicer Bootstrap Toast later if desired
  alert(msg);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}
async function authHeaders() {
  return { 'Accept': 'application/json', 'Content-Type': 'application/json' };
}
let currentUserId = null; // Store the logged-in user's ID

// ---= INITIALIZATION =---
document.addEventListener('DOMContentLoaded', function() {
  console.log("Passenger dashboard V3 loading...");
  setupUserInfo();
  setupEventListeners();
  loadBookings(); // Load "My Bookings"
  loadStationDirectory(); // Load the station list
  loadAllSchedules(); // *** ADD THIS LINE to load the timetable ***
});

async function setupUserInfo() {
  const userInfo = document.getElementById('userInfo');
  const storedEmail = localStorage.getItem('lankarail_email') || '';
  if (userInfo) userInfo.textContent = storedEmail;
  try {
    const res = await fetch('/api/users/me', { headers: await authHeaders(), credentials: 'same-origin' });
    if (!res.ok) throw new Error('Not logged in');
    const user = await res.json();
    currentUserId = user.id;
  } catch (err) {
    console.error('Failed to fetch user info:', err);
    window.location.href = '/login'; // Redirect if user info fails
  }
}

function setupEventListeners() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const searchForm = document.getElementById('searchScheduleForm');
  if (searchForm) searchForm.addEventListener('submit', handleSearchSubmit);

  // Modal form listener (for booking after search)
  const createForm = document.getElementById('createBookingForm');
  if (createForm) createForm.addEventListener('submit', handleCreateBooking);
}

// ---= LOGOUT =---
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch(e) { /* ignore */ }
  finally {
    localStorage.clear(); // Clear all local storage on logout
    window.location.href = '/login';
  }
}

// ---= STATION DIRECTORY =---
async function loadStationDirectory() {
  const area = document.getElementById('stationDirectoryArea');
  if (!area) return;

  try {
    const res = await fetch('/api/stations'); // Call the public endpoint
    if (!res.ok) throw new Error('Could not fetch stations.');

    const stations = await res.json();

    if (stations.length === 0) {
      area.innerHTML = '<div class="text-muted">No stations have been added yet.</div>';
      return;
    }

    // --- FIX FOR DUPLICATES AND FORMATTING ---
    const uniqueStationNames = new Set();
    let listHtml = '<ul class="list-group list-group-flush">';

    stations.forEach(station => {
      // Build the display text with better logic
      let displayText = escapeHtml(station.name);
      if (station.city && station.city.trim() !== '' && station.city.toLowerCase() !== station.name.toLowerCase()) {
        displayText += ` (${escapeHtml(station.city)})`;
      }

      // Only add the station if we haven't seen it before
      if (!uniqueStationNames.has(displayText)) {
        uniqueStationNames.add(displayText);
        listHtml += `<li class="list-group-item bg-transparent text-white border-secondary">${displayText}</li>`;
      }
    });
    listHtml += '</ul>';

    area.innerHTML = listHtml;

  } catch (err) {
    console.error("Error loading station directory:", err);
    area.innerHTML = '<div class="text-danger">Could not load stations.</div>';
  }
}


// ---= MY BOOKINGS =---
async function loadBookings() {
  const area = document.getElementById('bookingsArea');
  const loading = document.getElementById('loadingMsg');
  if (!area || !loading) return;
  area.innerHTML = '';
  loading.style.display = 'block';

  try {
    const res = await fetch('/api/bookings/my-bookings', { headers: await authHeaders(), credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (!res.ok) { area.innerHTML = `<div class="text-danger">Failed to load bookings: ${await res.text()}</div>`; return; }
    const bookings = await res.json();
    await renderBookings(bookings); // Make renderBookings async
  } catch (err) {
    area.innerHTML = `<div class="text-danger">Error loading bookings: ${err.message}</div>`;
  } finally {
    loading.style.display = 'none';
  }
}

async function renderBookings(bookings) {
  const area = document.getElementById('bookingsArea');
  if (!bookings || bookings.length === 0) {
    area.innerHTML = '<div class="alert alert-light booking-card">No bookings yet. Use the search above to find a journey.</div>';
    return;
  }

  // Pre-fetch all schedules and trains for details
  const [schedulesRes, trainsRes] = await Promise.all([
    fetch('/api/schedules'),
    fetch('/api/trains')
  ]);
  const schedules = await schedulesRes.json();
  const trains = await trainsRes.json();
  const scheduleMap = new Map(schedules.map(s => [s.id, s]));
  const trainMap = new Map(trains.map(t => [t.id, t.name]));

  const container = document.createElement('div');
  container.className = 'row g-3';

  bookings.forEach(b => {
    const schedule = scheduleMap.get(b.scheduleId);
    const trainName = schedule ? (trainMap.get(schedule.trainId) || 'Unknown Train') : 'Unknown Train';
    const scheduleInfo = schedule ? `${schedule.departureStation} ➔ ${schedule.arrivalStation}` : `Schedule ID #${b.scheduleId}`;
    const departureTime = schedule ? new Date(schedule.departureTime).toLocaleString() : 'N/A';
    const status = b.status ?? 'PENDING';

    const col = document.createElement('div');
    col.className = 'col-12';
    const card = document.createElement('div');
    card.className = 'p-3 booking-card d-flex justify-content-between align-items-start'; // Use flex for layout

    card.innerHTML = `
            <div>
              <strong>Booking #${escapeHtml(b.id)}</strong>
              <div class="muted-small">Journey: ${escapeHtml(scheduleInfo)} on ${escapeHtml(trainName)}</div>
              <div class="muted-small">Departure: ${escapeHtml(departureTime)}</div>
              <div class="muted-small">Seats: ${escapeHtml(b.seats)} | Total: LKR ${b.totalPrice ? b.totalPrice.toFixed(2) : 'N/A'}</div>
              <div class="muted-small">Status: <span class="badge ${status === 'CONFIRMED' ? 'bg-success' : 'bg-secondary'}">${escapeHtml(status)}</span> (Payment: <span class="badge ${b.paymentStatus === 'CONFIRMED' ? 'bg-success' : (b.paymentStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning')}">${escapeHtml(b.paymentStatus)}</span>)</div>
            </div>
            <div class="text-end booking-actions">
              ${b.paymentStatus === 'CONFIRMED'
        ? `<button class="btn btn-sm btn-outline-primary view-ticket-btn" data-booking-id="${b.id}">View Ticket</button>`
        : `<button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${escapeHtml(b.id)}">Cancel</button>`}
            </div>
        `;
    col.appendChild(card);
    container.appendChild(col);
  });

  area.innerHTML = '';
  area.appendChild(container);
  attachBookingActionListeners(area);
}

function attachBookingActionListeners(area) {
  area.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', handleCancelBooking);
  });
  area.querySelectorAll('.view-ticket-btn').forEach(btn => {
    btn.addEventListener('click', handleViewTicket);
  });
}

async function handleCancelBooking(event) {
  const btn = event.target;
  const id = btn.getAttribute('data-id');
  if (!confirm('Cancel booking #' + id + '?')) return;
  try {
    const res = await fetch('/api/bookings/' + encodeURIComponent(id), { method: 'DELETE', headers: await authHeaders(), credentials: 'same-origin' });
    if (!res.ok) throw new Error(await res.text());
    showMsg('Booking cancelled');
    loadBookings();
  } catch (err) {
    showMsg('Error: ' + err.message);
  }
}

function handleViewTicket(event) {
  const bookingId = event.target.getAttribute('data-booking-id');
  window.location.href = `/ticket?id=${bookingId}`;
}

// ---= BROWSE ALL SCHEDULES =---
async function loadAllSchedules() {
  const resultsArea = document.getElementById('searchResultsArea');
  resultsArea.innerHTML = `<div class="d-flex justify-content-center text-white p-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div><span class="ms-2">Loading all available journeys...</span></div>`; // Loading spinner

  try {
    const res = await fetch('/api/schedules', { headers: await authHeaders(), credentials: 'same-origin' });

    if (!res.ok) {
      throw new Error(`Failed to load schedules: ${res.statusText}`);
    }
    const schedules = await res.json();
    // We can reuse the same function that displays search results!
    await renderSearchResults(schedules, "All Available Journeys");
  } catch (err) {
    console.error("Error loading all schedules:", err);
    resultsArea.innerHTML = `<div class="alert alert-warning">Could not load available journeys. ${err.message}</div>`;
  }
}
// ---= SEARCH SCHEDULES =---
async function handleSearchSubmit(event) {
  event.preventDefault();
  const origin = document.getElementById('searchOrigin').value.trim();
  const destination = document.getElementById('searchDestination').value.trim();
  const date = document.getElementById('searchDate').value;
  const resultsArea = document.getElementById('searchResultsArea');

  if (!origin || !destination || !date) {
    showMsg('Please enter origin, destination, and date.');
    return;
  }

  resultsArea.innerHTML = `<div class="d-flex justify-content-center text-white p-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div><span class="ms-2">Searching...</span></div>`; // Loading spinner

  try {
    const url = `/api/schedules/search?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
    const res = await fetch(url, { headers: await authHeaders(), credentials: 'same-origin' });

    if (!res.ok) {
      throw new Error(`Search failed: ${res.statusText}`);
    }
    const schedules = await res.json();
    await renderSearchResults(schedules); // Make this async too
  } catch (err) {
    console.error("Search error:", err);
    resultsArea.innerHTML = `<div class="alert alert-warning">Could not perform search. ${err.message}</div>`;
  }
}

async function renderSearchResults(schedules, title = "Search Results") { // Added a title parameter
  const resultsArea = document.getElementById('searchResultsArea');
  resultsArea.innerHTML = ''; // Clear previous results or loading indicator

  if (!schedules || schedules.length === 0) {
    resultsArea.innerHTML = `<div class="alert alert-info text-center">No trains found for this route and date.</div>`;
    return;
  }

  const trainsRes = await fetch('/api/trains');
  const trains = await trainsRes.json();
  const trainMap = new Map(trains.map(t => [t.id, t.name]));

  const listGroup = document.createElement('div');
  listGroup.className = 'list-group glass-card p-3';

  // Add the title inside the card
  listGroup.innerHTML = `<h4 class="text-white mb-3">${title}</h4>`;

  schedules.forEach(s => {
    const trainName = trainMap.get(s.trainId) || 'Unknown Train';
    const departureTime = new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const arrivalTime = new Date(s.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const item = document.createElement('div');
    item.className = 'list-group-item list-group-item-action bg-transparent text-white d-flex justify-content-between align-items-center mb-2 border-secondary';

    item.innerHTML = `
            <div class="w-75">
                <h5 class="mb-1">${escapeHtml(trainName)}</h5>
                <p class="mb-1">${escapeHtml(s.departureStation)} <i class="fas fa-long-arrow-alt-right"></i> ${escapeHtml(s.destinationStation)}</p>
                <small>Departs: ${departureTime} | Arrives: ${arrivalTime}</small>
            </div>
            <div class="text-end">
                <span class="d-block fw-bold fs-5">LKR ${s.price.toFixed(2)}</span>
                <button class="btn btn-primary btn-sm mt-2 book-now-btn" data-schedule-id="${s.id}">Book Now</button>
            </div>
        `;
    listGroup.appendChild(item);
  });

  resultsArea.appendChild(listGroup);
  attachBookingButtonListeners(resultsArea);
}

function attachBookingButtonListeners(area) {
  area.querySelectorAll('.book-now-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      const scheduleId = event.target.getAttribute('data-schedule-id');
      openBookingModalForSchedule(scheduleId);
    });
  });
}

// ---= CREATE BOOKING (from Search Result) =---
function openBookingModalForSchedule(scheduleId) {
  const modalEl = document.getElementById('createBookingModal');
  if (!modalEl) return;
  const createForm = document.getElementById('createBookingForm');

  // Store scheduleId on the form to use during submission
  createForm.dataset.scheduleId = scheduleId;

  // Reset the form (especially the seats field)
  createForm.reset();

  // Hide the schedule select dropdown (it's not needed now)
  const scheduleSelectDiv = document.getElementById('scheduleSelect').closest('.mb-3');
  if (scheduleSelectDiv) scheduleSelectDiv.style.display = 'none';

  // Show the modal
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function handleCreateBooking(event) {
  event.preventDefault();
  if (!currentUserId) {
    showMsg('Error: User not identified. Please try logging in again.');
    return;
  }

  const createForm = event.target;
  const scheduleId = createForm.dataset.scheduleId; // Get scheduleId from the form's data attribute
  const seats = parseInt(document.getElementById('seats')?.value || '1', 10) || 1;

  if (!scheduleId) {
    showMsg('Error: No schedule selected. Please search again.');
    return;
  }

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
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (!res.ok) { throw new Error(await res.text()); }

    showMsg('Booking created successfully! Your booking is confirmed.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('createBookingModal')).hide();
    loadBookings(); // Refresh the "My Bookings" list
  } catch (err) {
    showMsg('Booking failed: ' + err.message);
  } finally {
    // Clean up form data attribute after submission attempt
    delete createForm.dataset.scheduleId;
    // Make schedule select visible again for next time (if old button is used)
    const scheduleSelectDiv = document.getElementById('scheduleSelect').closest('.mb-3');
    if (scheduleSelectDiv) scheduleSelectDiv.style.display = 'block';
  }
}
