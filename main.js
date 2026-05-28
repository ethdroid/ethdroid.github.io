/* =========================================================================
   Prism Wealth — main.js
   Shared behavior: nav, reveal-on-scroll, contact form (EmailJS), footer year
   ========================================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     Page transitions
     -----------------------------------------------------------------------
     Intercept same-origin link clicks, play the exit animation on <main>,
     then navigate. The new page's CSS plays the enter animation on load.

     Works on every browser and every protocol (file://, http://, https://).
     Bails out cleanly for:
       - external links, downloads, target=_blank
       - in-page hash anchors (#contact etc.)
       - modifier-key clicks (cmd/ctrl/shift/alt — new tab, etc.)
       - middle-click and right-click
       - prefers-reduced-motion
     ----------------------------------------------------------------------- */

  const EXIT_MS = 300; // must be ≤ the page-exit animation duration in CSS

  function isInternalNavLink(a) {
    if (!a || !a.href) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    if (a.getAttribute('href').startsWith('mailto:')) return false;
    if (a.getAttribute('href').startsWith('tel:')) return false;

    let url;
    try { url = new URL(a.href, location.href); }
    catch { return false; }

    // Different origin? Let the browser handle it.
    if (url.origin !== location.origin) return false;

    // Same page + hash? It's an anchor jump, not a navigation.
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;

    // Same URL entirely? No-op.
    if (url.href === location.href) return false;

    return true;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;                             // only left-click
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a');
    if (!isInternalNavLink(a)) return;
    if (reducedMotion()) return;                            // let it nav normally

    e.preventDefault();
    const href = a.href;

    // Avoid double-fires (e.g., rapid clicks).
    if (document.body.classList.contains('is-leaving')) return;

    document.body.classList.add('is-leaving');

    // Navigate just before the exit animation finishes so the new page's
    // enter animation picks up the motion without a stutter.
    window.setTimeout(() => { window.location.href = href; }, EXIT_MS);
  });

  // If the user returns via back/forward and the page is restored from
  // bfcache, clear any lingering leave state so it isn't stuck invisible.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('is-leaving');
  });

  /* -----------------------------------------------------------------------
     EmailJS Configuration
     -----------------------------------------------------------------------
     Replace the three placeholder strings below with your EmailJS values.
     Sign up at https://www.emailjs.com (free tier = 200 emails/month).

       1. Create a service (e.g., Gmail) and copy the SERVICE ID.
       2. Create a template — make sure the template variables match
          the form field names: from_name, from_email, phone, message.
          Set the template's "To Email" to cpeterman@prism-wealth.com.
       3. Copy the TEMPLATE ID.
       4. Get the PUBLIC KEY from Account → General.
     ----------------------------------------------------------------------- */

  const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
  const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

  /* ----- Init EmailJS (only if the SDK loaded) ----- */
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  /* ----- Footer year ----- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----- Mobile nav toggle ----- */
  const toggle = document.querySelector('.nav__toggle');
  const links  = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.textContent = isOpen ? 'Close' : 'Menu';
    });
    // Close menu when an in-page anchor is clicked
    links.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (window.innerWidth <= 820) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
      }
    });
  }

  /* ----- Reveal-on-scroll -----
     Honors prefers-reduced-motion. Safety timeout ensures content
     always becomes visible even if the observer never fires
     (accessibility tools, print, prerendering, headless screenshots). */
  const revealEls = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
    // Safety net: anything still hidden after 2s gets revealed.
    setTimeout(() => {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }, 2000);
  }

  /* ----- Contact form (EmailJS) ----- */
  const form    = document.getElementById('contact-form');
  const status  = document.getElementById('form-status');

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = 'form__status show ' + (type || '');
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic client-side validation
      const name    = form.from_name.value.trim();
      const email   = form.from_email.value.trim();
      const message = form.message.value.trim();
      if (!name || !email || !message) {
        setStatus('Please complete all required fields.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Please enter a valid email address.', 'error');
        return;
      }

      // Guard against unconfigured EmailJS
      if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'
       || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID'
       || EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
        setStatus('Contact form is not yet connected. Please email cpeterman@prism-wealth.com directly.', 'error');
        console.warn('[Prism Wealth] EmailJS keys have not been configured in main.js.');
        return;
      }

      // Submit state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.querySelector('.btn__label').textContent;
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn__label').textContent = 'Sending…';
      setStatus('Sending your message…', '');

      try {
        await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
        form.reset();
        setStatus('Thank you. Craig will be in touch shortly.', 'success');
      } catch (err) {
        console.error('[EmailJS] error:', err);
        setStatus('We could not send your message. Please email cpeterman@prism-wealth.com directly.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn__label').textContent = originalLabel;
      }
    });
  }

})();
