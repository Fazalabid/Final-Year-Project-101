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
      window.location.href = "../index.html"; // Redirect to login page

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
document
  .getElementById("feedbackForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to submit feedback.");
      return;
    }

    const name = document.getElementById("nameFeedback").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    try {
      const res = await secureFetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Feedback submitted successfully!");
        this.reset();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert(
        "An error occurred while submitting feedback. Please try again later."
      );
    }
  });
