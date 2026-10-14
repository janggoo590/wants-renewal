/* =========================================================
   WANTS Renewal - Common Script
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Header : 스크롤 시 배경 ---------- */
  var header = document.getElementById('header');
  var btnTop = document.querySelector('.btn-top');

  /* 헤더 테마 : 헤더 바로 아래 섹션의 배경 밝기를 감지해 밝으면 .is-light (어두운 글자) */
  function isLightBg(el) {
    while (el && el !== document.documentElement) {
      var m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m) {
        var c = m[1].split(',').map(parseFloat);
        var alpha = c.length > 3 ? c[3] : 1;
        if (alpha > 0.5) return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) > 160;
      }
      el = el.parentElement;
    }
    return true; // 배경 지정이 없으면 body(흰색)
  }
  var menuBar = document.querySelector('.menu-bar');
  function updateHeaderTheme() {
    if (!header) return;
    // 서브페이지 메뉴 바가 보이면(PC) 메뉴 바 바로 아래 배경을, 아니면 헤더 가운데 아래 배경을 기준으로 판단
    var x = window.innerWidth / 2, y = header.offsetHeight / 2;
    if (menuBar && getComputedStyle(menuBar).display !== 'contents') {
      var r = menuBar.getBoundingClientRect();
      x = r.right - 40; y = r.top + r.height / 2;
    }
    var els = document.elementsFromPoint(x, y);
    var target = null;
    for (var i = 0; i < els.length; i++) {
      if (!header.contains(els[i])) { target = els[i]; break; }
    }
    header.classList.toggle('is-light', !!target && isLightBg(target));
  }

  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 50);
    if (btnTop) btnTop.classList.toggle('show', y > 600);
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { updateHeaderTheme(); ticking = false; });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
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

  /* ---------- Sub : 메뉴 바 (PC) ---------- */
  // 마우스를 올리면 CSS(:hover)로 펼침. 터치 기기(큰 태블릿 등)는 버튼 클릭으로 열고 닫음
  var menuBarBtn = document.querySelector('.menu-bar-btn');
  if (menuBar && menuBarBtn) {
    var setMenuBar = function (open) {
      menuBar.classList.toggle('open', open);
      menuBarBtn.setAttribute('aria-expanded', open);
      menuBarBtn.setAttribute('aria-label', open ? '메뉴 접기' : '메뉴 펼치기');
    };
    menuBarBtn.addEventListener('click', function () { setMenuBar(!menuBar.classList.contains('open')); });
    menuBar.addEventListener('mouseenter', function () { menuBarBtn.setAttribute('aria-expanded', true); });
    menuBar.addEventListener('mouseleave', function () { setMenuBar(false); });
    document.addEventListener('click', function (e) { if (!menuBar.contains(e.target)) setMenuBar(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuBar.contains(document.activeElement)) { setMenuBar(false); document.activeElement.blur(); } });
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
      updateBar();
    }

    /* 스크롤 바 : PC(스크롤 고정 가로 이동)는 viewport.scrollLeft, 모바일/태블릿은 index 기준으로 위치 표시 */
    var bar = slider.querySelector('.pf-bar');
    var barThumb = bar && bar.querySelector('.pf-bar-thumb');
    function stepSize() { return items[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 0); }
    function barState(offset) {
      var vp = slider.querySelector('.pf-viewport');
      var scrub = vp._pfScrub;
      var max = scrub ? scrub.distance() : stepSize() * maxIndex();
      var pos = offset != null ? offset : (scrub ? vp.scrollLeft : stepSize() * index);
      return { max: max, progress: max > 0 ? Math.min(1, Math.max(0, pos / max)) : 0 };
    }
    function updateBar(offset) {
      if (!bar) return;
      var s = barState(offset);
      var thumbW = barThumb.offsetWidth; // 막대 길이는 CSS 고정 비율 (.pf-bar-thumb width)
      barThumb.style.transform = 'translateX(' + (bar.clientWidth - thumbW) * s.progress + 'px)';
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
        var ratio = drag.scrub.ratio ? drag.scrub.ratio() : (st.end - st.start) / (drag.scrub.distance() || 1);
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
        if (bar) { bar.classList.add('is-dragging'); updateBar(-(base + dx)); }
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
        if (bar) bar.classList.remove('is-dragging');
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

    /* 스크롤 바 연동 : PC 는 스크롤에 따라 viewport.scrollLeft 가 바뀌므로 scroll 이벤트로 갱신 */
    if (bar) {
      viewport.addEventListener('scroll', function () { updateBar(); }, { passive: true });
      window.addEventListener('load', function () { updateBar(); }); // PC 가로 이동 모드(js/scroll.js) 설정 후 막대 폭 재계산

      // 스크롤 바 클릭 / 드래그로 이동 (막대 가운데를 포인터 위치로)
      var barDrag = null;
      var barTo = function (clientX, done) {
        var r = bar.getBoundingClientRect();
        var s = barState();
        var thumbW = barThumb.offsetWidth;
        var p = Math.min(1, Math.max(0, (clientX - r.left - thumbW / 2) / ((r.width - thumbW) || 1)));
        var scrub = viewport._pfScrub;
        if (scrub) {
          // PC : 해당 위치가 되도록 페이지 스크롤을 이동 (고정 구간과 동기화)
          var st = scrub.st;
          var y = window.scrollY + (p * s.max - viewport.scrollLeft) * scrub.ratio();
          y = Math.min(st.end, Math.max(st.start, y));
          if (window.lenis) window.lenis.scrollTo(y, { immediate: !!barDrag && !done });
          else window.scrollTo(0, y);
        } else if (done) {
          index = Math.round(p * maxIndex());
          track.style.transition = '';
          bar.classList.remove('is-dragging');
          move();
        } else {
          track.style.transition = 'none';
          track.style.transform = 'translateX(' + (-p * s.max) + 'px)';
          updateBar(p * s.max);
        }
      };
      bar.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        barDrag = { id: e.pointerId };
        bar.classList.add('is-dragging');
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
      });
      bar.addEventListener('pointermove', function (e) {
        if (barDrag && e.pointerId === barDrag.id) barTo(e.clientX, false);
      });
      var endBar = function (e) {
        if (!barDrag || e.pointerId !== barDrag.id) return;
        barTo(e.clientX, true);
        barDrag = null;
        bar.classList.remove('is-dragging');
      };
      bar.addEventListener('pointerup', endBar);
      bar.addEventListener('pointercancel', endBar);
    }
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

  /* ---------- Sub : FAQ Filter (분류별 질문만 표시) ---------- */
  var faqFilterBtns = document.querySelectorAll('.faq-filter button');
  faqFilterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cate = btn.dataset.filter;
      faqFilterBtns.forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('.faq-list .faq-item').forEach(function (li) {
        li.classList.toggle('hide', cate !== 'all' && li.dataset.cate !== cate);
      });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh(); // 목록 높이가 바뀌므로 스크롤 연출 위치 재계산
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
