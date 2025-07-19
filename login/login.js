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

//My Code
async function submitLogin(event) {
  event.preventDefault(); // stop page reload

  const form = event.target;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  // const email = document.getElementById("email").value.trim();
  // const password = document.getElementById("password").value;

  try {
    const response = await secureFetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(result);
    if (response.ok) {
      // document.querySelector(".order-success-message").style.display = "block";
      // alert("Login successful!");
      showToast("Login successful!", "success");
      // Save token if needed:
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.removeItem("cart"); // Clear cart for new login
      setTimeout(() => {
        window.location.href = "../index.html"; // or any route
      }, 1500);
      // Redirect based on role
      // if (result.data.user.role === "admin") {
      //   window.location.href = "../admin/admin.html";
      // } else {
      //   window.location.href = "../index.html";
      // }
    } else {
      // alert(result.message || "Login failed.");
      showToast(result.message || "Login failed.", "error");
    }
  } catch (error) {
    console.error(error);
    // alert("Something went wrong. Please try again.");
    showToast("Something went wrong. Please try again.", "error");
  }
}

function forgotPassword() {
  // alert("Password recovery is not implemented yet.");
  showToast("Password recovery is not implemented yet.", "info");
}

// Function to show toast notifications
function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top", // top or bottom
    position: "center", // left, center or right
    backgroundColor: type === "error" ? "#dc3545" : "#28a745", // red or green
    close: true,
  }).showToast();
}
