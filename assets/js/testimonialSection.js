document.addEventListener("DOMContentLoaded", function () {
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      quote:
        "YUMMS made our anniversary dinner so special. The food was incredible, and the booking process was a breeze!",
      name: "Areeba Z., Karachi",
      title: "Ceo & Founder",
      stars: 5,
      image: "assets/img/testimonials/ikram.jpg",
    },
    {
      id: 2,
      quote:
        "As a restaurant owner, BooknBite has completely changed the way I manage orders and reservations. It's fast, reliable, and super easy to use.",
      name: "Mr. Rahim, Owner of Grill & Go",
      title: "Designer",
      stars: 5,
      image: "assets/img/testimonials/toofan1.jpg",
    },
    {
      id: 3,
      quote:
        "Booked my birthday dinner through YUMMS and everything went perfectly — from the food to the table setting!",
      name: "Faiza A., Lahore",
      title: "Store Owner",
      stars: 5,
      image: "assets/img/testimonials/mudasir.jpg",
    },
    {
      id: 4,
      quote:
        "We hosted a private party using YUMMS services and our guests were impressed with the food and ambiance. Highly recommended!",
      name: "Ali N., Hyderabad",
      title: "Entrepreneur",
      stars: 5,
      image: "assets/img/testimonials/image.jpg",
    },
  ];

  // Function to generate star ratings
  function generateStars(rating) {
    let stars = "";
    for (let i = 0; i < rating; i++) {
      stars += '<i class="bi bi-star-fill"></i>';
    }
    return stars;
  }

  // Function to generate testimonials
  function generateTestimonials() {
    const testimonialsContainer = document.getElementById(
      "testimonials-container"
    );

    testimonials.forEach((testimonial) => {
      const testimonialItem = document.createElement("div");
      testimonialItem.className = "swiper-slide";
      testimonialItem.innerHTML = `
        <div class="testimonial-item">
          <div class="row gy-4 justify-content-center">
            <div class="col-lg-6">
              <div class="testimonial-content">
                <p>
                  <i class="bi bi-quote quote-icon-left"></i>
                  <span>${testimonial.quote}</span>
                  <i class="bi bi-quote quote-icon-right"></i>
                </p>
                <h3>${testimonial.name}</h3>
                <h4>${testimonial.title}</h4>
                <div class="stars">
                  ${generateStars(testimonial.stars)}
                </div>
              </div>
            </div>
            <div class="col-lg-2 text-center">
              <img src="${
                testimonial.image
              }" class="img-fluid testimonial-img" alt="${testimonial.name}" />
            </div>
          </div>
        </div>
      `;
      testimonialsContainer.appendChild(testimonialItem);
    });

    // Initialize Swiper after testimonials are loaded
    const swiperConfig = JSON.parse(
      document.querySelector(".swiper-config").textContent
    );
    new Swiper(".init-swiper", swiperConfig);
  }

  // Call the function to generate testimonials
  generateTestimonials();
});
