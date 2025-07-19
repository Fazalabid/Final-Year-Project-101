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

async function submitSignup(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;

  if (password !== passwordConfirm) {
    alert("Passwords do not match.");
    return;
  }

  const data = { name, email, password, passwordConfirm };

  try {
    const response = await secureFetch(
      "http://localhost:5000/api/auth/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (response.ok) {
      document.getElementById("signupSuccess").style.display = "block";
      // alert("Signup successful!");
      showToast("Signup successful!", "success");
      localStorage.setItem("token", result.token);
      // Optional: redirect after delay
      setTimeout(() => (window.location.href = "../index.html"), 1000);
    } else {
      // alert(result.message || "Signup failed.");
      showToast(result.message || "Signup failed.", "error");
    }
  } catch (error) {
    console.error(error);
    // alert("Something went wrong. Please try again.");
    showToast("Something went wrong. Please try again.", "error");
  }
}

function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top", // top or bottom
    position: "right", // left, center or right
    backgroundColor: type === "error" ? "#dc3545" : "#28a745", // red or green
    close: true,
  }).showToast();
}
