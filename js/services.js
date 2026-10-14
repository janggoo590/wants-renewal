/* =========================================================
   WANTS Renewal - SERVICES 페이지 (services.html 전용)
   - 서비스 탭 : 탭을 누르면 해당 패널만 표시
   - 메인 페이지 서비스 카드(services.html#svc01 ~ #svc07)로 들어오면 해당 탭을 열고 탭 위치로 이동
   - 섹션 1 : 화면을 고정하고 스크롤에 따라 문구가 차례로 등장
   - 섹션 3 : 선택한 탭의 산출물 표시 + 카드가 스크롤에 따라 가로 이동 (점선 스크롤 바 연동)
   - 섹션 4 : 화면 고정 · 배경 → 그래픽 → 타이틀 → 좌측으로 이동하며 STEP 순차 등장
   ========================================================= */

/* ---------- 섹션 1 : 스크롤 연동 순차 등장 ----------
   ① 첫 줄 → ② "브랜드의 지속 가능한 성장" 2배 크기로 등장 → ③ 원래 크기로 축소 후 포인트 색상으로 변경
   → ④ 마지막 줄 → ⑤ 설명 문구(2줄 묶음)
   CDN 로드 실패 / 모션 최소화 설정 시 완성된 레이아웃을 그대로 보여줌 */
(function () {
  var root = document.documentElement;
  var hero = document.querySelector('.svc-visual');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hero || reduceMotion || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove('svc-anim');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var subs = hero.querySelectorAll('h2 .svc-visual-sub');
  var line1 = subs[0], line3 = subs[1];
  var big = hero.querySelector('h2 strong');
  var desc = hero.querySelector('p');
  var hint = hero.querySelector('.ab-scroll');

  // duration 단위 = 화면 높이 (모바일은 조금 짧게)
  var pace = function () { return window.innerWidth <= 768 ? 0.8 : 1; };
  var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.to(hint, { autoAlpha: 0, duration: 0.2, ease: 'none' }, 0)
    .fromTo(line1, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
    // 확대 : 글자 크기 2배 (CSS 변수 --big) → 좁은 화면에서는 2줄로 줄바꿈되고, 첫 줄은 자연스럽게 위로 밀림
    .fromTo(big, { autoAlpha: 0, '--big': 2 }, { autoAlpha: 1, duration: 0.5 }, '+=0.1')
    .to(big, { '--big': 1, duration: 0.6, ease: 'power2.inOut' }, '+=0.3')
    // 축소된 뒤 포인트 색상(--c-blue)으로 바뀜
    .to(big, { color: getComputedStyle(root).getPropertyValue('--c-blue').trim(), duration: 0.4, ease: 'none' })
    .fromTo(line3, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.15')
    .fromTo(desc, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, '+=0.1')
    .to({}, { duration: 0.4 }); // 완성된 상태로 잠시 머문 뒤 다음 섹션으로

  ScrollTrigger.create({
    trigger: hero, start: 'top top',
    end: function () { return '+=' + Math.round(tl.duration() * window.innerHeight * pace()); },
    animation: tl, pin: true, scrub: 1, invalidateOnRefresh: true,
    refreshPriority: 5 // 화면 고정 구간을 먼저 계산해야 아래 요소들(scroll.js 등장 효과 등)의 위치가 맞음
  });
})();

/* ---------- 섹션 2 : 서비스 탭 ---------- */
(function () {
  var tabWrap = document.querySelector('.svc-tabs');
  if (!tabWrap) return;
  var tabs = Array.prototype.slice.call(tabWrap.querySelectorAll('.svc-tab'));
  var panes = Array.prototype.slice.call(document.querySelectorAll('.svc-pane'));
  var delivers = Array.prototype.slice.call(document.querySelectorAll('.svc-deliver[data-pane]')); // 섹션 3 산출물 (탭과 연동)

  /* 탭 버튼 줄 : 섹션 2·3 은 화면 고정(pin) 구간이 있어 sticky 로는 섹션 밖까지 따라갈 수 없으므로
     원래 자리에 같은 높이의 자리표시(holder)를 두고 버튼 줄은 화면 위에 띄움(.is-float)
     → 원래 자리를 따라 움직이다 헤더 아래에 닿으면 머물고, 문의(CTA) 섹션이 올라오면 사라짐 */
  var holder = document.createElement('div');
  holder.className = 'svc-tabs-holder';
  tabWrap.parentNode.insertBefore(holder, tabWrap);
  document.body.appendChild(tabWrap);
  tabWrap.classList.add('is-float');
  var ctaSec = document.querySelector('.svc-cta');
  var headerH = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; };
  var lastTop = null;
  function placeTabs() {
    if (holder.offsetHeight !== tabWrap.offsetHeight) holder.style.height = tabWrap.offsetHeight + 'px';
    var top = Math.round(Math.max(headerH(), holder.getBoundingClientRect().top));
    if (top !== lastTop) { tabWrap.style.top = top + 'px'; lastTop = top; }
    var hide = !!ctaSec && ctaSec.getBoundingClientRect().top < window.innerHeight - 100; // 문의 섹션이 화면에 보이기 시작하면 숨김
    if (hide !== tabWrap.classList.contains('is-hidden')) tabWrap.classList.toggle('is-hidden', hide);
  }
  placeTabs();
  if (window.gsap) gsap.ticker.add(placeTabs); // 매 프레임 (Lenis 부드러운 스크롤·화면 고정 구간과 함께 정확히 맞춤)
  else { window.addEventListener('scroll', placeTabs, { passive: true }); window.addEventListener('resize', placeTabs); }

  // 탭 영역 상단으로 이동 (헤더 높이만큼 여백, Lenis 사용 시 부드럽게)
  function scrollToTabs(immediate) {
    // 섹션이 고정(pin)된 동안은 위치가 화면에 붙어 있으므로, 흐름상 자리를 지키는 pin-spacer 기준으로 계산
    var sec = holder.closest('section');
    if (sec.parentElement.classList.contains('pin-spacer')) sec = sec.parentElement;
    var y = sec.getBoundingClientRect().top + window.scrollY - 20;
    if (window.lenis) window.lenis.scrollTo(y, { immediate: !!immediate });
    else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
  }

  function select(id, opt) {
    opt = opt || {};
    var found = false;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('aria-controls') === id;
      if (on) found = true;
      tab.classList.toggle('on', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (!found) return false;
    panes.forEach(function (pane) {
      var on = pane.id === id;
      pane.classList.toggle('on', on);
      pane.hidden = !on;
    });
    delivers.forEach(function (list) {
      var on = list.getAttribute('data-pane') === id;
      list.classList.toggle('on', on);
      list.hidden = !on;
    });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (window.ScrollTrigger) window.ScrollTrigger.refresh(); // 패널 높이가 바뀌므로 스크롤 연출 위치 재계산
    if (opt.scroll) scrollToTabs(opt.immediate);
    return true;
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      // 패널 내용을 내려 읽던 중이면(패널 시작이 고정 탭 아래로 가려짐) 새 패널의 시작 위치로 이동
      var cur = document.querySelector('.svc-pane.on');
      var readDown = cur && cur.getBoundingClientRect().top < tabWrap.getBoundingClientRect().bottom;
      select(tab.getAttribute('aria-controls'), { scroll: readDown });
      tab.scrollIntoView({ block: 'nearest', inline: 'center' }); // 모바일 : 가로 스크롤 탭에서 선택한 탭이 보이도록
    });
  });

  // 메인 페이지 카드 링크로 들어온 경우 (#svc01 ~ #svc07)
  var hash = location.hash.replace('#', '');
  if (hash && select(hash)) {
    window.addEventListener('load', function () { setTimeout(function () { scrollToTabs(true); }, 50); });
  }
})();

/* ---------- 섹션 3 · 4 : 스크롤 연출 ---------- */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var pace = function () { return window.innerWidth <= 768 ? 0.8 : 1; };

  // 페이지 스크롤 이동 (Lenis 사용 시 Lenis 로)
  var scrollPage = function (y, immediate) {
    if (window.lenis) window.lenis.scrollTo(y, { immediate: !!immediate });
    else window.scrollTo(0, y);
  };

  /* 섹션 2 → 3, 섹션 3 → 4 : 메인 페이지 섹션 1 → 2 와 같은 전환 (js/scroll.js stackOver 와 같은 방식)
     섹션을 고정한 채 머문 뒤, 다음 섹션이 위로 덮어 올라오는 동안 0 → 0.9 어두워지며 내용이 흐려짐 */
  var HOLD_PC = 0.8, HOLD_MOBILE = 0.5; // 머무름 거리 (화면 높이 대비 · 메인과 동일)
  var getHold = function () { return Math.round(window.innerHeight * (window.innerWidth <= 768 ? HOLD_MOBILE : HOLD_PC)); };
  var stacks = [];
  var stackOver = function (section, priority) {
    if (!section) return;
    var next = section.nextElementSibling;
    // 화면보다 긴 섹션은 하단이 화면 하단에 닿을 때 고정 (내용이 잘리지 않도록)
    var anchor = function () { return section.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'; };
    var cover = function () { return Math.min(section.offsetHeight, window.innerHeight); };
    if (next) { next.style.marginTop = getHold() + 'px'; stacks.push(next); } // 다음 섹션을 머무름 거리만큼 아래로 (투명 여백)
    var hold = getHold(), coverDist = cover();
    gsap.timeline({
      scrollTrigger: {
        trigger: section, start: anchor,
        end: function () { return '+=' + (getHold() + cover()); },
        pin: true, pinSpacing: false, scrub: 1, invalidateOnRefresh: true, refreshPriority: priority
      }
    })
      .to({}, { duration: hold })
      .to(section, { '--dim': 0.9, ease: 'power1.in', duration: coverDist }, hold)
      .to(section.children, { autoAlpha: 0, ease: 'none', duration: coverDist * 0.6 }, hold);
  };
  ScrollTrigger.addEventListener('refreshInit', function () {
    stacks.forEach(function (next) { next.style.marginTop = getHold() + 'px'; });
  });
  stackOver(document.querySelector('.svc-tabs-sec'), 4);
  stackOver(document.querySelector('.svc-output'), 2);

  /* 섹션 3 : 산출물 박스 · 메인 페이지 섹션 3 서비스 카드와 같은 효과 (js/scroll.js 5·7 참고)
     ① 등장 : 박스 영역이 화면에 들어오면 아래에서 떠오르며 커지는 순차 등장
     ② 강조 : 스크롤 진행에 맞춰 박스를 하나씩 차례로 강조 (.on = 마우스 올렸을 때 모습)
     선택한 탭의 목록만 보이므로 항상 보이는 설명 문구를 기준으로 트리거하고, 7개 목록을 같은 순서로 함께 진행 */
  var outDesc = document.querySelector('.svc-output-desc');
  var deliverLists = gsap.utils.toArray('.svc-deliver');
  if (outDesc && deliverLists.length) {
    var deliverItems = gsap.utils.toArray('.svc-deliver li');
    gsap.set(deliverItems, { y: 80, scale: 0.92, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: outDesc, start: 'bottom 85%', once: true, refreshPriority: 3,
      onEnter: function () {
        deliverLists.forEach(function (list) {
          gsap.to(list.children, { y: 0, scale: 1, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.08 });
        });
      }
    });

    var setActiveDeliver = function (idx) {
      deliverLists.forEach(function (list) {
        Array.prototype.forEach.call(list.children, function (li, k) { li.classList.toggle('on', k === idx); });
      });
    };
    ScrollTrigger.create({
      trigger: outDesc, start: 'bottom 70%', end: 'bottom top', refreshPriority: 3,
      onUpdate: function (self) {
        var n = deliverLists[0].children.length;
        // 구간을 박스 수만큼 나눠 순차 강조 (시작 직후 1번, 끝에서 마지막 박스)
        setActiveDeliver(self.progress <= 0 ? -1 : Math.min(n - 1, Math.floor(self.progress * n)));
      },
      onLeaveBack: function () { setActiveDeliver(-1); }
    });
  }

  /* 섹션 3 : 카드가 섹션을 지나가는 동안(고정되어 머무는 구간 포함) 왼쪽으로 이동 + 스크롤 바 막대 위치 연동 */
  var gallery = document.querySelector('.svc-gallery');
  if (gallery) {
    var track = gallery.querySelector('.svc-gallery-track');
    var bar = gallery.querySelector('.svc-gallery-bar');
    var thumb = bar && bar.querySelector('.pf-bar-thumb');
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var updateBar = function (p) {
      if (thumb) thumb.style.transform = 'translateX(' + (p * (bar.offsetWidth - thumb.offsetWidth)) + 'px)';
    };
    var galleryST = ScrollTrigger.create({
      trigger: gallery, start: 'top bottom',
      end: function () { return 'bottom bottom-=' + getHold(); }, // 섹션 3 이 고정되어 머무는 구간까지 이동
      animation: gsap.fromTo(track, { x: 0 }, { x: function () { return -distance(); }, ease: 'none' }),
      scrub: 0.6, invalidateOnRefresh: true, refreshPriority: 3,
      onUpdate: function (self) { updateBar(self.progress); },
      onRefresh: function (self) { updateBar(self.progress); }
    });

    // 카드 등장 : 카드 영역이 화면에 들어오면 왼쪽부터 0.15초 간격으로 아래에서 떠오르며 페이드인
    // (가로 이동은 트랙 x, 등장은 카드 y 로 나눠 서로 겹치지 않음 · 위로 되돌아가면 다시 숨김)
    gsap.fromTo(track.children, { y: 60, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: track, start: 'top 85%', toggleActions: 'play none none reverse', refreshPriority: 3 }
    });

    // 막대 클릭·드래그 : 해당 진행률 위치로 페이지 스크롤
    if (bar) {
      var scrubTo = function (e, immediate) {
        var r = bar.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        scrollPage(galleryST.start + ratio * (galleryST.end - galleryST.start), immediate);
      };
      var dragging = false;
      bar.addEventListener('pointerdown', function (e) {
        dragging = true;
        bar.classList.add('is-dragging');
        if (bar.setPointerCapture) bar.setPointerCapture(e.pointerId);
        scrubTo(e);
      });
      bar.addEventListener('pointermove', function (e) { if (dragging) scrubTo(e, true); });
      var stop = function () { dragging = false; bar.classList.remove('is-dragging'); };
      bar.addEventListener('pointerup', stop);
      bar.addEventListener('pointercancel', stop);
    }
  }

  /* 섹션 4 : 진행 과정 (화면 고정)
     ① 배경 등장 (섹션 3 을 덮으며 올라오는 동안) → ② 그래픽 등장 → ③ 타이틀 등장 (그래픽·타이틀은 화면 가운데, 크게)
     → ④ 그래픽·타이틀이 왼쪽(모바일은 위쪽) 제자리로 작아지며 이동 → ⑤ STEP 1~5 순차 등장 */
  var proc = document.querySelector('.svc-process');
  if (proc) {
    var inner = proc.querySelector('.svc-proc-inner');
    var head = proc.querySelector('.svc-proc-head');
    var steps = proc.querySelectorAll('.svc-steps li');
    // 제자리(4-2 레이아웃) 기준으로 화면 가운데까지의 거리 (transform 영향 없는 offset 값 사용)
    var toCenterX = function () { return inner.clientWidth / 2 - (head.offsetLeft + head.offsetWidth / 2); };
    var toCenterY = function () { return inner.clientHeight / 2 - (head.offsetTop + head.offsetHeight / 2); };
    var headScale = function () { return window.innerWidth <= 1024 ? 1.15 : 1.2; };

    // ① 배경 : 섹션 3 을 덮으며 올라오는 동안 등장 (덮는 전환이 보이도록)
    gsap.fromTo(proc.querySelector('.svc-proc-bg'), { autoAlpha: 0, scale: 1.08 }, {
      autoAlpha: 1, scale: 1, ease: 'power1.out',
      scrollTrigger: { trigger: proc, start: 'top bottom', end: 'top top', scrub: 1, invalidateOnRefresh: true, refreshPriority: 1 }
    });

    var procTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    procTl.fromTo(proc.querySelector('.svc-proc-graphic'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.6 }, 0.1)
      .fromTo(proc.querySelectorAll('.svc-proc-title > *'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.15 })
      .to({}, { duration: 0.3 })
      // 시작 위치(화면 가운데 · 크게)는 fromTo 가 처음부터 적용 → 제자리로 이동
      .fromTo(head, { x: toCenterX, y: toCenterY, scale: headScale }, { x: 0, y: 0, scale: 1, duration: 1, ease: 'power2.inOut' })
      .fromTo(steps, { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.3 }, '-=0.3')
      .to({}, { duration: 0.4 }); // 완성된 상태로 잠시 머문 뒤 다음 섹션으로

    ScrollTrigger.create({
      trigger: proc, start: 'top top',
      end: function () { return '+=' + Math.round(procTl.duration() * window.innerHeight * pace()); },
      animation: procTl, pin: true, scrub: 1, invalidateOnRefresh: true, refreshPriority: 1
    });
  }
})();
