    // passenger dashboard client code
    (async function(){
        // check auth - redirect to login if not present
        const token = localStorage.getItem('lankarail_token') || null;

        // If you use sessions (no token) you can still call backend; here we do a safe redirect if nothing exists:
        if (!token && !sessionStorage.getItem('lankarail_session')) {
            // no token and no session hint -> redirect
            window.location.href = '/login.html';
            return;
        }

        // Helper to set Authorization header only if token exists
        function authHeaders() {
            const h = { 'Content-Type': 'application/json' };
            if (token) h['Authorization'] = 'Bearer ' + token;
            return h;
        }

        // fetch profile
        async function loadProfile() {
            try {
                const r = await fetch('/api/users/me', { headers: authHeaders() });
                if (!r.ok) {
                    console.warn('profile load failed', r.status);
                    // fallback: try to read stored role/email
                    const storedRole = JSON.parse(localStorage.getItem('lankarail_role') || 'null');
                    const storedEmail = localStorage.getItem('lankarail_email') || '';
                    document.getElementById('welcomeName').textContent = storedEmail ? storedEmail : '';
                    document.getElementById('pEmail').textContent = storedEmail ? storedEmail : '—';
                    return;
                }
                const data = await r.json();
                document.getElementById('welcomeName').textContent = data.email || '';
                document.getElementById('pEmail').textContent = data.email || '—';
                document.getElementById('pJoined').textContent = data.createdAt ? 'Joined ' + (new Date(data.createdAt)).toLocaleDateString() : '';
                // store for fallback
                localStorage.setItem('lankarail_email', data.email || '');
                localStorage.setItem('lankarail_role', JSON.stringify([data.role || 'ROLE_MEMBER']));
            } catch (err) {
                console.error('profile error', err);
            }
        }

        // load bookings
        async function loadBookings() {
            const area = document.getElementById('bookingsArea');
            area.innerHTML = '<div class="text-center text-muted py-4">Loading bookings…</div>';

            try {
                const r = await fetch('/api/bookings', { headers: authHeaders() });
                if (!r.ok) {
                    if (r.status === 401) {
                        // not authenticated
                        window.location.href = '/login.html';
                        return;
                    }
                    area.innerHTML = `<div class="empty-state">No bookings found.</div>`;
                    return;
                }
                const bookings = await r.json();
                if (!bookings || bookings.length === 0) {
                    area.innerHTML = `<div class="empty-state">You have no bookings yet. Try <a href="/buy-ticket.html">Buy Ticket</a>.</div>`;
                    return;
                }

                // Build table
                const tbl = document.createElement('table');
                tbl.className = 'table table-borderless table-bookings';
                const thead = document.createElement('thead');
                thead.innerHTML = `<tr>
        <th>Booking #</th><th>From</th><th>To</th><th>Date</th><th>Class</th><th>Status</th><th></th>
      </tr>`;
                tbl.appendChild(thead);

                const tbody = document.createElement('tbody');
                bookings.forEach(b => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td><strong>${b.id || b.ref || ''}</strong></td>
          <td>${b.from || b.origin || '-'}</td>
          <td>${b.to || b.destination || '-'}</td>
          <td>${b.travelDate ? (new Date(b.travelDate)).toLocaleDateString() : '-'}</td>
          <td>${b.carriageClass || b.class || '-'}</td>
          <td>${b.status || 'PENDING'}</td>
          <td class="booking-actions text-end">
             ${b.status === 'CONFIRMED' ? '<a class="btn btn-sm btn-outline-primary" href="/ticket.html?id='+ (b.id||'') +'">View</a>' :
                        '<button data-id="'+(b.id||'')+'" class="btn btn-sm btn-outline-danger cancel-btn">Cancel</button>'}
          </td>`;
                    tbody.appendChild(tr);
                });
                tbl.appendChild(tbody);
                area.innerHTML = '';
                area.appendChild(tbl);

                // attach cancel handlers
                [...area.querySelectorAll('.cancel-btn')].forEach(btn=>{
                    btn.addEventListener('click', async (e)=>{
                        const id = btn.getAttribute('data-id');
                        if (!confirm('Cancel booking #' + id + '?')) return;
                        try {
                            const resp = await fetch('/api/bookings/' + id + '/cancel', { method: 'POST', headers: authHeaders() });
                            if (!resp.ok) {
                                alert('Cancel failed');
                                return;
                            }
                            alert('Booking cancelled');
                            loadBookings();
                        } catch(err){ console.error(err); alert('Error'); }
                    });
                });

            } catch (err) {
                console.error('bookings error', err);
                area.innerHTML = `<div class="empty-state">Error loading bookings.</div>`;
            }
        }

        // Sign out
        document.getElementById('signOutBtn').addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() });
            } catch(e){ /* ignore */ }
            localStorage.removeItem('lankarail_token');
            localStorage.removeItem('lankarail_role');
            localStorage.removeItem('lankarail_email');
            window.location.href = '/login.html';
        });

        // Init
        await loadProfile();
        await loadBookings();

    })();
