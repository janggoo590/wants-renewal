/* =========================================================
   WANTS Renewal - Common Script
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Header : 스크롤 시 배경 ---------- */
  var header = document.getElementById('header');
  var btnTop = document.querySelector('.btn-top');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 50);
    if (btnTop) btnTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (btnTop) {
    btnTop.addEventListener('click', function () {
      if (window.lenis) window.lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Mobile Menu ---------- */
  var btnMenu = document.querySelector('.btn-menu');
  var gnb = document.getElementById('gnb');

  if (btnMenu && gnb) {
    btnMenu.addEventListener('click', function () {
      var isOpen = gnb.classList.toggle('open');
      btnMenu.classList.toggle('active', isOpen);
      btnMenu.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (window.lenis) isOpen ? window.lenis.stop() : window.lenis.start();
    });
    gnb.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        gnb.classList.remove('open');
        btnMenu.classList.remove('active');
        btnMenu.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
        if (window.lenis) window.lenis.start();
      });
    });
  }

  /* ---------- 배경 이미지 확인 : img 폴더에 이미지가 있으면 임시 도형 숨김 ---------- */
  document.querySelectorAll('.js-bg').forEach(function (sec) {
    var match = getComputedStyle(sec).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return;
    var img = new Image();
    img.onload = function () { sec.classList.add('bg-loaded'); };
    img.src = match[1];
  });

  /* ---------- Scroll Reveal ---------- */
  // 첫 화면(섹션 1)은 스크롤과 관계없이 바로 등장
  var heroReveals = document.querySelectorAll('.main-hero .reveal');
  requestAnimationFrame(function () {
    heroReveals.forEach(function (el) { el.classList.add('in'); });
  });

  var reveals = document.querySelectorAll('.reveal:not(.main-hero .reveal)');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Main : Portfolio Slider ---------- */
  var slider = document.querySelector('.pf-slider');
  if (slider) {
    var track = slider.querySelector('.pf-track');
    var items = track.querySelectorAll('.pf-item');
    var prev = slider.querySelector('.prev');
    var next = slider.querySelector('.next');
    var index = 0;

    function maxIndex() {
      var viewport = slider.querySelector('.pf-viewport').offsetWidth;
      var step = items[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 0);
      var visible = Math.floor((viewport + 1) / step);
      return Math.max(0, items.length - visible);
    }
    function move() {
      var step = items[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 0);
      index = Math.min(index, maxIndex());
      track.style.transform = 'translateX(' + (-step * index) + 'px)';
      prev.disabled = index === 0;
      next.disabled = index >= maxIndex();
    }
    prev.addEventListener('click', function () { index = Math.max(0, index - 1); move(); });
    next.addEventListener('click', function () { index = Math.min(maxIndex(), index + 1); move(); });
    window.addEventListener('resize', move);
    move();
  }

  /* ---------- Sub : Portfolio Filter ---------- */
  var filterBtns = document.querySelectorAll('.pf-filter button');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cate = btn.dataset.filter;
      filterBtns.forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('.pf-grid li').forEach(function (li) {
        li.classList.toggle('hide', cate !== 'all' && li.dataset.cate !== cate);
      });
    });
  });

  /* ---------- Sub : FAQ Accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var isOpen = item.classList.toggle('open');
      q.setAttribute('aria-expanded', isOpen);
    });
  });

  /* ---------- Sub : Contact Form (임시) ---------- */
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('문의가 접수되었습니다. (임시 화면 - 실제 전송 기능은 추후 연동 예정)');
      form.reset();
    });
  }
});
