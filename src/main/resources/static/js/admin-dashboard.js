// admin-dashboard.js - V2 (Corrected and Restructured)

// ---= LOADER FUNCTIONS (for displaying content panels) =---

async function loadContent(url, contentRenderer) {
  const contentDiv = document.getElementById('adminContent');
  contentDiv.classList.add('fade-out');
  setTimeout(async () => {
    contentDiv.innerHTML = '<div class="text-center text-white">Loading...</div>';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      contentRenderer(data);
    } catch (error) {
      console.error('Failed to load content:', error);
      contentDiv.innerHTML = `<div class="text-danger">Failed to load content. Please check the console.</div>`;
    } finally {
      contentDiv.classList.remove('fade-out');
      contentDiv.classList.add('animate-fade-in');
    }
  }, 200);
}

function loadTrains() {
  loadContent('/api/admin/trains', (trains) => {
    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Trains</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addTrainModal">+ Add New Train</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead><tr><th>ID</th><th>Train Name</th><th>Type</th><th>Capacity</th><th>Actions</th></tr></thead>
                        <tbody>`;
    if (trains.length === 0) {
      tableHtml += '<tr><td colspan="5" class="text-center">No trains found.</td></tr>';
    } else {
      trains.forEach(train => {
        tableHtml += `
                    <tr>
                        <th scope="row">${train.id}</th>
                        <td>${train.name}</td>
                        <td>${train.type}</td>
                        <td>${train.capacity}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-icon btn-outline-info" title="Edit Train" onclick="openEditTrainModal(${train.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-icon btn-outline-danger" title="Delete Train" onclick="deleteTrain(${train.id})"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </td>
                    </tr>`;
      });
    }
    tableHtml += `</tbody></table></div></div>`;
    document.getElementById('adminContent').innerHTML = tableHtml;
  });
}

function loadUsers() {
  loadContent('/api/admin/users', (users) => {
    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Users</h4>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead><tr><th>ID</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>`;
    if (users.length === 0) {
      tableHtml += '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
    } else {
      users.forEach(user => {
        const statusBadge = user.enabled ? `<span class="badge bg-success">Enabled</span>` : `<span class="badge bg-secondary">Disabled</span>`;
        const toggleButtonText = user.enabled ? 'Disable' : 'Enable';
        const toggleButtonClass = user.enabled ? 'btn-warning' : 'btn-success';
        tableHtml += `
                    <tr>
                        <th scope="row">${user.id}</th>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm ${toggleButtonClass}" onclick="toggleUserStatus(${user.id}, ${user.enabled})">${toggleButtonText}</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                            </div>
                        </td>
                    </tr>`;
      });
    }
    tableHtml += `</tbody></table></div></div>`;
    document.getElementById('adminContent').innerHTML = tableHtml;
  });
}

function loadSchedules() {
  Promise.all([
    fetch('/api/admin/schedules').then(res => res.json()),
    fetch('/api/admin/trains').then(res => res.json())
  ]).then(([schedules, trains]) => {
    const trainMap = new Map(trains.map(train => [train.id, train.name]));
    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Schedules</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addScheduleModal">+ Add New Schedule</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead><tr><th>ID</th><th>Train Name</th><th>From</th><th>To</th><th>Departure</th><th>Arrival</th><th>Price (LKR)</th><th>Actions</th></tr></thead>
                        <tbody>`;
    if (schedules.length === 0) {
      tableHtml += '<tr><td colspan="8" class="text-center">No schedules found.</td></tr>';
    } else {
      schedules.forEach(schedule => {
        tableHtml += `
                    <tr>
                        <th scope="row">${schedule.id}</th>
                        <td>${trainMap.get(schedule.trainId) || `ID: ${schedule.trainId}`}</td>
                        <td>${schedule.departureStation}</td>
                        <td>${schedule.arrivalStation}</td>
                        <td>${schedule.departureTime.replace('T', ' ')}</td>
                        <td>${schedule.arrivalTime.replace('T', ' ')}</td>
                        <td>${schedule.price.toFixed(2)}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-icon btn-outline-info" title="Edit Schedule" onclick="openEditScheduleModal(${schedule.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-icon btn-outline-danger" title="Delete Schedule" onclick="deleteSchedule(${schedule.id})"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </td>
                    </tr>`;
      });
    }
    tableHtml += `</tbody></table></div></div>`;
    document.getElementById('adminContent').innerHTML = tableHtml;
  }).catch(error => console.error('Failed to load schedules:', error));
}

function loadBookings() {
  Promise.all([
    fetch('/api/admin/bookings').then(res => res.json()),
    fetch('/api/admin/users').then(res => res.json()),
    fetch('/api/admin/schedules').then(res => res.json())
  ]).then(([bookings, users, schedules]) => {
    const userMap = new Map(users.map(user => [user.id, user.email]));
    const scheduleMap = new Map(schedules.map(schedule => [schedule.id, schedule]));
    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Bookings</h4>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead><tr><th>Booking ID</th><th>User</th><th>Schedule</th><th>Seats</th><th>Total Price</th><th>Payment Status</th><th>Actions</th></tr></thead>
                        <tbody>`;
    if (bookings.length === 0) {
      tableHtml += '<tr><td colspan="7" class="text-center">No bookings found.</td></tr>';
    } else {
      bookings.forEach(booking => {
        const schedule = scheduleMap.get(booking.scheduleId);
        let statusBadge = `<span class="badge bg-warning">Pending</span>`;
        if (booking.paymentStatus === 'CONFIRMED') statusBadge = `<span class="badge bg-success">Confirmed</span>`;
        if (booking.paymentStatus === 'REJECTED') statusBadge = `<span class="badge bg-danger">Rejected</span>`;

        let actionButtons = '';
        if (booking.paymentStatus === 'PENDING') {
          actionButtons = `<button class="btn btn-sm btn-success" onclick="confirmBookingPayment(${booking.id})">Confirm</button> <button class="btn btn-sm btn-danger" onclick="rejectBookingPayment(${booking.id})">Reject</button>`;
        } else if (booking.paymentStatus === 'CONFIRMED') {
          actionButtons = `<button class="btn btn-sm btn-danger" onclick="rejectBookingPayment(${booking.id})">Reject</button>`;
        } else {
          actionButtons = `<button class="btn btn-sm btn-success" onclick="confirmBookingPayment(${booking.id})">Confirm</button>`;
        }
        tableHtml += `
                    <tr>
                        <th scope="row">${booking.id}</th>
                        <td>${userMap.get(booking.userId) || 'Unknown User'}</td>
                        <td>${schedule ? `${schedule.departureStation} to ${schedule.arrivalStation}` : 'Unknown'}</td>
                        <td>${booking.seats}</td>
                        <td>${booking.totalPrice ? booking.totalPrice.toFixed(2) : 'N/A'}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="d-flex gap-2">
                                ${actionButtons}
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteBooking(${booking.id})">Delete</button>
                            </div>
                        </td>
                    </tr>`;
      });
    }
    tableHtml += `</tbody></table></div></div>`;
    document.getElementById('adminContent').innerHTML = tableHtml;
  }).catch(error => console.error('Failed to load bookings:', error));
}

function loadStations() {
  loadContent('/api/admin/stations', (stations) => {
    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Stations</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addStationModal">+ Add New Station</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead><tr><th>ID</th><th>Station Name</th><th>City</th><th>Actions</th></tr></thead>
                        <tbody>`;
    if (stations.length === 0) {
      tableHtml += '<tr><td colspan="4" class="text-center">No stations found.</td></tr>';
    } else {
      stations.forEach(station => {
        tableHtml += `
                    <tr>
                        <th scope="row">${station.id}</th>
                        <td>${station.name}</td>
                        <td>${station.city}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-icon btn-outline-info" title="Edit Station" onclick="openEditStationModal(${station.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-icon btn-outline-danger" title="Delete Station" onclick="deleteStation(${station.id})"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </td>
                    </tr>`;
      });
    }
    tableHtml += `</tbody></table></div></div>`;
    document.getElementById('adminContent').innerHTML = tableHtml;
  });
}

function loadRoutes() {
  loadContent('/api/admin/routes', (routes) => {
    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Routes</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addRouteModal">+ Add New Route</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead><tr><th>ID</th><th>Route Name</th><th>Origin</th><th>Destination</th><th>Distance (km)</th><th>Actions</th></tr></thead>
                        <tbody>`;
    if (routes.length === 0) {
      tableHtml += '<tr><td colspan="6" class="text-center">No routes found.</td></tr>';
    } else {
      routes.forEach(route => {
        tableHtml += `
                    <tr>
                        <th scope="row">${route.id}</th>
                        <td>${route.name}</td>
                        <td>${route.origin}</td>
                        <td>${route.destination}</td>
                        <td>${route.distanceKm}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-icon btn-outline-info" title="Edit Route" onclick="openEditRouteModal(${route.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-icon btn-outline-danger" title="Delete Route" onclick="deleteRoute(${route.id})"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </td>
                    </tr>`;
      });
    }
    tableHtml += `</tbody></table></div></div>`;
    document.getElementById('adminContent').innerHTML = tableHtml;
  });
}

// ---= CRUD HELPER FUNCTIONS (Organized by Entity) =---

// Train
async function handleAddNewTrain(event) {
  event.preventDefault();
  const trainData = { name: document.getElementById('trainName').value, type: document.getElementById('trainType').value, capacity: parseInt(document.getElementById('trainCapacity').value, 10) };
  try {
    const response = await fetch('/api/admin/trains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trainData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Train added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addTrainModal')).hide();
    document.getElementById('addTrainForm').reset();
    loadTrains();
  } catch (error) { alert('Error: ' + error.message); }
}
async function openEditTrainModal(trainId) {
  document.getElementById('editTrainForm').dataset.trainId = trainId;
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`);
    if (!response.ok) throw new Error('Failed to fetch train data.');
    const train = await response.json();
    document.getElementById('editTrainName').value = train.name;
    document.getElementById('editTrainType').value = train.type;
    document.getElementById('editTrainCapacity').value = train.capacity;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editTrainModal')).show();
  } catch (error) { alert("Error: Could not load train data."); }
}
async function handleUpdateTrain(event) {
  event.preventDefault();
  const form = event.target;
  const trainId = form.dataset.trainId;
  if (!trainId) return;
  const updatedData = { name: document.getElementById('editTrainName').value, type: document.getElementById('editTrainType').value, capacity: parseInt(document.getElementById('editTrainCapacity').value, 10) };
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Train updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editTrainModal')).hide();
    loadTrains();
  } catch (error) { alert('Error: ' + error.message); }
}
async function deleteTrain(trainId) {
  if (!confirm(`Are you sure you want to delete train ID #${trainId}?`)) return;
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    alert('Train deleted successfully.');
    loadTrains();
  } catch (error) { alert('Error: ' + error.message); }
}

// Schedule
async function handleAddNewSchedule(event) {
  event.preventDefault();
  const scheduleData = {
    trainId: document.getElementById('scheduleTrainId').value,
    departureStation: document.getElementById('scheduleDepartureStation').value,
    arrivalStation: document.getElementById('scheduleArrivalStation').value,
    departureTime: document.getElementById('scheduleDepartureTime').value + ':00',
    arrivalTime: document.getElementById('scheduleArrivalTime').value + ':00',
    price: parseFloat(document.getElementById('schedulePrice').value)
  };
  try {
    const response = await fetch('/api/admin/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scheduleData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Schedule added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addScheduleModal')).hide();
    document.getElementById('addScheduleForm').reset();
    loadSchedules();
  } catch (error) { alert('Error: ' + error.message); }
}
async function openEditScheduleModal(scheduleId) {
  document.getElementById('editScheduleForm').dataset.scheduleId = scheduleId;
  try {
    const [schedule, trains] = await Promise.all([
      fetch(`/api/admin/schedules/${scheduleId}`).then(res => res.json()),
      fetch('/api/admin/trains').then(res => res.json())
    ]);
    const select = document.getElementById('editScheduleTrainId');
    select.innerHTML = '';
    trains.forEach(train => {
      const option = document.createElement('option');
      option.value = train.id;
      option.textContent = `${train.name} (ID: ${train.id})`;
      if (train.id === schedule.trainId) option.selected = true;
      select.appendChild(option);
    });
    document.getElementById('editScheduleDepartureStation').value = schedule.departureStation;
    document.getElementById('editScheduleArrivalStation').value = schedule.arrivalStation;
    document.getElementById('editScheduleDepartureTime').value = schedule.departureTime.slice(0, 16);
    document.getElementById('editScheduleArrivalTime').value = schedule.arrivalTime.slice(0, 16);
    document.getElementById('editSchedulePrice').value = schedule.price;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editScheduleModal')).show();
  } catch (error) { alert("Error: Could not load schedule data for editing."); }
}
async function handleUpdateSchedule(event) {
  event.preventDefault();
  const form = event.target;
  const scheduleId = form.dataset.scheduleId;
  if (!scheduleId) return;
  const updatedData = {
    trainId: document.getElementById('editScheduleTrainId').value,
    departureStation: document.getElementById('editScheduleDepartureStation').value,
    arrivalStation: document.getElementById('editScheduleArrivalStation').value,
    departureTime: document.getElementById('editScheduleDepartureTime').value + ':00',
    arrivalTime: document.getElementById('editScheduleArrivalTime').value + ':00',
    price: parseFloat(document.getElementById('editSchedulePrice').value)
  };
  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Schedule updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editScheduleModal')).hide();
    loadSchedules();
  } catch (error) { alert('Error: ' + error.message); }
}
async function deleteSchedule(scheduleId) {
  if (!confirm(`Are you sure you want to delete schedule ID #${scheduleId}?`)) return;
  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    alert('Schedule deleted successfully.');
    loadSchedules();
  } catch (error) { alert('Error: ' + error.message); }
}

// Station
async function handleAddStation(event) {
  event.preventDefault();
  const stationData = { name: document.getElementById('stationName').value, city: document.getElementById('stationCity').value };
  try {
    const response = await fetch('/api/admin/stations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stationData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Station added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addStationModal')).hide();
    document.getElementById('addStationForm').reset();
    loadStations();
  } catch (error) { alert('Error: ' + error.message); }
}
async function openEditStationModal(stationId) {
  document.getElementById('editStationForm').dataset.stationId = stationId;
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`);
    if (!response.ok) throw new Error('Failed to fetch station data.');
    const station = await response.json();
    document.getElementById('editStationName').value = station.name;
    document.getElementById('editStationCity').value = station.city;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editStationModal')).show();
  } catch (error) { alert('Error: ' + error.message); } // CORRECTED SYNTAX HERE
}
async function handleUpdateStation(event) {
  event.preventDefault();
  const form = event.target;
  const stationId = form.dataset.stationId;
  if (!stationId) return;
  const stationData = { name: document.getElementById('editStationName').value, city: document.getElementById('editStationCity').value };
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stationData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Station updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editStationModal')).hide();
    loadStations();
  } catch (error) { alert('Error: ' + error.message); }
}
async function deleteStation(stationId) {
  if (!confirm(`Are you sure you want to delete station ID #${stationId}?`)) return;
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    alert('Station deleted successfully.');
    loadStations();
  } catch (error) { alert('Error: ' + error.message); }
}

// Route
async function handleAddRoute(event) {
  event.preventDefault();
  const routeData = {
    name: document.getElementById('routeName').value,
    origin: document.getElementById('routeOrigin').value,
    destination: document.getElementById('routeDestination').value,
    distanceKm: parseFloat(document.getElementById('routeDistance').value)
  };
  try {
    const response = await fetch('/api/admin/routes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(routeData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Route added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addRouteModal')).hide();
    document.getElementById('addRouteForm').reset();
    loadRoutes();
  } catch (error) { alert('Error: ' + error.message); }
}
async function openEditRouteModal(routeId) {
  document.getElementById('editRouteForm').dataset.routeId = routeId;
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`);
    if (!response.ok) throw new Error('Failed to fetch route data.');
    const route = await response.json();
    document.getElementById('editRouteName').value = route.name;
    document.getElementById('editRouteOrigin').value = route.origin;
    document.getElementById('editRouteDestination').value = route.destination;
    document.getElementById('editRouteDistance').value = route.distanceKm;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editRouteModal')).show();
  } catch (error) { alert('Error: ' + error.message); }
}
async function handleUpdateRoute(event) {
  event.preventDefault();
  const form = event.target;
  const routeId = form.dataset.routeId;
  if (!routeId) return;
  const routeData = {
    name: document.getElementById('editRouteName').value,
    origin: document.getElementById('editRouteOrigin').value,
    destination: document.getElementById('editRouteDestination').value,
    distanceKm: parseFloat(document.getElementById('editRouteDistance').value)
  };
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(routeData) });
    if (!response.ok) throw new Error(await response.text());
    alert('Route updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editRouteModal')).hide();
    loadRoutes();
  } catch (error) { alert('Error: ' + error.message); }
}
async function deleteRoute(routeId) {
  if (!confirm(`Are you sure you want to delete route ID #${routeId}?`)) return;
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    alert('Route deleted successfully.');
    loadRoutes();
  } catch (error) { alert('Error: ' + error.message); }
}

// User Management
async function deleteUser(userId) {
  if (!confirm(`Are you sure you want to permanently delete user ID #${userId}?`)) return;
  try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    alert('User deleted successfully.');
    loadUsers();
  } catch (error) { alert('Error: ' + error.message); }
}
async function toggleUserStatus(userId, isCurrentlyEnabled) {
  const action = isCurrentlyEnabled ? 'disable' : 'enable';
  if (!confirm(`Are you sure you want to ${action} user ID #${userId}?`)) return;
  const updatedUserData = { enabled: !isCurrentlyEnabled };
  try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedUserData) });
    if (!response.ok) throw new Error(await response.text());
    alert(`User ${action}d successfully!`);
    loadUsers();
  } catch (error) { alert('Error: ' + error.message); }
}

// Booking Management
async function confirmBookingPayment(bookingId) {
  if (!confirm(`Are you sure you want to CONFIRM payment for booking ID #${bookingId}?`)) return;
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, { method: 'PUT' });
    if (!response.ok) throw new Error(await response.text());
    alert('Payment confirmed successfully!');
    loadBookings();
  } catch (error) { alert('Error: ' + error.message); }
}
async function rejectBookingPayment(bookingId) {
  if (!confirm(`Are you sure you want to REJECT payment for booking ID #${bookingId}?`)) return;
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}/reject-payment`, { method: 'PUT' });
    if (!response.ok) throw new Error(await response.text());
    alert('Payment rejected successfully!');
    loadBookings();
  } catch (error) { alert('Error: ' + error.message); }
}
async function deleteBooking(bookingId) {
  if (!confirm(`Are you sure you want to permanently delete booking ID #${bookingId}?`)) return;
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    alert('Booking deleted successfully.');
    loadBookings();
  } catch (error) { alert('Error: ' + error.message); }
}

// Dashboard Stats
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/admin/dashboard/stats');
    if (!response.ok) throw new Error('Failed to load dashboard statistics.');
    const stats = await response.json();
    document.getElementById('statTotalTrains').textContent = stats.totalTrains;
    document.getElementById('statActiveSchedules').textContent = stats.totalSchedules;
    document.getElementById('statPendingBookings').textContent = stats.pendingBookings;
    document.getElementById('statRegisteredUsers').textContent = stats.totalUsers;
  } catch (error) {
    console.error(error.message);
  }
}


// ---= MASTER EVENT LISTENER (SINGLE SOURCE OF TRUTH) =---
document.addEventListener('DOMContentLoaded', function() {
  console.log("Attaching all event listeners...");

  // Load initial dashboard stats
  loadDashboardStats();

  // Attach form submit listeners for all "Add" modals
  document.getElementById('addTrainForm')?.addEventListener('submit', handleAddNewTrain);
  document.getElementById('addScheduleForm')?.addEventListener('submit', handleAddNewSchedule);
  document.getElementById('addStationForm')?.addEventListener('submit', handleAddStation);
  document.getElementById('addRouteForm')?.addEventListener('submit', handleAddRoute);

  // Attach form submit listeners for all "Edit" modals
  document.getElementById('editTrainForm')?.addEventListener('submit', handleUpdateTrain);
  document.getElementById('editScheduleForm')?.addEventListener('submit', handleUpdateSchedule);
  document.getElementById('editStationForm')?.addEventListener('submit', handleUpdateStation);
  document.getElementById('editRouteForm')?.addEventListener('submit', handleUpdateRoute);

  // Special listener for the "Add Schedule" modal to populate its dropdown
  const addScheduleModal = document.getElementById('addScheduleModal');
  if (addScheduleModal) {
    addScheduleModal.addEventListener('show.bs.modal', async () => {
      const select = document.getElementById('scheduleTrainId');
      try {
        const response = await fetch('/api/admin/trains');
        const trains = await response.json();
        select.innerHTML = '<option value="" selected disabled>Select a train</option>';
        trains.forEach(train => {
          const option = document.createElement('option');
          option.value = train.id;
          option.textContent = `${train.name} (ID: ${train.id})`;
          select.appendChild(option);
        });
      } catch (error) {
        select.innerHTML = '<option value="" disabled>Could not load trains</option>';
      }
    });
  }
});