/* =================================================================
   PARÉA ZION — interactions
   ================================================================= */
(function () {
  "use strict";

  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Year ---- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Sticky header state ---- */
  const onScroll = () => {
    if (window.scrollY > 24) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile nav ---- */
  const closeNav = () => {
    header.classList.remove("nav-open");
    mobileNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  navToggle.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    mobileNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- Hero parallax (subtle) — targets whichever background is active ---- */
  const heroSection = document.getElementById("hero");
  const heroMode = heroSection ? heroSection.getAttribute("data-hero") : "image";
  const heroImg = document.querySelector(
    heroMode === "video" ? ".hero__media--video video, .hero__media--video" : ".hero__media--image img"
  );
  if (heroImg && !reduceMotion) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, window.innerHeight);
          heroImg.style.transform = `scale(1.06) translateY(${y * 0.12}px)`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---- Newsletter (handles both the main CTA form and the footer form) ---- */
  function wireNewsletter(form, note) {
    if (!form || !note) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      const input = form.querySelector('input[name="EMAIL"]');
      const email = (input.value || "").trim();

      note.className = "form-note is-in";
      note.textContent = "";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        note.classList.add("is-err");
        note.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }

      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";

      try {
        const res = await fetch("/api/newsletter", { method: "POST", body: new FormData(form) });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          note.classList.add("is-ok");
          note.textContent = data.message || "Thank you — we’ll be in touch from the canyon.";
          form.reset();
        } else {
          note.classList.add("is-err");
          note.textContent = data.message || "Something went wrong. Please try again.";
        }
      } catch (err) {
        note.classList.add("is-err");
        note.textContent = "Network error. Please try again.";
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }
  wireNewsletter(document.getElementById("newsletterForm"), document.getElementById("formNote"));

  /* ---- Smooth-scroll for in-page anchors (respects reduced motion) ---- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id === "#top") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });
})();
