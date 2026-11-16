/* ============================================================
   theme.js — runs in <head> BEFORE first paint so there is no
   flash of the wrong theme. Stores the choice in localStorage,
   so every page shows the same mode.
   ============================================================ */
(function () {
  var KEY = 'astronomad-theme';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  var theme = saved || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  // Called by common.js when the toggle button is clicked
  window.AstroTheme = {
    get: function () { return document.documentElement.getAttribute('data-theme'); },
    set: function (value) {
      document.documentElement.setAttribute('data-theme', value);
      try { localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
    },
    toggle: function () {
      var next = this.get() === 'dark' ? 'light' : 'dark';
      this.set(next);
      return next;
    }
  };
})();
