/* ============================================================
   home.js — Home page: live clock, greeting, animated counters,
   newsletter popup with validation.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Greeting by time of day ---------- */
  var badge = document.getElementById('heroBadge');
  if (badge) {
    var hour = new Date().getHours();
    var greeting;
    if (hour >= 5 && hour < 12) greeting = '🌅 Good morning, stargazer!';
    else if (hour >= 12 && hour < 17) greeting = '☀️ Good afternoon, explorer!';
    else if (hour >= 17 && hour < 22) greeting = '🌆 Good evening, astronomer!';
    else greeting = '🌙 Good night, cosmic traveler!';
    badge.textContent = greeting;
  }

  /* ---------- Live clock ---------- */
  var clock = document.getElementById('dateTime');
  if (clock) {
    var tick = function () {
      clock.textContent = new Date().toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Animated counters (data-count, data-decimals, data-suffix) ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function animate(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    var duration = 1800;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  } else {
    counters.forEach(function (c) {
      c.textContent = parseFloat(c.dataset.count).toFixed(parseInt(c.dataset.decimals || '0', 10)) + (c.dataset.suffix || '');
    });
  }

  /* ---------- Newsletter popup ---------- */
  var overlay = document.getElementById('popupOverlay');
  if (!overlay) return;
  var form = document.getElementById('subscribeForm');
  var emailInput = document.getElementById('subEmail');
  var status = document.getElementById('subStatus');
  var lastFocus = null;

  var binding = AstroForms.bind(form, [{ input: emailInput, validator: Validators.email }]);

  function open() { lastFocus = document.activeElement; overlay.classList.add('show'); emailInput.focus(); }
  function close() { overlay.classList.remove('show'); if (lastFocus) lastFocus.focus(); }

  document.querySelectorAll('[data-open-popup]').forEach(function (b) { b.addEventListener('click', open); });
  document.getElementById('closePopup').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    if (!binding.validateAll()) return;

    var subs = Store.get('astronomad-subscribers', []);
    var email = emailInput.value.trim().toLowerCase();
    if (subs.indexOf(email) !== -1) {
      status.className = 'form-status error';
      status.textContent = 'This email is already subscribed.';
      return;
    }
    subs.push(email);
    Store.set('astronomad-subscribers', subs);
    binding.reset();
    status.className = 'form-status';
    status.textContent = '✅ Subscribed! Welcome aboard.';
    showToast('Subscribed to the Astronomad newsletter!', 'success');
    setTimeout(function () { close(); status.textContent = ''; }, 1500);
  });
});
