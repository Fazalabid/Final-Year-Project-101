//Function to handle secure fetch requests with token
//Automatically logs out user if token is invalid or expired
async function secureFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  // Add Authorization header
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type":
      options.body instanceof FormData ? undefined : "application/json",
  };

  try {
    const res = await fetch(url, options);

    // Handle expired or invalid token
    if (res.status === 401 || res.status === 403) {
      alert("⏰ Session expired. Please log in again.");
      localStorage.removeItem("token");
      window.location.href = "../index.html"; // Redirect to login page

      return Promise.reject("Unauthorized");
    }

    return res;
  } catch (err) {
    console.error("Network error:", err);
    alert("🚨 Network error. Please try again later.");
    return null;
  }
}

function showSection(id, element) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show the selected section
  document.getElementById(id).classList.add("active");

  // Remove active class from all sidebar links
  document.querySelectorAll(".sidebar ul li a").forEach((link) => {
    link.classList.remove("active-link");
  });

  // Add active class to the clicked link
  if (element) {
    element.classList.add("active-link");
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const defaultTab = document.querySelector(
    '.sidebar ul li a[href="#dashboard"]'
  );
  if (defaultTab) {
    showSection("dashboard", defaultTab);
  }
});
document.getElementById("toggleSidebar").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("show");
});

//admin dashboard stats
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  try {
    const response = await secureFetch(
      "http://localhost:5000/api/admin/stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const stats = await response.json();

    // Updated selectors based on the new dashboard card IDs
    document.getElementById("count-users").textContent = stats.users;
    document.getElementById("count-orders").textContent = stats.orders;
    document.getElementById("count-bookings").textContent = stats.bookings;
    document.getElementById("count-menu").textContent = stats.menuItems;
    document.getElementById("count-tables").textContent = stats.tables;
    document.getElementById("count-feedbacks").textContent = stats.feedbacks;
    document.getElementById("count-requests").textContent = stats.requests;
  } catch (err) {
    console.error("❌ Failed to load dashboard stats:", err);
  }
});

// Reservation management
document.addEventListener("DOMContentLoaded", () => {
  loadAllBookings();
});

async function loadAllBookings() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("admin-booking-list");

  try {
    const res = await secureFetch("http://localhost:5000/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const bookings = await res.json();

    if (!res.ok || !Array.isArray(bookings)) {
      container.innerHTML = "<p>❌ Failed to load bookings.</p>";
      return;
    }

    if (bookings.length === 0) {
      container.innerHTML = "<p>No bookings found.</p>";
      return;
    }

    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let html = `
      <table class="table table-bordered table-striped table-light table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Name / Email</th>
            <th>Date / Time</th>
            <th>Status</th>
            <th>Special Request</th>
            <th>Table Number</th>
            <th>Table Capacity</th>
            <th>Guests</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    bookings.forEach((booking, i) => {
      const start = new Date(booking.reservationStart);
      const end = new Date(booking.reservationEnd);

      html += `
        <tr>
          <td>${i + 1}</td>
          <td>
            ${booking.name}<br/>
            <small>${booking.email}</small>
            </td>
            <td>
            ${start.toLocaleDateString()}<br/>
            ${start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - 
            ${end.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            </td>
          <td>
          <select class="form-select" onchange="updateBookingStatus('${
            booking._id
          }', this.value)">
            <option value="Pending" ${
              booking.status === "Pending" ? "selected" : ""
            }>Pending</option>
              <option value="Approved" ${
                booking.status === "Approved" ? "selected" : ""
              }>Approved</option>
                <option value="Cancelled" ${
                  booking.status === "Cancelled" ? "selected" : ""
                }>Cancelled</option>
                  </select>
                  </td>
                  <td>${booking.specialRequest || "N/A"}</td>
                  <td>${booking.table?.tableNumber || "N/A"}</td>
                  <td>${booking.table?.capacity || "N/A"}</td>
                  <td>${booking.guests}</td>
                  <td>${new Date(booking.createdAt).toLocaleString()}</td>
                  <td>
                  <button class="btn btn-sm btn-danger" onclick="deleteBooking('${
                    booking._id
                  }')">🗑️Delete</button>
                  <button class="btn btn-sm btn-warning" onclick="openEditBookingModal('${
                    booking._id
                  }')">✏️ Edit</button>

            <button class="btn btn-sm btn-success" onclick="downloadBookingInvoice('${
              booking._id
            }')">Download</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    console.error("Error fetching bookings:", err);
    container.innerHTML = "<p>❌ Server error.</p>";
  }
}
//Edit booking
async function openEditBookingModal(bookingId) {
  const token = localStorage.getItem("token");
  try {
    const res = await secureFetch(
      `http://localhost:5000/api/bookings/${bookingId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const booking = await res.json();

    // Prefill form
    document.getElementById("editBookingId").value = booking._id;
    document.getElementById("editDate").value =
      booking.reservationStart.split("T")[0];
    document.getElementById("editTime").value = new Date(
      booking.reservationStart
    )
      .toTimeString()
      .slice(0, 5);
    document.getElementById("editGuests").value = booking.guests;

    // Load table list
    const tablesRes = await secureFetch("http://localhost:5000/api/tables", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tables = await tablesRes.json();

    const tableSelect = document.getElementById("editTable");
    tableSelect.innerHTML = "";

    tables.forEach((t) => {
      const option = document.createElement("option");
      option.value = t._id;
      option.textContent = `Table ${t.tableNumber} (${t.capacity})`;
      if (t._id === booking.table?._id) option.selected = true;
      tableSelect.appendChild(option);
    });

    // Show modal
    new bootstrap.Modal(document.getElementById("editBookingModal")).show();
  } catch (err) {
    console.error("❌ Error loading booking for edit:", err);
    alert("Failed to load booking data.");
  }
}
//Submit booking after edit
document
  .getElementById("editBookingForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const id = document.getElementById("editBookingId").value;
    const date = document.getElementById("editDate").value;
    const time = document.getElementById("editTime").value;
    const guests = document.getElementById("editGuests").value;
    const table = document.getElementById("editTable").value;

    try {
      const res = await secureFetch(
        `http://localhost:5000/api/bookings/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date, time, guests, table }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        alert("❌ Update failed: " + error.message);
        return;
      }

      alert("✅ Booking updated successfully!");
      new bootstrap.Modal(document.getElementById("editBookingModal")).hide();
      loadAllBookings(); // reload table
    } catch (err) {
      console.error("❌ Error updating booking:", err);
      alert("Error updating booking.");
    }
  });

//Download Booking Invoice
// Function to download booking invoice
function downloadBookingInvoice(bookingId) {
  const token = localStorage.getItem("token");

  secureFetch(`http://localhost:5000/api/bookings/${bookingId}/invoice`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `booking_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((err) => {
      console.error("Booking PDF error:", err);
      alert("❌ Failed to download confirmation.");
    });
}

//Update booking status and Delete Booking
async function updateBookingStatus(bookingId, status) {
  try {
    const res = await secureFetch(
      `http://localhost:5000/api/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await res.json();
    if (res.ok) {
      alert("Status updated.");
      loadAllBookings();
    } else {
      alert(result.message || "Failed to update.");
    }
  } catch (err) {
    alert("Server error.");
    console.error(err);
  }
}

async function deleteBooking(bookingId) {
  if (!confirm("Are you sure you want to delete this booking?")) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/bookings/${bookingId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Booking deleted.");
      loadAllBookings();
    } else {
      alert(data.message || "Delete failed.");
    }
  } catch (err) {
    alert("Server error.");
    console.error(err);
  }
}

//Order management
document.addEventListener("DOMContentLoaded", fetchOrders);

async function fetchOrders() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("orderList");

  try {
    const res = await secureFetch("http://localhost:5000/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const orders = await res.json();
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = "<p>No orders found.</p>";
      return;
    }

    let html = `
      <table class="table table-bordered table-striped table-light table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Email / Phone</th>
            <th>Address</th>
            <th>Items</th>
            <th>Tax</th>
            <th>Total</th>
            <th>Split b/w</th>
            <th>Per Person</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    orders.forEach((order, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${order.customerName}</td>
          <td>
            ${order.email}<br/>
            <small>${order.phone}</small>
          </td>
          <td>${order.address}</td>
          <td>
  <button class="btn btn-sm btn-outline-secondary" type="button"
    onclick="toggleItems(${i})">
    ${order.items.length} items
  </button>
  <div id="items-${i}" style="display:none;">
    <ul class="ps-3">
      ${order.items
        .map((item) => `<li>${item.menuItem?.title || "Item"}</li>`)
        .join("")}
    </ul>
  </div>
</td>



          <td>Rs ${order.tax}</td>
          <td>Rs ${order.totalPrice}</td>
          <td>
            ${order.splitBetween} people<br/>
          </td>
          <td>Rs ${order.perPersonAmount}</td>
          <td>
            <select class="form-select" onchange="updateOrderStatus('${
              order._id
            }', this.value)">
              ${["Pending", "Preparing", "Delivered", "Cancelled"]
                .map(
                  (status) =>
                    `<option value="${status}" ${
                      status === order.status ? "selected" : ""
                    }>${status}</option>`
                )
                .join("")}
            </select>
          </td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteOrder('${
              order._id
            }')">🗑️Delete</button>
            <button class="btn btn-sm btn-success" onclick="downloadInvoice('${
              order._id
            }')">Download</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    container.innerHTML = "<p>❌ Failed to load orders.</p>";
  }
}
function toggleItems(index) {
  const el = document.getElementById(`items-${index}`);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

//Download Invoice function
function downloadInvoice(orderId) {
  const token = localStorage.getItem("token");

  secureFetch(`http://localhost:5000/api/orders/${orderId}/invoice`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((err) => {
      console.error("Invoice download error:", err);
      alert("❌ Failed to download invoice.");
    });
}

function formatDate(rawDate) {
  const date = new Date(rawDate);
  return isNaN(date)
    ? "Invalid Date"
    : date.toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short",
      });
}

async function deleteOrder(id) {
  const token = localStorage.getItem("token");

  if (!confirm("Are you sure you want to delete this order?")) return;

  try {
    const res = await secureFetch(`http://localhost:5000/api/orders/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to delete");

    alert("✅ Order deleted");
    fetchOrders();
  } catch (err) {
    console.error("❌ Delete order error:", err);
    alert("❌ Couldn't delete order");
  }
}
async function updateOrderStatus(orderId, newStatus) {
  const token = localStorage.getItem("token");
  try {
    const res = await secureFetch(
      `http://localhost:5000/api/orders/${orderId}/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    alert("✅ Order status updated!");
  } catch (err) {
    console.error("Status update failed:", err);
    alert("Failed to update status.");
  }
}

// Admin management---------------------
// Manage Users Section
document.addEventListener("DOMContentLoaded", fetchUsers);

async function fetchUsers() {
  const token = localStorage.getItem("token");

  try {
    const res = await secureFetch("http://localhost:5000/api/admin/admins", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!Array.isArray(data.data.users))
      throw new Error("Unexpected response format");

    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";

    if (data.data.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No users found.</td></tr>`;
      return;
    }

    data.data.users.forEach((user, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openEditUserModal('${
            user._id
          }', '${user.name}', '${user.email}')">Edit</button>
          <button class="btn btn-sm btn-warning" onclick="changeUserRole('${
            user._id
          }', '${user.role}')">Change Role</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${
            user._id
          }')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to fetch users:", err);
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = `<tr><td colspan="5">❌ Unauthorized access or server error.</td></tr>`;
  }
}

// Edit User Modal
function openEditUserModal(id, name, email) {
  document.getElementById("editUserId").value = id;
  document.getElementById("editUserName").value = name;
  document.getElementById("editUserEmail").value = email;
  document.getElementById("edit-user-modal").style.display = "flex";
}

function closeEditUserModal() {
  document.getElementById("edit-user-modal").style.display = "none";
}

// Save Updated User
async function submitUserUpdate() {
  const id = document.getElementById("editUserId").value;
  const name = document.getElementById("editUserName").value;
  const email = document.getElementById("editUserEmail").value;
  const token = localStorage.getItem("token");

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/admin/user/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed");

    alert("✅ User updated");
    closeEditUserModal();
    fetchUsers();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to update user");
  }
}

// Change Role
async function changeUserRole(id, currentRole) {
  const token = localStorage.getItem("token");
  const newRole = currentRole === "admin" ? "customer" : "admin";

  if (!confirm(`Are you sure you want to change role to ${newRole}?`)) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/admin/user/${id}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Role change failed");

    alert("✅ Role updated");
    fetchUsers();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to change role");
  }
}

// Toggle Status
async function toggleUserStatus(id, currentStatus) {
  const token = localStorage.getItem("token");
  const newStatus = currentStatus === "active" ? "blocked" : "active";

  if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Status update failed");

    alert("✅ Status updated");
    fetchUsers();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to update status");
  }
}

// Delete User
async function deleteUser(id) {
  const token = localStorage.getItem("token");
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/admin/admins/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Delete failed");

    alert("✅ User deleted");
    fetchUsers();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete user");
  }
}

function openAddUserModal() {
  document.getElementById("add-user-modal").style.display = "flex";
}

function closeAddUserModal() {
  document.getElementById("add-user-modal").style.display = "none";
  document.getElementById("newUserName").value = "";
  document.getElementById("newUserEmail").value = "";
  document.getElementById("newUserPassword").value = "";
  document.getElementById("newUserPasswordConfirm").value = "";
  document.getElementById("newUserRole").value = "customer";
}

async function submitAddUser() {
  const name = document.getElementById("newUserName").value.trim();
  const email = document.getElementById("newUserEmail").value.trim();
  const password = document.getElementById("newUserPassword").value;
  const passwordConfirm = document.getElementById(
    "newUserPasswordConfirm"
  ).value;
  const role = document.getElementById("newUserRole").value;

  const token = localStorage.getItem("token");

  if (!name || !email || !password || !passwordConfirm || !role) {
    return alert("❗ All fields are required.");
  }

  if (password !== passwordConfirm) {
    return alert("❗ Passwords do not match.");
  }

  try {
    const res = await secureFetch("http://localhost:5000/api/admin/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        passwordConfirm,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to add user");

    alert("✅ User added successfully!");
    closeAddUserModal();
    fetchUsers(); // Refresh user list if you're using it
  } catch (err) {
    console.error("Add user error:", err);
    alert("❌ Failed to add user.");
  }
}

//Menu Section code-------------
document.addEventListener("DOMContentLoaded", fetchMenuItems);

async function fetchMenuItems() {
  const token = localStorage.getItem("token");
  const res = await secureFetch("http://localhost:5000/api/menu", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const items = await res.json();
  const tbody = document.getElementById("menuTableBody");
  tbody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${item.image}" width="50" /></td>
      <td>${item.title}</td>
      <td>${item.category}</td>
      <td>Rs ${item.price}</td>
      <td>${item.stock || 0}</td>
      <td>
  <span class="badge bg-${item.stock > 0 ? "success" : "danger"}">
    ${item.stock > 0 ? "Available" : "Out of stock"}
  </span>
</td>

      <td>
        <button class="btn btn-sm btn-primary edit-btn" data-item='${JSON.stringify(
          item
        ).replace(/'/g, "&apos;")}'>
  Edit
</button>

        <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${
          item._id
        }')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = JSON.parse(
          btn.getAttribute("data-item").replace(/&apos;/g, "'")
        );
        openMenuModal(item);
      });
    });
  });
}

function openMenuModal(item = null) {
  document.getElementById("menu-modal").style.display = "flex";
  document.getElementById("menu-modal-title").innerText = item
    ? "Edit Menu Item"
    : "Add Menu Item";

  document.getElementById("menu-name").value = item?.title || "";
  document.getElementById("menu-description").value = item?.description || "";
  document.getElementById("menu-price").value = item?.price || "";
  document.getElementById("menu-category").value = item?.category || "";
  document.getElementById("menu-stock").value = item?.stock || "";
  document.getElementById("menu-id").value = item?._id || "";
  // ✅ store existing image
  base64Image = ""; // reset in case new image is selected
  document.getElementById("menu-existing-image").value = item?.image || "";
}

function closeMenuModal() {
  document.getElementById("menu-modal").style.display = "none";
}
let base64Image = "";

//   const form = document.getElementById("addMenuForm");
const imageInput = document.getElementById("menu-image");

// Convert image to base64
imageInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file && file.type === "image/png") {
    const reader = new FileReader();
    reader.onload = function (e) {
      base64Image = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please select a PNG image.");
  }
});

async function submitMenuItem() {
  const token = localStorage.getItem("token");
  const id = document.getElementById("menu-id").value;

  // ✅ Use new image if selected, otherwise keep existing one
  const finalImage =
    base64Image || document.getElementById("menu-existing-image").value;

  const body = {
    title: document.getElementById("menu-name").value,
    description: document.getElementById("menu-description").value,
    price: document.getElementById("menu-price").value,
    category: document.getElementById("menu-category").value,
    stock: document.getElementById("menu-stock").value,
    image: finalImage, // ✅ add the base64 image here
  };

  const url = id
    ? `http://localhost:5000/api/menu/${id}`
    : "http://localhost:5000/api/menu";

  const method = id ? "PATCH" : "POST";

  const res = await secureFetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Failed to save menu item");
    return;
  }

  alert("✅ Menu item saved");
  closeMenuModal();
  fetchMenuItems();
}

async function deleteMenuItem(id) {
  const token = localStorage.getItem("token");
  if (!confirm("Are you sure you want to delete this item?")) return;

  const res = await secureFetch(`http://localhost:5000/api/menu/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message || "Delete failed");

  alert("🗑️ Item deleted");
  fetchMenuItems();
}

//Feedback management
async function fetchFeedback() {
  try {
    const res = await secureFetch("http://localhost:5000/api/feedback");
    const feedbacks = await res.json();

    const tbody = document.getElementById("feedbackList");
    tbody.innerHTML = "";

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No feedbacks found.</td></tr>`;
      return;
    }

    feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    feedbacks.forEach((feedback, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${feedback.name}</td>
        <td>${feedback.email}</td>
        <td>${feedback.subject}</td>
        <td>${feedback.message}</td>
        <td>${new Date(feedback.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteFeedback('${
            feedback._id
          }')">
            🗑️ Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Failed to load feedbacks:", err);
    const tbody = document.getElementById("feedbackList");
    tbody.innerHTML = `<tr><td colspan="7">❌ Error loading feedbacks.</td></tr>`;
  }
}

fetchFeedback(); // Run on page load

//service requests management////////////////////////////////////////////////////
let lastRequestCount = 0;

function showServiceAlert() {
  const alertBox = document.getElementById("serviceAlert");
  alertBox.style.display = "block";

  // Play sound
  const audio = new Audio("../assets/sounds/ding.mp3");
  audio.play();

  // Hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = "none";
  }, 5000);
}

async function loadAllServiceRequests() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("service-requests-table");

  try {
    const res = await secureFetch("http://localhost:5000/api/requests/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML =
        "<p class='text-muted'>No service requests found.</p>";
      return;
    }
    if (Array.isArray(data) && data.length > lastRequestCount) {
      showServiceAlert();
    }
    lastRequestCount = data.length;

    let html = `
      <table class="table table-light table-bordered table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Type</th>
            <th>Note</th>
            <th>Booking Time</th>
            <th>Table</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((req, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${req.user?.name || "N/A"}<br><small>${
        req.user?.email || ""
      }</small></td>
          <td>${req.type}</td>
          <td>${req.note || "No note..."}</td>
          <td>
            ${new Date(req.booking?.reservationStart).toLocaleTimeString()} - 
            ${new Date(req.booking?.reservationEnd).toLocaleTimeString()}
          </td>
          <td>${req.booking.table?.tableNumber || "N/A"}</td>
          <td>
            <span class="badge bg-${
              req.status === "Completed" ? "success" : "warning"
            }">
              ${req.status}
            </span>
          </td>
        <td>
  ${
    req.status !== "Completed"
      ? `<button style="color:black" class="btn btn-sm btn-success" onclick="markServiceCompleted('${req._id}')">Mark as Done</button>`
      : `<button class="btn btn-sm btn-danger" onclick="deleteServiceRequest('${req._id}')">🗑️ Delete</button>`
  }
</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  } catch (err) {
    console.error("Failed to fetch requests:", err);
    container.innerHTML =
      "<p class='text-danger'>Error loading service requests.</p>";
  }
}

setInterval(loadAllServiceRequests, 10000); // every 10 sec

async function markServiceCompleted(requestId) {
  const token = localStorage.getItem("token");

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/requests/${requestId}/complete`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to update");

    alert("✅ Marked as completed");
    loadAllServiceRequests();
  } catch (err) {
    console.error(err);
    alert("❌ Could not mark request as completed.");
  }
}

loadAllServiceRequests();
async function deleteServiceRequest(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this request?"
  );
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");

  try {
    const res = await secureFetch(`http://localhost:5000/api/requests/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete");

    alert("🗑️ Request deleted.");
    loadAllServiceRequests();
  } catch (err) {
    console.error(err);
    alert("❌ Could not delete request.");
  }
}

//Table managment/////////////////////////////////////////////////////////////
async function fetchTables() {
  const token = localStorage.getItem("token");
  const tbody = document.getElementById("tableList");

  if (!tbody) {
    console.error("❌ tbody #tableList not found");
    return;
  }

  try {
    const res = await secureFetch("http://localhost:5000/api/tables", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tables = await res.json();
    tbody.innerHTML = "";

    if (!Array.isArray(tables) || tables.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No tables found.</td></tr>`;
      return;
    }

    tables.sort((a, b) => a.tableNumber - b.tableNumber);

    tables.forEach((table, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${table.tableNumber}</td>
        <td>${table.capacity}</td>
        <td>
          <span class="badge bg-${
            table.status === "Available" ? "success" : "danger"
          }">
            ${table.status}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openTableModal(
            ${table.tableNumber}, 
            ${table.capacity}, 
            '${table.status}', 
            '${table._id}'
          )">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTable('${
            table._id
          }')">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Error fetching tables:", err);
    tbody.innerHTML = `<tr><td colspan="5">❌ Failed to load tables.</td></tr>`;
  }
}

function openTableModal(
  tableNumber = "",
  capacity = "",
  status = "available",
  id = ""
) {
  document.getElementById("table-modal").style.display = "flex";
  document.getElementById("table-number").value = tableNumber;
  document.getElementById("table-capacity").value = capacity;
  document.getElementById("table-status").value = status;
  document.getElementById("table-id").value = id;
}

function closeTableModal() {
  document.getElementById("table-modal").style.display = "none";
}

async function submitTable() {
  const token = localStorage.getItem("token");

  const id = document.getElementById("table-id").value;
  const tableNumber = parseInt(document.getElementById("table-number").value);
  const capacity = parseInt(document.getElementById("table-capacity").value);
  const status = document.getElementById("table-status").value;

  if (!tableNumber || !capacity) {
    alert("Please fill in all fields.");
    return;
  }

  const body = { tableNumber, capacity, status };

  const url = id
    ? `http://localhost:5000/api/tables/${id}`
    : "http://localhost:5000/api/tables";
  const method = id ? "PATCH" : "POST";

  try {
    const res = await secureFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Backend Error:", data);
      throw new Error(data.message || "Unknown error");
    }

    alert(`✅ Table ${id ? "updated" : "added"} successfully`);
    closeTableModal();
    fetchTables();
  } catch (err) {
    console.error("❌ Error saving table:", err);
    alert(`❌ ${err.message}`); // Show actual error message
  }
}

async function deleteTable(id) {
  const token = localStorage.getItem("token");
  if (!confirm("Are you sure you want to delete this table?")) return;

  try {
    const res = await secureFetch(`http://localhost:5000/api/tables/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    alert("🗑️ Table deleted");
    fetchTables();
  } catch (err) {
    console.error("❌ Error deleting table:", err);
    alert("Failed to delete table.");
  }
}
fetchTables(); // Load tables on page load
