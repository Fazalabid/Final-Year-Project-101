(function () {
  "use strict";

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
      if (res.status === 500 || res.status === 400 || res.status === 503) {
        Toastify({
          text: "Server Error, Try again later",
          duration: 3000,
          gravity: "top", // or "bottom"
          position: "center", // or "left", "center"
          backgroundColor: "#dc3545", // Bootstrap danger red
          stopOnFocus: true,
        }).showToast();
      }

      return res;
    } catch (err) {
      console.error("Network error:", err);
      alert("🚨 Network error. Please try again later.");
      return null;
    }
  }
  /**
   * Apply `.scrolled` class to the body when the page is scrolled down
   * This class is used to change styles when the user scrolls (like changing header background)
   */
  function toggleScrolled() {
    const selectBody = document.querySelector("body");
    const selectHeader = document.querySelector("#header");

    // Only apply the effect if the header is sticky or fixed
    if (
      !selectHeader.classList.contains("scroll-up-sticky") &&
      !selectHeader.classList.contains("sticky-top") &&
      !selectHeader.classList.contains("fixed-top")
    )
      return;

    // Add or remove "scrolled" class based on scroll position
    window.scrollY > 100
      ? selectBody.classList.add("scrolled")
      : selectBody.classList.remove("scrolled");
  }

  // Trigger on scroll and page load
  document.addEventListener("scroll", toggleScrolled);
  window.addEventListener("load", toggleScrolled);

  /**
   * Mobile navigation toggle
   * Toggles nav menu and hamburger icon on small screens
   */
  const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");

  function mobileNavToogle() {
    document.querySelector("body").classList.toggle("mobile-nav-active");
    mobileNavToggleBtn.classList.toggle("bi-list"); // hamburger icon
    mobileNavToggleBtn.classList.toggle("bi-x"); // close icon
  }

  mobileNavToggleBtn.addEventListener("click", mobileNavToogle);

  /**
   * Hide mobile nav when clicking a same-page/hash link
   */
  document.querySelectorAll("#navmenu a").forEach((navmenu) => {
    navmenu.addEventListener("click", () => {
      if (document.querySelector(".mobile-nav-active")) {
        mobileNavToogle();
      }
    });
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll(".navmenu .toggle-dropdown").forEach((navmenu) => {
    navmenu.addEventListener("click", function (e) {
      e.preventDefault();
      this.parentNode.classList.toggle("active");
      this.parentNode.nextElementSibling.classList.toggle("dropdown-active");
      e.stopImmediatePropagation(); // Prevent bubbling
    });
  });

  //  Remove preloader once page fully loads
  const preloader = document.querySelector("#preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.style.display = "none";
    });
  }

  /**
   * Scroll-to-top button toggle
   */
  let scrollTop = document.querySelector(".scroll-top");

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100
        ? scrollTop.classList.add("active")
        : scrollTop.classList.remove("active");
    }
  }

  // Scroll to top on click
  scrollTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Trigger scrollTop button on load and scroll
  window.addEventListener("load", toggleScrollTop);
  document.addEventListener("scroll", toggleScrollTop);

  /**
   * Initialize AOS (Animate On Scroll)
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }
  window.addEventListener("load", aosInit);

  /**
   * Initialize GLightbox (image lightbox popup)
   */
  const glightbox = GLightbox({
    selector: ".glightbox",
  });

  /**
   * Initialize Pure Counter (animated number counters)
   */

  /**
   * Initialize Swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Smooth scroll to hash links on page load
   */
  window.addEventListener("load", function () {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: "smooth",
          });
        }, 100);
      }
    }
  });

  /**
   * Highlight nav menu items as user scrolls through sections
   */
  let navmenulinks = document.querySelectorAll(".navmenu a");

  function navmenuScrollspy() {
    navmenulinks.forEach((navmenulink) => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;

      let position = window.scrollY + 200;

      if (
        position >= section.offsetTop &&
        position <= section.offsetTop + section.offsetHeight
      ) {
        document
          .querySelectorAll(".navmenu a.active")
          .forEach((link) => link.classList.remove("active"));
        navmenulink.classList.add("active");
      } else {
        navmenulink.classList.remove("active");
      }
    });
  }

  window.addEventListener("load", navmenuScrollspy);
  document.addEventListener("scroll", navmenuScrollspy);
})();

//logOut function
function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("checkoutItem");
  window.location.href = "../../index.html"; // Or reload with location.reload()
}

//Code to hide profile and logout button if user is not logged in
document.addEventListener("DOMContentLoaded", () => {
  const profileIcon = document.getElementById("profileIcon");
  const token = localStorage.getItem("token");
  const logInButton = document.getElementById("logInButton");

  if (token) {
    // Show profile icon
    profileIcon.style.display = "inline-block";
    logInButton.style.display = "none"; // Hide login button if logged in
  } else {
    // Hide profile icon
    profileIcon.style.display = "none";
  }
});

// Function to open history modal
function openHistoryModal() {
  document.getElementById("history-modal").style.display = "flex";
  loadUserHistory();
}

function closeHistoryModal() {
  document.getElementById("history-modal").style.display = "none";
}

async function loadUserHistory() {
  const token = localStorage.getItem("token");
  const userId = getUserIdFromToken(token);
  const container = document.getElementById("history-content");

  if (!userId) {
    container.innerHTML = "<p>User not found.</p>";
    return;
  }

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/orders/user/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No order history found.</p>";
      return;
    }
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = data
      .map((order) => {
        const itemList = order.items
          .map(
            (item) => `
            <li>
              ${item.menuItem?.title || "Unknown Item"} x ${item.quantity} 
              @ Rs ${item.menuItem?.price || "?"} = Rs ${
              item.quantity * (item.menuItem?.price || 0)
            }
            </li>`
          )
          .join("");

        return `
        <div class="order-card mb-4 p-3 border rounded shadow-sm" style="background-color:#264d76; color: white;">
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Date:</strong> ${new Date(
            order.createdAt
          ).toLocaleString()}</p>
          <p><strong>Name:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <p><strong>Address:</strong> ${order.address}</p>
          <p><strong>Total Price:</strong> Rs ${order.totalPrice}</p>
          <p><strong>Tax:</strong> Rs ${order.tax}</p>
          <p><strong>Per Person:</strong> Rs ${order.perPersonAmount}</p>
          <p><strong>Split Between:</strong> ${order.splitBetween} people</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Status:</strong> 
            <span class="badge bg-${
              order.status === "Cancelled"
                ? "danger"
                : order.status === "Confirmed"
                ? "success"
                : "warning"
            }">
              ${order.status || "Pending"}
            </span>
            ${
              order.status === "Cancelled"
                ? `<p class="text-danger fw-bold">Order Cancelled</p>`
                : `<button class="btn btn-sm btn-danger mt-2" onclick="if(confirm('Cancel this Order?')) cancelOrder('${order._id}')"">Cancel Order</button>`
            }
          </p>

          
          <p><strong>Items Ordered:</strong></p>
          <ul style="padding-left: 20px;">${itemList}</ul>
          <div class="mt-3">
  <button class="btn btn-success btn-sm" onclick="downloadInvoice('${
    order._id
  }')">
    📄 Download Invoice
  </button>
</div>
        </div>
        `;
      })
      .join("");
  } catch (err) {
    container.innerHTML = "<p>❌ Failed to load history.</p>";
    console.error("Error loading user history:", err);
  }
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

//Order Now button in menu function
function orderNow(itemId, name, price) {
  const item = {
    menuItemId: itemId,
    name: name,
    price: price,
    quantity: 1,
  };

  // Store as single-item checkout (not full cart)
  localStorage.setItem("checkoutItem", JSON.stringify(item));

  // // Optional: also add to cart
  // addToCart(itemId, name, price);

  // Redirect to checkout
  window.location.href = "checkout.html";
}

//Booking hsitory modal
// Modal control
function openBookingModal() {
  document.getElementById("booking-modal").style.display = "flex";
  loadUserBookings();
}

function closeBookingModal() {
  document.getElementById("booking-modal").style.display = "none";
}

// Booking loader
async function loadUserBookings() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("booking-content");

  if (!token) {
    container.innerHTML = "<p>User not logged in.</p>";
    return;
  }

  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await secureFetch(
      "http://localhost:5000/api/bookings/my-bookings",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No bookings found.</p>";
      return;
    }
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = data
      .map((booking) => {
        const start = new Date(booking.reservationStart);
        const end = new Date(booking.reservationEnd);

        const durationMinutes = Math.round((end - start) / 60000);
        const durationStr =
          durationMinutes >= 60
            ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
            : `${durationMinutes} minutes`;

        return `
        <div class="order-card mb-4 p-3 border rounded shadow-sm" style="background-color:#264d76; color: white;">
          <p><strong>Booking ID:</strong> ${booking._id}</p>
          <p><strong>Booking Created:</strong> ${new Date(
            booking.createdAt
          ).toLocaleString()}</p>
          <p><strong>Date:</strong> ${start.toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</p>
          <p><strong>Duration:</strong> ${durationStr}</p>
          <p><strong>Guests:</strong> ${booking.guests}</p>
          <p><strong>Name:</strong> ${booking.name}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Message:</strong> ${booking.specialRequest || "N/A"}</p>
          <p><strong>Table:</strong> ${
            booking.table.tableNumber || "Not assigned"
          }</p>
          <p><strong>Seats/Capacity:</strong> ${
            booking.table?.capacity || "N/A"
          }</p>
          <p><strong>Status:</strong> 
            <span class="badge bg-${
              booking.status === "Cancelled"
                ? "danger"
                : booking.status === "Confirmed"
                ? "success"
                : "warning"
            }">
              ${booking.status || "Pending"}
            </span>
          </p>
          ${
            booking.status === "Cancelled"
              ? `<p class="text-danger fw-bold">Booking Cancelled</p>`
              : `<button class="btn btn-sm btn-danger mt-2" onclick="if(confirm('Cancel this booking?')) cancelBooking('${booking._id}')">Cancel Booking</button>`
          }
              <button class="btn btn-success btn-sm mt-2" onclick="downloadBookingInvoice('${
                booking._id
              }')">
  📄 Download Confirmation
</button>

        </div>
        `;
      })
      .join("");
  } catch (err) {
    container.innerHTML = "<p>❌ Failed to load bookings.</p>";
    console.error("Error fetching bookings:", err);
  }
}

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

//Canceling Order and booking from history modal
async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/orders/${orderId}/cancel`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Order cancelled successfully.");
      loadUserHistory(); // Refresh view
    } else {
      alert(data.message || "Failed to cancel order.");
    }
  } catch (err) {
    console.error("Error cancelling order:", err);
    alert("Server error.");
  }
}

async function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Booking cancelled successfully.");
      loadUserBookings(); // Refresh view
    } else {
      alert(data.message || "Failed to cancel booking.");
    }
  } catch (err) {
    console.error("Error cancelling booking:", err);
    alert("Server error.");
  }
}

//Function to go to admin dashboard
const token = localStorage.getItem("token");

async function checkAdminStatus() {
  if (!token) return;

  try {
    const res = await secureFetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = await res.json();

    if (res.ok && user.data.user.role === "admin") {
      // ✅ Show admin button
      document.getElementById("adminBtnWrapper").style.display = "block";
    }
  } catch (err) {
    console.error("Failed to fetch user role:", err);
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", checkAdminStatus);

///////////////////////////////////////////////////
//service request code
async function checkServiceRequestEligibility() {
  const token = localStorage.getItem("token");

  try {
    const res = await secureFetch("http://localhost:5000/api/bookings/active", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    const serviceBtn = document.getElementById("service-request-btn");
    if (!serviceBtn) return;

    if (data.active) {
      serviceBtn.style.display = "block"; // or serviceBtn.disabled = false;
    } else {
      serviceBtn.style.display = "none"; // or serviceBtn.disabled = true;
    }
  } catch (err) {
    console.error("Failed to check booking status:", err);
  }
}
window.addEventListener("DOMContentLoaded", checkServiceRequestEligibility);

//submit service request
document
  .getElementById("service-request-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const type = document.getElementById("requestType").value;
    const note = document.getElementById("note").value;

    if (!type) {
      alert("Please select a service type.");
      return;
    }

    try {
      const res = await secureFetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, note }),
      });

      const data = await res.json();
      if (res.status === 429) {
        alert(data.message); // Or show this in a UI alert
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Service request failed.");
      }

      alert("✅ Service request submitted!");

      // Reset form
      document.getElementById("service-request-form").reset();

      // Close modal (Bootstrap 5)
      const modalEl = document.getElementById("serviceRequestModal");
      const modal = bootstrap.Modal.getInstance(modalEl);

      if (modal) modal.hide();

      // 🧼 Clean up leftover backdrop if any
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) backdrop.remove();

      // 🧹 Also remove 'modal-open' class from <body> to restore scroll
      document.body.classList.remove("modal-open");
      document.body.style = "";

      modal.hide();
    } catch (err) {
      console.error("Request failed:", err);
      alert("❌ Could not submit service request. Please try again.");
    }
  });

// Function to load user's service requests
async function loadMyServiceRequests() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("my-service-requests-container");

  if (!token) {
    container.innerHTML = "<p>User not logged in.</p>";
    return;
  }

  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await secureFetch("http://localhost:5000/api/requests/my", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>You haven’t made any service requests yet.</p>";
      return;
    }

    container.innerHTML = data
      .map((req) => {
        const isPending = req.status === "Pending";
        return `
      <div class="border rounded p-3 mb-3 bg-light position-relative">
        <p><strong>Type:</strong> ${req.type}</p>
        <p><strong>Note:</strong> ${req.note || "—"}</p>
        <p><strong>Status:</strong> 
          <span class="badge bg-${isPending ? "warning" : "success"}">${
          req.status
        }</span>
        </p>
        <p><strong>Table:</strong> ${
          req.booking?.table?.tableNumber || "N/A"
        }</p>
        <p><strong>Time:</strong> ${new Date(
          req.createdAt
        ).toLocaleString()}</p>

        ${
          isPending
            ? `<button class="btn btn-sm btn-danger mt-2" onclick="cancelServiceRequest('${req._id}')">Cancel Request</button>`
            : ""
        }
      </div>
    `;
      })
      .join("");
  } catch (err) {
    container.innerHTML = "<p>❌ Failed to load service requests.</p>";
    console.error(err);
  }
}

async function cancelServiceRequest(requestId) {
  const token = localStorage.getItem("token");
  if (!confirm("Are you sure you want to cancel this service request?")) return;

  try {
    const res = await secureFetch(
      `http://localhost:5000/api/requests/${requestId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to cancel");

    // Refresh the list
    loadMyServiceRequests();

    alert("✅ Service request cancelled.");
  } catch (err) {
    console.error("❌ Cancel failed:", err);
    alert("Failed to cancel service request.");
  }
}
