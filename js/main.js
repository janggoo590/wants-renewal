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

  /* ---------- Sub : FAQ Accordion (단일 오픈 : 새 질문을 열면 기존에 열린 답변은 닫힘) ---------- */
  var faqItems = document.querySelectorAll('.faq-item');
  var faqRefreshTimer;
  var setFaqOpen = function (item, isOpen) {
    item.classList.toggle('open', isOpen);
    item.querySelector('.faq-q').setAttribute('aria-expanded', isOpen);
  };
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var willOpen = !item.classList.contains('open');
      faqItems.forEach(function (other) { if (other !== item) setFaqOpen(other, false); });
      setFaqOpen(item, willOpen);
      // 펼침 애니메이션(.45s)이 끝나 목록 높이가 바뀐 뒤 스크롤 연출 위치 재계산
      clearTimeout(faqRefreshTimer);
      faqRefreshTimer = setTimeout(function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 500);
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

    // 신청 버튼 : 필수 입력(회사명/성함 · 연락처)과 개인정보 동의 체크가 모두 채워졌을 때만 활성화
    var submitBtn = form.querySelector('[type="submit"]');
    var requiredFields = form.querySelectorAll('[required]');
    var updateSubmit = function () {
      var ok = Array.prototype.every.call(requiredFields, function (el) {
        return el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
      });
      submitBtn.disabled = !ok;
    };
    form.addEventListener('input', updateSubmit);
    form.addEventListener('change', updateSubmit);
    form.addEventListener('reset', function () { setTimeout(updateSubmit, 0); }); // 초기화 후 다시 비활성화
    updateSubmit();
  }

  /* ---------- Sub : Contact 업종 선택 (기본 select 팝업 대신 페이지 디자인에 맞춘 드롭다운) ----------
     select 는 숨긴 채 값 전송 · 초기화용으로 유지하고, 버튼 + 목록을 만들어 값을 동기화
     마우스 : 클릭 / 키보드 : ↑↓ 이동 · Enter·Space 선택 · Esc·Tab 닫기 */
  document.querySelectorAll('.ct-form select').forEach(function (sel) {
    var wrap = document.createElement('div');
    wrap.className = 'ct-select';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ct-select-btn';
    btn.id = sel.id + 'Btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var list = document.createElement('ul');
    list.className = 'ct-select-list';
    list.id = sel.id + 'List';
    list.setAttribute('role', 'listbox');
    btn.setAttribute('aria-controls', list.id);
    var label = document.querySelector('label[for="' + sel.id + '"]');
    if (label) { label.htmlFor = btn.id; label.id = label.id || sel.id + 'Label'; list.setAttribute('aria-labelledby', label.id); }

    var placeholder = '';
    var items = [];
    Array.prototype.forEach.call(sel.options, function (opt) {
      if (opt.value === '') { placeholder = opt.text; return; } // "선택해주세요" 는 목록에서 제외
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.textContent = opt.text;
      li._opt = opt;
      list.appendChild(li);
      items.push(li);
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);

    var active = -1;
    var setActive = function (i) {
      active = i;
      items.forEach(function (li, n) { li.classList.toggle('is-active', n === i); });
    };
    var sync = function () { // select 값 → 버튼 문구 · 선택 표시
      var cur = sel.options[sel.selectedIndex];
      var empty = !cur || cur.value === '';
      btn.textContent = empty ? placeholder : cur.text;
      btn.classList.toggle('is-empty', empty);
      items.forEach(function (li) { li.setAttribute('aria-selected', li._opt === cur ? 'true' : 'false'); });
    };
    var open = function () {
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      var sIdx = -1;
      items.forEach(function (li, n) { if (li._opt.selected) sIdx = n; });
      setActive(sIdx);
    };
    var close = function () {
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      setActive(-1);
    };
    var choose = function (i) {
      if (!items[i]) return;
      items[i]._opt.selected = true;
      sel.dispatchEvent(new Event('change', { bubbles: true })); // 신청 버튼 활성화 검사 등 기존 change 처리 유지
      sync();
      close();
      btn.focus();
    };

    btn.addEventListener('click', function () { wrap.classList.contains('is-open') ? close() : open(); });
    items.forEach(function (li, n) {
      li.addEventListener('click', function () { choose(n); });
      li.addEventListener('pointermove', function () { if (active !== n) setActive(n); });
    });
    btn.addEventListener('keydown', function (e) {
      var isOpen = wrap.classList.contains('is-open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) { open(); if (active < 0) setActive(0); return; }
        var next = active + (e.key === 'ArrowDown' ? 1 : -1);
        setActive(Math.max(0, Math.min(items.length - 1, next)));
      } else if ((e.key === 'Enter' || e.key === ' ') && isOpen && active > -1) {
        e.preventDefault();
        choose(active);
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        close();
      }
    });
    document.addEventListener('pointerdown', function (e) { if (!wrap.contains(e.target)) close(); });
    sel.addEventListener('change', sync);
    if (sel.form) sel.form.addEventListener('reset', function () { setTimeout(sync, 0); }); // 폼 초기화 후 문구 원복
    sync();
  });

  /* ---------- Sub : Contact 문의 내용 Tip (마우스를 올리면 안내 카드 페이드인 · 치우면 페이드아웃) ----------
     마우스 : hover / 키보드 : 포커스 / 터치 : 탭으로 열고 바깥을 탭하거나 Esc 로 닫기 */
  var tip = document.querySelector('.ct-tip');
  if (tip) {
    var tipBtn = tip.querySelector('.ct-tip-btn');
    var tipCard = tip.querySelector('.ct-tip-card');
    var tipTimer;
    // 카드가 화면 오른쪽 밖으로 나가면 그만큼 왼쪽으로 당김 (좌우 여백 16px)
    var placeTip = function () {
      tipCard.style.setProperty('--tip-shift', '0px');
      var r = tipCard.getBoundingClientRect();
      var over = r.right - (document.documentElement.clientWidth - 16);
      var shift = over > 0 ? -over : 0;
      if (r.left + shift < 16) shift = 16 - r.left;
      tipCard.style.setProperty('--tip-shift', shift + 'px');
    };
    var showTip = function () { clearTimeout(tipTimer); placeTip(); tip.classList.add('is-show'); };
    var hideTip = function (delay) {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { tip.classList.remove('is-show'); }, delay || 0);
    };
    tip.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') showTip(); });
    tip.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hideTip(120); }); // 커서가 문구 → 카드로 옮겨가는 순간 깜빡이지 않도록 약간 지연
    tipBtn.addEventListener('focus', function () { if (tipBtn.matches(':focus-visible')) showTip(); }); // 키보드 이동 시
    tipBtn.addEventListener('blur', function () { if (!tip.matches(':hover')) hideTip(); });
    tipBtn.addEventListener('pointerup', function (e) { // 터치 : 탭할 때마다 열기 / 닫기
      if (e.pointerType === 'touch') tip.classList.contains('is-show') ? hideTip() : showTip();
    });
    document.addEventListener('pointerdown', function (e) { if (!tip.contains(e.target)) hideTip(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
  }
});
