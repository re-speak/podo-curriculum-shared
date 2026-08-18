/* ================================================================
   PAGER · 한 장씩 넘겨 보는 모드 (공유 스크립트)

   덱은 .phone 의 자식이 한 장씩 늘어선 평평한 목록이라, 페이지 넘김은
   "하나만 보이고 나머지는 감춘다"가 전부다 — 구조를 바꾸지 않는다.

   덱이 해야 할 일은 마크업 한 덩어리뿐이다(자리는 .phone 바깥, 스탬프처럼):

     <nav class="pager" data-sync-id="deck-page" data-sync-kind="page">
       <input class="pg-scrub" type="range" min="0" max="0" step="1" value="0"
              aria-label="페이지 이동">
       <button class="pg-btn pg-prev" type="button" aria-label="이전 페이지">←</button>
       <div class="pg-mid"><span class="pg-label"><b class="pg-act">—</b><span class="pg-n">—</span></span></div>
       <button class="pg-btn pg-teach" type="button" aria-label="티칭 모드">T</button>
       <button class="pg-btn pg-next" type="button" aria-label="다음 페이지">→</button>
     </nav>

   스크러버(.pg-scrub)는 없으면 없는 대로 돌아간다 — 나머지 기능은 그대로다.
   (발음 표기 스위치는 여기 없다. 학습자가 자기 것으로 알아보려면 페이저가
   아니라 읽고 있는 페이지 위에 있어야 해서, yomi.js 가 따로 놓는다.)
   페이지마다 data-page-id 를 달아 두는 것이 중요하다: 공유되는 것은 순서가
   아니라 그 id 라서, 나중에 페이지를 끼워 넣어도 상대 화면이 어긋나지 않는다.

   로드 순서: 페이지를 다 세고 난 뒤에 칸을 끼워 넣어야 하므로 tutor-notes.js
   보다 먼저 온다. 활동 배선(activities.js)이 .slot 을 입력칸으로 바꾼 뒤라야
   티칭 모드가 유령 답을 띄울 수 있으니, activities.js 다음에 둔다.
   ================================================================ */
(function () {
  var phone = document.querySelector(".phone");
  var bar   = document.querySelector(".pager");
  if (!phone || !bar) return;

  // 보드 밖(로컬에서 파일을 직접 열 때)에서는 lessonSync 가 없다.
  var sync = window.lessonSync || { register: function () {}, push: function () {} };

  var pages = [].slice.call(phone.children);

  // Acts come from pages that already exist: the brand divider, and any
  // page naming itself with data-act. They only name where you are —
  // progress itself is measured across the whole deck.
  var acts = [], cur = null;
  pages.forEach(function (p, i) {
    if (!cur || p.hasAttribute("data-act") || p.classList.contains("divider")) {
      var t = p.querySelector(".brand-title");
      cur = {
        name: p.getAttribute("data-act")
           || (t ? (t.firstChild.textContent || "").trim() : "체험 레슨"),
        from: i, to: i
      };
      acts.push(cur);
    }
    cur.to = i;
  });

  var at = 0;
  var prevBtn  = bar.querySelector(".pg-prev");
  var nextBtn  = bar.querySelector(".pg-next");
  var actEl    = bar.querySelector(".pg-act");
  var nEl      = bar.querySelector(".pg-n");
  var teachBtn = bar.querySelector(".pg-teach");
  var scrub    = bar.querySelector(".pg-scrub");

  /* ---- 이 화면이 누구의 것인지가 티칭 모드를 정한다 ----
     학생이라고 명시된 화면에서는 버튼을 아예 지운다 — 학습자가 켜면 답이
     전부 열린다. 튜터라고 명시된 화면에서는 버튼을 두고 처음부터 켜 둔다:
     수업은 티칭 모드로 하는 것이 기본이라, 매 수업 T 를 누르게 하면 누르지
     않은 채로 진행하는 일이 생긴다(그래도 튜터는 언제든 끌 수 있다).
     역할이 없으면 레슨을 직접 연 내부 공유·검수 화면일 수 있으므로 예전처럼
     버튼만 보여 주고 꺼 둔 채로 시작한다.

     "튜터"를 tutor 한 낱말로 못 박지 않는다 — 학생이 아니라고 앱이 명시한
     역할이면 모두 튜터 쪽으로 본다. 앱이 teacher 처럼 다른 낱말을 넘기게
     되어도 조용히 꺼진 채로 수업이 나가는 일은 없어야 한다. */
  var lessonContext = window.PODO_LESSON_CONTEXT || {};
  var viewerRole = String(lessonContext.viewerRole || "").trim().toLowerCase();
  var isStudent  = viewerRole === "student";
  var isTutor    = viewerRole !== "" && !isStudent;
  if (isStudent && teachBtn) {
    teachBtn.remove();
    teachBtn = null;
  }

  function paint() {
    if (prevBtn) prevBtn.disabled = at <= 0;
    if (nextBtn) nextBtn.disabled = at >= pages.length - 1;
    var a = 0;
    acts.forEach(function (x, k) { if (at >= x.from) a = k; });
    if (actEl) actEl.textContent = acts[a].name;   // the act only labels where you are
    if (nEl) nEl.textContent = (at + 1) + " / " + pages.length;
    if (scrub) scrub.value = at;
  }

  // Layout is flushed before scrolling — the page has only just left
  // display:none, so measuring before that reads stale geometry.
  function show(i) {
    at = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach(function (p, k) { p.classList.toggle("pg-on", k === at); });
    paint();
    void pages[at].offsetHeight;
    if (window.__resizeInputs) window.__resizeInputs();   // 이제야 잴 수 있다
    window.scrollTo(0, 0);
  }

  // show() moves the page silently; goTo() is a turn someone made, so it
  // is the one that tells the other side.
  function goTo(i) {
    if (i === at || i < 0 || i > pages.length - 1) return;
    show(i);
    sync.push(bar);
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { goTo(at - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { goTo(at + 1); });

  /* ---- 문서 안 링크는 페이지 넘김이 된다 ----
     페이지 모드에서는 지금 장 말고는 전부 display:none 이라, 앵커가 가리키는
     자리가 화면에 없다 — 눌러도 아무 일도 일어나지 않는 것처럼 보인다.
     대상이 다른 장에 있으면 그 장으로 넘기고, 같은 장 안이면 브라우저에
     맡긴다. 넘기는 건 goTo() 라 상대 화면도 같이 따라온다: 튜터가 "요금표
     보여 드릴게요" 하고 눌렀는데 학습자만 제자리면 설명이 어긋난다. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    var page = target.closest(".phone > *");
    var i = pages.indexOf(page);
    if (i < 0 || i === at) return;            // 같은 장 안 — 그냥 스크롤
    e.preventDefault();
    goTo(i);
    // 장 전체가 아니라 그 안의 한 곳을 가리킨 링크면 거기까지 맞춰 준다.
    // show() 가 이미 맨 위로 올려 둔 뒤라, 이 줄이 마지막 말이 된다.
    if (target !== page) target.scrollIntoView();
  });

  /* ---- 스크러버 ----
     25장짜리 덱에서 「지난 장 한 번 더」를 하려면 화살표를 여러 번 눌러야
     한다. 끄는 동안은 이쪽 화면만 움직이고(show), 손을 뗀 자리에서 한 번만
     상대에게 알린다(push) — 끄는 내내 보내면 상대 화면이 덜컹거린다. */
  if (scrub) {
    scrub.max = pages.length - 1;
    scrub.addEventListener("input", function () { show(Number(scrub.value)); });
    scrub.addEventListener("change", function () { sync.push(bar); });
  }

  document.addEventListener("keydown", function (e) {
    if (e.target.matches && e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight") goTo(at + 1);
    if (e.key === "ArrowLeft") goTo(at - 1);
  });

  /* ---- 페이지 넘김도 이 문서가 정의한다 ----
     보드에는 "페이지" 개념이 없다. 넘긴 결과(어느 페이지인지)를 공유할 뿐,
     버튼 클릭을 재생하지는 않는다 — 그래야 늦게 들어오거나 새로고침한 쪽도
     한 번에 같은 페이지로 따라온다. 칸은 순서가 아니라 data-page-id 로 지칭해,
     페이지를 추가해도 이전에 공유된 위치가 어긋나지 않는다. */
  sync.register("page", {
    read: function () {
      return { pageId: pages[at].getAttribute("data-page-id") };
    },
    apply: function (el, state) {
      if (!state || typeof state.pageId !== "string") return;
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].getAttribute("data-page-id") === state.pageId) { show(i); return; }
      }
      // 이 덱에 없는 페이지면 그대로 둔다
    }
  });

  /* ---- teaching mode is the one thing that stays on this screen ----
     The tutor flips it to reveal answers; sending it would hand the
     learner the whole key. 공유하지 않는 유일한 상태다. 학생 앱이 명시한
     화면에는 버튼 자체가 없고, 그 밖의 화면에서만 이 핸들러를 붙인다. */
  function setTeaching(on) {
    document.body.classList.toggle("teaching", on);
    if (teachBtn) teachBtn.classList.toggle("on", on);
    if (window.__revealAnswers) window.__revealAnswers(on);
  }

  if (teachBtn) {
    teachBtn.addEventListener("click", function () {
      setTeaching(!document.body.classList.contains("teaching"));
    });
  }

  // One page at a time is the only mode for now — the scrolling view is
  // hidden rather than removed, so it can come back without a rewrite.
  phone.classList.add("paged");
  document.body.classList.add("paged");
  /* 튜터 화면은 켜진 채로 시작한다. show() 보다 먼저 켜는 이유는 유령 답이
     placeholder 로 들어가면 입력칸 폭이 달라지기 때문이다 — show() 가 첫
     페이지를 재는 시점에는 이미 켜져 있어야 폭이 맞는다. tutor-notes.js 와
     stamp.js 는 이 파일 다음에 오므로 처음부터 켜진 body 를 보게 된다. */
  if (isTutor) setTeaching(true);
  show(0);
})();
