// This function runs when the page is first loaded
document.addEventListener('DOMContentLoaded', function() {
  // You can add any initialization code here if needed in the future
  console.log("Admin dashboard loaded.");
});

// A reusable function to fetch data and update the content panel with animations
async function loadContent(url, contentRenderer) {
  const contentDiv = document.getElementById('adminContent');

  // 1. Add fade-out animation
  contentDiv.classList.add('fade-out');

  // 2. Wait for the animation to be visible, then load data
  setTimeout(async () => {
    contentDiv.innerHTML = '<div class="text-center text-white">Loading...</div>'; // Show a loading message

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      contentRenderer(data); // Call the specific function to build the HTML
    } catch (error) {
      console.error('Failed to load content:', error);
      contentDiv.innerHTML = `<div class="text-danger">Failed to load content. Please check the console for errors.</div>`;
    } finally {
      // 3. Remove old animation classes and add the fade-in animation
      contentDiv.classList.remove('fade-out');
      contentDiv.classList.add('animate-fade-in');
    }
  }, 200); // This timeout should match the animation duration in the CSS
}

// --- Specific Content Loaders ---

function loadTrains() {
  loadContent('/api/admin/trains', (trains) => {
    const contentDiv = document.getElementById('adminContent');

    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Trains</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addTrainModal">+ Add New Train</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Train Name</th>
                                <th scope="col">Type</th>
                                <th scope="col">Capacity</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

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
                    </tr>
                `;
      });
    }

    tableHtml += `
                    </tbody>
                </table>
            </div>
        `;

    contentDiv.innerHTML = tableHtml;
  });
}

function loadUsers() {
  loadContent('/api/admin/users', (users) => {
    const contentDiv = document.getElementById('adminContent');

    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Users</h4>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Email</th>
                                <th scope="col">Role</th>
                                <th scope="col">Status</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

    if (users.length === 0) {
      tableHtml += '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
    } else {
      users.forEach(user => {
        const statusBadge = user.enabled
            ? `<span class="badge bg-success">Enabled</span>`
            : `<span class="badge bg-secondary">Disabled</span>`;

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
                    </tr>
                `;
      });
    }

    tableHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        `;

    contentDiv.innerHTML = tableHtml;
  });
}

function loadSchedules() {
  // We need to fetch both schedules AND trains to display the train name
  const fetchSchedules = fetch('/api/admin/schedules').then(res => res.json());
  const fetchTrains = fetch('/api/admin/trains').then(res => res.json());

  // Use Promise.all to wait for both requests to complete
  Promise.all([fetchSchedules, fetchTrains])
      .then(([schedules, trains]) => {
        const contentDiv = document.getElementById('adminContent');

        // Create a quick lookup map for train names from their IDs
        const trainMap = new Map(trains.map(train => [train.id, train.name]));

        let tableHtml = `
                <div class="admin-content-panel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="text-white mb-0">Manage Schedules</h4>
                        <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addScheduleModal">+ Add New Schedule</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-dark table-striped table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Train Name</th>
                                    <th scope="col">From</th>
                                    <th scope="col">To</th>
                                    <th scope="col">Departure</th>
                                    <th scope="col">Arrival</th>
                                    <th scope="col">Price (LKR)</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

        if (schedules.length === 0) {
          tableHtml += '<tr><td colspan="8" class="text-center">No schedules found.</td></tr>';
        } else {
          schedules.forEach(schedule => {
            const trainName = trainMap.get(schedule.trainId) || `Train ID: ${schedule.trainId}`;
            const departure = schedule.departureTime.replace('T', ' ');
            const arrival = schedule.arrivalTime.replace('T', ' ');

            tableHtml += `
                        <tr>
                            <th scope="row">${schedule.id}</th>
                            <td>${trainName}</td>
                            <td>${schedule.departureStation}</td>
                            <td>${schedule.arrivalStation}</td>
                            <td>${departure}</td>
                            <td>${arrival}</td>
                            <td>${schedule.price.toFixed(2)}</td>
                            <td>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-icon btn-outline-info" title="Edit Schedule" onclick="openEditScheduleModal(${schedule.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-icon btn-outline-danger" title="Delete Schedule" onclick="deleteSchedule(${schedule.id})"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
          });
        }

        tableHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

        contentDiv.innerHTML = tableHtml;
      })
      .catch(error => {
        console.error('Failed to load schedules:', error);
        const contentDiv = document.getElementById('adminContent');
        contentDiv.innerHTML = `<div class="text-danger">Failed to load schedules. Please check the console for errors.</div>`;
      });
}

function loadBookings() {
  const fetchBookings = fetch('/api/admin/bookings').then(res => res.json());
  const fetchUsers = fetch('/api/admin/users').then(res => res.json());
  const fetchSchedules = fetch('/api/admin/schedules').then(res => res.json());

  Promise.all([fetchBookings, fetchUsers, fetchSchedules])
      .then(([bookings, users, schedules]) => {
        const contentDiv = document.getElementById('adminContent');
        const userMap = new Map(users.map(user => [user.id, user.email]));
        const scheduleMap = new Map(schedules.map(schedule => [schedule.id, schedule]));

        let tableHtml = `
                <div class="admin-content-panel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="text-white mb-0">Manage Bookings</h4>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-dark table-striped table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">Booking ID</th>
                                    <th scope="col">User</th>
                                    <th scope="col">Schedule</th>
                                    <th scope="col">Seats</th>
                                    <th scope="col">Total Price</th>
                                    <th scope="col">Payment Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

        if (bookings.length === 0) {
          tableHtml += '<tr><td colspan="7" class="text-center">No bookings found.</td></tr>';
        } else {
          bookings.forEach(booking => {
            const userEmail = userMap.get(booking.userId) || 'Unknown User';
            const schedule = scheduleMap.get(booking.scheduleId);
            const scheduleInfo = schedule
                ? `${schedule.departureStation} to ${schedule.arrivalStation}`
                : 'Unknown Schedule';

            let statusBadge;
            if (booking.paymentStatus === 'CONFIRMED') {
              statusBadge = `<span class="badge bg-success">Confirmed</span>`;
            } else if (booking.paymentStatus === 'REJECTED') {
              statusBadge = `<span class="badge bg-danger">Rejected</span>`;
            } else { // PENDING
              statusBadge = `<span class="badge bg-warning">Pending</span>`;
            }

            // Define action buttons based on status
            let actionButtons = '';
            if (booking.paymentStatus === 'PENDING') {
              actionButtons = `
                            <button class="btn btn-sm btn-success" onclick="confirmBookingPayment(${booking.id})">Confirm</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectBookingPayment(${booking.id})">Reject</button>
                        `;
            } else if (booking.paymentStatus === 'CONFIRMED') {
              actionButtons = `<button class="btn btn-sm btn-danger" onclick="rejectBookingPayment(${booking.id})">Reject</button>`;
            } else { // REJECTED
              actionButtons = `<button class="btn btn-sm btn-success" onclick="confirmBookingPayment(${booking.id})">Confirm</button>`;
            }




            tableHtml += `
                        <tr>
                            <th scope="row">${booking.id}</th>
                            <td>${userEmail}</td>
                            <td>${scheduleInfo} (ID: ${booking.scheduleId})</td>
                            <td>${booking.seats}</td>
                            <td>${booking.totalPrice ? booking.totalPrice.toFixed(2) : 'N/A'}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <div class="d-flex gap-2">
                                    ${actionButtons}
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBooking(${booking.id})">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `;
          });
        }
        tableHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        contentDiv.innerHTML = tableHtml;
      })
      .catch(error => {
        console.error('Failed to load bookings:', error);
        const contentDiv = document.getElementById('adminContent');
        contentDiv.innerHTML = `<div class="text-danger">Failed to load bookings. Please check the console for errors.</div>`;
      });
}

// --- Station Management ---
function loadStations() {
  loadContent('/api/admin/stations', (stations) => {
    const contentDiv = document.getElementById('adminContent');

    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Stations</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addStationModal">+ Add New Station</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Station Name</th>
                                <th scope="col">City</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

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
                    </tr>
                `;
      });
    }
    tableHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        `;
    contentDiv.innerHTML = tableHtml;
  });
}


// --- CRUD Helper Functions ---

// Add Train
async function handleAddNewTrain(event) {
  event.preventDefault();
  const name = document.getElementById('trainName').value;
  const type = document.getElementById('trainType').value;
  const capacity = document.getElementById('trainCapacity').value;
  if (!name || !type || !capacity) {
    alert('Please fill out all fields.');
    return;
  }
  const trainData = { name, type, capacity: parseInt(capacity, 10) };
  try {
    const response = await fetch('/api/admin/trains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create train.');
    }
    alert('Train added successfully!');
    bootstrap.Modal.getInstance(document.getElementById('addTrainModal')).hide();
    document.getElementById('addTrainForm').reset();
    loadTrains();
  } catch (error) {
    console.error('Error adding train:', error);
    alert('Error: ' + error.message);
  }
}

// Edit Train
async function openEditTrainModal(trainId) {
  const editTrainForm = document.getElementById('editTrainForm');
  editTrainForm.dataset.trainId = trainId;
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`);
    if (!response.ok) throw new Error('Failed to fetch train data.');
    const train = await response.json();
    document.getElementById('editTrainName').value = train.name;
    document.getElementById('editTrainType').value = train.type;
    document.getElementById('editTrainCapacity').value = train.capacity;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editTrainModal')).show();
  } catch (error) {
    console.error("Failed to load train for editing:", error);
    alert("Error: Could not load train data.");
  }
}

async function handleUpdateTrain(event) {
  event.preventDefault();
  const editTrainForm = document.getElementById('editTrainForm');
  const trainId = editTrainForm.dataset.trainId;
  if (!trainId) return;
  const updatedTrainData = {
    name: document.getElementById('editTrainName').value,
    type: document.getElementById('editTrainType').value,
    capacity: parseInt(document.getElementById('editTrainCapacity').value, 10)
  };
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTrainData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update train.');
    }
    alert('Train updated successfully!');
    bootstrap.Modal.getInstance(document.getElementById('editTrainModal')).hide();
    loadTrains();
  } catch (error) {
    console.error('Error updating train:', error);
    alert('Error: ' + error.message);
  }
}

// Delete Train
async function deleteTrain(trainId) {
  if (!confirm('Are you sure you want to delete train ID #' + trainId + '? This might affect existing schedules.')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/trains/${trainId}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Train deleted successfully.');
      loadTrains();
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete train.');
    }
  } catch (error) {
    console.error('Error deleting train:', error);
    alert('Error: ' + error.message);
  }
}

// Add Schedule
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
  if (!scheduleData.trainId || !scheduleData.departureStation || !scheduleData.arrivalStation || !scheduleData.departureTime || !scheduleData.arrivalTime || !scheduleData.price) {
    alert('Please fill out all fields.');
    return;
  }
  try {
    const response = await fetch('/api/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create schedule.');
    }
    alert('Schedule added successfully!');
    bootstrap.Modal.getInstance(document.getElementById('addScheduleModal')).hide();
    document.getElementById('addScheduleForm').reset();
    loadSchedules();
  } catch (error) {
    console.error('Error adding schedule:', error);
    alert('Error: ' + error.message);
  }
}

// Edit Schedule
async function openEditScheduleModal(scheduleId) {
  const editScheduleForm = document.getElementById('editScheduleForm');
  editScheduleForm.dataset.scheduleId = scheduleId;
  try {
    const scheduleResponse = await fetch(`/api/admin/schedules/${scheduleId}`);
    const schedule = await scheduleResponse.json();
    const trainsResponse = await fetch('/api/admin/trains');
    const trains = await trainsResponse.json();

    const select = document.getElementById('editScheduleTrainId');
    select.innerHTML = '';
    trains.forEach(train => {
      const option = document.createElement('option');
      option.value = train.id;
      option.textContent = `${train.name} (ID: ${train.id})`;
      if (train.id === schedule.trainId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    document.getElementById('editScheduleDepartureStation').value = schedule.departureStation;
    document.getElementById('editScheduleArrivalStation').value = schedule.arrivalStation;
    document.getElementById('editScheduleDepartureTime').value = schedule.departureTime.slice(0, 16);
    document.getElementById('editScheduleArrivalTime').value = schedule.arrivalTime.slice(0, 16);
    document.getElementById('editSchedulePrice').value = schedule.price;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('editScheduleModal')).show();
  } catch (error) {
    console.error("Failed to load schedule for editing:", error);
    alert("Error: Could not load schedule data.");
  }
}

async function handleUpdateSchedule(event) {
  event.preventDefault();
  const editScheduleForm = document.getElementById('editScheduleForm');
  const scheduleId = editScheduleForm.dataset.scheduleId;
  if (!scheduleId) return;
  const updatedScheduleData = {
    trainId: document.getElementById('editScheduleTrainId').value,
    departureStation: document.getElementById('editScheduleDepartureStation').value,
    arrivalStation: document.getElementById('editScheduleArrivalStation').value,
    departureTime: document.getElementById('editScheduleDepartureTime').value + ':00',
    arrivalTime: document.getElementById('editScheduleArrivalTime').value + ':00',
    price: parseFloat(document.getElementById('editSchedulePrice').value)
  };
  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedScheduleData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update schedule.');
    }
    alert('Schedule updated successfully!');
    bootstrap.Modal.getInstance(document.getElementById('editScheduleModal')).hide();
    loadSchedules();
  } catch (error) {
    console.error('Error updating schedule:', error);
    alert('Error: ' + error.message);
  }
}

// Delete Schedule
async function deleteSchedule(scheduleId) {
  if (!confirm('Are you sure you want to delete schedule ID #' + scheduleId + '? This action cannot be undone.')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Schedule deleted successfully.');
      loadSchedules();
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete schedule.');
    }
  } catch (error) {
    console.error('Error deleting schedule:', error);
    alert('Error: ' + error.message);
  }
}

// Add Station
async function handleAddStation(event) {
  event.preventDefault();
  const stationData = {
    name: document.getElementById('stationName').value,
    city: document.getElementById('stationCity').value
  };
  try {
    const response = await fetch('/api/admin/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stationData)
    });
    if (!response.ok) throw new Error('Failed to create station.');

    alert('Station added successfully!');
    bootstrap.Modal.getInstance(document.getElementById('addStationModal')).hide();
    document.getElementById('addStationForm').reset();
    loadStations();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Edit Station
async function openEditStationModal(stationId) {
  const editStationForm = document.getElementById('editStationForm');
  editStationForm.dataset.stationId = stationId;
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`);
    if (!response.ok) throw new Error('Failed to fetch station data.');
    const station = await response.json();

    document.getElementById('editStationName').value = station.name;
    document.getElementById('editStationCity').value = station.city;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editStationModal')).show();
  } catch (error) {
    alert('Error: ' + error.message); // THIS IS THE LINE WITH THE ERROR
  }
}

async function handleUpdateStation(event) {
  event.preventDefault();
  const editStationForm = document.getElementById('editStationForm');
  const stationId = editStationForm.dataset.stationId;
  if (!stationId) return;
  const stationData = {
    name: document.getElementById('editStationName').value,
    city: document.getElementById('editStationCity').value
  };
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stationData)
    });
    if (!response.ok) throw new Error('Failed to update station.');

    alert('Station updated successfully!');
    bootstrap.Modal.getInstance(document.getElementById('editStationModal')).hide();
    loadStations();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Delete Station
async function deleteStation(stationId) {
  if (!confirm('Are you sure you want to delete station ID #' + stationId + '?')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/stations/${stationId}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Station deleted successfully.');
      loadStations();
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete station.');
    }
  } catch (error) {
    console.error('Error deleting station:', error);
    alert('Error: ' + error.message);
  }
}

// --- Dashboard Statistics Logic ---
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/admin/dashboard/stats');
    if (!response.ok) {
      throw new Error('Failed to load dashboard statistics.');
    }
    const stats = await response.json();
    document.getElementById('statTotalTrains').textContent = stats.totalTrains;
    document.getElementById('statActiveSchedules').textContent = stats.totalSchedules;
    document.getElementById('statPendingBookings').textContent = stats.pendingBookings;
    document.getElementById('statRegisteredUsers').textContent = stats.totalUsers;
  } catch (error) {
    console.error(error.message);
  }
}

// --- User Management Logic ---
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to permanently delete user ID #' + userId + '? This action cannot be undone.')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (response.ok) {
      alert('User deleted successfully.');
      loadUsers();
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete user.');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error: ' + error.message);
  }
}

async function toggleUserStatus(userId, isCurrentlyEnabled) {
  const action = isCurrentlyEnabled ? 'disable' : 'enable';
  if (!confirm(`Are you sure you want to ${action} user ID #${userId}?`)) {
    return;
  }
  const updatedUserData = { enabled: !isCurrentlyEnabled };
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUserData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to ${action} user.`);
    }
    alert(`User ${action}d successfully!`);
    loadUsers();
  } catch (error) {
    console.error(`Error toggling user status:`, error);
    alert('Error: ' + error.message);
  }
}

// --- Booking Payment Management Logic ---
async function confirmBookingPayment(bookingId) {
  if (!confirm('Are you sure you want to CONFIRM payment for booking ID #' + bookingId + '?')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to confirm payment.');
    alert('Payment confirmed successfully!');
    loadBookings();
  } catch (error) {
    console.error('Error confirming payment:', error);
    alert('Error: ' + error.message);
  }
}

async function rejectBookingPayment(bookingId) {
  if (!confirm('Are you sure you want to REJECT payment for booking ID #' + bookingId + '?')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/bookings/${bookingId}/reject-payment`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to reject payment.');
    alert('Payment rejected successfully!');
    loadBookings();
  } catch (error) {
    console.error('Error rejecting payment:', error);
    alert('Error: ' + error.message);
  }
}


// ---= MASTER EVENT LISTENER =---
// This block ensures all event listeners are added only after the page is fully loaded.
document.addEventListener('DOMContentLoaded', function() {
  console.log("Attaching all event listeners...");

  // Load initial stats
  loadDashboardStats();

  // Add Train
  const addTrainForm = document.getElementById('addTrainForm');
  if (addTrainForm) {
    addTrainForm.addEventListener('submit', handleAddNewTrain);
  }

  // Edit Train
  const editTrainForm = document.getElementById('editTrainForm');
  if (editTrainForm) {
    editTrainForm.addEventListener('submit', handleUpdateTrain);
  }

  // Add Schedule
  const addScheduleForm = document.getElementById('addScheduleForm');
  if (addScheduleForm) {
    addScheduleForm.addEventListener('submit', handleAddNewSchedule);
  }
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
        console.error("Failed to fetch trains for dropdown:", error);
      }
    });
  }

  // Edit Schedule
  const editScheduleForm = document.getElementById('editScheduleForm');
  if (editScheduleForm) {
    editScheduleForm.addEventListener('submit', handleUpdateSchedule);
  }

  // Add Station
  const addStationForm = document.getElementById('addStationForm');
  if (addStationForm) {
    addStationForm.addEventListener('submit', handleAddStation);
  }

  // Edit Station
  const editStationForm = document.getElementById('editStationForm');
  if (editStationForm) {
    editStationForm.addEventListener('submit', handleUpdateStation);
  }
});

// --- Route Management ---

function loadRoutes() {
  loadContent('/api/admin/routes', (routes) => {
    const contentDiv = document.getElementById('adminContent');

    let tableHtml = `
            <div class="admin-content-panel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white mb-0">Manage Routes</h4>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addRouteModal">+ Add New Route</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Route Name</th>
                                <th scope="col">Origin</th>
                                <th scope="col">Destination</th>
                                <th scope="col">Distance (km)</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

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
                    </tr>
                `;
      });
    }

    tableHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        `;

    contentDiv.innerHTML = tableHtml;
  });
}

// --- Route CRUD Helper Functions ---

async function deleteRoute(routeId) {
  if (!confirm('Are you sure you want to delete route ID #' + routeId + '?')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/routes/${routeId}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Route deleted successfully.');
      loadRoutes(); // Refresh the table
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete route.');
    }
  } catch (error) {
    console.error('Error deleting route:', error);
    alert('Error: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // --- Add Route Logic ---
  const addRouteForm = document.getElementById('addRouteForm');
  if (addRouteForm) {
    addRouteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const routeData = {
        name: document.getElementById('routeName').value,
        origin: document.getElementById('routeOrigin').value,
        destination: document.getElementById('routeDestination').value,
        distanceKm: parseFloat(document.getElementById('routeDistance').value)
      };

      try {
        const response = await fetch('/api/admin/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(routeData)
        });
        if (!response.ok) throw new Error('Failed to create route.');

        alert('Route added successfully!');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addRouteModal')).hide();
        addRouteForm.reset();
        loadRoutes(); // Refresh
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }

  // --- Edit Route Logic ---
  const editRouteForm = document.getElementById('editRouteForm');
  if (editRouteForm) {
    // Function to open the modal
    window.openEditRouteModal = async function(routeId) {
      editRouteForm.dataset.routeId = routeId;
      try {
        const response = await fetch(`/api/admin/routes/${routeId}`);
        if (!response.ok) throw new Error('Failed to fetch route data.');
        const route = await response.json();

        document.getElementById('editRouteName').value = route.name;
        document.getElementById('editRouteOrigin').value = route.origin;
        document.getElementById('editRouteDestination').value = route.destination;
        document.getElementById('editRouteDistance').value = route.distanceKm;

        bootstrap.Modal.getOrCreateInstance(document.getElementById('editRouteModal')).show();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }

    // Function to handle the update
    editRouteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const routeId = editRouteForm.dataset.routeId;
      if (!routeId) return;

      const routeData = {
        name: document.getElementById('editRouteName').value,
        origin: document.getElementById('editRouteOrigin').value,
        destination: document.getElementById('editRouteDestination').value,
        distanceKm: parseFloat(document.getElementById('editRouteDistance').value)
      };

      try {
        const response = await fetch(`/api/admin/routes/${routeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(routeData)
        });
        if (!response.ok) throw new Error('Failed to update route.');

        alert('Route updated successfully!');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editRouteModal')).hide();
        loadRoutes(); // Refresh
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }
});

// --- Booking Management Logic ---

async function deleteBooking(bookingId) {
  if (!confirm('Are you sure you want to permanently delete booking ID #' + bookingId + '? This action cannot be undone.')) {
    return;
  }

  try {
    // We use the new ADMIN endpoint
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Booking deleted successfully.');
      loadBookings(); // Refresh the table
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete booking.');
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    alert('Error: ' + error.message);
  }
}