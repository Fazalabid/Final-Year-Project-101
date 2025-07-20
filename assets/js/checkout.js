const API_BASE = "http://localhost:5000/api";
const token = localStorage.getItem("token");
let stripe = "";
let card;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("http://localhost:5000/api/payment/stripe");
    const { publicKey } = await res.json();

    // Stripe setup
    stripe = Stripe(publicKey);
    const elements = stripe.elements();
    card = elements.create("card");
    card.mount("#card-element");
  } catch (error) {
    console.error("Stripe init failed:", error);
  }
});

// Function to show toast
function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "center",
    backgroundColor: type === "error" ? "#e74c3c" : "#2ecc71",
    className: type,
    close: true,
  }).showToast();
}

// Secure fetch with token + logout on 401
async function secureFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type":
      options.body instanceof FormData ? undefined : "application/json",
  };

  try {
    const res = await fetch(url, options);

    if (res.status === 401 || res.status === 403) {
      Toastify({
        text: "Session Expired, Please log in again.",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#dc3545",
        stopOnFocus: true,
      }).showToast();
      localStorage.removeItem("token");
      window.location.href = "../index.html";
      return Promise.reject("Unauthorized");
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

// Cart setup
let cart = [];
const fullCart = JSON.parse(localStorage.getItem("cart")) || [];
const singleItem = JSON.parse(localStorage.getItem("checkoutItem"));
cart = singleItem && Object.keys(singleItem).length ? [singleItem] : fullCart;

// Render cart summary
function renderCartSummary() {
  const list = document.getElementById("cartSummary");
  const subtotalSpan = document.getElementById("subtotal");
  const taxSpan = document.getElementById("tax");
  const totalSpan = document.getElementById("total");
  const perPersonSpan = document.getElementById("perPerson");
  const splitInput = document.getElementById("splitBetween");

  list.innerHTML = "";

  let subtotal = 0;
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      ${item.name} x ${item.quantity}
      <span>Rs ${item.price * item.quantity}</span>
    `;
    list.appendChild(li);
    subtotal += item.price * item.quantity;
  });

  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const split = parseInt(splitInput.value) || 1;
  const perPerson = total / split;

  subtotalSpan.textContent = subtotal.toFixed(2);
  taxSpan.textContent = tax.toFixed(2);
  totalSpan.textContent = total.toFixed(2);
  perPersonSpan.textContent = perPerson.toFixed(2);
}

function calculateCartTotal() {
  return (
    cart.reduce((total, item) => total + item.price * item.quantity, 0) * 1.1
  );
}

// Stripe form toggle
document.querySelectorAll("input[name='paymentMethod']").forEach((input) => {
  input.addEventListener("change", (e) => {
    const method = e.target.value.toLowerCase();
    document.getElementById("card-payment-section").style.display =
      method === "card" ? "block" : "none";
  });
});

// Autofill user info if logged in
document.addEventListener("DOMContentLoaded", async () => {
  renderCartSummary();

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await secureFetch(`${API_BASE}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json();

    if (user.name) {
      const nameInput = document.getElementById("customerName");
      nameInput.value = user.name;
      nameInput.disabled = true; // disable input
    }

    if (user.email) {
      const emailInput = document.getElementById("email");
      emailInput.value = user.email;
      emailInput.disabled = true; // disable input
    }
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
  }
});

// Re-render on split change
document
  .getElementById("splitBetween")
  .addEventListener("input", renderCartSummary);

// Handle form submission
document
  .getElementById("checkoutForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!cart.length) {
      showToast("❌ Your cart is empty!", "error");
      return;
    }

    if (!token) {
      showToast("❌ You must be logged in to place an order!", "error");
      return;
    }

    const paymentMethod = document.querySelector(
      "input[name='paymentMethod']:checked"
    )?.value;

    const orderData = {
      customerName: document.getElementById("customerName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      paymentMethod,
      splitBetween:
        parseInt(document.getElementById("splitBetween").value) || 1,
      items: cart.map((item) => ({
        menuItem: item.menuItemId || item.id,
        quantity: item.quantity,
      })),
    };

    const placeOrderBtn = document.getElementById("placeOrderBtn");
    const orderModal = document.getElementById("orderModal");
    orderModal.style.display = "block";
    placeOrderBtn.disabled = true;

    try {
      // Handle Stripe Payment if selected
      if (paymentMethod.toLowerCase() === "card") {
        const amount = Math.round(calculateCartTotal() * 100); // Convert to paisa
        const paymentRes = await fetch(
          `${API_BASE}/payment/create-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
          }
        );

        const { clientSecret } = await paymentRes.json();

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: card },
        });

        if (result.error) {
          document.getElementById("card-errors").textContent =
            result.error.message;
          showToast("❌ Card payment failed!", "error");
          return;
        }

        if (result.paymentIntent.status !== "succeeded") {
          showToast("❌ Payment not successful", "error");
          return;
        }
      }

      // Now place order after payment
      const res = await secureFetch(`${API_BASE}/orders`, {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(`❌ ${data.message || "Failed to place order"}`, "error");
        return;
      }

      localStorage.removeItem("checkoutItem");
      localStorage.removeItem("cart");
      cart = [];
      renderCartSummary();
      showToast("✅ Order placed successfully! Check your email.", "success");
      setTimeout(() => {
        window.location.href = "index.html"; // or any route
      }, 2000);
    } catch (err) {
      showToast(
        `🚨 Error placing order: ${err.message || "Try again later"}`,
        "error"
      );
      console.error("Order error:", err);
    } finally {
      orderModal.style.display = "none";
      placeOrderBtn.disabled = false;
    }
  });
