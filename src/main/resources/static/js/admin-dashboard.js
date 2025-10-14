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
                <button class="btn btn-success btn-sm">+ Add New Train</button>
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
  document.getElementById('adminContent').innerHTML = '<div class="text-white">Schedule Management Coming Soon...</div>';
}

function loadBookings() {
  document.getElementById('adminContent').innerHTML = '<div class="text-white">Booking Viewer Coming Soon...</div>';
}