/* ================================================================
   SPOTLIGHT · 손가락 포인터 — "여기 보세요" 를 상대 화면에 비춘다
   ----------------------------------------------------------------
   레몬보드 위에선 자유롭게 그릴 수 없으니, 튜터(또는 학생)가 무엇을
   가리키는지 상대 화면에 똑같이 켠다. 대칭이다 — 누가 눌러도 상대에게 간다.

   레몬보드의 data-sync 계약을 그대로 탄다. 보드 수정도 배포도 없다:
     · 공유되는 상태는 딱 하나 — "지금 몇 번째 블록이 켜졌나"({ spot }).
       클릭(이벤트)이 아니라 결과 상태라, 늦게 들어오거나 새로고침해도
       스냅샷 하나로 따라온다. 메시지가 유실돼도 다음 탭에서 수렴한다.
     · data-spot 은 로드 때 덱 전체에 순서대로(전역 인덱스) 매긴다. 두 사람의
       DOM 이 똑같으니 "n 번째" 가 양쪽에서 같은 요소다 — page-id 가 없는
       스크롤 덱에서도 그대로 동작한다.
     · 탭-타일·키패드·입력 등 자기 클릭을 이미 쓰는 위젯([data-sync-id],
       버튼, 입력…)은 포인터에서 제외한다. 내용 블록(제목·말풍선·카드·글자
       카드…)만 켠다.

   한 덱에 <script src> 한 줄이면 붙는다. lessonSync 가 없으면(파일 직접 열기)
   스텁으로 대체돼, 덱은 그대로 동작하되 동기화만 안 한다.
   ================================================================ */
(function () {
  "use strict";

  var phone = document.querySelector(".phone");
  if (!phone) return;

  // 보드가 lessonSync 를 주입하지 않았으면(로컬) 스텁으로 대체한다.
  var sync = (window.lessonSync = window.lessonSync || {
    kinds: {},
    register: function (name, handlers) { this.kinds[name] = handlers; return this; },
    push: function () {}
  });

  // 가리킬 수 있는 "내용 블록" — 모든 트라이얼 덱이 공유하는 컴포넌트 어휘.
  // 여기에 없는 클래스는 그 덱에서 그냥 안 잡힌다(무해). 활동(정답을 고르거나
  // 채우는 것)은 일부러 뺀다 — 칩을 집는 손과 가리키는 손이 같으면 안 된다.
  //
  // 이 목록은 덱이 자라면 같이 자라야 한다. 새 컴포넌트를 만들고 여기 안 넣으면
  // 그 블록만 조용히 안 켜진다(고장 신호가 없다). AUTHORING.md 의 컴포넌트를
  // 하나 늘릴 때 이 줄도 같이 늘려라.
  var SPOT = [
    // 페이지의 뼈대 — 제목 · 부제 · 표지 · 장 전환
    ".section-title", ".transition-title", ".transition-copy", ".brand-title",
    ".brand-sub", ".section-subtitle", ".transition-kicker", ".section-kicker",
    ".podo-badge",
    // 말과 예문
    ".bubble", ".card", ".pattern-card", ".note-box", ".hook-quote", ".tip",
    ".row", ".hint-chip", ".nchip", ".known-row", ".model-line", ".lab",
    ".lv-badge", ".cast-row",
    ".sent-hero", ".sent-more > div", ".br-row", ".swap-row", ".pi-card",
    ".bt-box",
    // 활동 카드 자체 — "지금 이 문제요". 안의 알약·조각은 자기 클릭을 그대로
    // 가지고, 카드는 짚을 자리로 남는다.
    ".answer-box", ".choose-row", ".answer-label",
    /* 블록 안의 부품. 한 겹 더 들어가 짚는 자리다 — 카드를 켠 뒤 그 안을 다시
       누르면 여기로 좁혀진다. 짚을 이름이 있는 것만 넣는다(읽기용 요미가나처럼
       따로 짚을 일이 없는 것은 뺀다). */
    ".bt-syl", ".bt-out", ".bt-head", ".bt-ex > span",
    ".br-cn", ".br-ko", ".sw-from", ".sw-to",
    ".combi-nouns > span", ".combi-ends > span", ".choose-sentence",
    ".bubble > .korean", ".bubble > .translation",
    // 뜻과 쓰임 상자의 앵커. 상자 전체는 .section-subtitle 로 이미 짚히지만,
    // 이 컴포넌트가 있는 이유가 "이 일본어를 보세요" 라서 그 두 줄은 따로
    // 짚을 수 있어야 한다. 읽기(.anchor-ko)는 튜터가 소리 내어 줄 때 짚는다.
    ".anchor-ja", ".anchor-ko",
    // 한글 덱의 글자 부품
    // .read-item is the block (card); .read-chip and .mouth are the parts
    // inside it, reached by the second tap.
    ".letter-card", ".pair-side", ".pair-kana", ".read-item", ".read-chip", ".blk",
    ".blk-item", ".part", ".kana", ".syl", ".eq", ".build", ".combo > span",
    ".word-card", ".sign", ".payoff", ".mouth", ".brand-mascot",
    // 마무리 — 오늘의 결과와 닫는 장
    ".combi", ".combi-nouns", ".combi-ends", ".end-head", ".end-card",
    // 풀 트라이얼의 안내·가격·FAQ 페이지. 튜터가 가장 오래 짚어 가며 말하는
    // 곳인데도 여기 하나도 없었다.
    ".sub-h", ".fact", ".stat", ".feat", ".rev", ".rev-h", ".arrowline",
    ".fineprint", ".smallnote", ".sched", ".week", ".tstat > div", ".stg",
    ".deadline", ".plan2", ".pr", ".incl h4", ".il", ".versus > div", ".switchcard",
    ".swcall", ".ptable", ".qa2", ".faq-div", ".faq-end",
    // 리포트에서 학생에게 보여 주는 칸들(튜터만 보는 레벨 체크는 뺀다)
    ".rhead", ".rsec-h", ".lvbig", ".topikrow", ".radbox", ".axbars", ".axs",
    ".axtip", ".freq-h", ".tiles > .tile"
  ].join(",");

  /* 글자를 써 넣는 칸 — 블록과 달리 눌러서 켜는 것이 아니라 "들어가면" 켜진다.
     아래 focusin 이 쓴다. 튜터 메모(.note-input)는 뺀다: 그 모듈이 이 파일보다
     늦게 뜨므로 여기서는 아직 없고, 빈 메모는 상대 화면에서 아예 안 보인다. */
  var FIELD = "input.slot-input,input.space-input,textarea.free-input,textarea.fb-in";

  /* 예습 지문 — 위젯 안에 들어앉은 "내용".

     줄 자체는 자기 클릭(여는 동작)을 가지지만, 그 클릭이 곧 「이 문장이요」다.
     칸이 focusin 으로 켜지는 것과 같은 예외이고 이유도 같다: 여는 손과 짚는
     손을 나눌 수가 없다. 나눠 두면 튜터는 줄을 열고 나서 그 줄을 다시 짚어야
     한다.

     번역과 낱말은 아예 컨트롤이 아니다 — 그냥 글인데, 줄이 sync 옵션이라
     WIDGET 에 통째로 걸려서 함께 예외로 둔다. 이게 있어야 「블록 먼저, 부품
     나중」이 이 장에서도 성립한다: 줄을 한 번 눌러 문장을 켜고, 열린 칸의
     낱말을 다시 눌러 그 낱말 하나로 좁힌다. 없으면 줄 전체 아니면 아무것도,
     둘 중 하나뿐이었다.

     예외를 좁게 두는 것이 요점이다. 알약·칩·키패드처럼 "고르는" 컨트롤은
     그대로 뺀다. 저기서는 누르는 것이 답이지 자리가 아니다. */
  var POINTS = ".sents .sent, .sents .sent .s-ja, .sents .sent .s-w";

  /* 칸이 켜지면 링은 칸이 아니라 칸이 든 블록에 두른다 — 문제 상자 하나, 말풍선
     하나, 피드백 줄 하나.
     칸에 직접 두르지 않는 이유가 둘이다. 칸마다 :focus 에서 outline 을 지우고
     있어서(저마다 자기 포커스 표시를 쓴다) 정작 쓰는 사람 화면에서만 링이
     벗겨졌다. 그리고 60px 짜리 빈칸에 겨우 두른 링은 "이 칸" 을 가리킬 뿐인데,
     블록을 켜면 "지금 이 문제를 푼다" 가 된다 — 상대가 알아야 하는 건 그쪽이다.
     주소는 그대로 칸이다: 칸은 눌러서 켜는 대상이 아니라 클릭 다툼이 없고,
     블록에 번호를 옮기면 조각을 집어 놓는 활동과 부딪힌다. */
  var FIELD_HOST = ".answer-box,.fb-row,.bubble";

  function ringHost(el) {
    return el.matches(FIELD) ? (el.closest(FIELD_HOST) || el) : el;
  }

  /* 자기 클릭을 이미 소유한 것들 — 절대 가로채지 않는다.
     여기 드는 것은 "눌리는 물건" 뿐이다: 고르는 알약, 집어 옮기는 조각, 버튼,
     칸. 활동을 담는 바깥 상자([data-sync-id])는 일부러 뺐다 — 고르기 카드처럼
     상자 전체가 활동의 sync 단위인 경우가 있는데, 그 상자를 눌러도 활동은
     아무 일도 하지 않는다. 상자까지 싸잡아 빼면 "이 문제요" 하고 짚을 자리가
     통째로 사라진다. 상자는 SPOT 에 이름이 있을 때만 짚힌다. */
  var WIDGET =
    "button,a,input,textarea,select,label,[contenteditable]," +
    "[data-sync-option],[data-ok],[data-item-id]";

  // ---- 전역 인덱스 매기기 ----
  // 문서 순서대로 번호를 매긴다. 인터랙티브 안에 든 것은 건너뛴다 — 칸은 빼고.
  // 칸도 같은 번호줄을 쓴다: 켜지는 것은 언제나 하나뿐이라, 블록이든 칸이든
  // 주소가 한 종류여야 상태가 { spot } 하나로 남는다.
  (function stamp() {
    var n = 0;
    var nodes = phone.querySelectorAll(SPOT + "," + FIELD + "," + POINTS);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.matches(FIELD) && !el.matches(POINTS) && el.closest(WIDGET)) continue;
      el.setAttribute("data-spot", String(n++));
    }
  })();

  var current = null; // 지금 켜진 블록의 인덱스(number) | null

  function clearLit() {
    var prev = phone.querySelector(".is-spot");
    if (prev) prev.classList.remove("is-spot", "is-spot-in", "is-spot-field");
  }

  /* 링을 밖이 아니라 안쪽에 그려야 하는 블록인가.
     카드 위쪽에 딱 붙은 머리띠처럼, overflow 를 자르는 상자에 가장자리를 맞대고
     들어앉은 블록이 있다. 거기에 바깥 링을 그리면 세 변이 잘려 나가고 한 줄만
     남아 — 가리키는 표시가 아니라 이상한 빨간 선으로 보인다.
     클래스로 열거하지 않고 재 보는 이유: 덱이 새 컴포넌트를 들일 때마다
     이 목록까지 같이 고쳐야 한다면 언젠가 또 놓친다. */
  function needsInsetRing(el) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;      // 아직 안 보이는 장이면 판단하지 않는다
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      var cs = getComputedStyle(p);
      if (cs.overflow === "visible" && cs.overflowX === "visible" &&
          cs.overflowY === "visible") continue;   // 안 자르는 조상은 그냥 지나간다
      var pr = p.getBoundingClientRect();         // 처음 만난 자르는 상자만 본다
      return r.top - pr.top < 4 || r.left - pr.left < 4 ||
             pr.right - r.right < 4 || pr.bottom - r.bottom < 4;
    }
    return false;
  }

  // 정확히 하나만 켜거나, 아무것도 안 켠다. 멱등: 같은 인자 → 같은 결과.
  function light(spot) {
    clearLit();
    current = null;
    if (spot == null) return;
    var el = phone.querySelector('[data-spot="' + spot + '"]');
    if (!el) return;                       // 이 덱에 없는 인덱스면 조용히 무시
    var host = ringHost(el);               // 칸이면 그 칸이 든 블록에 두른다
    host.classList.add("is-spot");
    if (el !== host) host.classList.add("is-spot-field");
    if (needsInsetRing(host)) host.classList.add("is-spot-in");
    current = spot;
  }

  /* 공유 상태는 블록 인덱스 하나. 페이저와 똑같이 레슨이 자기 kind 를 들고 온다. */
  sync.register("spotlight", {
    read: function () { return { spot: current }; },
    apply: function (_el, state) {
      light(state && typeof state.spot === "number" ? state.spot : null);
    }
  });

  // sync-id 를 달아 둘 껍데기. 상태는 클로저에 있으니 요소 자체는 비어 있어도 된다.
  var carrier = document.createElement("div");
  carrier.setAttribute("data-sync-id", "deck-spotlight");
  carrier.setAttribute("data-sync-kind", "spotlight");
  carrier.style.display = "none";
  document.body.appendChild(carrier);

  /* ---- 대칭 입력: 누가 블록을 누르든 상대에게 켜 준다 ----
     같은 블록을 다시 누르면 끄고, 딴 데를 누르면 그것으로 끈다 — 켜 둔 것을
     끄려고 그 블록을 다시 찾아 누를 필요가 없다. 손가락으로 짚었다 떼는 것과
     같은 동작이라, 짚을 곳이 아닌 데를 짚으면 그냥 손을 뗀 것이다.
     문서 전체에서 듣는다: 덱 바깥 여백을 눌러도 꺼져야 하니까.

     인터랙티브 위젯은 자기 핸들러로 흘려보낸다. 끄지도 않는다 — 칸을 누르면
     click 보다 focusin 이 먼저 와서 그 칸이 켜지는데, 뒤따라온 click 이 그걸
     도로 꺼 버리면 칸의 링은 한 번도 보이지 못한다. */
  function spotOf(el) { return parseInt(el.getAttribute("data-spot"), 10); }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(WIDGET) && !t.closest(POINTS)) return;

    /* 누른 자리에서 바깥으로, 짚을 수 있는 것을 다 모은다 — 안쪽부터 순서대로.
       규칙 하나에서 두 가지가 나온다: 처음 누르면 가장 바깥(블록 전체)이 켜지고,
       켜진 채로 그 안을 다시 누르면 한 겹 들어간다. 카드를 짚었다가 카드 안의
       글자 하나를 짚는 손동작 그대로다. 제일 안쪽에서 또 누르면 꺼진다. */
    var chain = [], p = t.closest("[data-spot]");
    while (p && phone.contains(p)) {
      chain.push(p);
      p = p.parentElement && p.parentElement.closest("[data-spot]");
    }

    if (!chain.length) {                      // 짚을 것이 없는 자리 → 손을 뗀다
      if (current == null) return;            // 이미 꺼져 있다 — 발행할 게 없다
      light(null);
    } else {
      var at = -1;
      for (var i = 0; i < chain.length; i++) {
        if (spotOf(chain[i]) === current) { at = i; break; }
      }
      var top = chain[chain.length - 1];
      var on = current == null ? null : phone.querySelector('[data-spot="' + current + '"]');
      var next;
      if (at >= 0) next = at === 0 ? null : chain[at - 1];  // 이 줄기 위 → 한 겹 안으로
      else if (on && top.contains(on)) next = chain[0];     // 이미 이 블록 안이다 →
                                                            // 옆 부품으로 바로 옮긴다
      else next = top;                                      // 밖에서 왔다 → 블록 전체부터
      light(next ? spotOf(next) : null);
    }
    sync.push(carrier);
  });

  /* ---- 칸에 들어가면 그 칸이 켜진다 ----
     쓰는 사람에게는 커서가 보이지만 상대 화면에는 아무 표시도 없어서, 튜터가
     어느 빈칸을 채우는 중인지 학생이 알 수 없었다. 들어간 칸을 그대로 포인터로
     켜면 "지금 여기" 가 양쪽에 똑같이 보인다.

     상대에게 가는 것은 여전히 "몇 번이 켜졌나" 하나다. 받는 쪽은 링만 그리고
     포커스는 옮기지 않는다 — 남의 커서가 내 키보드를 빼앗으면 안 된다. */
  phone.addEventListener("focusin", function (e) {
    var f = e.target;
    if (!f.matches || !f.matches(FIELD) || !f.hasAttribute("data-spot")) return;
    var spot = parseInt(f.getAttribute("data-spot"), 10);
    if (current === spot) return;
    light(spot);
    sync.push(carrier);
  });

  // 칸에서 나오면 끈다. 다만 창을 잃었을 뿐인 경우(다른 앱으로 갔다가 돌아오는
  // 사이)에는 activeElement 가 그대로라, 그때는 켜 둔 채로 둔다.
  phone.addEventListener("focusout", function (e) {
    var f = e.target;
    if (!f.matches || !f.matches(FIELD) || !f.hasAttribute("data-spot")) return;
    var spot = parseInt(f.getAttribute("data-spot"), 10);
    setTimeout(function () {
      if (document.activeElement === f) return;
      if (current !== spot) return;         // 그새 다른 것이 켜졌다
      light(null);
      sync.push(carrier);
    }, 0);
  });

  // ---- 페이지를 넘기면 포인터를 끈다 ----
  // 페이저가 pg-on 을 옮기면(로컬이든 원격 적용이든) 감지해서 지운다. 스크롤 덱엔
  // pg-on 이 없어 아무 일도 안 한다. 지운 상태도 발행해, 늦게 들어온 사람이
  // 이미 떠난 페이지의 낡은 포인터를 되살리지 않게 한다.
  var lastActive = phone.querySelector(".pg-on");
  var observer = new MutationObserver(function () {
    var now = phone.querySelector(".pg-on");
    if (now === lastActive) return;         // pg-on 이 실제로 바뀐 배치만 처리
    lastActive = now;
    if (current != null) {
      light(null);
      sync.push(carrier);
    }
  });
  observer.observe(phone, { subtree: true, attributes: true, attributeFilter: ["class"] });
})();
