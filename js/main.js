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
    var bg = getComputedStyle(sec).backgroundImage;
    if (bg === 'none') bg = getComputedStyle(sec, '::before').backgroundImage; // 배경을 별도 레이어로 분리한 섹션
    var match = bg.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return;
    var img = new Image();
    img.onload = function () { sec.classList.add('bg-loaded'); };
    img.src = match[1];
  });

  /* ---------- Scroll Reveal ---------- */
  // 첫 화면(섹션 1)은 스크롤과 관계없이 등장 (배경 인트로가 커지는 동안 이어서 등장)
  var heroReveals = document.querySelectorAll('.main-hero .reveal');
  setTimeout(function () {
    heroReveals.forEach(function (el) { el.classList.add('in'); });
  }, 600);

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

  /* ---------- 배경 동영상 : 화면 근처에서만 재생 (데이터·배터리 절약) ---------- */
  var lazyVideos = document.querySelectorAll('.js-lazy-video');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lazyVideos.length && !reduceMotion && 'IntersectionObserver' in window) {
    var videoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          var p = video.play();
          if (p && p.catch) p.catch(function () {}); // 자동재생 차단 시 포스터 이미지 유지
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    lazyVideos.forEach(function (v) { videoIO.observe(v); });
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

    /* 드래그 앤 드롭 / 터치 스와이프로 넘기기 */
    var viewport = slider.querySelector('.pf-viewport');
    var drag = null;
    var dragged = false;

    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); }); // 링크/이미지 기본 드래그 방지

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var step = items[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 0);
      drag = {
        x: e.clientX, id: e.pointerId, step: step,
        scrub: viewport._pfScrub || null,          // PC : 스크롤 고정 가로 이동 모드 (js/scroll.js)
        startScroll: window.scrollY,
        startIndex: index
      };
      dragged = false;
    });

    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!dragged && Math.abs(dx) < 6) return;
      if (!dragged) {
        dragged = true;
        viewport.classList.add('is-dragging');
        try { viewport.setPointerCapture(drag.id); } catch (err) {}
      }

      if (drag.scrub) {
        // 드래그한 만큼 페이지 스크롤 위치를 옮겨 고정 구간과 동기화
        var st = drag.scrub.st;
        var ratio = (st.end - st.start) / (drag.scrub.distance() || 1);
        var y = drag.startScroll - dx * ratio;
        if (drag.startScroll >= st.start && drag.startScroll <= st.end) {
          y = Math.min(st.end, Math.max(st.start, y)); // 고정 구간 안에서만 이동
        }
        if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      } else {
        // 모바일/태블릿 : 카드 트랙을 손가락/마우스를 따라 이동
        var base = -drag.step * drag.startIndex;
        track.style.transition = 'none';
        track.style.transform = 'translateX(' + (base + dx) + 'px)';
      }
    });

    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (dragged && !drag.scrub) {
        var dx = e.type === 'pointercancel' ? 0 : e.clientX - drag.x;
        var moved = Math.round(-dx / drag.step);
        if (moved === 0 && Math.abs(dx) > drag.step * 0.2) moved = dx < 0 ? 1 : -1; // 짧게 밀어도 한 칸 이동
        index = Math.min(maxIndex(), Math.max(0, drag.startIndex + moved));
        track.style.transition = '';
        move();
      }
      viewport.classList.remove('is-dragging');
      drag = null;
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // 드래그 직후에는 카드 링크 클릭 무시
    viewport.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
    }, true);
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
