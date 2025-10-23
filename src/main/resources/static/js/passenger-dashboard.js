// passenger-dashboard.js V7.3 (Fixes 'undefined' in search results)

// ---= UTILITIES =---
function showMsg(msg, type = 'info') { alert(msg); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
async function authHeaders() { return { 'Accept': 'application/json', 'Content-Type': 'application/json' }; }
let currentUserId = null;

// ---= INITIALIZATION & USER INFO =---
async function setupUserInfo() {
  const userInfo = document.getElementById('userInfo');
  const storedEmail = localStorage.getItem('lankarail_email') || '';
  if (userInfo) userInfo.textContent = storedEmail;
  try {
    const res = await fetch('/api/users/me', { headers: await authHeaders(), credentials: 'same-origin' });
    if (!res.ok) throw new Error('Not logged in');
    const user = await res.json();
    currentUserId = user.id;
    console.log("User ID set:", currentUserId);
  } catch (err) {
    console.error('Failed to fetch user info:', err);
    window.location.href = '/login';
  }
}

// ---= VIEW/PANEL NAVIGATION =---
function setActiveSidebarLink(targetOnClick) {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.sidebar-nav a[onclick="${targetOnClick}"]`);
  if(link) link.classList.add('active');
}

function showMyBookingsView() {
  setActiveSidebarLink("showMyBookingsView()");
  const dynamicArea = document.getElementById('dynamicContentArea');
  if (!dynamicArea) return;
  dynamicArea.innerHTML = `
        <div id="myBookingsPanel" class="animate-fade-in">
            <h3 class="mb-3 text-white">My Bookings</h3>
            <div id="bookingsArea" class="bookings-list">
                <div class="d-flex justify-content-center text-white p-3"><div class="spinner-border spinner-border-sm" role="status"></div><span class="ms-2">Loading bookings...</span></div>
            </div>
        </div>`;
  loadBookings();
}

function showAllJourneysView() {
  setActiveSidebarLink("showAllJourneysView()");
  const dynamicArea = document.getElementById('dynamicContentArea');
  if (!dynamicArea) return;
  dynamicArea.innerHTML = `
        <div id="allJourneysPanel" class="animate-fade-in">
             <div id="allSchedulesArea">
                 <div class="d-flex justify-content-center text-white p-3"><div class="spinner-border spinner-border-sm" role="status"></div><span class="ms-2">Loading all journeys...</span></div>
             </div>
        </div>`;
  loadAllSchedules();
}

function showStationDirectoryView() {
  setActiveSidebarLink("showStationDirectoryView()");
  const dynamicArea = document.getElementById('dynamicContentArea');
  if (!dynamicArea) return;
  dynamicArea.innerHTML = `
        <div id="stationDirectoryPanel" class="animate-fade-in">
            <h3 class="mb-3 text-white">Station Directory</h3>
            <div id="stationDirectoryArea" class="station-list">
                 <div class="d-flex justify-content-center text-white p-3"><div class="spinner-border spinner-border-sm" role="status"></div><span class="ms-2">Loading stations...</span></div>
            </div>
        </div>`;
  loadStationDirectory();
}

// ---= LOGOUT =---
async function handleLogout() {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch(e) {}
  finally { localStorage.clear(); window.location.href = '/login'; }
}

// ---= STATION DIRECTORY =---
async function loadStationDirectory() {
  const area = document.getElementById('stationDirectoryArea');
  if (!area) return;
  try {
    const res = await fetch('/api/stations');
    if (!res.ok) throw new Error('Could not fetch stations.');
    const stations = await res.json();
    if (stations.length === 0) {
      area.innerHTML = '<div class="alert alert-info bg-transparent text-white border-secondary">No stations have been added yet.</div>';
      return;
    }
    const uniqueStationNames = new Set();
    let listHtml = '<div class="glass-card p-3"><ul class="list-group list-group-flush">';
    stations.sort((a, b) => a.name.localeCompare(b.name));
    stations.forEach(station => {
      let displayText = escapeHtml(station.name);
      if (station.city && station.city.trim() !== '' && station.city.toLowerCase() !== station.name.toLowerCase()) {
        displayText += ` (${escapeHtml(station.city)})`;
      }
      if (!uniqueStationNames.has(displayText)) {
        uniqueStationNames.add(displayText);
        listHtml += `<li class="list-group-item bg-transparent text-white border-secondary">${displayText}</li>`;
      }
    });
    listHtml += '</ul></div>';
    area.innerHTML = listHtml;
  } catch (err) {
    console.error("Error loading station directory:", err);
    area.innerHTML = '<div class="text-danger">Could not load stations.</div>';
  }
}

// ---= MY BOOKINGS =---
async function loadBookings() {
  const area = document.getElementById('bookingsArea');
  if (!area) return;
  try {
    const res = await fetch('/api/bookings/my-bookings', { headers: await authHeaders(), credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (!res.ok) throw new Error(await res.text());
    const bookings = await res.json();
    await renderBookings(bookings, area);
  } catch (err) {
    area.innerHTML = `<div class="text-danger">Error loading bookings: ${err.message}</div>`;
  }
}

async function renderBookings(bookings, targetArea) {
  if (!targetArea) return;
  if (!bookings || !bookings.length) {
    targetArea.innerHTML = '<div class="alert alert-info bg-transparent text-white border-secondary">You have no bookings yet.</div>';
    return;
  }
  const [schedules, trains] = await Promise.all([ fetch('/api/schedules').then(r=>r.json()), fetch('/api/trains').then(r=>r.json()) ])
      .catch(err => { console.error("Fetch failed in renderBookings:", err); return [null, null]; });
  if (!schedules || !trains) { targetArea.innerHTML = `<div class="text-danger">Error loading booking details.</div>`; return; }

  const scheduleMap = new Map(schedules.map(s => [s.id, s]));
  const trainMap = new Map(trains.map(t => [t.id, t.name]));
  let html = '';

  bookings.forEach(b => {
    const schedule = scheduleMap.get(b.scheduleId);
    const trainName = schedule ? (trainMap.get(schedule.trainId) || 'Unknown') : 'Unknown';
    const scheduleInfo = schedule ? `${schedule.departureStation} ➔ ${schedule.arrivalStation}` : `ID #${b.scheduleId}`;
    const departureTime = schedule ? new Date(schedule.departureTime).toLocaleString() : 'N/A';
    const status = b.status ?? 'PENDING';
    let paymentActions = b.paymentStatus === 'PENDING' ? `<button class="btn btn-sm btn-warning pay-now-btn" data-id="${b.id}">Pay Now</button>` : '';
    const statusBadgeClass = status === 'CONFIRMED' ? 'bg-success' : 'bg-secondary';
    const paymentBadgeClass = b.paymentStatus === 'CONFIRMED' ? 'bg-success' : (b.paymentStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning');

    html += `
            <div class="p-3 booking-card glass-card d-flex justify-content-between align-items-start mb-3 text-white border-secondary">
                <div>
                  <strong>Booking #${escapeHtml(b.id)}</strong>
                  <div class="muted-small">Journey: ${escapeHtml(scheduleInfo)} on ${escapeHtml(trainName)}</div>
                  <div class="muted-small">Departure: ${escapeHtml(departureTime)}</div>
                  <div class="muted-small">Seats: ${escapeHtml(b.seats)} | Total: LKR ${b.totalPrice ? b.totalPrice.toFixed(2) : 'N/A'}</div>
                  <div class="muted-small">Status: <span class="badge ${statusBadgeClass}">${escapeHtml(status)}</span> (Payment: <span class="badge ${paymentBadgeClass}">${escapeHtml(b.paymentStatus)}</span>)</div>
                </div>
                <div class="text-end booking-actions d-flex flex-column gap-2">
                  ${b.paymentStatus === 'CONFIRMED' ? `<button class="btn btn-sm btn-outline-primary view-ticket-btn" data-booking-id="${b.id}">View Ticket</button>` : paymentActions}
                  ${b.paymentStatus !== 'CONFIRMED' ? `<button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${escapeHtml(b.id)}">Cancel</button>` : ''}
                </div>
            </div>`;
  });
  targetArea.innerHTML = html;
  attachBookingActionListeners(targetArea);
}

function attachBookingActionListeners(area) {
  if (!area) return;
  area.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', handleCancelBooking));
  area.querySelectorAll('.view-ticket-btn').forEach(btn => btn.addEventListener('click', handleViewTicket));
  area.querySelectorAll('.pay-now-btn').forEach(btn => btn.addEventListener('click', handlePayNow));
}

async function handleCancelBooking(event) {
  const id = event.target.getAttribute('data-id');
  if (!confirm('Are you sure you want to cancel booking #' + id + '?')) return;
  try {
    const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await authHeaders(), credentials: 'same-origin' });
    if (!res.ok) throw new Error(await res.text() || `Failed to cancel (Status: ${res.status})`);
    showMsg('Booking cancelled successfully.');
    loadBookings();
  } catch (err) { showMsg('Error: ' + err.message); }
}

function handleViewTicket(event) {
  const bookingId = event.target.getAttribute('data-booking-id');
  window.location.href = `/ticket?id=${bookingId}`;
}

async function handlePayNow(event) {
  const button = event.target;
  const id = button.getAttribute('data-id');
  const actionDiv = button.closest('.booking-actions');
  if (!confirm('This will mark your booking as awaiting payment confirmation. Proceed?')) return;
  if (actionDiv) actionDiv.innerHTML = `<span class="text-muted small fst-italic">Processing...</span>`;
  try {
    const res = await fetch(`/api/bookings/${id}/pay`, { method: 'POST', headers: await authHeaders(), credentials: 'same-origin' });
    if (!res.ok) throw new Error(await res.text() || `Failed to submit (Status: ${res.status})`);
    showMsg('Payment submitted for confirmation.');
    loadBookings();
  } catch (err) { showMsg('Error: ' + err.message); loadBookings(); }
}

// ---= SEARCH & ALL JOURNEYS =---
async function handleSearchSubmit(event) {
  event.preventDefault();
  setActiveSidebarLink("showMyBookingsView()");
  const origin = document.getElementById('searchOrigin').value.trim();
  const destination = document.getElementById('searchDestination').value.trim();
  const date = document.getElementById('searchDate').value;
  const resultsArea = document.getElementById('dynamicContentArea');
  if (!origin || !destination || !date) { showMsg('Please enter all fields.'); return; }
  resultsArea.innerHTML = `<div class="d-flex justify-content-center text-white p-3"><div class="spinner-border"></div><span class="ms-2">Searching...</span></div>`;
  try {
    const url = `/api/schedules/search?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text() || `Search failed (Status: ${res.status})`);
    const schedules = await res.json();
    await renderSearchResults(schedules, "Search Results", resultsArea);
  } catch (err) {
    console.error("Search error:", err);
    resultsArea.innerHTML = `<div class="alert alert-warning">${err.message}</div>`;
  }
}

async function loadAllSchedules() {
  const area = document.getElementById('allSchedulesArea');
  if (!area) return;
  area.innerHTML = `<div class="d-flex justify-content-center text-white p-3"><div class="spinner-border"></div><span class="ms-2">Loading all journeys...</span></div>`;
  try {
    const res = await fetch('/api/schedules');
    if (!res.ok) throw new Error(await res.text() || `Failed to load (Status: ${res.status})`);
    const schedules = await res.json();
    await renderSearchResults(schedules, "All Available Journeys", area);
  } catch (err) {
    console.error("Load all schedules error:", err);
    area.innerHTML = `<div class="alert alert-warning">${err.message}</div>`;
  }
}

async function renderSearchResults(schedules, title, targetArea) {
  if (!targetArea) { console.error("Target area missing for search results!"); return; }
  if (!schedules || !schedules.length) {
    targetArea.innerHTML = `<div class="alert alert-info text-center bg-transparent text-white border-secondary">No trains found matching your criteria.</div>`;
    return;
  }
  const trains = await fetch('/api/trains').then(r => r.ok ? r.json() : []).catch(err => { console.error("Failed to fetch trains:", err); return []; });
  const trainMap = new Map(trains.map(t => [t.id, t.name]));
  let html = `<div class="glass-card p-3 animate-fade-in"><h3 class="text-white mb-3">${title}</h3>`;
  schedules.forEach(s => {
    const trainName = trainMap.get(s.trainId) || 'Unknown';
    const departureTime = new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const arrivalTime = new Date(s.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    html += `
            <div class="list-group-item list-group-item-action bg-transparent text-white d-flex justify-content-between align-items-center mb-2 border-secondary p-3">
                <div class="w-75">
                    <h5 class="mb-1">${escapeHtml(trainName)}</h5>
                    <!-- *** THIS IS THE CORRECTED LINE *** -->
                    <p class="mb-1">${escapeHtml(s.departureStation)} <i class="fas fa-long-arrow-alt-right"></i> ${escapeHtml(s.arrivalStation)}</p>
                    <small>Departs: ${departureTime} | Arrives: ${arrivalTime}</small>
                </div>
                <div class="text-end">
                    <span class="d-block fw-bold fs-5">LKR ${s.price.toFixed(2)}</span>
                    <button class="btn btn-primary btn-sm mt-2 book-now-btn" data-schedule-id="${s.id}">Book Now</button>
                </div>
            </div>`;
  });
  html += `</div>`;
  targetArea.innerHTML = html;
  attachSearchResultsBookingListeners(targetArea); // Attach listeners here
}


// ---= BOOKING MODAL & SUBMISSION =---
function attachSearchResultsBookingListeners(area) {
  if (!area) return;
  area.querySelectorAll('.book-now-btn').forEach(btn => {
    btn.removeEventListener('click', handleBookNowClick);
    btn.addEventListener('click', handleBookNowClick);
  });
}

function handleBookNowClick(event) {
  const scheduleId = event.target.getAttribute('data-schedule-id');
  if (scheduleId) { openBookingModalForSchedule(scheduleId); }
  else { console.error("Book Now clicked without schedule ID."); showMsg("Error initiating booking."); }
}

function openBookingModalForSchedule(scheduleId) {
  const modalEl = document.getElementById('createBookingModal');
  if (!modalEl) { console.error("Booking modal missing!"); return; }
  const createForm = document.getElementById('createBookingForm');
  if (!createForm) { console.error("Booking form missing!"); return; }
  createForm.dataset.scheduleId = scheduleId;
  createForm.reset();
  const scheduleSelectDiv = document.getElementById('scheduleSelect')?.closest('.mb-3');
  if (scheduleSelectDiv) scheduleSelectDiv.style.display = 'none';
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function handleCreateBooking(event) {
  event.preventDefault();
  console.log("handleCreateBooking triggered");
  if (!currentUserId) { showMsg('Error: User not identified. Please login again.'); return; }

  const createForm = event.target;
  const scheduleId = createForm.dataset.scheduleId;
  const seatsInput = document.getElementById('seats');
  const seats = seatsInput ? parseInt(seatsInput.value || '1', 10) : 1;
  console.log("Booking - UserID:", currentUserId, "ScheduleID:", scheduleId, "Seats:", seats);

  if (!scheduleId) {
    showMsg('Error: Could not determine journey. Please select again.');
    console.error("scheduleId missing from form dataset in handleCreateBooking");
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('createBookingModal'));
    if(modalInstance) modalInstance.hide();
    return;
  }

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ scheduleId: parseInt(scheduleId), userId: currentUserId, seats: seats })
    });
    console.log("Booking response status:", res.status);
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Booking failed (Status: ${res.status})`);
    }
    showMsg('Booking created! Pending payment confirmation.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('createBookingModal')).hide();
    showMyBookingsView(); // Refresh and show My Bookings
  } catch (err) {
    console.error('Booking submission error:', err);
    showMsg('Booking failed: ' + err.message);
  } finally {
    if (createForm.dataset.scheduleId) delete createForm.dataset.scheduleId;
    const scheduleSelectDiv = document.getElementById('scheduleSelect')?.closest('.mb-3');
    if(scheduleSelectDiv) scheduleSelectDiv.style.display = 'none';
  }
}

// ---= MASTER EVENT LISTENER (Single source of truth) =---
document.addEventListener('DOMContentLoaded', async function() {
  console.log("Attaching event listeners...");

  await setupUserInfo(); // Wait for user info

  // Attach listeners for static elements
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('searchScheduleForm')?.addEventListener('submit', handleSearchSubmit);

  // Attach listener for the booking modal form SUBMIT event
  const createBookingForm = document.getElementById('createBookingForm');
  if (createBookingForm) {
    if (typeof handleCreateBooking === 'function') { // Ensure function exists
      createBookingForm.addEventListener('submit', handleCreateBooking);
    } else {
      console.error('handleCreateBooking function missing!');
    }
  } else {
    console.error("Booking Form not found!");
  }

  // Load initial view
  showMyBookingsView();
});

