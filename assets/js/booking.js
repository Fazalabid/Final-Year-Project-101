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
      Toastify({
        text: "Session Expired, Please log in again.",
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center"
        backgroundColor: "#dc3545", // Bootstrap danger red
        stopOnFocus: true,
      }).showToast();
      alert("Session Expired, Please log in again.");
      localStorage.removeItem("token");
      // window.location.href = "../index.html"; // Redirect to login page

      return null;
    }

    return res;
  } catch (err) {
    console.error("Network error:", err);
    alert("🚨 Network error. Please try again later.");
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const guestsInput = document.getElementById("guests");
  const tableSelect = document.getElementById("tableSelect");
  const checkBtn = document.getElementById("checkTablesBtn");

  async function fetchAvailableTables() {
    const date = dateInput.value;
    const time = timeInput.value;
    const guests = guestsInput.value;

    if (!date || !time || !guests) {
      Toastify({
        text: "⚠️ Please select date, time, and number of guests first.",
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "right", // or "left", "center"
        backgroundColor: "#dc3545", // Bootstrap danger red
        stopOnFocus: true,
      }).showToast();

      return;
    }

    // ⏱️ Restrict time selection to between 08:00 and 20:00
    if (time < "06:00" || time > "20:00") {
      alert("Please select a time between 06:00 AM and 08:00 PM.");
      return;
    }

    // ⛔ Prevent selecting time earlier than now (only on today's date)
    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (date === today && selectedDateTime < now) {
      alert("You cannot select a past time.");
      return;
    }

    try {
      const res = await secureFetch(
        `http://localhost:5000/api/tables/available?date=${date}&time=${time}&guests=${guests}`
      );
      const data = await res.json();

      tableSelect.innerHTML = ""; // Clear previous options

      if (!Array.isArray(data) || data.length === 0) {
        const opt = document.createElement("option");
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = "No tables available for selected slot";
        tableSelect.appendChild(opt);
        return;
      }

      data.forEach((table) => {
        const opt = document.createElement("option");
        opt.value = table._id;
        opt.textContent = `Table ${table.tableNumber} - ${table.capacity} seats`;
        tableSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Error fetching tables:", err);
      alert("Server error while checking tables.");
    }
  }

  checkBtn.addEventListener("click", fetchAvailableTables);
  timeInput.addEventListener("change", fetchAvailableTables);

  // checkBtn.addEventListener("click", fetchAvailableTables);
  // Attach globally
  window.fetchAvailableTables = fetchAvailableTables;
});

async function submitBooking(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) return alert("You must be logged in to book a table.");

  const modal = document.getElementById("orderModal");
  modal.style.display = "flex";

  const body = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    guests: document.getElementById("guests").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    specialRequest: document.getElementById("specialRequest").value,
    table: document.getElementById("tableSelect").value,
  };

  try {
    const res = await secureFetch("http://localhost:5000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    // console.log(data, data.booking.name);

    modal.style.display = "none";

    if (res.ok) {
      // alert("Booking confirmed! 🎉 Check your email.");
      Toastify({
        text: "Booking confirmed! 🎉 Check your email.",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "rgba(40, 167, 69, 0.85)",
        stopOnFocus: true,
      }).showToast();
      document.getElementById("bookingForm").reset();
    } else {
      alert("Booking failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    modal.style.display = "none";
    alert("Error while booking. Try again.");
    console.error(err);
  }
}

//Automatically fetch name and email if logged in
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) return; // Not logged in, skip

  try {
    const res = await secureFetch("http://localhost:5000/api/profile/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await res.json();

    // Autofill fields if user is fetched successfully
    if (user.name) {
      const nameInput = document.getElementById("name");
      nameInput.value = user.name;
      nameInput.disabled = true; // disable input
    }

    if (user.email) {
      const emailInput = document.getElementById("email");
      emailInput.value = user.email;
      emailInput.disabled = true; // disable input
    }
  } catch (err) {
    console.error("Failed to load user profile:", err);
  }
});
