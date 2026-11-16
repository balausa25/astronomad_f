/* missions.js — live search + status filter for the Missions page */
document.addEventListener('DOMContentLoaded', function () {
  initFilterable({
    items: '.js-item', input: 'missionSearch', chips: '.chip', count: 'missionCount',
    empty: 'missionEmpty', clear: 'missionClear', key: 'astronomad-mission-search'
  });
});
