/* ============================================================
   gallery.js — Live NASA image search (external API).
   Shows: loading state, error state with retry, empty state,
   "load more" paging, lightbox viewer. Last query is saved.
   ============================================================ */
(function () {
  var KEY = 'astronomad-gallery-search';
  var PRESETS = ['Nebula', 'Galaxy', 'Mars', 'Jupiter', 'Apollo', 'Aurora', 'Black hole', 'Webb telescope'];

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('galleryForm');
    if (!form) return;

    var input = document.getElementById('galleryQuery');
    var grid = document.getElementById('galleryGrid');
    var loader = document.getElementById('galleryLoader');
    var errorBox = document.getElementById('galleryError');
    var errorText = document.getElementById('galleryErrorText');
    var empty = document.getElementById('galleryEmpty');
    var moreBtn = document.getElementById('galleryMore');
    var status = document.getElementById('galleryStatus');
    var chips = document.getElementById('galleryChips');
    var queryError = document.getElementById('galleryQueryError');

    var lightbox = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbTitle = document.getElementById('lbTitle');
    var lbDesc = document.getElementById('lbDesc');
    var lbMeta = document.getElementById('lbMeta');

    var currentQuery = '';
    var page = 1;
    var requestId = 0; // ignore answers of outdated requests

    PRESETS.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = name;
      b.addEventListener('click', function () { input.value = name; runSearch(name); });
      chips.appendChild(b);
    });

    function setLoading(on) {
      loader.classList.toggle('hidden', !on);
      if (on) { errorBox.classList.add('hidden'); empty.classList.add('hidden'); }
    }

    function addItems(items) {
      items.forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gallery-item fade-in';
        var img = document.createElement('img');
        img.alt = item.title;
        img.loading = 'lazy';
        setImageSrc(img, item);
        var cap = document.createElement('span');
        cap.className = 'cap';
        cap.textContent = item.title;
        btn.appendChild(img);
        btn.appendChild(cap);
        btn.addEventListener('click', function () { openLightbox(item); });
        grid.appendChild(btn);
      });
    }

    // Image with fallback chain (medium -> thumb -> placeholder)
    function setImageSrc(img, item) {
      var step = 0;
      img.onerror = function () {
        step++;
        if (step === 1) img.src = item.thumb;
        else { img.onerror = null; img.src = Nasa.PLACEHOLDER; }
      };
      img.src = item.medium;
    }

    function load(reset) {
      var id = ++requestId;
      if (reset) { grid.innerHTML = ''; page = 1; moreBtn.classList.add('hidden'); }
      setLoading(true);
      status.textContent = '';

      Nasa.search(currentQuery, { page: page, pageSize: 24 })
        .then(function (items) {
          if (id !== requestId) return;
          setLoading(false);
          if (!items.length && page === 1) { empty.classList.remove('hidden'); return; }
          addItems(items);
          status.textContent = grid.children.length + ' images for “' + currentQuery + '”';
          moreBtn.classList.toggle('hidden', items.length < 24);
        })
        .catch(function (err) {
          if (id !== requestId) return;
          setLoading(false);
          errorText.textContent = err.message || 'Something went wrong.';
          errorBox.classList.remove('hidden');
        });
    }

    function runSearch(query) {
      var q = query.trim();
      // Validation: required + minimum length, shown inline (no alert)
      if (q === '') { queryError.textContent = 'Type something to search, e.g. “Mars”.'; return; }
      if (q.length < 2) { queryError.textContent = 'Use at least 2 characters.'; return; }
      queryError.textContent = '';
      currentQuery = q;
      Store.set(KEY, q);
      chips.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('active', c.textContent.toLowerCase() === q.toLowerCase());
      });
      load(true);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); runSearch(input.value); });
    moreBtn.addEventListener('click', function () { page++; load(false); });
    document.getElementById('galleryRetry').addEventListener('click', function () { load(page === 1); });

    /* ---------- Lightbox ---------- */
    var lastFocus = null;
    function openLightbox(item) {
      lastFocus = document.activeElement;
      lbImg.src = item.medium;
      lbImg.alt = item.title;
      lbTitle.textContent = item.title;
      var text = item.description.replace(/<[^>]*>/g, '');
      lbDesc.textContent = text.length > 500 ? text.slice(0, 500) + '…' : text;
      lbMeta.textContent = (item.date ? item.date + ' · ' : '') + 'NASA ID: ' + item.id;
      lightbox.classList.add('show');
      document.getElementById('lbClose').focus();
    }
    function closeLightbox() {
      lightbox.classList.remove('show');
      if (lastFocus) lastFocus.focus();
    }
    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

    // Start with the last saved search
    var saved = Store.get(KEY, 'Nebula');
    input.value = saved;
    runSearch(saved);
  });
})();
