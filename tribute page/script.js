document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");
      if (targetId.startsWith("#")) {
        event.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
});