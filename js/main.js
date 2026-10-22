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

  /* ---------- Main : WANTS CONTENT 블로그 최신 글 ---------- */
  // data/blog.json (GitHub Actions 가 매일 네이버 블로그 RSS 로 갱신) 의 글로 기존 목록 3칸의 내용만 교체
  // (스크롤 등장 연출이 기존 li 에 연결되어 있어 요소는 새로 만들지 않음) / 불러오지 못하면 HTML 의 기본 글 유지
  var blogLinks = document.querySelectorAll('.blog-list a');
  if (blogLinks.length && window.fetch) {
    fetch('data/blog.json', { cache: 'no-cache' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        var items = data && Array.isArray(data.items) ? data.items : [];
        items.slice(0, blogLinks.length).forEach(function (item, i) {
          if (!item || !item.title || !/^https:\/\/blog\.naver\.com\//.test(item.link || '')) return;
          var a = blogLinks[i];
          a.href = item.link;
          a.querySelector('p').textContent = item.title;
          a.querySelector('.tag').textContent = item.category || 'BLOG';
        });
      })
      .catch(function () {});
  }

  /* ---------- 공통 : SCROLL 안내 링크 (.ab-scroll.is-link · 메인 히어로) ---------- */
  // 스크롤을 시작하면 사라지고(맨 위로 돌아오면 다시 표시), 누르면 href 의 섹션으로 부드럽게 이동
  // (about · services 의 SCROLL 안내는 각 페이지 스크롤 연출(js/about.js · js/services.js)에서 사라짐 처리)
  // 화면 높이가 낮아 섹션 문구·버튼과 겹치면 숨김 (기존 히어로 배치는 그대로 두기 위해)
  document.querySelectorAll('.ab-scroll.is-link').forEach(function (hint) {
    var target = document.querySelector(hint.getAttribute('href'));
    var inner = hint.parentElement.querySelector('.inner');
    var update = function () { hint.classList.toggle('is-hidden', window.pageYOffset > 10); };
    var checkOverlap = function () {
      if (!inner) return;
      hint.classList.remove('is-cramped');
      var GAP = 16; // 문구·버튼 맨 아래와 최소 간격
      var contentBottom = 0;
      Array.prototype.forEach.call(inner.children, function (el) {
        var r = el.getBoundingClientRect();
        if (r.height) contentBottom = Math.max(contentBottom, r.bottom);
      });
      hint.classList.toggle('is-cramped', hint.getBoundingClientRect().top < contentBottom + GAP);
    };
    var overlapTimer;
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () {
      clearTimeout(overlapTimer);
      overlapTimer = setTimeout(checkOverlap, 150);
    });
    window.addEventListener('load', checkOverlap);
    setTimeout(checkOverlap, 1500); // 히어로 문구 등장 애니메이션이 끝난 위치 기준으로 다시 확인
    update();
    checkOverlap();
    hint.addEventListener('click', function (e) {
      if (!target) return;
      e.preventDefault();
      if (window.lenis) window.lenis.scrollTo(target);
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Main : Portfolio 상세 모달 ---------- */
  // 섹션 4 각 줄(카테고리)을 클릭하면 같은 줄의 <script class="pf-works"> 데이터로 공용 모달(#pfModal)에 작업을 표시
  // - 왼쪽 : 작업의 메인 페이지 캡처 1장 (web) 또는 영상 1개 (video)
  // - 오른쪽 : 업체 · 제목 · 프로젝트 형식 · 설명 · 사이트 바로가기
  // - 하단 넘김 버튼 · 좌우 방향키로 같은 카테고리 안의 작업 이동 (모달은 그대로, 내용만 교체)
  var pfModal = document.getElementById('pfModal');
  var pfRows = Array.prototype.slice.call(document.querySelectorAll('.pf-list .pf-row'));
  if (pfModal && pfRows.length) {
    var pfBox = pfModal.querySelector('.pf-modal-box');
    var pfMedia = pfModal.querySelector('.pf-modal-media');
    var pfNum = pfModal.querySelector('.pf-modal-num');
    var pfTitle = pfModal.querySelector('.pf-modal-title');
    var pfBody = pfModal.querySelector('.pf-modal-body');
    var pfClose = pfModal.querySelector('.pf-modal-close');
    var pfPager = pfModal.querySelector('.pf-modal-pager');
    var pfPagerCur = pfModal.querySelector('.pf-pager-cur');
    var pfPagerTotal = pfModal.querySelector('.pf-pager-total');
    var pfWorkBtns = pfModal.querySelectorAll('[data-pf-work]');
    pfBox.setAttribute('tabindex', '-1'); // 포커스를 모달 안에 둘 때 사용 (영상 재생 버튼을 마우스로 누른 뒤 등)
    var pfCat = -1;      // 열린 카테고리 (목록 줄 번호)
    var pfData = null;   // { type, works }
    var pfWork = 0;      // 카테고리 안 현재 작업 번호
    var pfScrollY = 0;
    var pfSwapping = false;
    var pfSwapTimer;
    var pfMediaState = null; // 현재 이미지 영역의 스크롤·안내 상태 (buildPfWeb)

    // 카테고리 데이터 읽기 : 비었거나 형식이 틀려도 기본값(web, 빈 작업 1개)으로 표시
    var getPfData = function (row) {
      var data = {};
      var json = row.parentElement.querySelector('script.pf-works');
      if (json) {
        try { data = JSON.parse(json.textContent) || {}; } catch (err) { data = {}; }
      }
      return {
        type: data.type === 'video' ? 'video' : 'web',
        linkLabel: data.linkLabel || '사이트 바로가기', // 카테고리별 링크 버튼 문구 (예 : 블로그 바로가기)
        works: Array.isArray(data.works) && data.works.length ? data.works : [{}]
      };
    };

    // 브라우저 바에 표시할 주소 : 도메인 + 경로 (https://www.abc.co.kr/ → abc.co.kr, https://blog.naver.com/abc → blog.naver.com/abc)
    var pfDomain = function (url) {
      try {
        var u = new URL(url, location.href);
        return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '');
      } catch (err) { return url; }
    };

    var makePfPlaceholder = function (text) {
      var ph = document.createElement('div');
      ph.className = 'pf-media-ph';
      ph.textContent = text;
      return ph;
    };

    // 재생 중인 영상 정지 (닫기 · 작업 이동 시)
    var stopPfMedia = function () {
      pfMedia.querySelectorAll('video').forEach(function (v) { v.pause(); });
      pfMedia.querySelectorAll('iframe').forEach(function (f) { f.src = 'about:blank'; });
    };

    // 유튜브 주소에서 영상 ID 추출 (youtu.be/ID · watch?v=ID · embed/ID · shorts/ID · live/ID)
    var pfYoutubeId = function (url) {
      var m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
      return m ? m[1] : '';
    };

    // 영상 작업 : 유튜브 주소 → youtube-nocookie iframe / 그 외(mp4 등) → video 태그
    // 자동재생 없음 : poster 가 있으면 썸네일 + 재생 버튼 → 누르면 재생 / video 가 비어 있으면 '영상 준비 중'
    var buildPfVideo = function (work, title) {
      var wrap = document.createElement('div');
      wrap.className = 'pf-media-video';
      var src = typeof work.video === 'string' ? work.video.trim() : '';
      var ytId = src ? pfYoutubeId(src) : '';
      var showPh = function () {
        wrap.innerHTML = '';
        wrap.appendChild(makePfPlaceholder('영상 준비 중'));
      };
      var makePlayer = function (autoplay) {
        var el;
        if (ytId) {
          el = document.createElement('iframe');
          el.src = 'https://www.youtube-nocookie.com/embed/' + ytId + '?rel=0&playsinline=1' + (autoplay ? '&autoplay=1' : '');
          el.title = title;
          el.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          el.allowFullscreen = true;
        } else {
          el = document.createElement('video');
          el.controls = true;
          el.playsInline = true;
          el.preload = 'none'; // 재생 전에는 영상을 미리 받지 않음
          if (work.poster) el.poster = work.poster;
          el.addEventListener('error', showPh); // 경로가 잘못되면 플레이스홀더
          el.src = src;
        }
        return el;
      };

      if (!work.poster) { // 썸네일이 없으면 플레이어를 바로 (영상도 없으면 플레이스홀더)
        if (src) wrap.appendChild(makePlayer(false));
        else showPh();
        return wrap;
      }
      var poster = document.createElement('img');
      poster.className = 'pf-video-poster';
      poster.alt = '';
      poster.addEventListener('error', function () { // 썸네일 경로가 잘못되면 영상 없을 때 플레이스홀더
        if (src) poster.remove();
        else showPh();
      });
      poster.src = work.poster;
      wrap.appendChild(poster);
      if (!src) {
        var msg = document.createElement('p');
        msg.className = 'pf-video-msg';
        msg.textContent = '영상 준비 중';
        wrap.appendChild(msg);
        return wrap;
      }
      var play = document.createElement('button');
      play.type = 'button';
      play.className = 'pf-video-play';
      play.setAttribute('aria-label', title + ' 재생');
      play.innerHTML = '<i aria-hidden="true"></i>';
      play.addEventListener('click', function (e) {
        var player = makePlayer(true);
        wrap.innerHTML = '';
        wrap.appendChild(player);
        if (player.tagName === 'VIDEO') {
          var p = player.play();
          if (p && p.catch) p.catch(function () {});
        }
        // 키보드(Enter·Space)로 재생했을 때만 영상으로 포커스 (마우스로 재생하면 좌우 방향키 = 작업 넘김 유지)
        if (e.detail === 0) player.focus();
        else pfBox.focus({ preventScroll: true });
      });
      wrap.appendChild(play);
      return wrap;
    };

    // 웹 작업 : 브라우저 바 + 메인 페이지 캡처 1장 + 하단 스크롤 안내
    var buildPfWeb = function (work, title) {
      var state = { userScrolled: false, nudging: false, nudgeRaf: 0, nudgeTimer: 0, ro: null };
      var scroller = document.createElement('div');
      scroller.className = 'pf-media-scroll';
      scroller.tabIndex = 0; // 키보드 방향키로 스크롤
      scroller.setAttribute('aria-label', '작업 이미지');

      var head = document.createElement('div');
      head.className = 'pf-media-head';
      var bar = document.createElement('div');
      bar.className = 'pf-browser-bar';
      bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<span class="pf-browser-dots"><i></i><i></i><i></i></span>';
      if (work.barLabel || work.url) {
        var domain = document.createElement('span');
        domain.className = 'pf-browser-url';
        domain.textContent = work.barLabel || pfDomain(work.url); // 단축 링크 등은 barLabel 문구로 대신 표시
        bar.appendChild(domain);
      }
      head.appendChild(bar);
      scroller.appendChild(head);

      var fig = document.createElement('figure');
      fig.className = 'pf-media-item';
      var img = null;
      var showPh = function () { // 경로가 없거나 잘못되면 깨진 아이콘 대신 안내 문구
        fig.classList.remove('is-loaded');
        fig.classList.add('is-error');
        fig.innerHTML = '';
        fig.appendChild(makePfPlaceholder('이미지 준비 중'));
      };
      if (work.image) {
        img = document.createElement('img');
        img.alt = (title ? title + ' ' : '') + '메인 페이지';
        img.decoding = 'async';
        img.addEventListener('load', function () {
          fig.classList.add('is-loaded');
          update();
        });
        img.addEventListener('error', showPh);
        img.src = work.image;
        fig.appendChild(img);
      } else {
        showPh();
      }
      scroller.appendChild(fig);

      var hint = document.createElement('div');
      hint.className = 'pf-scroll-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.innerHTML = '<span>SCROLL</span><i></i>';

      // 이미지 크기 : 영역 안에 다 맞췄을 때 폭이 60% 이상 남으면(블로그·플레이스 등) 여백 32px 안에서 비율 유지 최대 크기로 가운데 (원본보다 커질 수 있음)
      //             그보다 좁아지는 긴 이미지(홈페이지 전체 캡처)는 가로 100% + 위에서부터 세로 스크롤
      var FIT_GAP = 32;
      var layoutImg = function () {
        if (!img || !fig.classList.contains('is-loaded') || !img.naturalWidth) return;
        var maxH = parseFloat(getComputedStyle(scroller).maxHeight); // 모바일·태블릿은 60vh 제한 기준
        var w = scroller.offsetWidth - FIT_GAP * 2;
        var h = (isNaN(maxH) ? scroller.clientHeight : maxH) - head.offsetHeight - FIT_GAP * 2;
        var scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        var fit = img.naturalWidth * scale >= w * 0.6;
        fig.classList.toggle('is-fit', fit);
        img.style.width = fit ? Math.floor(img.naturalWidth * scale) + 'px' : '';
        img.style.height = fit ? Math.floor(img.naturalHeight * scale) + 'px' : '';
      };

      var canScroll = function () { return scroller.scrollHeight - scroller.clientHeight > 8; };
      // 이미지 크기 맞춤 + 스크롤 안내 표시 (스크롤이 필요 없거나 이미 스크롤했으면 숨김)
      var update = function () {
        layoutImg();
        hint.classList.toggle('is-show', !state.userScrolled && canScroll());
      };

      // 힌트 애니메이션 : 열리고 .6초 뒤 80px 내렸다가 올림 (한 번만)
      var cancelNudge = function () {
        clearTimeout(state.nudgeTimer);
        if (state.nudging) {
          cancelAnimationFrame(state.nudgeRaf);
          state.nudging = false;
        }
      };
      state.nudge = function () {
        if (reduceMotion) return;
        state.nudgeTimer = setTimeout(function () {
          if (state.userScrolled || !canScroll()) return;
          var DOWN = 450, UP = 550, DIST = 80;
          var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
          var start = performance.now();
          var step = function (now) {
            var t = now - start;
            if (t >= DOWN + UP) {
              scroller.scrollTop = 0;
              state.nudging = false;
              return;
            }
            scroller.scrollTop = t < DOWN ? DIST * ease(t / DOWN) : DIST * (1 - ease((t - DOWN) / UP));
            state.nudgeRaf = requestAnimationFrame(step);
          };
          state.nudging = true;
          state.nudgeRaf = requestAnimationFrame(step);
        }, 600);
      };
      ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (type) {
        scroller.addEventListener(type, cancelNudge, { passive: true }); // 사용자가 먼저 움직이면 힌트 중단
      });

      scroller.addEventListener('scroll', function () {
        if (state.nudging) return;
        if (!state.userScrolled && scroller.scrollTop > 4) state.userScrolled = true;
        update();
      }, { passive: true });

      // 이미지가 로드되며 높이가 바뀌면 다시 확인
      if ('ResizeObserver' in window) {
        state.ro = new ResizeObserver(update);
        state.ro.observe(fig);
        state.ro.observe(scroller);
      } else {
        fig.addEventListener('load', update, true);
        fig.addEventListener('error', update, true);
      }

      state.scroller = scroller;
      state.cancelNudge = cancelNudge;
      state.destroy = function () {
        cancelNudge();
        if (state.ro) state.ro.disconnect();
      };
      pfMedia.appendChild(scroller);
      pfMedia.appendChild(hint);
      update();
      return state;
    };

    var renderPfMedia = function (work, title) {
      if (pfMediaState) pfMediaState.destroy();
      pfMediaState = null;
      stopPfMedia();
      pfMedia.innerHTML = '';
      pfMedia.classList.toggle('is-video', pfData.type === 'video');
      if (pfData.type === 'video') pfMedia.appendChild(buildPfVideo(work, title));
      else pfMediaState = buildPfWeb(work, title);
    };

    // 오른쪽 정보 : 업체 · 프로젝트 형식 · 설명 · 사이트 바로가기 (url 이 없으면 버튼 숨김)
    var renderPfInfo = function (work) {
      pfBody.innerHTML = '';
      var dl = document.createElement('dl');
      dl.className = 'pf-detail-info';
      var addRow = function (label, dd) {
        var dt = document.createElement('dt');
        dt.textContent = label;
        dl.appendChild(dt);
        dl.appendChild(dd);
      };
      if (work.client) {
        var client = document.createElement('dd');
        client.textContent = work.client;
        addRow('CLIENT', client);
      }
      var tags = Array.isArray(work.tags) ? work.tags : [];
      if (tags.length) {
        var tagDd = document.createElement('dd');
        var ul = document.createElement('ul');
        ul.className = 'pf-type';
        tags.forEach(function (tag) {
          var li = document.createElement('li');
          li.textContent = tag;
          ul.appendChild(li);
        });
        tagDd.appendChild(ul);
        addRow('PROJECT', tagDd);
      }
      if (dl.children.length) pfBody.appendChild(dl);
      if (work.description) {
        var desc = document.createElement('p');
        desc.className = 'pf-detail-desc';
        desc.textContent = work.description;
        pfBody.appendChild(desc);
      }
      if (work.url && pfData.type !== 'video') { // 영상 카테고리는 바로가기 버튼 없음
        var link = document.createElement('a');
        link.className = 'pf-detail-link btn-line dark';
        link.href = work.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = pfData.linkLabel + ' ';
        link.insertAdjacentHTML('beforeend', '<i class="arr"></i>');
        pfBody.appendChild(link);
      }
    };

    // 현재 카테고리의 n 번째 작업으로 모달 채우기
    var renderPfWork = function (index) {
      var works = pfData.works;
      var work = works[index] || {};
      var title = work.title || pfRows[pfCat].querySelector('.pf-name').textContent;
      pfWork = index;
      pfTitle.textContent = title; // 제목 = 작업 제목 (번호는 카테고리 번호 유지)
      renderPfInfo(work);
      renderPfMedia(work, title);
      // 넘김 : 작업이 1개면 숨김 · 처음 / 마지막에서는 비활성 (순환 없음)
      pfPager.hidden = works.length < 2;
      pfPagerCur.textContent = index + 1;
      pfPagerTotal.textContent = works.length;
      pfWorkBtns.forEach(function (btn) {
        btn.disabled = !works[index + Number(btn.dataset.pfWork)];
      });
      pfBox.scrollTop = 0;
    };

    function openPfModal(catIndex) {
      var row = pfRows[catIndex];
      var num = row.querySelector('.pf-num');
      pfCat = catIndex;
      pfData = getPfData(row);
      pfNum.textContent = num ? num.textContent : '';
      renderPfWork(0);
      pfScrollY = window.pageYOffset;
      pfModal.classList.add('is-open');
      pfModal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('pf-modal-open');
      document.body.style.overflow = 'hidden';
      if (window.lenis) window.lenis.stop();
      pfClose.focus();
      if (pfMediaState) pfMediaState.nudge(); // 스크롤 힌트는 처음 열 때만
    }
    function closePfModal() {
      if (!pfModal.classList.contains('is-open')) return;
      clearTimeout(pfSwapTimer);
      pfSwapping = false;
      pfBox.classList.remove('is-swapping');
      if (pfMediaState) pfMediaState.cancelNudge();
      stopPfMedia();
      pfModal.classList.remove('is-open');
      pfModal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('pf-modal-open');
      document.body.style.overflow = '';
      if (window.lenis) window.lenis.start();
      // 열기 전 스크롤 위치로 복원
      if (Math.abs(window.pageYOffset - pfScrollY) > 1) {
        if (window.lenis) window.lenis.scrollTo(pfScrollY, { immediate: true });
        else window.scrollTo(0, pfScrollY);
      }
      if (pfRows[pfCat]) pfRows[pfCat].focus({ preventScroll: true }); // 닫은 뒤 클릭했던 줄로 포커스 복귀
    }
    // 작업 넘김 : 페이드 아웃(.2s) → 이미지·정보 교체 → 페이드 인
    function goPfWork(dir) {
      var next = pfWork + dir;
      if (pfSwapping || !pfData || !pfData.works[next] || !pfModal.classList.contains('is-open')) return;
      var focusInMedia = pfMedia.contains(document.activeElement);
      pfSwapping = true;
      if (pfMediaState) pfMediaState.cancelNudge();
      stopPfMedia();
      pfBox.classList.add('is-swapping');
      pfSwapTimer = setTimeout(function () {
        renderPfWork(next);
        pfBox.classList.remove('is-swapping');
        pfSwapping = false;
        // 포커스 유지 : 이미지 영역이었으면 새 이미지 영역, 누른 버튼이 비활성되면 반대쪽 버튼
        var active = document.activeElement;
        if (focusInMedia && pfMediaState) pfMediaState.scroller.focus({ preventScroll: true });
        else if (!pfBox.contains(active) || active.disabled) {
          var other = pfModal.querySelector('[data-pf-work]:not(:disabled)');
          (other || pfClose).focus({ preventScroll: true });
        }
      }, reduceMotion ? 0 : 200);
    }

    pfRows.forEach(function (row, i) {
      row.addEventListener('click', function () { openPfModal(i); });
    });
    pfModal.querySelectorAll('[data-pf-close]').forEach(function (el) {
      el.addEventListener('click', closePfModal);
    });
    pfWorkBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { goPfWork(Number(btn.dataset.pfWork)); });
    });
    // ESC 로 닫기 · 좌우 방향키로 작업 넘김 · Tab 이동을 모달 안에서만 순환
    document.addEventListener('keydown', function (e) {
      if (!pfModal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closePfModal(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.altKey || e.ctrlKey || e.metaKey || document.activeElement.tagName === 'VIDEO') return; // 영상 탐색 키는 그대로
        e.preventDefault();
        goPfWork(e.key === 'ArrowLeft' ? -1 : 1);
        return;
      }
      if (e.key !== 'Tab') return;
      var focusables = Array.prototype.filter.call(
        pfBox.querySelectorAll('a[href], button, iframe, video[controls], [tabindex="0"]'),
        function (el) { return !el.disabled && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'; }
      );
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
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
