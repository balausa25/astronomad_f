/* deep-space.js — live search + category filter for the Deep Space page */
document.addEventListener('DOMContentLoaded', function () {
  initFilterable({
    items: '.js-item', input: 'spaceSearch', chips: '.chip', count: 'spaceCount',
    empty: 'spaceEmpty', clear: 'spaceClear', key: 'astronomad-space-search'
  });
});
