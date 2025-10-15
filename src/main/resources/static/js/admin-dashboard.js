// This function runs when the page is first loaded
document.addEventListener('DOMContentLoaded', function() {
  // You can add any initialization code here if needed in the future
  console.log("Admin dashboard loaded.");
});

// A reusable function to fetch data and update the content panel
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
  loadContent('/api/admin/trains', (trains) => { // Changed here
    const contentDiv = document.getElementById('adminContent');

    let tableHtml = `
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
                            <button class="btn btn-sm btn-outline-info me-2">Edit</button>
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
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

// Placeholder functions for other buttons - we will build these next!
function loadUsers() {
  document.getElementById('adminContent').innerHTML = '<div class="text-white">User Management Coming Soon...</div>';
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
            // Look up train name using the map. Fallback to just the ID if not found.
            const trainName = trainMap.get(schedule.trainId) || `Train ID: ${schedule.trainId}`;

            // Format dates for better readability
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
                                    <button class="btn btn-sm btn-icon btn-outline-info" title="Edit Schedule"><i class="fas fa-edit"></i></button>
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
  document.getElementById('adminContent').innerHTML = '<div class="text-white">Booking Viewer Coming Soon...</div>';
}
// Function to handle the submission of the "Add New Train" form
async function handleAddNewTrain(event) {
  event.preventDefault(); // Stop the default form submission

  const name = document.getElementById('trainName').value;
  const type = document.getElementById('trainType').value;
  const capacity = document.getElementById('trainCapacity').value;

  if (!name || !type || !capacity) {
    alert('Please fill out all fields.');
    return;
  }

  const trainData = {
    name: name,
    type: type,
    capacity: parseInt(capacity, 10)
  };

  try {
    const response = await fetch('/api/admin/trains', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainData)
    });

    if (!response.ok) {
      // Try to get a more specific error message from the backend
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create train.');
    }

    // Success!
    alert('Train added successfully!');

    // Hide the modal
    const modalElement = document.getElementById('addTrainModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    // Clear the form for the next time
    document.getElementById('addTrainForm').reset();

    // Reload the list of trains to show the new one
    loadTrains();

  } catch (error) {
    console.error('Error adding train:', error);
    alert('Error: ' + error.message);
  }
}

// Attach the event listener to the form when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const addTrainForm = document.getElementById('addTrainForm');
  if (addTrainForm) {
    addTrainForm.addEventListener('submit', handleAddNewTrain);
  }
});

// --- Add Schedule Logic ---

// Function to handle the submission of the "Add New Schedule" form
async function handleAddNewSchedule(event) {
  event.preventDefault();

  const scheduleData = {
    trainId: document.getElementById('scheduleTrainId').value,
    departureStation: document.getElementById('scheduleDepartureStation').value,
    arrivalStation: document.getElementById('scheduleArrivalStation').value,
    departureTime: document.getElementById('scheduleDepartureTime').value + ':00', // Append seconds
    arrivalTime: document.getElementById('scheduleArrivalTime').value + ':00', // Append seconds
    price: parseFloat(document.getElementById('schedulePrice').value)
  };

  // Basic validation
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
    const modal = bootstrap.Modal.getInstance(document.getElementById('addScheduleModal'));
    modal.hide();
    document.getElementById('addScheduleForm').reset();
    loadSchedules(); // Refresh the schedules table

  } catch (error) {
    console.error('Error adding schedule:', error);
    alert('Error: ' + error.message);
  }
}

// Attach event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Listener for the form submission
  const addScheduleForm = document.getElementById('addScheduleForm');
  if (addScheduleForm) {
    addScheduleForm.addEventListener('submit', handleAddNewSchedule);
  }

  // Listener to populate train dropdown when modal is about to open
  const addScheduleModal = document.getElementById('addScheduleModal');
  if (addScheduleModal) {
    addScheduleModal.addEventListener('show.bs.modal', async () => {
      const select = document.getElementById('scheduleTrainId');
      try {
        const response = await fetch('/api/admin/trains');
        const trains = await response.json();

        select.innerHTML = '<option value="" selected disabled>Select a train</option>'; // Clear old options
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
});

// --- Delete Schedule Logic ---

async function deleteSchedule(scheduleId) {
  // Show a confirmation dialog to prevent accidental deletion
  if (!confirm('Are you sure you want to delete schedule ID #' + scheduleId + '? This action cannot be undone.')) {
    return; // Stop if the user clicks "Cancel"
  }

  try {
    const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Schedule deleted successfully.');
      loadSchedules(); // Refresh the table to show the change
    } else {
      // Try to get a more specific error message from the backend
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData ? errorData.message : 'Failed to delete schedule.');
    }
  } catch (error) {
    console.error('Error deleting schedule:', error);
    alert('Error: ' + error.message);
  }
}