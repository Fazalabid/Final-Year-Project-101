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
    Toastify({
      text: "Session Expired, Please log in again.",
      duration: 3000,
      gravity: "top", // or "bottom"
      position: "right", // or "left", "center"
      backgroundColor: "#dc3545", // Bootstrap danger red
      stopOnFocus: true,
    }).showToast();
    return null;
  }
}
const uploadForm = document.getElementById("uploadPicForm");

function openPicUploadModal() {
  const modal = new bootstrap.Modal(document.getElementById("profilePicModal"));
  modal.show();
}

document
  .getElementById("uploadPicForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const file = document.getElementById("picInput").files[0];

    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch("http://localhost:5000/api/profile/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.profilePic) {
        document.getElementById("userProfilePic").src = data.profilePic;
        bootstrap.Modal.getInstance(
          document.getElementById("profilePicModal")
        ).hide();
        alert("✅ Profile picture updated!");
      } else {
        alert("❌ Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Error uploading picture.");
    }
  });
async function loadProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await secureFetch("http://localhost:5000/api/profile/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    // Update profile image in dashboard
    document.getElementById("userProfilePic").src =
      data.profilePic || "assets/img/default-avatar.jpg";

    // Update profile button image
    document.getElementById("profilePic").src =
      data.profilePic || "assets/img/default-avatar.jpg";

    // Set fallback on error
    document.getElementById("profilePic").onerror = function () {
      this.src = "assets/img/default-avatar.jpg";
    };
  } catch (err) {
    console.error("Failed to load profile:", err);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
