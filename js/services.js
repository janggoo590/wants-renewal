/* =========================================================
   WANTS Renewal - SERVICES 페이지 (services.html 전용)
   - 서비스 탭 : 섹션 2·3 은 공통 틀 1개 → 탭을 누르면 SERVICE_DATA 의 문구만 페이드로 교체
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

/* ---------- 서비스별 문구 데이터 ----------
   섹션 2(라벨·타이틀·안내 박스·카드 3개)와 섹션 3(산출물 6개)는 HTML 에 공통 틀 1개만 두고,
   탭을 누르면 이 데이터에서 문구를 찾아 data-svc-field="경로" 자리에 넣음
   (예 : data-svc-field="focus.1.0" → focus[1][0]) · 키(svc01 ~ svc07)는 탭의 data-svc, 주소 해시(#svc01)와 같음
   문구 수정은 여기서, 디자인 수정은 services.html / css 의 공통 틀 하나만 고치면 7개 서비스에 모두 적용됨 */
var SERVICE_DATA = {
    svc01: {
      label: 'AI SEARCH STRATEGY',
      title: '검색부터 AI 답변까지<br>브랜드 정보를 <span class="t-green">하나</span>로 연결',
      summaryTitle: 'SEO가 기반이고 AEO·GEO는 그 위에 확장됩니다.',
      summary: '검색엔진이 사이트를 이해하는 구조, 고객 질문에 바로 답하는 콘텐츠, 생성형 AI가 브랜드와 서비스를 정확히 이해하도록 만드는 정보를 함께 정리합니다.',
      focus: [
        ['검색 기반', '페이지 제목, 설명, 헤딩, 내부 링크, 인덱싱 등 검색 기본 구조를 점검합니다.'],
        ['질문형 콘텐츠', '실제 고객이 묻는 질문을 기준으로 FAQ, 비교형, 정보형 콘텐츠를 설계합니다.'],
        ['브랜드 정보', '회사명, 서비스, 지역, 전문 분야가 홈페이지·블로그·플레이스에서 다르게 보이지 않도록 정리합니다.']
      ],
      deliver: ['SEO/AEO/GEO 진단', '키워드·질문 맵', 'FAQ·콘텐츠 기획', '구조화 데이터', '채널 정보 정합성', '월별 개선 리포트']
    },
    svc02: {
      label: 'WEBSITE',
      title: '보기 좋은 홈페이지보다<br>이해되고 선택되는 홈페이지',
      summaryTitle: '메인은 짧게, 상세는 설득력 있게.',
      summary: '브랜드 메시지와 핵심 서비스는 메인에서 빠르게 이해시키고, 필요한 정보는 상세페이지에서 충분히 설명해 문의로 이어지도록 설계합니다.',
      focus: [
        ['정보 구조', 'ABOUT, SERVICES, PORTFOLIO, FAQ, CONTACT의 역할을 분리해 필요한 정보를 빨리 찾게 합니다.'],
        ['검색 기반', 'SEO 기본 세팅과 AEO·GEO에 필요한 질문형 정보, 구조화 데이터를 함께 고려합니다.'],
        ['전환 동선', '전화, 문의, 상담 등 실제 행동으로 이어지는 CTA를 페이지 흐름에 맞게 배치합니다.']
      ],
      deliver: ['사이트맵', '메인/상세 설계', '카피라이팅', '반응형 디자인', 'SEO 기본 세팅', '문의 전환 동선']
    },
    svc03: {
      label: 'NAVER BLOG',
      title: '키워드만 반복하지 않고<br>고객 질문에 답하는 콘텐츠',
      summaryTitle: '발행 수보다 검색 의도와 정보의 질을 봅니다.',
      summary: '대표 키워드, 지역 키워드, 세부 키워드, 실제 상담 질문을 나눠 콘텐츠를 기획하고 전문성과 신뢰를 쌓는 글을 축적합니다.',
      focus: [
        ['키워드 구조', '대표·지역·세부·질문 키워드를 목적별로 나눠 한쪽에 치우치지 않게 운영합니다.'],
        ['콘텐츠 품질', '같은 말을 반복하기보다 실제 사례, 비교, FAQ, 전문 정보를 다르게 구성합니다.'],
        ['모바일 가독성', '짧은 문단, 명확한 소제목, 핵심 답변 우선 구조로 읽기 쉽게 만듭니다.']
      ],
      deliver: ['월간 콘텐츠 캘린더', '블로그 원고', '대표·상세 이미지', '키워드 맵', 'FAQ형 콘텐츠', '운영 리포트']
    },
    svc04: {
      label: 'LOCAL SEARCH',
      title: '가까운 고객이 찾을 때<br>정확한 정보를 빠르게 보여줍니다.',
      summaryTitle: '플레이스는 지역 검색의 첫인상입니다.',
      summary: '주소와 영업시간만 맞추는 수준을 넘어 서비스, 대표 이미지, 소개, 소식, 예약·전화까지 방문 전 필요한 정보를 정리합니다.',
      focus: [
        ['기본 정보', '상호, 주소, 전화, 영업시간, 서비스 정보를 최신 상태로 맞춥니다.'],
        ['소개·이미지', '처음 보는 고객이 어떤 곳인지 바로 이해하도록 소개글과 대표 이미지를 정리합니다.'],
        ['전환 정보', '전화, 길찾기, 예약처럼 실제 방문과 상담으로 이어지는 요소를 점검합니다.']
      ],
      deliver: ['플레이스 진단', '소개글 개선', '대표 이미지 구성', '소식 콘텐츠', '정보 정합성 점검', '운영 리포트']
    },
    svc05: {
      label: 'SOCIAL CONTENT',
      title: '브랜드의 분위기와 경험을<br>한눈에 보이게 만듭니다.',
      summaryTitle: 'SNS는 ‘우리가 어떤 회사인지’를 빠르게 보여주는 채널입니다.',
      summary: '정보, 사례, 사람, 제품, 분위기를 적절히 섞어 브랜드를 입체적으로 보여주고, 카드뉴스·릴스·숏폼을 목적에 맞게 기획합니다.',
      focus: [
        ['콘텐츠 축', '정보형, 사례형, 브랜드형, 프로모션형 콘텐츠 비율을 정합니다.'],
        ['비주얼 톤', '썸네일과 카드뉴스, 영상의 톤을 맞춰 브랜드가 기억되게 합니다.'],
        ['숏폼', '짧은 시간에 강점이 보이도록 장면, 멘트, 자막을 기획합니다.']
      ],
      deliver: ['SNS 캘린더', '피드 디자인', '카드뉴스', '릴스·숏폼', '캡션·해시태그', '촬영 가이드']
    },
    svc06: {
      label: 'VIDEO CONTENT',
      title: '설명하기 어려운 강점을<br>영상으로 빠르게 이해시킵니다.',
      summaryTitle: '한 번 촬영한 원본을 여러 콘텐츠로 확장합니다.',
      summary: '브랜드 소개, 제품 특장점, 인터뷰, 행사 스케치 등을 목적에 맞게 기획하고 긴 영상에서 상세 영상, 숏폼까지 재가공할 수 있게 설계합니다.',
      focus: [
        ['메시지 우선', '누구에게 무엇을 보여줄지 먼저 정하고 장면과 스토리를 구성합니다.'],
        ['제품·서비스 표현', '글로 설명하기 어려운 특장점을 촬영과 그래픽으로 보여줍니다.'],
        ['멀티 포맷', '메인 홍보영상, 2~3분 영상, 30초 숏폼처럼 채널별로 재가공합니다.']
      ],
      deliver: ['영상 기획안', '스토리보드', '메인 홍보영상', '상세 영상', '숏폼', '썸네일·자막']
    },
    svc07: {
      label: 'PERFORMANCE MARKETING',
      title: '광고비보다 먼저<br>어떤 검색어에서 전환할지 봅니다.',
      summaryTitle: '광고와 콘텐츠를 따로 보지 않습니다.',
      summary: '검색광고에서 실제로 들어오는 검색어와 전환 데이터를 확인하고, 광고문구·랜딩페이지·콘텐츠가 같은 의도에 맞춰지도록 조정합니다.',
      focus: [
        ['키워드 분류', '브랜드, 일반, 지역, 문제형 검색어를 목적별로 나눕니다.'],
        ['랜딩 연결', '검색어와 광고문구, 랜딩페이지의 핵심 메시지를 맞춥니다.'],
        ['데이터 활용', '실제 검색어와 전환 데이터를 블로그·홈페이지 콘텐츠 개선에도 활용합니다.']
      ],
      deliver: ['키워드 구조안', '광고그룹·문구', '랜딩 개선안', '예산 운영안', '전환 리포트', '검색어 기반 콘텐츠 제안']
    }
};

/* ---------- 섹션 2 : 서비스 탭 ---------- */
(function () {
  var tabWrap = document.querySelector('.svc-tabs');
  if (!tabWrap) return;
  var tabs = Array.prototype.slice.call(tabWrap.querySelectorAll('.svc-tab'));
  var pane = document.getElementById('svcPane');
  var deliverList = document.getElementById('svcDeliver'); // 섹션 3 산출물 (탭과 연동)
  var fields = Array.prototype.slice.call(document.querySelectorAll('[data-svc-field]'));
  var current = (tabWrap.querySelector('.svc-tab.on') || tabs[0]).getAttribute('data-svc'); // HTML 기본 내용 = 첫 탭

  /* 탭 버튼 줄 : 섹션 2·3 은 화면 고정(pin) 구간이 있어 sticky 로는 섹션 밖까지 따라갈 수 없으므로
     원래 자리에 같은 높이의 자리표시(holder)를 두고 버튼 줄은 화면 위에 띄움(.is-float)
     → 원래 자리를 따라 움직이다 헤더 아래에 닿으면 머물고, 문의(CTA) 섹션이 올라오면 사라짐 */
  var holder = document.createElement('div');
  holder.className = 'svc-tabs-holder';
  tabWrap.parentNode.insertBefore(holder, tabWrap);
  document.body.appendChild(tabWrap);
  tabWrap.classList.add('is-float');
  var ctaSec = document.querySelector('.svc-cta');
  var tabsSec = holder.closest('section');
  var outSec = document.querySelector('.svc-output');
  var lastBand = '';
  var headerH = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; };
  var lastTop = null;
  function placeTabs() {
    if (holder.offsetHeight !== tabWrap.offsetHeight) holder.style.height = tabWrap.offsetHeight + 'px';
    var top = Math.round(Math.max(headerH(), holder.getBoundingClientRect().top));
    if (top !== lastTop) { tabWrap.style.top = top + 'px'; lastTop = top; }
    var hide = !!ctaSec && ctaSec.getBoundingClientRect().top < window.innerHeight - 100; // 문의 섹션이 화면에 보이기 시작하면 숨김
    if (hide !== tabWrap.classList.contains('is-hidden')) tabWrap.classList.toggle('is-hidden', hide);
    // 섹션 2 를 지나는 동안(헤더 아래 고정 · 섹션 3 이 아직 버튼 줄 아래에 있을 때) 섹션 배경색 띠로 내용이 비치지 않게 함
    var band = top <= headerH() && !!outSec && outSec.getBoundingClientRect().top > top + tabWrap.offsetHeight;
    // 섹션 3 부터(어두운 배경)는 버튼 줄 가운데 높이까지 올라오면 어두운 배경용 버튼으로
    var dark = !!outSec && outSec.getBoundingClientRect().top < top + tabWrap.offsetHeight / 2;
    if (dark !== tabWrap.classList.contains('is-dark')) tabWrap.classList.toggle('is-dark', dark);
    if (band !== tabWrap.classList.contains('is-band')) tabWrap.classList.toggle('is-band', band);
    if (band) { // 섹션 2 가 덮이며 어두워지는 정도(--dim)에 맞춰 띠 색도 함께 어둡게
      var c = Math.round(255 * (1 - (parseFloat(getComputedStyle(tabsSec).getPropertyValue('--dim')) || 0)));
      var col = 'rgb(' + c + ',' + c + ',' + c + ')';
      if (col !== lastBand) { tabWrap.style.setProperty('--band', col); lastBand = col; }
    }
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

  // 공통 틀의 data-svc-field 자리에 해당 서비스 문구 채우기
  function fill(item) {
    fields.forEach(function (el) {
      var value = el.getAttribute('data-svc-field').split('.').reduce(function (v, key) { return v == null ? v : v[key]; }, item);
      if (value != null) el.innerHTML = value; // 타이틀의 <br>·강조 span 포함
    });
  }
  // 문구 교체 : 페이드아웃 → 교체 → 페이드인 (animate:false 면 바로 교체)
  var SWITCH_MS = 280; // css .is-switching 전환 시간과 같게
  var switchTimer = null;
  function render(id, animate) {
    var boxes = [pane, deliverList].filter(Boolean);
    clearTimeout(switchTimer);
    var apply = function () {
      fill(SERVICE_DATA[id]);
      boxes.forEach(function (box) { box.classList.remove('is-switching'); });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh(); // 문구 길이에 따라 높이가 바뀌므로 스크롤 연출 위치 재계산
    };
    if (!animate) { apply(); return; }
    boxes.forEach(function (box) { box.classList.add('is-switching'); });
    switchTimer = setTimeout(apply, SWITCH_MS);
  }

  function select(id, opt) {
    opt = opt || {};
    if (!SERVICE_DATA[id]) return false;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-svc') === id;
      tab.classList.toggle('on', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (id !== current) { render(id, opt.animate !== false); current = id; }
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (opt.scroll) scrollToTabs(opt.immediate);
    return true;
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      // 패널 내용을 내려 읽던 중이면(패널 시작이 고정 탭 아래로 가려짐) 새 패널의 시작 위치로 이동
      var readDown = pane.getBoundingClientRect().top < tabWrap.getBoundingClientRect().bottom;
      select(tab.getAttribute('data-svc'), { scroll: readDown });
      tab.scrollIntoView({ block: 'nearest', inline: 'center' }); // 모바일 : 가로 스크롤 탭에서 선택한 탭이 보이도록
    });
  });

  // 메인 페이지 카드 링크로 들어온 경우 (#svc01 ~ #svc07)
  var hash = location.hash.replace('#', '');
  if (hash && select(hash, { animate: false })) {
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

  /* 섹션 2 : 선택된 서비스 내용 순차 등장 (영역에 들어오면 한 번 재생)
     ① 라벨·타이틀 → ② 안내 박스 (0.32초 간격) → ③ 플러스 기호 → ④ 카드 3개를 0.3초 간격으로 왼쪽부터
     위쪽(타이틀·안내 박스)과 아래쪽(플러스·카드)은 각각 화면에 들어올 때 재생 (긴 영역이 화면 밖에서 미리 끝나지 않도록)
     (공통 틀이라 탭을 바꿔도 같은 요소 · 문구만 바뀜) */
  var activePane = document.getElementById('svcPane');
  if (activePane) {
    var paneTop = gsap.utils.toArray(activePane.querySelectorAll('.svc-headline .sec-label, .svc-headline h3, .svc-summary'));
    var panePlus = activePane.querySelector('.svc-plus');
    var paneCards = gsap.utils.toArray(activePane.querySelectorAll('.svc-focus li'));
    gsap.set(paneTop.concat(paneCards), { y: 50, autoAlpha: 0 }); // 시작 상태
    if (panePlus) gsap.set(panePlus, { scale: 0.4, rotate: -90, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: activePane.querySelector('.svc-headline'), start: 'top 85%', once: true, refreshPriority: 3.5,
      onEnter: function () {
        gsap.to(paneTop, { y: 0, autoAlpha: 1, duration: 1.6, ease: 'power3.out', stagger: 0.32 });
      }
    });
    ScrollTrigger.create({
      trigger: panePlus || paneCards[0], start: 'top 88%', once: true, refreshPriority: 3.5,
      onEnter: function () {
        var tl = gsap.timeline();
        if (panePlus) tl.to(panePlus, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.2, ease: 'back.out(1.4)' });
        tl.to(paneCards, { y: 0, autoAlpha: 1, duration: 1.5, ease: 'power3.out', stagger: 0.3 }, panePlus ? '-=0.4' : 0);
      }
    });
  }

  /* 섹션 3 : 산출물 박스 · 화면 고정(pin) + 스크롤 연동(scrub) 순차 등장
     박스 영역(.svc-output-top)을 타이틀이 탭 버튼 줄 아래에 오도록 고정
     → 타이틀·설명은 화면 가운데에서 시작해, 박스가 왼쪽부터 하나씩 떠오르는 동안 원래 자리로 밀려 올라감
     → 마지막 박스까지 나타난 뒤 잠시 머물고 고정 해제. 방금 다 나타난 박스는 강조(.on = 마우스 올렸을 때 모습)
     (공통 목록 1개 · 탭을 바꾸면 문구만 바뀌고 진행 상태는 그대로) */
  var outTop = document.querySelector('.svc-output-top');
  var deliverList = document.getElementById('svcDeliver');
  if (outTop && deliverList) {
    var outTitle = outTop.querySelector('.svc-output-title');
    var outDesc = outTop.querySelector('.svc-output-desc');
    var deliverItems = gsap.utils.toArray(deliverList.children);
    var deliverCount = deliverItems.length;
    var CARD_START = 0.4, CARD_GAP = 0.6; // 박스 등장 시작 시점 · 박스 간 간격 (박스 하나당 duration 1)
    var setActiveDeliver = function (idx) {
      deliverItems.forEach(function (li, k) { li.classList.toggle('on', k === idx); });
    };
    var pad = function (side) { return parseFloat(getComputedStyle(outTop)['padding' + side]) || 0; };
    var headerH = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; };
    // 고정 시 영역 상단 위치 : 타이틀이 탭 버튼 줄 아래(여백 24px)에 오도록. 화면이 낮아 박스가 잘리면 박스 하단을 화면 하단에 맞춤
    var pinTop = function () {
      var tabsBar = document.querySelector('.svc-tabs');
      var safeTop = headerH() + (tabsBar ? tabsBar.offsetHeight : 0) + 24;
      return Math.round(Math.min(safeTop - pad('Top'), window.innerHeight - 20 - (outTop.offsetHeight - pad('Bottom'))));
    };
    // 타이틀·설명을 화면 가운데로 옮기는 거리 (고정된 상태 기준)
    var toCenter = function () {
      var groupH = outDesc.offsetTop + outDesc.offsetHeight - outTitle.offsetTop;
      return Math.round((window.innerHeight - groupH) / 2 - (pinTop() + outTitle.offsetTop));
    };

    gsap.set(deliverItems, { y: 80, scale: 0.92, autoAlpha: 0 }); // 시작 상태
    var deliverTl = gsap.timeline();
    deliverTl.fromTo([outTitle, outDesc], { y: toCenter }, { y: 0, duration: 1.4, ease: 'power2.inOut' }, 0);
    deliverTl.to(deliverItems, { y: 0, scale: 1, autoAlpha: 1, duration: 1, ease: 'power2.out', stagger: CARD_GAP }, CARD_START);
    deliverTl.to({}, { duration: 0.8 }); // 모두 나타난 상태로 잠시 머문 뒤 고정 해제

    ScrollTrigger.create({
      trigger: outTop,
      start: function () { return 'top ' + pinTop() + 'px'; },
      end: function () { return '+=' + Math.round(window.innerHeight * (window.innerWidth <= 768 ? 1.6 : 2)); }, // 스크롤 거리
      pin: true, scrub: 1, animation: deliverTl, invalidateOnRefresh: true, refreshPriority: 3.5,
      pinReparent: true, // 섹션 3 자체도 이후 덮기 전환으로 고정(transform 적용)되어, 고정 중에는 body 로 옮겨야 화면에 고정됨
      onUpdate: function (self) {
        var t = self.progress * deliverTl.duration() - CARD_START - 1; // 첫 박스가 다 나타난 시점부터
        setActiveDeliver(t < 0 ? -1 : Math.min(deliverCount - 1, Math.floor(t / CARD_GAP)));
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
     ① 배경과 함께 섹션 3 을 덮으며 올라옴 → ② 그래픽 등장 → ③ 타이틀 등장 (그래픽·타이틀은 화면 가운데, 크게)
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

    // ① 배경 : 메인 섹션 1 → 2 처럼 배경이 처음부터 보이는 상태로 섹션 3 위를 덮으며 올라옴 (섹션 3 은 어두워짐 · stackOver)

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
