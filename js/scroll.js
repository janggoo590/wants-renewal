/* =========================================================
   WANTS Renewal - Scroll Interaction
   - Lenis : 관성 스무스 스크롤
   - GSAP ScrollTrigger : 섹션 고정(Pin), 스크롤 연동 모션
   - CDN 로드 실패 / 모션 최소화 설정 시 main.js 의 기본 reveal 로 동작
   ========================================================= */
(function () {
  /* ---------- 0. 스크롤 호흡 설정 (전 페이지 공통 · FAQ 제외 · about.js / services.js 에서도 사용) ----------
     실제 사용자는 휠을 빠르게 넘기므로, 연출이 순식간에 지나가지 않도록 구간을 늘리고 스크럽에 지연을 둠
     - len   : 고정(Pin)·머무름 구간 길이 배율 (1 = 기존 길이)
     - scrub : 스크롤 연동 지연(초) · 휠을 빠르게 내려도 애니메이션이 관성 있게 천천히 따라옴 (0 = 기존 값 유지) */
  var isFaq = !!document.querySelector('.faq-list');
  var TUNE = window.SCROLL_TUNE = isFaq ? { len: 1, scrub: 0 } : { len: 1.6, scrub: 1.5 };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-on');

  /* ---------- 1. Smooth Scroll (Lenis) ---------- */
  if (window.Lenis) {
    var lenis = new Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- 2. Scroll Progress Bar ---------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  gsap.to(progress, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ---------- 3. 섹션 타이틀 : 줄 단위 마스크 리빌 ---------- */
  document.querySelectorAll('.sec-title').forEach(function (title) {
    if (title.closest('.main-about')) return; // 섹션 2 는 타이핑 효과 (아래 3-1)
    title.classList.remove('reveal', 'd1', 'd2', 'd3');
    title.innerHTML = title.innerHTML
      .split(/<br\s*\/?>/i)
      .map(function (line) { return '<span class="line"><span class="line-inner">' + line.trim() + '</span></span>'; })
      .join('');
    gsap.from(title.querySelectorAll('.line-inner'), {
      yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12,
      scrollTrigger: { trigger: title, start: 'top 85%' }
    });
  });

  /* ---------- 3-1. 섹션 2 타이틀 : 타이핑 효과 ---------- */
  var typeTitle = document.querySelector('.main-about .sec-title');
  if (typeTitle) {
    typeTitle.classList.remove('reveal', 'd1', 'd2', 'd3');
    typeTitle.setAttribute('aria-label', typeTitle.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());

    // 글자 단위로 감싸기 (색상 span, 줄바꿈 br 유지)
    var chars = [];
    var afterBreak = false;
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(child.textContent).forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'char';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch;
            if (afterBreak) { s.dataset.pause = '1'; afterBreak = false; }
            frag.appendChild(s);
            chars.push(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeName === 'BR') {
          afterBreak = true;
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(typeTitle);

    var caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    chars[0].parentNode.insertBefore(caret, chars[0]);

    var typeNext = function (i) {
      if (i >= chars.length) {
        setTimeout(function () { caret.classList.add('done'); }, 2000); // 완료 후 2초 깜빡이다 사라짐
        return;
      }
      var c = chars[i];
      var delay = c.textContent === ' ' ? 25 : 40 + Math.random() * 30;
      if (c.dataset.pause) delay += 150; // 줄바꿈에서 잠깐 멈춤
      setTimeout(function () {
        c.classList.add('on');
        c.parentNode.insertBefore(caret, c.nextSibling);
        typeNext(i + 1);
      }, delay);
    };

    ScrollTrigger.create({
      trigger: typeTitle, start: 'top 80%', once: true,
      onEnter: function () { typeNext(0); }
    });
  }

  /* ---------- 4. 공통 Fade-up (기존 .reveal 대체) ---------- */
  var revealEls = gsap.utils.toArray('.reveal').filter(function (el) { return !el.closest('.main-hero'); });
  revealEls.forEach(function (el) { el.classList.remove('reveal'); });
  gsap.set(revealEls, { autoAlpha: 0, y: 60 });
  ScrollTrigger.batch(revealEls, {
    start: 'top 88%',
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, overwrite: true });
    }
  });

  /* ---------- 4-1. FAQ 섹션 1 : 타이틀 → 서브 문구 → 설명 순서대로 아래에서 위로 등장 (페이지 진입 시) ---------- */
  var faqIntro = gsap.utils.toArray('.faq-visual .inner > *');
  if (faqIntro.length) {
    gsap.from(faqIntro, { y: 60, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.18, delay: 0.2 });
  }

  var mm = gsap.matchMedia();

  /* ---------- 5. 섹션 1 → 2 → 3 → 4 : 고정(Pin) + 머무름 + 다음 섹션이 위로 덮으며 어두워지는 전환 ---------- */
  // 머무름 구간 : 섹션이 화면에 다 보인 상태로 이 거리만큼 스크롤해도 그대로 유지된 뒤 다음 섹션이 올라옴
  var HOLD_PC = 0.8;          // 화면 높이 대비 (PC)
  var HOLD_MOBILE = 0.5;      // 화면 높이 대비 (모바일)
  var HOLD_SERVICE_PC = 2.1;  // 섹션 3 : 카드 7개를 순차적으로 보여주므로 더 길게
  var stacks = [];

  var stackOver = function (section, opts) {
    opts = opts || {};
    var ratio = opts.holdRatio || function () { return window.innerWidth <= 768 ? HOLD_MOBILE : HOLD_PC; };
    var getHold = function () { return Math.round(window.innerHeight * ratio() * TUNE.len); };
    var next = section.nextElementSibling; // 고정(pin) 전에 다음 섹션 확보
    // 화면보다 긴 섹션은 하단이 화면 하단에 닿을 때 고정 (내용이 잘리지 않도록)
    var anchor = function () { return section.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'; };
    var cover = function () { return Math.min(section.offsetHeight, window.innerHeight); };
    var stack = { next: next, getHold: getHold };
    if (next) next.style.marginTop = getHold() + 'px'; // 다음 섹션을 머무름 거리만큼 아래로 (투명 여백)
    stacks.push(stack);

    // 고정 + 어두워짐을 하나의 타임라인으로 : [머무름 구간] → [다음 섹션이 덮는 구간 : 0 → 0.9 어두워짐 + 텍스트 페이드아웃]
    var hold = getHold(), coverDist = cover();
    var proxy = { p: 0 };
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section, start: anchor,
        end: function () { return '+=' + (getHold() + cover()); },
        pin: true, pinSpacing: false, scrub: TUNE.scrub || 1, invalidateOnRefresh: true
      }
    })
      .to(proxy, { p: 1, ease: 'none', duration: hold, onUpdate: function () { if (opts.onHold) opts.onHold(proxy.p); } })
      .to(section, { '--dim': 0.9, ease: 'power1.in', duration: coverDist }, hold)
      .to(section.querySelector('.inner'), { autoAlpha: 0, ease: 'none', duration: coverDist * 0.6 }, hold);

    // 해제(화면 크기 조건 변경) 시 여백 원복
    return function () {
      if (next) next.style.marginTop = '';
      stacks.splice(stacks.indexOf(stack), 1);
    };
  };
  ['.main-hero', '.main-about', '.faq-visual'].forEach(function (sel) { // .faq-visual : FAQ 섹션 1 → 2 (메인 섹션 2 → 3 과 같은 전환)
    var section = document.querySelector(sel);
    if (section) stackOver(section);
  });

  // 섹션 3 : 머무는 동안 스크롤에 따라 카드 hover 효과를 순서대로 표시
  var serviceSec = document.querySelector('.main-service');
  var serviceLis = gsap.utils.toArray('.service-list li');
  var setActiveCard = function (idx) {
    serviceLis.forEach(function (li, k) { li.classList.toggle('on', k === idx); });
  };
  if (serviceSec && serviceLis.length) {
    mm.add('(min-width: 1025px)', function () {
      var release = stackOver(serviceSec, {
        holdRatio: function () { return HOLD_SERVICE_PC; },
        onHold: function (p) {
          // 머무름 구간을 카드 수만큼 나눠 순차 강조 (시작 직후 1번, 끝에서 7번)
          setActiveCard(p <= 0 ? -1 : Math.min(serviceLis.length - 1, Math.floor(p * serviceLis.length)));
        }
      });
      return function () { release(); setActiveCard(-1); };
    });
    // 모바일/태블릿 : 고정 없이, 카드가 화면 가운데를 지날 때 순서대로 강조
    mm.add('(max-width: 1024px)', function () {
      serviceLis.forEach(function (li, k) {
        ScrollTrigger.create({
          trigger: li, start: 'top 60%', end: 'bottom 40%',
          onToggle: function (self) { if (self.isActive) setActiveCard(k); }
        });
      });
      return function () { setActiveCard(-1); };
    });
  }

  // 화면 크기 변경 시 머무름 거리 재계산 (위치 측정 전에 실행)
  ScrollTrigger.addEventListener('refreshInit', function () {
    stacks.forEach(function (st) { if (st.next) st.next.style.marginTop = st.getHold() + 'px'; });
  });

  /* ---------- 6. 섹션 2 : 임시 비주얼 패럴랙스 ---------- */
  var aboutVisual = document.querySelector('.main-about .about-visual');
  if (aboutVisual) {
    gsap.fromTo(aboutVisual, { y: 120, rotate: -8 }, {
      y: -120, rotate: 8, ease: 'none',
      scrollTrigger: { trigger: '.main-about', start: 'top bottom', end: 'bottom top', scrub: TUNE.scrub || true }
    });
  }

  /* ---------- 7. 섹션 3 : 배경 이미지 제자리 페이드인 + 서비스 카드 순차 등장 ---------- */
  var serviceSection = document.querySelector('.main-service');
  if (serviceSection) {
    gsap.fromTo(serviceSection, { '--bg-op': 0 }, {
      '--bg-op': 1, duration: 1.8, ease: 'power2.inOut',
      scrollTrigger: { trigger: serviceSection, start: 'top 70%', toggleActions: 'play none none reverse' }
    });
  }
  var serviceCards = gsap.utils.toArray('.service-list li');
  if (serviceCards.length) {
    gsap.from(serviceCards, {
      y: 80, scale: 0.92, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.service-list', start: 'top 85%' }
    });
  }
  var serviceVisual = document.querySelector('.main-service .service-visual');
  if (serviceVisual) {
    gsap.fromTo(serviceVisual, { y: 150, scale: 0.85 }, {
      y: -100, scale: 1.05, ease: 'none',
      scrollTrigger: { trigger: '.main-service', start: 'top bottom', end: 'bottom top', scrub: TUNE.scrub || true }
    });
  }

  /* ---------- 8. 섹션 4 : 포트폴리오 고정 + 가로 스크롤 (PC) ---------- */
  var pfSection = document.querySelector('.main-portfolio');
  var pfViewport = document.querySelector('.pf-viewport');
  if (pfSection && pfViewport) {
    mm.add('(min-width: 1025px)', function () {
      pfSection.classList.add('is-scrub');
      var distance = function () { return pfViewport.scrollWidth - pfViewport.clientWidth; };
      // 시작 전 잠깐 머무름(0.2) → 가로 이동(1) → 마지막 카드에서 머무름(0.3)
      var PF_PRE = 0.2, PF_MOVE = 1, PF_POST = 0.3;
      var pfTl = gsap.timeline({
        scrollTrigger: {
          trigger: pfSection, start: 'center center',
          end: function () { return '+=' + Math.round((distance() * 2.5 + window.innerHeight * 0.5) * TUNE.len); },
          pin: true, scrub: TUNE.scrub || 1, invalidateOnRefresh: true
        }
      })
        .to({}, { duration: PF_PRE })
        .to(pfViewport, { scrollLeft: distance, ease: 'none', duration: PF_MOVE })
        .to({}, { duration: PF_POST });
      // 드래그 시 스크롤 위치와 동기화하기 위해 main.js 에 전달 (가로 이동 구간 기준 비율)
      pfViewport._pfScrub = {
        st: pfTl.scrollTrigger, distance: distance,
        ratio: function () {
          var st = pfTl.scrollTrigger;
          return (st.end - st.start) * (PF_MOVE / (PF_PRE + PF_MOVE + PF_POST)) / (distance() || 1);
        }
      };
      return function () { pfSection.classList.remove('is-scrub'); pfViewport.scrollLeft = 0; delete pfViewport._pfScrub; };
    });
  }

  /* ---------- 9. 섹션 5 : 인스타 그리드 / 블로그 카드 ---------- */
  var instaItems = gsap.utils.toArray('.insta-grid li');
  if (instaItems.length) {
    gsap.from(instaItems, {
      scale: 0.8, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: { each: 0.08, from: 'random' },
      scrollTrigger: { trigger: '.insta-grid', start: 'top 85%' }
    });
  }
  var blogItems = gsap.utils.toArray('.blog-list li');
  if (blogItems.length) {
    gsap.from(blogItems, {
      x: 60, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.blog-list', start: 'top 85%' }
    });
  }

  /* ---------- 10. CTA : 화면 가득 펼쳐지는 전환 ---------- */
  gsap.utils.toArray('.main-cta').forEach(function (cta) {
    gsap.fromTo(cta, { clipPath: 'inset(0% 8% 0% 8% round 40px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: cta, start: 'top bottom', end: 'top 30%', scrub: TUNE.scrub || true }
    });
  });

  /* ---------- 11. 서브 비주얼 : 타이틀 패럴랙스 ---------- */
  var subVisual = document.querySelector('.sub-visual:not(.svc-visual)'); // SERVICES 섹션1은 js/services.js 의 스크롤 연출 사용
  if (subVisual) {
    gsap.to(subVisual.children, {
      y: 80, autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: subVisual, start: 'top top', end: 'bottom top', scrub: TUNE.scrub || true }
    });
  }

  /* ---------- 12. 커스텀 커서 (마우스 사용 환경만 · body.default-cursor 페이지는 기본 커서 사용) ---------- */
  if (!document.body.classList.contains('default-cursor')) mm.add('(hover: hover) and (pointer: fine)', function () {
    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
    document.documentElement.classList.add('has-cursor');

    var xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    var yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    var onMove = function (e) { xTo(e.clientX); yTo(e.clientY); cursor.classList.add('show'); };
    var onOver = function (e) { cursor.classList.toggle('hover', !!e.target.closest('a, button, label, input, select, textarea')); };
    var onLeave = function () { cursor.classList.remove('show'); };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);

    return function () {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      cursor.remove();
      document.documentElement.classList.remove('has-cursor');
    };
  });

  /* 이미지 / 웹폰트 로드 후 위치 재계산 */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
