// admin-dashboard.js - V4 (Fixes All Syntax Errors & Includes Add Admin)

// ---= UTILITIES & SHARED LOGIC =---
async function loadContent(url, contentRenderer) {
  const contentDiv = document.getElementById('adminContent');
  if (!contentDiv) { console.error("Admin content area not found!"); return; }
  contentDiv.classList.add('fade-out');
  setTimeout(async () => {
    contentDiv.innerHTML = '<div class="d-flex justify-content-center text-white p-3"><div class="spinner-border spinner-border-sm" role="status"></div><span class="ms-2">Loading...</span></div>';
    try {
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} ${await response.text()}`);
      const data = await response.json();
      contentRenderer(data);
    } catch (error) {
      console.error('Failed to load content for URL:', url, error);
      contentDiv.innerHTML = `<div class="alert alert-danger">Failed to load content. Please check console.</div>`;
    } finally {
      contentDiv.classList.remove('fade-out');
    }
  }, 200);
}

function getAuthHeaders() {
  return { 'Accept': 'application/json', 'Content-Type': 'application/json' };
}

function showAdminMsg(msg, isError = false) {
  console.log(msg);
  alert(msg);
}

// ---= CONTENT LOADERS (Called by Sidebar Links) =---
// Functions are defined globally, so onclick="" in HTML will work.
function loadTrains() {
  loadContent('/api/admin/trains', (trains) => {
    let tableHtml = `<div class="admin-content-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="text-white mb-0">Manage Trains</h4><button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addTrainModal">+ Add New Train</button></div><div class="table-responsive"><table class="table table-dark table-striped table-hover"><thead><tr><th>ID</th><th>Train Name</th><th>Type</th><th>Capacity</th><th>Actions</th></tr></thead><tbody>`;
    if (!trains.length) tableHtml += '<tr><td colspan="5" class="text-center">No trains found.</td></tr>';
    else trains.forEach(train => { tableHtml += `<tr><th>${train.id}</th><td>${train.name}</td><td>${train.type}</td><td>${train.capacity}</td><td><div class="d-flex gap-2"><button class="btn btn-sm btn-icon btn-outline-info" title="Edit Train" onclick="openEditTrainModal(${train.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-icon btn-outline-danger" title="Delete Train" onclick="deleteTrain(${train.id})"><i class="fas fa-trash-alt"></i></button></div></td></tr>`; });
    tableHtml += `</tbody></table></div></div>`;
    const contentDiv = document.getElementById('adminContent');
    contentDiv.innerHTML = tableHtml;
    contentDiv.classList.add('animate-fade-in');
  });
}

function loadUsers() {
  loadContent('/api/admin/users', (users) => {
    let tableHtml = `<div class="admin-content-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="text-white mb-0">Manage Users</h4><button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addAdminModal">+ Add New Admin</button></div><div class="table-responsive"><table class="table table-dark table-striped table-hover"><thead><tr><th>ID</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
    if (!users.length) tableHtml += '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
    else users.forEach(user => {
      const statusBadge = user.enabled ? `<span class="badge bg-success">Enabled</span>` : `<span class="badge bg-secondary">Disabled</span>`;
      const toggleBtnText = user.enabled ? 'Disable' : 'Enable';
      const toggleBtnClass = user.enabled ? 'btn-warning' : 'btn-success';
      tableHtml += `<tr><th>${user.id}</th><td>${user.email}</td><td>${user.role}</td><td>${statusBadge}</td><td><div class="d-flex gap-2"><button class="btn btn-sm ${toggleBtnClass}" onclick="toggleUserStatus(${user.id}, ${user.enabled})">${toggleBtnText}</button><button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button></div></td></tr>`;
    });
    tableHtml += `</tbody></table></div></div>`;
    const contentDiv = document.getElementById('adminContent');
    contentDiv.innerHTML = tableHtml;
    contentDiv.classList.add('animate-fade-in');
  });
}

function loadSchedules() {
  Promise.all([fetch('/api/admin/schedules',{headers:getAuthHeaders()}).then(r=>r.json()), fetch('/api/admin/trains',{headers:getAuthHeaders()}).then(r=>r.json())])
      .then(([schedules, trains]) => {
        const trainMap = new Map(trains.map(t => [t.id, t.name]));
        let tableHtml = `<div class="admin-content-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="text-white mb-0">Manage Schedules</h4><button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addScheduleModal">+ Add New Schedule</button></div><div class="table-responsive"><table class="table table-dark table-striped table-hover"><thead><tr><th>ID</th><th>Train</th><th>From</th><th>To</th><th>Departure</th><th>Arrival</th><th>Price</th><th>Actions</th></tr></thead><tbody>`;
        if (!schedules.length) tableHtml += '<tr><td colspan="8" class="text-center">No schedules.</td></tr>';
        else schedules.forEach(s => { tableHtml += `<tr><th>${s.id}</th><td>${trainMap.get(s.trainId)||"?"}</td><td>${s.departureStation}</td><td>${s.arrivalStation}</td><td>${s.departureTime.replace('T',' ')}</td><td>${s.arrivalTime.replace('T',' ')}</td><td>${s.price.toFixed(2)}</td><td><div class="d-flex gap-2"><button class="btn btn-sm btn-icon btn-outline-info" title="Edit" onclick="openEditScheduleModal(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-icon btn-outline-danger" title="Delete" onclick="deleteSchedule(${s.id})"><i class="fas fa-trash-alt"></i></button></div></td></tr>`; });
        tableHtml += `</tbody></table></div></div>`;
        const contentDiv = document.getElementById('adminContent');
        contentDiv.innerHTML = tableHtml;
        contentDiv.classList.add('animate-fade-in');
      }).catch(e => { console.error("Load schedules error:", e); document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Failed load schedules.</div>`; });
}

function loadBookings() {
  Promise.all([fetch('/api/admin/bookings',{headers:getAuthHeaders()}).then(r=>r.json()), fetch('/api/admin/users',{headers:getAuthHeaders()}).then(r=>r.json()), fetch('/api/admin/schedules',{headers:getAuthHeaders()}).then(r=>r.json())])
      .then(([bookings, users, schedules]) => {
        const userMap = new Map(users.map(u => [u.id, u.email]));
        const scheduleMap = new Map(schedules.map(s => [s.id, s]));
        let tableHtml = `<div class="admin-content-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="text-white mb-0">Manage Bookings</h4></div><div class="table-responsive"><table class="table table-dark table-striped table-hover"><thead><tr><th>ID</th><th>User</th><th>Schedule</th><th>Seats</th><th>Price</th><th>Payment</th><th>Actions</th></tr></thead><tbody>`;
        if (!bookings.length) tableHtml += '<tr><td colspan="7" class="text-center">No bookings.</td></tr>';
        else bookings.forEach(b => {
          const schedule = scheduleMap.get(b.scheduleId);
          let pStatus = `<span class="badge bg-warning">Pending</span>`;
          if(b.paymentStatus === 'CONFIRMED') pStatus = `<span class="badge bg-success">Confirmed</span>`;
          if(b.paymentStatus === 'REJECTED') pStatus = `<span class="badge bg-danger">Rejected</span>`;
          let actions = '';
          if(b.paymentStatus === 'PENDING') actions = `<button class="btn btn-sm btn-success" onclick="confirmBookingPayment(${b.id})">Confirm</button> <button class="btn btn-sm btn-danger" onclick="rejectBookingPayment(${b.id})">Reject</button>`;
          else if(b.paymentStatus === 'CONFIRMED') actions = `<button class="btn btn-sm btn-danger" onclick="rejectBookingPayment(${b.id})">Reject</button>`;
          else actions = `<button class="btn btn-sm btn-success" onclick="confirmBookingPayment(${b.id})">Confirm</button>`;
          tableHtml += `<tr><th>${b.id}</th><td>${userMap.get(b.userId)||"?"}</td><td>${schedule?`${schedule.departureStation}➔${schedule.arrivalStation}`:"?"}</td><td>${b.seats}</td><td>${b.totalPrice?b.totalPrice.toFixed(2):'N/A'}</td><td>${pStatus}</td><td><div class="d-flex gap-2">${actions}<button class="btn btn-sm btn-outline-danger" onclick="deleteBooking(${b.id})">Delete</button></div></td></tr>`;
        });
        tableHtml += `</tbody></table></div></div>`;
        const contentDiv = document.getElementById('adminContent');
        contentDiv.innerHTML = tableHtml;
        contentDiv.classList.add('animate-fade-in');
      }).catch(e => { console.error("Load bookings error:", e); document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Failed load bookings.</div>`; });
}

function loadStations() {
  loadContent('/api/admin/stations', (stations) => {
    let tableHtml = `<div class="admin-content-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="text-white mb-0">Manage Stations</h4><button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addStationModal">+ Add New Station</button></div><div class="table-responsive"><table class="table table-dark table-striped table-hover"><thead><tr><th>ID</th><th>Station Name</th><th>City</th><th>Actions</th></tr></thead><tbody>`;
    if (!stations.length) tableHtml += '<tr><td colspan="4" class="text-center">No stations found.</td></tr>';
    else stations.forEach(s => { tableHtml += `<tr><th>${s.id}</th><td>${s.name}</td><td>${s.city}</td><td><div class="d-flex gap-2"><button class="btn btn-sm btn-icon btn-outline-info" title="Edit" onclick="openEditStationModal(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-icon btn-outline-danger" title="Delete" onclick="deleteStation(${s.id})"><i class="fas fa-trash-alt"></i></button></div></td></tr>`; });
    tableHtml += `</tbody></table></div></div>`;
    const contentDiv = document.getElementById('adminContent');
    contentDiv.innerHTML = tableHtml;
    contentDiv.classList.add('animate-fade-in');
  });
}

function loadRoutes() {
  loadContent('/api/admin/routes', (routes) => {
    let tableHtml = `<div class="admin-content-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="text-white mb-0">Manage Routes</h4><button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addRouteModal">+ Add New Route</button></div><div class="table-responsive"><table class="table table-dark table-striped table-hover"><thead><tr><th>ID</th><th>Name</th><th>Origin</th><th>Dest.</th><th>Dist.</th><th>Actions</th></tr></thead><tbody>`;
    if (!routes.length) tableHtml += '<tr><td colspan="6" class="text-center">No routes found.</td></tr>';
    else routes.forEach(r => { tableHtml += `<tr><th>${r.id}</th><td>${r.name}</td><td>${r.origin}</td><td>${r.destination}</td><td>${r.distanceKm}</td><td><div class="d-flex gap-2"><button class="btn btn-sm btn-icon btn-outline-info" title="Edit" onclick="openEditRouteModal(${r.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-icon btn-outline-danger" title="Delete" onclick="deleteRoute(${r.id})"><i class="fas fa-trash-alt"></i></button></div></td></tr>`; });
    tableHtml += `</tbody></table></div></div>`;
    const contentDiv = document.getElementById('adminContent');
    contentDiv.innerHTML = tableHtml;
    contentDiv.classList.add('animate-fade-in');
  });
}


// ---= CRUD HELPER FUNCTIONS (Defined globally for onclick) =---

// Train
async function handleAddNewTrain(event) {
  event.preventDefault();
  const trainData = { name: document.getElementById('trainName').value, type: document.getElementById('trainType').value, capacity: parseInt(document.getElementById('trainCapacity').value, 10) };
  if (!trainData.name || !trainData.type || !trainData.capacity) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch('/api/admin/trains', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(trainData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Train added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addTrainModal')).hide();
    document.getElementById('addTrainForm').reset();
    loadTrains();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.openEditTrainModal = async function(trainId) {
  const form = document.getElementById('editTrainForm');
  if (!form) return;
  form.dataset.trainId = trainId;
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch train data.');
    const train = await response.json();
    document.getElementById('editTrainName').value = train.name;
    document.getElementById('editTrainType').value = train.type;
    document.getElementById('editTrainCapacity').value = train.capacity;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editTrainModal')).show();
  } catch (error) { showAdminMsg("Error: Could not load train data.", true); }
}
async function handleUpdateTrain(event) {
  event.preventDefault();
  const form = event.target;
  const trainId = form.dataset.trainId;
  if (!trainId) return;
  const updatedData = { name: document.getElementById('editTrainName').value, type: document.getElementById('editTrainType').value, capacity: parseInt(document.getElementById('editTrainCapacity').value, 10) };
  if (!updatedData.name || !updatedData.type || !updatedData.capacity) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatedData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Train updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editTrainModal')).hide();
    loadTrains();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.deleteTrain = async function(trainId) {
  if (!confirm(`Are you sure you want to delete train ID #${trainId}?`)) return;
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Train deleted successfully.');
    loadTrains();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
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
  if (!scheduleData.trainId || !scheduleData.departureStation || !scheduleData.arrivalStation || !scheduleData.departureTime || !scheduleData.arrivalTime || !scheduleData.price) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch('/api/admin/schedules', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(scheduleData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Schedule added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addScheduleModal')).hide();
    document.getElementById('addScheduleForm').reset();
    loadSchedules();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.openEditScheduleModal = async function(scheduleId) {
  const form = document.getElementById('editScheduleForm');
  if (!form) return;
  form.dataset.scheduleId = scheduleId;
  try {
    const [schedule, trains] = await Promise.all([
      fetch(`/api/admin/schedules/${scheduleId}`, {headers:getAuthHeaders()}).then(res => res.json()),
      fetch('/api/admin/trains', {headers:getAuthHeaders()}).then(res => res.json())
    ]);
    const select = document.getElementById('editScheduleTrainId');
    select.innerHTML = '';
    trains.forEach(train => {
      const option = document.createElement('option'); option.value = train.id; option.textContent = `${train.name} (ID: ${train.id})`;
      if (train.id === schedule.trainId) option.selected = true;
      select.appendChild(option);
    });
    document.getElementById('editScheduleDepartureStation').value = schedule.departureStation;
    document.getElementById('editScheduleArrivalStation').value = schedule.arrivalStation;
    document.getElementById('editScheduleDepartureTime').value = schedule.departureTime.slice(0, 16);
    document.getElementById('editScheduleArrivalTime').value = schedule.arrivalTime.slice(0, 16);
    document.getElementById('editSchedulePrice').value = schedule.price;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editScheduleModal')).show();
  } catch (error) { showAdminMsg("Error: Could not load schedule data for editing.", true); }
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
  if (!updatedData.trainId || !updatedData.departureStation || !updatedData.arrivalStation || !updatedData.departureTime || !updatedData.arrivalTime || !updatedData.price) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatedData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Schedule updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editScheduleModal')).hide();
    loadSchedules();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.deleteSchedule = async function(scheduleId) {
  if (!confirm(`Are you sure you want to delete schedule ID #${scheduleId}?`)) return;
  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Schedule deleted successfully.');
    loadSchedules();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}

// Station
async function handleAddStation(event) {
  event.preventDefault();
  const stationData = { name: document.getElementById('stationName').value, city: document.getElementById('stationCity').value };
  if (!stationData.name || !stationData.city) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch('/api/admin/stations', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(stationData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Station added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addStationModal')).hide();
    document.getElementById('addStationForm').reset();
    loadStations();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.openEditStationModal = async function(stationId) {
  const form = document.getElementById('editStationForm');
  if (!form) return;
  form.dataset.stationId = stationId;
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch station data.');
    const station = await response.json();
    document.getElementById('editStationName').value = station.name;
    document.getElementById('editStationCity').value = station.city;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editStationModal')).show();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); } // *** FIXED SYNTAX ERROR HERE ***
}
async function handleUpdateStation(event) {
  event.preventDefault();
  const form = event.target;
  const stationId = form.dataset.stationId;
  if (!stationId) return;
  const stationData = { name: document.getElementById('editStationName').value, city: document.getElementById('editStationCity').value };
  if (!stationData.name || !stationData.city) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(stationData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Station updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editStationModal')).hide();
    loadStations();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.deleteStation = async function(stationId) {
  if (!confirm(`Are you sure you want to delete station ID #${stationId}?`)) return;
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Station deleted successfully.');
    loadStations();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}

// Route
async function handleAddRoute(event) {
  event.preventDefault();
  const routeData = { name: document.getElementById('routeName').value, origin: document.getElementById('routeOrigin').value, destination: document.getElementById('routeDestination').value, distanceKm: parseFloat(document.getElementById('routeDistance').value) };
  if (!routeData.name || !routeData.origin || !routeData.destination || !routeData.distanceKm) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch('/api/admin/routes', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(routeData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Route added successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addRouteModal')).hide();
    document.getElementById('addRouteForm').reset();
    loadRoutes();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.openEditRouteModal = async function(routeId) {
  const form = document.getElementById('editRouteForm');
  if(!form) return;
  form.dataset.routeId = routeId;
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch route data.');
    const route = await response.json();
    document.getElementById('editRouteName').value = route.name;
    document.getElementById('editRouteOrigin').value = route.origin;
    document.getElementById('editRouteDestination').value = route.destination;
    document.getElementById('editRouteDistance').value = route.distanceKm;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editRouteModal')).show();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
async function handleUpdateRoute(event) {
  event.preventDefault();
  const form = event.target;
  const routeId = form.dataset.routeId;
  if (!routeId) return;
  const routeData = { name: document.getElementById('editRouteName').value, origin: document.getElementById('editRouteOrigin').value, destination: document.getElementById('editRouteDestination').value, distanceKm: parseFloat(document.getElementById('editRouteDistance').value) };
  if (!routeData.name || !routeData.origin || !routeData.destination || !routeData.distanceKm) { showAdminMsg('All fields are required.'); return; }
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(routeData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Route updated successfully.');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editRouteModal')).hide();
    loadRoutes();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.deleteRoute = async function(routeId) {
  if (!confirm(`Are you sure you want to delete route ID #${routeId}?`)) return;
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Route deleted successfully.');
    loadRoutes();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}

// User Management
window.deleteUser = async function(userId) {
  if (!confirm(`Are you sure you want to permanently delete user ID #${userId}?`)) return;
  try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('User deleted successfully.');
    loadUsers();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.toggleUserStatus = async function(userId, isCurrentlyEnabled) {
  const action = isCurrentlyEnabled ? 'disable' : 'enable';
  if (!confirm(`Are you sure you want to ${action} user ID #${userId}?`)) return;
  const updatedUserData = { enabled: !isCurrentlyEnabled };
  try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatedUserData) });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg(`User ${action}d successfully!`);
    loadUsers();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
// *** ADD THIS NEW FUNCTION ***
async function handleAddAdmin(event) {
  event.preventDefault();
  const email = document.getElementById('adminUserEmail').value;
  const password = document.getElementById('adminUserPassword').value;
  if (!email || !/\S+@\S+\.\S+/.test(email) || password.length < 8) {
    showAdminMsg('Please provide a valid email and a password of at least 8 characters.');
    return;
  }
  const adminData = { email, password }; // Role is set by backend
  try {
    const response = await fetch('/api/admin/users/create-admin', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adminData)
    });
    if (!response.ok) {
      // Corrected error handling
      let errorMsg = 'Failed to create admin.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || JSON.stringify(errorData);
      } catch (jsonError) {
        errorMsg = await response.text(); // Fallback to text
      }
      throw new Error(errorMsg);
    }
    showAdminMsg('New admin user created successfully!');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addAdminModal')).hide();
    document.getElementById('addAdminForm').reset();
    loadUsers(); // Refresh user list
  } catch (error) {
    console.error("Error creating admin:", error);
    showAdminMsg('Error: ' + error.message, true);
  }
}

// Booking Management
window.confirmBookingPayment = async function(bookingId) {
  if (!confirm(`Are you sure you want to CONFIRM payment for booking ID #${bookingId}?`)) return;
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, { method: 'PUT', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Payment confirmed successfully!');
    loadBookings();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.rejectBookingPayment = async function(bookingId) {
  if (!confirm(`Are you sure you want to REJECT payment for booking ID #${bookingId}?`)) return;
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}/reject-payment`, { method: 'PUT', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Payment rejected successfully!');
    loadBookings();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}
window.deleteBooking = async function(bookingId) {
  if (!confirm(`Are you sure you want to permanently delete booking ID #${bookingId}?`)) return;
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await response.text());
    showAdminMsg('Booking deleted successfully.');
    loadBookings();
  } catch (error) { showAdminMsg('Error: ' + error.message, true); }
}

// Dashboard Stats
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/admin/dashboard/stats', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to load dashboard statistics.');
    const stats = await response.json();
    const statTotalTrains = document.getElementById('statTotalTrains');
    const statActiveSchedules = document.getElementById('statActiveSchedules');
    const statPendingBookings = document.getElementById('statPendingBookings');
    const statRegisteredUsers = document.getElementById('statRegisteredUsers');

    if(statTotalTrains) statTotalTrains.textContent = stats.totalTrains;
    if(statActiveSchedules) statActiveSchedules.textContent = stats.totalSchedules;
    if(statPendingBookings) statPendingBookings.textContent = stats.pendingBookings;
    if(statRegisteredUsers) statRegisteredUsers.textContent = stats.totalUsers;

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
  const addTrainForm = document.getElementById('addTrainForm');
  if(addTrainForm) addTrainForm.addEventListener('submit', handleAddNewTrain);

  const addScheduleForm = document.getElementById('addScheduleForm');
  if(addScheduleForm) addScheduleForm.addEventListener('submit', handleAddNewSchedule);

  const addStationForm = document.getElementById('addStationForm');
  if(addStationForm) addStationForm.addEventListener('submit', handleAddStation);

  const addRouteForm = document.getElementById('addRouteForm');
  if(addRouteForm) addRouteForm.addEventListener('submit', handleAddRoute);

  const addAdminForm = document.getElementById('addAdminForm'); // *** ADDED THIS LINE ***
  if(addAdminForm) addAdminForm.addEventListener('submit', handleAddAdmin); // *** ADDED THIS LINE ***

  // Attach form submit listeners for all "Edit" modals
  const editTrainForm = document.getElementById('editTrainForm');
  if(editTrainForm) editTrainForm.addEventListener('submit', handleUpdateTrain);

  const editScheduleForm = document.getElementById('editScheduleForm');
  if(editScheduleForm) editScheduleForm.addEventListener('submit', handleUpdateSchedule);

  const editStationForm = document.getElementById('editStationForm');
  if(editStationForm) editStationForm.addEventListener('submit', handleUpdateStation);

  const editRouteForm = document.getElementById('editRouteForm');
  if(editRouteForm) editRouteForm.addEventListener('submit', handleUpdateRoute);

  // Special listener for the "Add Schedule" modal to populate its dropdown
  const addScheduleModal = document.getElementById('addScheduleModal');
  if (addScheduleModal) {
    addScheduleModal.addEventListener('show.bs.modal', async () => {
      const select = document.getElementById('scheduleTrainId');
      if (!select) return;
      select.innerHTML = '<option value="" selected disabled>Loading trains...</option>';
      try {
        const response = await fetch('/api/admin/trains', { headers: getAuthHeaders() });
        if(!response.ok) throw new Error("Fetch failed");
        const trains = await response.json();
        select.innerHTML = '<option value="" selected disabled>Select a train</option>';
        trains.forEach(train => {
          const option = document.createElement('option');
          option.value = train.id;
          option.textContent = `${train.name} (ID: ${train.id})`;
          select.appendChild(option);
        });
      } catch (error) {
        console.error("Error loading trains for dropdown:", error);
        select.innerHTML = '<option value="" disabled>Could not load trains</option>';
      }
    });
  }

  // *** ADDED LOGOUT LISTENER ***
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch(e) {}
      finally {
        localStorage.clear(); // Clear all local storage
        window.location.href = '/login'; // Redirect to login
      }
    });
  } else {
    console.error("Logout button ('logoutBtn') not found!");
  }

  // Display Admin Info
  const adminInfoSpan = document.getElementById('adminInfo');
  if (adminInfoSpan) {
    adminInfoSpan.textContent = localStorage.getItem('lankarail_email') || 'Admin';
  }
});