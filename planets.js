/* ============================================================
   planets.js — Planets page: data-driven cards, live search,
   category filter, favourites and expandable details.
   State (search, filter, favourites) is saved in localStorage.
   ============================================================ */
(function () {
  // Moon counts are the confirmed totals reported in 2025 and keep changing.
  var PLANETS = [
    { name: 'Mercury', symbol: '☿', type: 'inner', kind: 'Terrestrial', query: 'Mercury planet MESSENGER',
      blurb: 'The smallest planet and the closest to the Sun. With no real atmosphere, it swings between extreme heat and cold.',
      day: '59 Earth days', year: '88 Earth days', moons: '0', temp: '−180 to 430 °C',
      facts: ['Smaller than Jupiter’s moon Ganymede and Saturn’s moon Titan.', 'NASA’s MESSENGER orbited it from 2011 to 2015 and mapped the whole surface.'] },
    { name: 'Venus', symbol: '♀', type: 'inner', kind: 'Terrestrial', query: 'Venus Magellan radar',
      blurb: 'Similar in size to Earth, but a runaway greenhouse effect makes it the hottest planet in the Solar System.',
      day: '243 Earth days', year: '225 Earth days', moons: '0', temp: '≈ 465 °C',
      facts: ['It spins backwards (retrograde) compared to most planets.', 'A Venus day is longer than a Venus year.', 'NASA’s Magellan mapped it with radar in the early 1990s.'] },
    { name: 'Earth', symbol: '🌍', type: 'inner', kind: 'Terrestrial', query: 'Earth Blue Marble',
      blurb: 'Our home and the only world known to host life, with liquid water covering about 71% of its surface.',
      day: '24 hours', year: '365.25 days', moons: '1', temp: '≈ 15 °C average',
      facts: ['Its magnetic field shields the surface from solar wind.', 'NASA’s Earth-observing satellites track climate, oceans and weather.'] },
    { name: 'Mars', symbol: '♂', type: 'inner', kind: 'Terrestrial', query: 'Mars planet global view',
      blurb: 'A cold desert world whose red colour comes from iron oxide. Home to Olympus Mons, the tallest volcano known.',
      day: '24.6 hours', year: '687 Earth days', moons: '2 (Phobos, Deimos)', temp: '≈ −60 °C average',
      facts: ['Valles Marineris is a canyon system about 4,000 km long.', 'The Perseverance rover explores Jezero Crater, collecting samples for future return to Earth.'] },
    { name: 'Jupiter', symbol: '♃', type: 'gas', kind: 'Gas giant', query: 'Jupiter Juno',
      blurb: 'The largest planet: more than twice the mass of all other planets combined, with a storm bigger than Earth.',
      day: '9.9 hours', year: '11.9 Earth years', moons: '97', temp: '≈ −110 °C (cloud tops)',
      facts: ['The Great Red Spot has been observed for well over a century.', 'NASA’s Juno has orbited Jupiter since 2016.'] },
    { name: 'Saturn', symbol: '♄', type: 'gas', kind: 'Gas giant', query: 'Saturn Cassini rings',
      blurb: 'Famous for its spectacular ring system. It is the least dense planet — less dense than water.',
      day: '10.7 hours', year: '29.5 Earth years', moons: '274', temp: '≈ −140 °C (cloud tops)',
      facts: ['Its rings are mostly water ice, from dust grains to house-sized chunks.', 'Cassini studied Saturn for 13 years, until 2017.'] },
    { name: 'Uranus', symbol: '♅', type: 'ice', kind: 'Ice giant', query: 'Uranus planet',
      blurb: 'An ice giant that rotates on its side, likely after a giant collision. Methane gives it a pale blue colour.',
      day: '17.2 hours', year: '84 Earth years', moons: '29', temp: '≈ −195 °C',
      facts: ['Its axis is tilted about 98°.', 'Voyager 2 is the only spacecraft that has visited it (1986).'] },
    { name: 'Neptune', symbol: '♆', type: 'ice', kind: 'Ice giant', query: 'Neptune planet Voyager',
      blurb: 'The farthest planet: dark, cold and extremely windy, with supersonic winds in its atmosphere.',
      day: '16.1 hours', year: '165 Earth years', moons: '16', temp: '≈ −200 °C',
      facts: ['It was found through mathematical predictions before it was seen.', 'Voyager 2 flew past in 1989 and discovered the Great Dark Spot.'] }
  ];

  var FILTERS = [
    { id: 'all', label: 'All planets' },
    { id: 'inner', label: 'Inner (rocky)' },
    { id: 'gas', label: 'Gas giants' },
    { id: 'ice', label: 'Ice giants' },
    { id: 'fav', label: '⭐ Favorites' }
  ];

  var KEY_STATE = 'astronomad-planet-search';
  var KEY_FAV = 'astronomad-favorites';

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('planetGrid');
    if (!grid) return;

    var input = document.getElementById('planetSearch');
    var chipBox = document.getElementById('planetChips');
    var count = document.getElementById('planetCount');
    var empty = document.getElementById('planetEmpty');
    var state = Store.get(KEY_STATE, { query: '', filter: 'all' });
    var favorites = Store.get(KEY_FAV, []);
    var cards = {};

    // Build each card once, then only toggle visibility when filtering
    PLANETS.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'card planet-card';

      var img = document.createElement('img');
      img.className = 'card-img';
      img.alt = p.name + ' — NASA image';
      img.src = Nasa.PLACEHOLDER;
      img.loading = 'lazy';
      img.dataset.nasaQuery = p.query;

      var body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML =
        '<span class="tag"></span><h3></h3><p></p>' +
        '<dl class="planet-meta">' +
        '<div><dt>Day</dt><dd data-f="day"></dd></div>' +
        '<div><dt>Year</dt><dd data-f="year"></dd></div>' +
        '<div><dt>Moons</dt><dd data-f="moons"></dd></div>' +
        '<div><dt>Temperature</dt><dd data-f="temp"></dd></div></dl>' +
        '<div class="planet-details"><ul></ul></div>' +
        '<div class="card-actions">' +
        '<button type="button" class="btn btn-outline more-btn" aria-expanded="false">More facts</button>' +
        '<button type="button" class="btn btn-outline fav-btn" aria-pressed="false">☆ Save</button></div>';

      // Fill text with textContent (safe)
      body.querySelector('.tag').textContent = p.kind;
      body.querySelector('h3').textContent = p.symbol + ' ' + p.name;
      body.querySelector('p').textContent = p.blurb;
      ['day', 'year', 'moons', 'temp'].forEach(function (f) {
        body.querySelector('[data-f="' + f + '"]').textContent = p[f];
      });
      var ul = body.querySelector('ul');
      p.facts.forEach(function (fact) {
        var li = document.createElement('li');
        li.textContent = fact;
        ul.appendChild(li);
      });

      var details = body.querySelector('.planet-details');
      var moreBtn = body.querySelector('.more-btn');
      moreBtn.addEventListener('click', function () {
        var open = details.classList.toggle('open');
        moreBtn.textContent = open ? 'Hide facts' : 'More facts';
        moreBtn.setAttribute('aria-expanded', open);
      });

      var favBtn = body.querySelector('.fav-btn');
      favBtn.addEventListener('click', function () {
        var i = favorites.indexOf(p.name);
        if (i === -1) { favorites.push(p.name); showToast(p.name + ' saved to your profile.', 'success'); }
        else { favorites.splice(i, 1); showToast(p.name + ' removed.', 'info'); }
        Store.set(KEY_FAV, favorites);
        render();
      });

      card.appendChild(img);
      card.appendChild(body);
      grid.appendChild(card);
      cards[p.name] = { el: card, fav: favBtn, data: p };
    });
    Nasa.fillImages(grid);

    // Filter chips
    FILTERS.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.filter = f.id;
      b.textContent = f.label;
      b.addEventListener('click', function () { state.filter = f.id; render(); });
      chipBox.appendChild(b);
    });

    function render() {
      var q = state.query.trim().toLowerCase();
      var shown = 0;
      PLANETS.forEach(function (p) {
        var c = cards[p.name];
        var isFav = favorites.indexOf(p.name) !== -1;
        var typeOk = state.filter === 'all' || (state.filter === 'fav' ? isFav : p.type === state.filter);
        var textOk = !q || (p.name + ' ' + p.kind + ' ' + p.blurb).toLowerCase().indexOf(q) !== -1;
        var visible = typeOk && textOk;
        c.el.classList.toggle('hidden', !visible);
        if (visible) shown++;
        c.fav.textContent = isFav ? '★ Saved' : '☆ Save';
        c.fav.classList.toggle('active', isFav);
        c.fav.setAttribute('aria-pressed', isFav);
      });
      chipBox.querySelectorAll('.chip').forEach(function (chip) {
        chip.classList.toggle('active', chip.dataset.filter === state.filter);
      });
      count.textContent = shown + ' of ' + PLANETS.length + ' planets shown';
      empty.classList.toggle('hidden', shown > 0);
      Store.set(KEY_STATE, state);
    }

    input.value = state.query;
    input.addEventListener('input', function () { state.query = input.value; render(); });
    document.getElementById('planetReset').addEventListener('click', function () {
      state = { query: '', filter: 'all' };
      input.value = '';
      render();
    });
    render();
  });
})();
