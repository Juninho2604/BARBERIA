/* ============ Brothers Club — interactions ============ */
(function () {
  'use strict';

  /* ---- service data (from current site) ---- */
  var SERVICES = [
    { name: 'Royal Package', price: '$115', meta: '1 h' },
    { name: 'Haircut', price: '$49', meta: '30 min' },
    { name: 'King Shave', price: '$45', meta: '30 min' },
    { name: 'Balding Head Shave', price: '$50', meta: '30 min' },
    { name: 'Beard Trim', price: '$25', meta: '30 min' },
    { name: 'Black Mask', price: '$20', meta: '5 min' },
    { name: 'Nourishing / Purifying Detox Mask', price: '$20', meta: '15 min' },
    { name: 'Ear Wax', price: '$15', meta: '5 min' },
    { name: 'Nose Wax', price: '$15', meta: '5 min' },
    { name: 'Eyebrow Wax', price: '$15', meta: '5 min' }
  ];

  function renderServices() {
    var list = document.getElementById('svcList');
    if (!list) return;
    SERVICES.forEach(function (s, i) {
      var a = document.createElement('a');
      a.className = 'svc';
      a.href = '#reservar';
      a.setAttribute('data-reveal', '');
      var no = (i + 1) < 10 ? '0' + (i + 1) : '' + (i + 1);
      a.innerHTML =
        '<span class="svc__no">' + no + '</span>' +
        '<span class="svc__name">' + s.name + '</span>' +
        '<span class="svc__meta">' + s.meta + '</span>' +
        '<span class="svc__price">' + s.price + '</span>' +
        '<span class="svc__go">Reservar →</span>';
      list.appendChild(a);
    });
  }

  /* ---- scroll reveal ---- */
  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---- nav scrolled state ---- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- parallax on backgrounds ---- */
  function initParallax() {
    var nodes = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if (!nodes.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      nodes.forEach(function (n) {
        var rect = n.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var speed = parseFloat(n.getAttribute('data-parallax')) || 0.15;
        var center = rect.top + rect.height / 2;
        var offset = (center - vh / 2) * speed * -1;
        var img = n.querySelector('img');
        if (img) img.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function boot() {
    renderServices();
    initNav();
    initParallax();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
