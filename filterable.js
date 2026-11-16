/* ============================================================
   filterable.js — reusable live search + category filter for
   lists of static cards (Deep Space, Missions).
   The last search/filter is saved in localStorage.

   initFilterable({
     items:  '.js-item',         // selector of the cards
     input:  'searchInput',      // id of the text input
     chips:  '.chip',            // category buttons (data-category)
     count:  'resultCount',      // id of the "N results" element
     empty:  'emptyState',       // id of the "nothing found" element
     key:    'astronomad-space'  // localStorage key
   })
   Cards need data-category="..."; text to highlight has class .hl-target
   ============================================================ */
window.initFilterable = function (cfg) {
  var items = Array.prototype.slice.call(document.querySelectorAll(cfg.items));
  var input = document.getElementById(cfg.input);
  var chips = document.querySelectorAll(cfg.chips);
  var countEl = document.getElementById(cfg.count);
  var emptyEl = document.getElementById(cfg.empty);
  if (!items.length || !input) return;

  var state = Store.get(cfg.key, { query: '', category: 'all' });

  /** Wrap each match of q in <mark> using DOM nodes (no innerHTML = no XSS) */
  function highlight(root, q) {
    root.querySelectorAll('.hl-target').forEach(function (el) {
      if (el.dataset.orig === undefined) el.dataset.orig = el.textContent;
      var text = el.dataset.orig;
      el.textContent = '';
      if (!q) { el.textContent = text; return; }
      var lower = text.toLowerCase();
      var pos = 0, idx;
      while ((idx = lower.indexOf(q, pos)) !== -1) {
        if (idx > pos) el.appendChild(document.createTextNode(text.slice(pos, idx)));
        var mark = document.createElement('mark');
        mark.className = 'hl';
        mark.textContent = text.slice(idx, idx + q.length);
        el.appendChild(mark);
        pos = idx + q.length;
      }
      el.appendChild(document.createTextNode(text.slice(pos)));
    });
  }

  function apply() {
    var q = state.query.trim().toLowerCase();
    var shown = 0;
    items.forEach(function (item) {
      var catOk = state.category === 'all' || item.dataset.category === state.category;
      var textOk = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
      var visible = catOk && textOk;
      item.classList.toggle('hidden', !visible);
      if (visible) { shown++; highlight(item, q); }
    });
    if (countEl) countEl.textContent = shown + ' of ' + items.length + ' shown';
    if (emptyEl) emptyEl.classList.toggle('hidden', shown > 0);
    chips.forEach(function (chip) {
      chip.classList.toggle('active', chip.dataset.category === state.category);
      chip.setAttribute('aria-pressed', chip.dataset.category === state.category);
    });
    Store.set(cfg.key, state);
  }

  input.value = state.query;
  input.addEventListener('input', function () { state.query = input.value; apply(); });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () { state.category = chip.dataset.category; apply(); });
  });
  var clear = document.getElementById(cfg.clear);
  if (clear) clear.addEventListener('click', function () {
    state = { query: '', category: 'all' };
    input.value = '';
    apply();
  });
  apply();
};
