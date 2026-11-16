/* ============================================================
   nasa.js — External API integration: NASA Image and Video Library
   https://images-api.nasa.gov  (public, no API key needed)

   Window.Nasa.search(query, {page, pageSize})  -> Promise<items[]>
   Window.Nasa.fillImages(root)                 -> fills <img data-nasa-query="...">
   Static cards on every page use data-nasa-query so each picture
   matches its topic; results are cached in localStorage.
   ============================================================ */
(function () {
  var API = 'https://images-api.nasa.gov/search';
  var PLACEHOLDER = 'images/placeholder.svg';
  var TIMEOUT_MS = 12000;

  /** Search the library. Rejects on network / HTTP errors (callers show an error state). */
  function search(query, options) {
    options = options || {};
    var url = API + '?q=' + encodeURIComponent(query) +
      '&media_type=image&page_size=' + (options.pageSize || 24) +
      '&page=' + (options.page || 1);

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    return fetch(url, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('NASA server answered with status ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var items = (json && json.collection && json.collection.items) || [];
        return items
          .filter(function (it) { return it.data && it.data[0] && it.links && it.links[0] && it.links[0].href; })
          .map(function (it) {
            var thumb = it.links[0].href;
            return {
              id: it.data[0].nasa_id,
              title: it.data[0].title || 'Untitled',
              description: it.data[0].description || '',
              date: it.data[0].date_created ? it.data[0].date_created.slice(0, 10) : '',
              thumb: thumb,
              medium: thumb.replace(/~(thumb|small)\./, '~medium.')
            };
          });
      })
      .catch(function (err) {
        if (err.name === 'AbortError') throw new Error('The request timed out. Check your connection.');
        throw err;
      })
      .finally(function () { clearTimeout(timer); });
  }

  /** Set src with graceful fallbacks: medium -> thumb -> local placeholder */
  function setImage(img, item) {
    var step = 0;
    img.onerror = function () {
      step++;
      if (step === 1 && item.thumb) img.src = item.thumb;
      else { img.onerror = null; img.src = PLACEHOLDER; }
    };
    img.src = item.medium;
    img.classList.remove('img-loading');
  }

  /* ---------- Queue (max 3 requests at once) for static card images ---------- */
  var queue = [];
  var running = 0;
  function runQueue() {
    while (running < 3 && queue.length) {
      running++;
      queue.shift()().then(function () { running--; runQueue(); });
    }
  }

  function loadFor(img) {
    var query = img.dataset.nasaQuery;
    var cacheKey = 'astronomad-img:' + query;
    var cached = Store.get(cacheKey, null);
    if (cached) { setImage(img, cached); return Promise.resolve(); }

    return search(query, { pageSize: 6 })
      .then(function (items) {
        if (!items.length) throw new Error('no results');
        Store.set(cacheKey, items[0]);
        setImage(img, items[0]);
      })
      .catch(function () { img.onerror = null; img.src = PLACEHOLDER; img.classList.remove('img-loading'); });
  }

  function fillImages(root) {
    var imgs = (root || document).querySelectorAll('img[data-nasa-query]');
    var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        queue.push(function () { return loadFor(entry.target); });
        runQueue();
      });
    }, { rootMargin: '250px' }) : null;

    imgs.forEach(function (img) {
      if (img.dataset.nasaBound) return;
      img.dataset.nasaBound = '1';
      img.classList.add('img-loading');
      if (observer) observer.observe(img);
      else { queue.push(function () { return loadFor(img); }); runQueue(); }
    });
  }

  window.Nasa = { search: search, fillImages: fillImages, PLACEHOLDER: PLACEHOLDER };
  document.addEventListener('DOMContentLoaded', function () { fillImages(document); });
})();
