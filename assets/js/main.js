"use strict";

/* =========================================================
   MASH LABS
   Front-end interactions
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const navAnchors = document.querySelectorAll(".nav-links a");
    const yearElement = document.querySelector("#current-year");

    /* -----------------------------------------------------
       Current year
       ----------------------------------------------------- */

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    /* -----------------------------------------------------
       Header state on scroll
       ----------------------------------------------------- */

    const updateHeader = () => {
        if (!header) {
            return;
        }

        header.classList.toggle("scrolled", window.scrollY > 24);
    };

    updateHeader();

    window.addEventListener("scroll", updateHeader, {
        passive: true
    });

    /* -----------------------------------------------------
       Mobile navigation
       ----------------------------------------------------- */

    const closeMenu = () => {
        if (!menuToggle || !navLinks) {
            return;
        }

        menuToggle.classList.remove("active");
        navLinks.classList.remove("open");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");

        document.body.classList.remove("menu-open");
    };

    const openMenu = () => {
        if (!menuToggle || !navLinks) {
            return;
        }

        menuToggle.classList.add("active");
        navLinks.classList.add("open");

        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation");

        document.body.classList.add("menu-open");
    };

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.contains("open");

            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    navAnchors.forEach((anchor) => {
        anchor.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    /* -----------------------------------------------------
       Reveal-on-scroll
       ----------------------------------------------------- */

    const revealTargets = document.querySelectorAll(
        [
            ".section-intro",
            ".principle",
            ".project-card",
            ".capability",
            ".about-layout",
            ".contact-inner"
        ].join(",")
    );

    revealTargets.forEach((element) => {
        element.classList.add("reveal");
    });

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
        revealTargets.forEach((element) => {
            element.classList.add("visible");
        });
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealTargets.forEach((element) => {
            revealObserver.observe(element);
        });
    }

    /* -----------------------------------------------------
       Smooth internal navigation with header offset
       ----------------------------------------------------- */

    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            const headerHeight = header ? header.offsetHeight : 0;

            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: reducedMotion ? "auto" : "smooth"
            });
        });
    });

    /* -----------------------------------------------------
       Console identity
       ----------------------------------------------------- */

    console.log(
        "%cMASH LABS%c  Data · Intelligence · Engineering",
        [
            "background:#58f0c2",
            "color:#04110d",
            "font-weight:700",
            "padding:6px 8px",
            "border-radius:4px"
        ].join(";"),
        [
            "color:#a2abb8",
            "padding:6px 8px"
        ].join(";")
    );
});