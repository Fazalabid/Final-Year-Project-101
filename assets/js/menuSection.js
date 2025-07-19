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
      localStorage.removeItem("token");
      // window.location.href = "../index.html"; // Redirect to login page

      return Promise.reject("Unauthorized");
    }

    return res;
  } catch (err) {
    console.error("Network error:", err);
    alert("🚨 Network error. Please try again later.");
    return null;
  }
}
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let userRatings = {};

// Load and render everything on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await secureFetch("http://localhost:5000/api/menu");
    const items = await response.json();

    const categorizedMenu = {};

    items.forEach((item) => {
      const category = item.category?.toLowerCase() || "others";
      if (!categorizedMenu[category]) {
        categorizedMenu[category] = { name: capitalize(category), items: [] };
      }
      categorizedMenu[category].items.push(item);
    });
    await fetchUserRatings(); // Get previous ratings
    setupStarRatings(); // Light up the stars

    renderMenuTabs(categorizedMenu);
    updateCartUI(); // ✅ Load cart on page load
  } catch (error) {
    console.error("Failed to load menu:", error);
  }

  async function fetchUserRatings() {
    try {
      const res = await secureFetch("http://localhost:5000/api/ratings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        const ratings = await res.json();
        userRatings = ratings.reduce((acc, rating) => {
          acc[rating.menuItem] = rating.rating;
          return acc;
        }, {});
      }
    } catch (err) {
      console.error("Failed to fetch user ratings:", err);
    }
  }
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderMenuTabs(menuData) {
  const tabsContainer = document.getElementById("menu-tabs");
  const contentContainer = document.getElementById("menu-tab-content");

  tabsContainer.innerHTML = "";
  contentContainer.innerHTML = "";

  let isFirst = true;

  Object.entries(menuData).forEach(([categoryId, category]) => {
    const tab = document.createElement("li");
    tab.className = "nav-item";
    tab.innerHTML = `
      <a class="nav-link ${
        isFirst ? "active" : ""
      }" data-bs-toggle="tab" href="#tab-${categoryId}">
        ${category.name}
      </a>
    `;
    tabsContainer.appendChild(tab);

    const content = document.createElement("div");
    content.className = `tab-pane fade ${isFirst ? "show active" : ""}`;
    content.id = `tab-${categoryId}`;

    const row = document.createElement("div");
    row.className = "row";

    category.items.forEach((item) => {
      const isOutOfStock = item.stock === 0;

      const col = document.createElement("div");
      col.className = "col-md-4";
      col.innerHTML = `
        <div class="menu-card position-relative mb-4 text-center p-3 ${
          isOutOfStock ? "out-of-stock-card" : ""
        }">
          
          <button 
            class="add-to-cart-btn" 
            onclick="${
              isOutOfStock
                ? ""
                : `addToCart('${item._id}', '${item.title}', ${item.price})`
            }" 
            title="${isOutOfStock ? "Out of Stock" : "Add to Cart"}"
            ${isOutOfStock ? "disabled" : ""}
          >🛒</button>

          <img src="${item.image || "assets/img/menu/default.png"}"
               class="img-fluid rounded mb-3"
               alt="${item.title}"
               style="max-height: 300px; object-fit: cover; filter: ${
                 isOutOfStock ? "grayscale(100%)" : "none"
               };">

          <h5 style="font-size: 40px">${item.title}</h5>
          <p class="text-muted">${item.description}</p>
          <p class="fw-bold">Rs ${item.price}</p>

          ${
            isOutOfStock
              ? `<span class="badge bg-danger mb-2">Out of Stock</span>`
              : item.stock <= 5
              ? `<span class="badge bg-warning text-dark mb-2">Only ${item.stock} left!</span>`
              : ""
          }

          <button class="btn btn-${isOutOfStock ? "secondary" : "primary"}" 
            ${isOutOfStock ? "disabled" : ""}
            onclick="${
              isOutOfStock
                ? ""
                : `orderNow('${item._id}', '${item.title}', ${item.price})`
            }">
            ${isOutOfStock ? "Unavailable" : "Order Now"}
          </button>

          <div class="star-rating" data-id="${item._id}">
            ${[1, 2, 3, 4, 5]
              .map((val) => {
                const selected = userRatings[item._id] >= val ? "selected" : "";
                return `<span class="star ${selected}" data-value="${val}">&#9734;</span>`;
              })
              .join("")}
          </div>
        </div>
      `;
      row.appendChild(col);
    });

    content.appendChild(row);
    contentContainer.appendChild(content);
    setupStarRatings(); // Attach ratings to stars
    isFirst = false;
  });
}

function addToCart(id, name, price) {
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  Toastify({
    text: "Item added to cart!",
    duration: 3000,
    gravity: "top", // 'top' or 'bottom'
    position: "center", // 'left', 'center', or 'right'
    backgroundColor: "rgba(40, 167, 69, 0.85)", // Bootstrap green with 85% opacity
    close: true, // Show close button (optional)
    stopOnFocus: true, // Pause on hover
    style: {
      borderRadius: "8px",
      fontWeight: "500",
      padding: "12px 20px",
      color: "#fff", // Make sure text is readable
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  }).showToast();

  saveCart();
  updateCartUI();

  // Optional: Toast message
  // showToast("Added to cart!");
}

function removeFromCart(id) {
  const itemIndex = cart.findIndex((item) => item.id === id);

  if (itemIndex !== -1) {
    if (cart[itemIndex].quantity > 1) {
      cart[itemIndex].quantity -= 1;
    } else {
      cart.splice(itemIndex, 1); // Remove item completely if quantity is 1
    }

    saveCart();
    updateCartUI();
  }
}

function updateCartUI() {
  const cartItemsList = document.getElementById("cartItemsList");
  const cartItemCount = document.getElementById("cartItemCount");
  const cartItemCountIn = document.getElementById("cartItemCountIn");
  const totalAmount = document.getElementById("totalAmount");

  if (!cartItemsList || !totalAmount || !cartItemCount || !cartItemCountIn)
    return;

  cartItemsList.innerHTML = "";
  let total = 0;
  let totalCount = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;
    totalCount += item.quantity;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} x ${item.quantity} = Rs ${item.price * item.quantity}
      <button onclick="removeFromCart('${item.id}')">❌</button>
    `;
    cartItemsList.appendChild(li);
  });

  totalAmount.textContent = total.toFixed(2);
  cartItemCount.textContent = totalCount;
  cartItemCountIn.textContent = totalCount;
}

function toggleCart() {
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.style.display =
      cartModal.style.display === "block" ? "none" : "block";
  }
}

function checkout() {
  const token = localStorage.getItem("token");
  if (!cart || cart.length === 0) {
    alert("❌ Your cart is empty!");
    return;
  }
  if (!token) {
    alert("Please log in to proceed to checkout.");
    return;
  }
  localStorage.removeItem("checkoutItem");
  // Save the cart before redirect
  saveCart();

  // Redirect to checkout page
  window.location.href = "checkout.html";
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

//Item Rating code
function setupStarRatings() {
  document.querySelectorAll(".star-rating").forEach((container) => {
    const menuItemId = container.dataset.id;
    const stars = container.querySelectorAll(".star");

    const userHasRated = userRatings[menuItemId] !== undefined;
    let selectedRating = userRatings[menuItemId] || 0;

    // 🔁 Reset all listeners
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    const newStars = newContainer.querySelectorAll(".star");
    const token = localStorage.getItem("token");
    // If user has rated, highlight and lock
    if (userHasRated || !token) {
      highlightStars(newContainer, selectedRating);
      return; // ⛔ Do not add any event listeners
    }

    // 🔄 Event delegation only if user hasn't rated
    newContainer.addEventListener("mouseover", (e) => {
      if (e.target.classList.contains("star")) {
        const hoverValue = parseInt(e.target.dataset.value);
        highlightStars(newContainer, hoverValue);
      }
    });

    newContainer.addEventListener("mouseout", () => {
      highlightStars(newContainer, selectedRating);
    });

    newContainer.addEventListener("click", async (e) => {
      if (e.target.classList.contains("star")) {
        selectedRating = parseInt(e.target.dataset.value);
        highlightStars(newContainer, selectedRating);
        await submitRating(menuItemId, selectedRating);
      }
    });
  });
}

function highlightStars(container, value) {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star) => {
    const starValue = parseInt(star.dataset.value);
    star.classList.toggle("selected", starValue <= value);
  });
}

async function submitRating(menuItemId, rating) {
  // console.log("Submitting rating for", menuItemId, "Rating:", rating);
  try {
    const res = await secureFetch(
      `http://localhost:5000/api/ratings/${menuItemId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ rating }),
      }
    );

    const result = await res.json();
    // console.log(result);
    if (res.ok) {
      alert("Thanks for your rating!");
    } else {
      alert(result.message || "Rating failed.");
    }
  } catch (err) {
    console.error("Error submitting rating:", err);
  }
}
