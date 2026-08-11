/* ================================================================
   REPORT (상담 v5) · 니즈 → 레벨 체크 → 리포트의 배선 (공유 스크립트)

     .glc          목표 카드 — 고른 학습 동기에 따라 줄이 남는다
     .tcon         튜터 콘솔 — 레벨·항목별 레벨을 고르고 접힌다
     .lvc / .axcard / .rad   그 선택에서 파생되는 리포트 전체

   튜터가 고른 것만 공유되고, 리포트는 양쪽이 각자 그린다.
   풀덱의 리포트는 앞 세대라 runtime/js/report.js 를 쓴다 — 둘은 서로
   다른 마크업을 보므로 같이 불러도 부딪히지 않는다.
   ================================================================ */

(function () {
  /* ---------- 10단계 레벨 ----------
     사내 레벨표(CEFR·JLPT 대응)를 한국어 학습으로 옮긴 것이다. 눈금 10칸이
     곧 레벨 1~10 이고, 튜터가 고른 이 값이 리포트 전체의 기준점이 된다.
     출처: Figma「❤️ PODO JP」> 일본어 리포트 > 레벨표. */
  var LADDER_STEPS = 10;
  var LV = {
    "1":  { name: "첫걸음", mascot: "mascot-newborn.svg",
            line: '한글을 <b>하나씩 읽어요</b>',
            diag: '간단한 인사와 자기소개는 <b>따라 말할 수 있어요.</b> 아직 글자를 붙여 읽는 게 느리고, 문장은 한 번에 하나씩 나와요. 지금은 소리와 글자를 손에 익히는 단계예요.',
            cert: ["1급", "준비 단계 · 아직 응시 전"] },
    "2":  { name: "글자 떼기", mascot: "mascot-newborn.svg",
            line: '한글을 <b>막힘 없이 읽어요</b>',
            diag: '받침이 있는 글자까지 <b>소리 내어 읽어요.</b> 일상적인 주제로 짧은 대화가 오가고, 가게에서 메뉴를 물어보는 정도는 돼요. 아직 아는 단어가 적어서, 읽어도 뜻이 바로 붙지는 않아요.',
            cert: ["1급", "문턱 · 어휘가 붙으면 사정권"] },
    "3":  { name: "문장 시작", mascot: "mascot-grad.svg",
            line: '원하는 대로 <b>주문할 수 있어요</b>',
            diag: '배운 패턴으로 <b>짧은 문장을 스스로 만들어요.</b> 가게에서 원하는 대로 주문하고, 가족·친구·취미처럼 익숙한 주제로 간단히 이야기해요. 조사와 말끝은 아직 자주 흔들려요.',
            cert: ["2급", "사정권"] },
    "4":  { name: "일상 회화", mascot: "mascot-grad.svg",
            line: '여행에서 <b>혼자서도 괜찮아요</b>',
            diag: '익숙한 주제라면 <b>주고받는 대화가 이어져요.</b> 여행지에서 만난 한국인과 가벼운 수다도 가능해요. 낯선 화제로 넘어가면 말이 끊기고, 문법도 말할 때는 자주 흔들려요.',
            cert: ["2급", "3급 문턱"] },
    "5":  { name: "대화의 폭", mascot: "mascot-grad.svg",
            line: '익숙한 주제를 <b>구체적으로 말해요</b>',
            diag: '익숙한 주제를 <b>더 구체적이고 분명하게 말해요.</b> 일 이야기도 가벼운 스몰톡 정도는 오가요. 아직 표현의 폭이 좁아 같은 말이 반복돼요.',
            cert: ["3급", "사정권"] },
    "6":  { name: "내 생각", mascot: "mascot-grad.svg",
            line: '이유를 붙여 <b>내 의견을 말해요</b>',
            diag: '자기 생각에 <b>이유를 붙여 말할 수 있어요.</b> 가벼운 사회 이슈로도 의견을 주고받아요. 긴 이야기는 아직 앞뒤가 느슨해져요.',
            cert: ["3~4급", "사정권"] },
    "7":  { name: "논리", mascot: "mascot-grad.svg",
            line: '추상적인 주제도 <b>논리적으로 말해요</b>',
            diag: '추상적인 주제로도 <b>깊은 대화가 이어져요.</b> 사회 이슈를 두고 원어민과 논리적으로 설명하고 되받을 수 있어요. 어휘 선택은 아직 무난한 쪽으로 몰려요.',
            cert: ["4급", "사정권"] },
    "8":  { name: "자연스러움", mascot: "mascot-grad.svg",
            line: '다양한 표현으로 <b>흐름을 이어가요</b>',
            diag: '다양한 어휘와 표현을 쓰며 <b>대화의 흐름이 자연스러워요.</b> 한국에서 일하게 되어도 빠르게 적응할 수 있는 수준이에요.',
            cert: ["4~5급", "사정권"] },
    "9":  { name: "유학파", mascot: "mascot-grad.svg",
            line: '복잡한 이야기도 <b>바로 알아들어요</b>',
            diag: '복잡한 내용으로 <b>심층적인 논의가 가능해요.</b> 전문적인 어휘를 쓰고, 어려운 글의 함축적인 의미까지 읽어내요.',
            cert: ["5급", "사정권"] },
    "10": { name: "전문가", mascot: "mascot-grad.svg",
            line: '어떤 자리에서도 <b>막힘이 없어요</b>',
            diag: '까다로운 주제로 <b>깊이 있는 토론이 가능해요.</b> 전문 분야에서도 자유롭게 소통하고, 전문 지식이 필요한 글도 서슴없이 읽고 말해요.',
            cert: ["6급", "사정권"] }
  };

  /* ---------- 항목별 문안 ----------
     출처: 같은 Figma 파일의 항목 × 레벨대 표(1~2 / 3~4 / 5~6 / 7~8 / 9~10).
     문장은 그대로 두고 대상 언어만 한국어로 옮겼다. 한 칸이 두 레벨을
     덮으므로 색인은 ceil(lv / 2) 다.
     HINT 는 같은 표의 "OO을 보완하려면?" 문단을 한 줄로 줄인 것. */
  var AREAS = [
    { k: "acc",  n: "정확성" },
    { k: "voc",  n: "어휘" },
    { k: "flu",  n: "유창성" },
    { k: "pron", n: "발음" },
    { k: "lis",  n: "듣기" }
  ];
  var BAND = {
    flu: ["익숙한 주제로 더듬더듬 소통이 되는 정도",
          "익숙한 주제로 간단한 소통을 천천히 하는 정도",
          "익숙한 주제로 주저 없이 소통되는 정도",
          "새로운 주제에도 주저 없이 소통이 되는 정도",
          "새로운 주제에도 빠른 속도로 편하게 소통 가능"],
    acc: ["간단한 단어와 문법으로, 기초적인 의미는 전달 가능",
          "어려운 단어·문법은 알지만 복잡한 문장 구조와 순서는 자주 틀림",
          "어려운 단어·문법은 알지만 복잡한 문장 구조와 순서는 가끔 틀림",
          "문맥에 맞는 단어·문법·문장 구조 및 순서가 대개 정확",
          "문맥에 맞는 단어·문법·문장 구조 및 순서가 완벽"],
    pron:["아는 단어를 신경 써서 말하면, 이해되는 정도",
          "아는 단어는 말할 수 있지만, 처음 보는 단어는 발음이 어려움",
          "아는 단어는 능숙하며, 처음 보는 단어도 발음이 가능한 정도",
          "능숙한 발음과 전체적인 억양, 리듬감도 적절한 정도",
          "발음이 명확하고 억양과 리듬까지 자연스러움"],
    lis: ["천천히, 또박또박 말하는 문장을 이해할 수 있음",
          "천천히 말하는 문장은 이해할 수 있으나, 빨라지면 어려움",
          "빠르게 말해도, 전반적인 내용을 파악할 수 있음",
          "빠르게 말해도, 어떤 내용인지 뉘앙스와 함께 이해할 수 있는 정도",
          "한국인 수준으로 빠르게 말해도 뉘앙스까지 정확히 파악 가능"],
    voc: ["단순한 단어들로 전달하고픈 의미를 표현할 수 있음",
          "전달하고픈 의미에 해당하는 단어 2~3개를 알고 있음",
          "전달하고픈 의미에 맞는 단어를 골라서 적절히 표현 가능",
          "전달하고픈 의미를 다채로운 단어로 표현 가능",
          "상황에 맞는 다양한 단어와 표현을 적절하게 활용 가능"]
  };
  var HINT = {
    flu: "다양한 상황에서 소통하는 경험을 늘리기 — 사람과 한국어로 주고받은 양이 그대로 유창성이 돼요.",
    acc: "단어와 문법의 정확한 뜻·쓰임을 이해하고, 맞는 상황에서 직접 써 보며 충분히 연습하기.",
    pron: "정확한 발음·억양·리듬을 쓰는 원어민의 한국어를 많이 듣고, 그대로 따라 하며 내 것으로 만들기.",
    lis: "한국어의 다양한 억양과 속도에 친숙해지기 — 빠르게 말해도 들릴 때까지 여러 사람과 대화해 보기.",
    voc: "많이 읽어 단어를 알고, 그 단어가 어떤 맥락에서 쓰이는지 원어민과 대화하며 계속 익히기."
  };

  /* ---------- 견줄 자리 ----------
     체험 수업을 받은 분들의 항목별 평균. 목표선 대신 이걸 옆에 두는 이유는,
     처음 온 사람에게 "Lv.3" 은 아무 크기도 아니어서다 — 옆에 사람이 서 있어야
     비로소 높이가 보인다.
     TODO(데이터): 아래 값은 실제 코호트 수치가 나오기 전까지 쓰는 임시값이다.
     숫자만 갈아끼우면 레이더와 카드가 함께 따라간다. */
  var AVG = { acc: 2.6, voc: 2.2, flu: 2.0, pron: 2.8, lis: 2.4 };

  /* ---------- 목표 ----------
     학습 동기 하나가 사다리 하나고, 그 사다리의 세 칸이 여기 세 줄이다.
     같은 "여행" 이라도 주문만 하면 되는 사람과 현지에서 수다 떨고 싶은
     사람은 가는 거리가 다르다 — 이유는 어느 사다리인지를, 목표는 그
     사다리의 몇 칸까지인지를 정한다. 인사·자기소개처럼 지나가는 자리는
     목표에서 뺐다: 그걸 목표로 삼는 사람은 없고, 실제로는 코스 안의
     이정표라 그래프가 알아서 그려 준다.
     lv 는 그 목표가 도착하는 레벨이고, 걸리는 레슨 수는 따로 두지 않고
     DONE[lv] 에서 읽는다 — 같은 레벨인데 어느 줄을 눌렀느냐로 기간이
     달라지면 튜터가 설명할 수 없다.
     가는 길의 이정표는 추천 코스(c)에서 나온다 — 그래프의 마디와 아래
     카드가 같은 목록이어야 하나의 그림으로 읽힌다. */
  var GOALS = {
    t3: { lv: 3, t: "짧은 문장으로 전하기" },
    t5: { lv: 5, t: "익숙한 주제로 대화 이어가기" },
    t7: { lv: 7, t: "의견도 이유도 말하기" },
    t9: { lv: 9, t: "어떤 주제든 자유롭게 말하기" }
  };
  // 이유 -> 그 이유를 실제로 채워 주는 상황별 코스. 목표 카드는 거리만
  // 정하고, 길에 무엇을 깔지는 이유가 정한다.
  var WHY_COURSE = { travel: "travel", kpop: "drama", friend: "banmal",
                     self: "travel", work: "free", topik: "free" };
  // the tutor's level call -> lessons already effectively covered.
  // 목표 쪽에서도 같은 표를 읽는다 — 도착 레벨 하나로 거리가 정해진다.
  var DONE = { "1": 0, "2": 11, "3": 25, "4": 45, "5": 70,
               "6": 90, "7": 110, "8": 130, "9": 150, "10": 170 };

  // Names, stage numbers and anchors all match the 커리큘럼 page in the
  // full trial deck, so a recommended course can be pointed at and
  // explained without the learner having to work out that they are the
  // same thing.
  // cov = 커버 그림(assets/art/cov/) + 커버에 박히는 짧은 이름 + 바탕색.
  //       원본 아이콘에 구워져 있던 흰 타일·그림자를 벗겨 낸 그림이라,
  //       색 바탕 위에 얹으면 강의 커버처럼 읽힌다.
  // s = 그 코스가 뭘 하는 곳인지 한 줄,
  // can = 그 코스를 마치면 할 수 있게 되는 말 — 그래프의 마디에 그대로 붙는다,
  // ex = 그 말을 예문 하나로 푼 것 — 카드의 흰 줄이 마디를 이어받는다,
  // w  = 코스 길이(그래프에서 마디가 서는 자리를 정한다).
  // 레슨 수·기간은 일부러 두지 않는다 — 카드는 "무엇을" 만 말한다.
  var COURSE = {
    hangul: { t: "한글 읽기",        k: "한글",     tint: "#E7FBC5", w: 1,   s: "글자를 소리 내어 읽는 법",
              can: "간판이 읽혀요",
              ex: "카페 · 김밥 · 화장실 — 거리에서 보이는 글자를 소리 내어 읽어요" },
    core:   { t: "핵심 패턴",        k: "패턴",     tint: "#DFEAFF", w: 3,   s: "하고 싶은 말을 스스로 만드는 법",
              can: "내 이야기를 말해요",
              ex: "「저는 일본 사람입니다」처럼, 배운 틀에 내 단어를 넣어 문장을 만들어요" },
    travel: { t: "상황별 · 여행",     k: "여행",     tint: "#FFE8CB", w: 2,   s: "가게에서 · 길에서 진짜 쓰는 말",
              can: "가게에서 말해요",
              ex: "「혹시 명동역이 어딘지 아세요?」 길을 묻고, 주문하고, 되물어요" },
    drama:  { t: "상황별 · 드라마",   k: "드라마",   tint: "#EBE2FF", w: 2.4, s: "좋아하는 드라마의 진짜 대사",
              can: "자막 없이 들려요",
              ex: "「우리 어디서 본 적 있지 않아요?」 드라마에 나오는 말이 그대로 들려요" },
    banmal: { t: "상황별 · 반말 수다", k: "반말",     tint: "#FFE0E5", w: 2,   s: "친구에게 쓰는 편한 반말",
              can: "반말로 수다 떨어요",
              ex: "「너 지금 어디 가는 거야?」 친구에게 말을 놓고 편하게 이야기해요" },
    free:   { t: "프리토킹",         k: "프리토킹", tint: "#D6F3EA", w: 2.4, s: "문법이 아니라 생각을 말하기",
              can: "이유까지 말해요",
              ex: "「돈 vs 시간, 하나만 가질 수 있다면?」 생각과 그 이유를 이어서 말해요" }
  };
  // why -> a closing line that ties the plan back to their own reason
  var WHY = {
    kpop:   "K-POP·드라마를 자막 없이 즐기는 데까지, 이 순서가 가장 빨라요.",
    travel: "여행 전에 맞추려고 읽는 힘과 가게에서 쓰는 표현을 먼저 넣었어요.",
    friend: "한국인 친구·연인과 이야기하려면 반말까지가 사정권이에요.",
    work:   "일에서 쓰려면 문법 토대가 필요해서 패턴을 두껍게 잡았어요.",
    topik:  "TOPIK의 토대가 되는 문법부터 차례대로 쌓는 순서예요.",
    self:   "무리 없이 이어갈 수 있게, 조금씩 쌓이는 순서로 짰어요.",
    other:  "오늘 들은 희망에 맞춰 순서를 짰어요."
  };

  var pick = { why: [], goal: null, pace: null, level: null };

  /* ---- the answer groups remember what was chosen ---- */
  document.querySelectorAll("[data-group]").forEach(function (group) {
    var key = group.getAttribute("data-group");
    var multi = group.getAttribute("data-pick") === "multi";
    group.querySelectorAll("button[data-val]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-val");
        if (multi) {
          b.classList.toggle("on");
          pick[key] = [].slice.call(group.querySelectorAll("button.on"))
                        .map(function (x) { return x.getAttribute("data-val"); });
        } else {
          var was = b.classList.contains("on");
          group.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
          if (!was) b.classList.add("on");
          pick[key] = was ? null : v;
        }
        render();
      });
    });
  });

  /* ---- 지금 서 있는 레벨들 ----
     종합은 아직 안 골랐으면 1 — 레벨 체크의 "대부분 1이에요" 가 말하는 그
     기본값이다. 항목별은 손대지 않았으면 종합을 그대로 따라간다. */
  function overall() { return clamp(Number(pick.level || 1)); }
  function areaLv(k) { return clamp(Number(pick["ax-" + k] || pick.level || 1)); }
  function clamp(n) { return Math.max(1, Math.min(LADDER_STEPS, n || 1)); }
  function band(lv) { return Math.ceil(clamp(lv) / 2) - 1; }
  // 10칸 사다리 위의 자리. 평균은 2.6 처럼 칸 사이에 서므로 칸 중앙이 아니라
  // 눈금값 그대로 재야 레이더(반지름 = lv/10)와 같은 곳을 가리킨다.
  function pct(lv) { return clamp(lv) * 10; }

  /* ---- ⓪ 튜터 콘솔 ---- */
  var tcon = document.querySelector(".tcon");
  if (tcon) {
    // 종합 레벨을 고르는 순간 접는다 — 항목별은 다를 때만 손대는 것이라
    // 매번 펼쳐 둘 이유가 없다. 요약 줄이나 T 를 누르면 다시 열린다.
    tcon.querySelector(".lvpick").addEventListener("click", function (e) {
      if (e.target.closest("button[data-val]")) tcon.classList.add("folded");
    });
    tcon.querySelector(".tcon-fold").addEventListener("click", function () {
      tcon.classList.add("folded");
    });
    tcon.querySelector(".tcon-sum").addEventListener("click", function () {
      tcon.classList.remove("folded");
    });
  }

  function renderConsole() {
    if (!tcon) return;
    tcon.querySelector(".ts-lv").textContent = "Lv." + overall();
    var same = true, parts = [];
    AREAS.forEach(function (a) {
      var lv = areaLv(a.k);
      if (lv !== overall()) same = false;
      parts.push(a.n + " " + lv);
    });
    tcon.querySelector(".ts-ax").textContent = same ? "항목별 모두 같음" : parts.join(" · ");

    // 아직 손대지 않은 줄도 어느 칸에 서 있는지는 보여 준다 — 따라가는
    // 중이라는 뜻이라, 직접 고른 칸(.on)보다 옅게 칠한다.
    AREAS.forEach(function (a) {
      var g = tcon.querySelector('[data-group="ax-' + a.k + '"]');
      if (!g) return;
      var own = !!pick["ax-" + a.k];
      g.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("echo", !own && Number(b.getAttribute("data-val")) === overall());
      });
    });
  }

  /* ---- ① 지금 레벨 카드 ---- */
  var card = document.querySelector(".lvc");

  function renderLevel() {
    if (!card) return;
    var n = overall(), d = LV[String(n)];
    card.querySelector(".lvc-mascot").src = "../assets/" + d.mascot;
    card.querySelector(".lvc-badge").textContent = "Lv." + n + " · " + d.name;
    card.querySelector(".lvc-line").innerHTML = d.line;
    card.querySelector(".lvc-diag").innerHTML = d.diag;
    card.querySelector(".lvc-cert b").textContent = d.cert[0];
    card.querySelector(".lvc-cert span").textContent = d.cert[1];

    var segs = card.querySelector(".lad-segs"), nums = card.querySelector(".lad-nums");
    segs.innerHTML = ""; nums.innerHTML = "";
    for (var i = 1; i <= LADDER_STEPS; i++) {
      var s = document.createElement("span");
      if (i <= n) s.className = "on";
      segs.appendChild(s);
      var t = document.createElement("span");
      if (i === n) { t.className = "on"; t.textContent = "Lv." + i; }
      else t.textContent = String(i);
      nums.appendChild(t);
    }

    /* 근거 세 줄은 항목별 레벨에서 나온다 — 잘 되는 두 항목과 가장 처지는
       항목. 다섯이 모두 같으면 처지는 항목이란 게 없으므로 전부 ✓ 다. */
    var sorted = AREAS.slice().sort(function (a, b) { return areaLv(b.k) - areaLv(a.k); });
    var top = sorted[0], mid = sorted[1], low = sorted[sorted.length - 1];
    var spread = areaLv(top.k) > areaLv(low.k);
    var ul = card.querySelector(".lvc-ev");
    ul.innerHTML = "";
    [[1, top], [1, mid], [spread ? 0 : 1, low]].forEach(function (row) {
      var a = row[1], li = document.createElement("li");
      if (!row[0]) li.className = "miss";
      li.innerHTML = '<i>' + (row[0] ? "✓" : "·") + '</i>' +
                     '<span>' + a.n + " · " + BAND[a.k][band(areaLv(a.k))] + '</span>';
      ul.appendChild(li);
    });
  }

  /* ---- ② 항목별 진단 · 레이더 + 트랙 ---- */
  var trks = document.querySelector(".trks");

  function renderAspects() {
    drawRadar();
    if (!trks) return;
    trks.innerHTML = "";
    AREAS.forEach(function (a) {
      var now = areaLv(a.k), avg = AVG[a.k];
      var d = document.createElement("div");
      d.className = "axcard";

      var segs = "";
      for (var i = 1; i <= LADDER_STEPS; i++) {
        segs += '<span' + (i <= now ? ' class="on"' : "") + '></span>';
      }
      // 평균 표시는 라벨이 카드 밖으로 새지 않게 양 끝에서 조금 들여 세운다
      var mp = Math.max(9, Math.min(91, pct(avg)));

      d.innerHTML =
        '<div class="axc-top">' +
          '<span class="axc-ico"><img src="../assets/report-icons/' + a.k + '.svg" alt=""></span>' +
          '<span class="axc-name">' + a.n + '</span>' +
          '<span class="axc-lv">Lv.' + now + '</span>' +
        '</div>' +
        '<div class="axc-lad">' +
          '<div class="axc-segs">' + segs + '</div>' +
          '<div class="axc-mark"><b style="left:' + mp + '%">▲ 평균</b></div>' +
        '</div>' +
        '<p class="axc-tx">' + BAND[a.k][band(now)] + '</p>' +
        '<div class="axc-tip"><span class="ic">💡</span>' +
          '<span class="t"><b>추천</b>' + HINT[a.k] + '</span></div>';

      trks.appendChild(d);
    });
  }

  /* 오각형. 지금(초록 채움)은 튜터가 고른 항목별 레벨, 점선 외곽은 체험
     수업을 받은 분들의 평균이다. 평균은 배경 쪽 정보라 점만 찍지 않고
     윤곽선으로만 두고, 초록 면을 그 위에 얹는다. */
  var svg = document.getElementById("radar");
  function drawRadar() {
    if (!svg) return;
    var cx = 100, cy = 100, R = 82, N = AREAS.length, NS = "http://www.w3.org/2000/svg";
    svg.innerHTML = "";
    var el = function (t, at) {
      var e = document.createElementNS(NS, t);
      for (var k in at) e.setAttribute(k, at[k]);
      return e;
    };
    var P = function (i, f) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / N;
      return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f];
    };
    var poly = function (pts) {
      return pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    };
    var i, p, e, lp, t, d;
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      p = [];
      for (i = 0; i < N; i++) p.push(P(i, f));
      svg.appendChild(el("polygon", { points: poly(p), fill: "none", stroke: "#f0efec", "stroke-width": "1" }));
    });
    for (i = 0; i < N; i++) {
      e = P(i, 1);
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: e[0], y2: e[1], stroke: "#f0efec", "stroke-width": "1" }));
      lp = P(i, 1.18);
      t = el("text", { x: lp[0].toFixed(1), y: (lp[1] + 4).toFixed(1), "font-size": "11.5",
                       "font-weight": "600", fill: "#6a6a66",
                       "text-anchor": lp[0] > cx + 4 ? "start" : (lp[0] < cx - 4 ? "end" : "middle") });
      t.textContent = AREAS[i].n;
      svg.appendChild(t);
    }
    var ap = [];
    for (i = 0; i < N; i++) ap.push(P(i, AVG[AREAS[i].k] / LADDER_STEPS));
    svg.appendChild(el("polygon", { points: poly(ap), fill: "none", stroke: "#b4b4b0",
                                    "stroke-width": "1.5", "stroke-dasharray": "4 3",
                                    "stroke-linejoin": "round" }));
    var np = [];
    for (i = 0; i < N; i++) np.push(P(i, areaLv(AREAS[i].k) / LADDER_STEPS));
    svg.appendChild(el("polygon", { points: poly(np), fill: "rgba(106,190,54,.20)", stroke: "#6abe36",
                                    "stroke-width": "1.75", "stroke-linejoin": "round" }));
    for (i = 0; i < N; i++) {
      d = P(i, areaLv(AREAS[i].k) / LADDER_STEPS);
      svg.appendChild(el("circle", { cx: d[0].toFixed(1), cy: d[1].toFixed(1), r: "2.6",
                                     fill: "#6abe36", stroke: "#fff", "stroke-width": "1" }));
    }
  }

  /* ---- ③ 도착 예측 ---- */
  var rep = document.querySelector(".rep");
  var empty = document.querySelector(".rep-empty");
  var $ = function (sel) { return rep.querySelector(sel); };

  function months(lessons, perWeek) {
    return Math.max(1, Math.round(lessons / (perWeek * 4.3)));
  }

  function gradDate(mo) {
    var d = new Date();
    d.setMonth(d.getMonth() + mo);
    return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월쯤";
  }

  // ---- 그래프 좌표계 ----------------------------------------------------
  // 세로축은 '지금 레벨 → 목표 레벨'. 눈금 간격은 사람마다 다르니 여기서
  // 만든다. 목표선은 항상 맨 위 눈금이라, 도착점이 그래프 꼭대기에 붙는다.
  var PX0 = 36, PX1 = 324, PYB = 206, PYT = 32;

  // 지금 레벨부터 목표 레벨까지 한 칸도 건너뛰지 않는다 — 건너뛴 눈금은
  // 사이에 레벨이 없는 것처럼 보이고, 올라야 할 칸 수가 지워진다.
  function lvTicks(cur, goal) {
    if (goal <= cur) goal = cur + 1;
    var span = goal - cur, out = [], v;
    for (v = cur; v <= goal; v++) out.push({ lv: v, y: PYB - (PYB - PYT) * (v - cur) / span });
    return out;
  }

  // 완만하다가 뒤에서 솟는 곡선. exp 가 클수록 늦게 터지고, top 은
  // 끝점이 도달하는 높이(1 = 목표선).
  function curveD(exp, top) {
    var h = (PYB - PYT) * top, d = "", i, t;
    for (i = 0; i <= 48; i++) {
      t = i / 48;
      d += (i ? "L" : "M") + (PX0 + (PX1 - PX0) * t).toFixed(1) +
           " " + (PYB - h * Math.pow(t, exp)).toFixed(1);
    }
    return d;
  }

  var FAST_EXP = 2, SELF_TOP = 0.26;

  function renderPlan() {
    if (!rep) return;

    var g = GOALS[pick.goal], pace = pick.pace, lv = String(overall());
    // While the report is a skeleton, say which answer is missing and
    // take the tutor straight there — the old caption only restated
    // the problem and left them to scroll back and find it.
    var jump = document.querySelector(".rep-jump");
    if (!g || !pace) {
      rep.classList.remove("ready");
      empty.classList.remove("hide");
      if (jump) {
        jump.classList.remove("hide");
        var missing = !g
          ? { href: "#p-goal", t: "목표를 아직 안 골랐어요" }
          : { href: "#p-pace", t: "학습 페이스를 아직 안 골랐어요" };
        jump.href = missing.href;
        jump.querySelector(".rj-t").textContent = missing.t;
      }
      return;
    }
    rep.classList.add("ready");
    empty.classList.add("hide");
    if (jump) jump.classList.add("hide");

    var per = pace === "5" ? 5 : Number(pace);
    var need = Math.max(6, DONE[String(g.lv)] - DONE[lv]);
    var mo = months(need, per);

    // 리포트가 부르는 목표 이름은, 그 카드 안에서 이 사람의 첫 번째 이유가
     // 달고 있던 바로 그 줄이다 — 문구를 여기에 또 적어 두면 카드와 리포트가
    // 언젠가 서로 다른 말을 하게 된다. 이유가 없으면 카드 제목을 쓴다.
    var why0 = pick.why && pick.why.length ? pick.why[0] : null;
    var mine = why0 && document.querySelector(
      '.glc[data-val="' + pick.goal + '"] .glc-i[data-why="' + why0 + '"] em');
    document.querySelector(".rep-sub").textContent =
      "「" + (mine ? mine.textContent : g.t) + "」까지, 지금 페이스로 언제쯤 도착하는지 그려 봤어요.";

    $(".lg1").textContent = "주 " + (pace === "5" ? "5회" : pace + "회") + " 수업";

    /* ---- 무엇을 배우는지는 이유가, 어디까지 가는지는 목표가 ----
       한글·핵심 패턴은 누구나 지나가는 길이고, 그 위에 얹는 상황별 코스는
       고른 이유에서 나온다. 둘까지만 얹는다 — 마디가 다섯이 되면 그래프의
       라벨이 서로 겹치고, 학습 순서라기보다 목록이 된다.
       Lv.8 위는 프리토킹 없이 설명이 안 되는 높이라, 그 자리를 비워 둔다. */
    var extras = [];
    (pick.why || []).forEach(function (w) {
      var k = WHY_COURSE[w];
      if (k && extras.indexOf(k) < 0) extras.push(k);
    });
    extras = g.lv >= 8
      ? extras.filter(function (k) { return k !== "free"; }).slice(0, 1).concat("free")
      : extras.slice(0, 2);
    // 첫 번째 이유의 코스는 맨 뒤로. 마지막 마디가 곧 「목표」 라서, 리포트가
    // 부르는 목표 이름과 다른 코스가 끝에 서면 도착점이 두 개로 읽힌다.
    var mainC = why0 && WHY_COURSE[why0];
    if (mainC && extras.length > 1 && extras.indexOf(mainC) >= 0 && extras[extras.length - 1] !== "free") {
      extras = extras.filter(function (k) { return k !== mainC; }).concat(mainC);
    }

    // never recommend a course the learner has already passed.
    // 그래프의 마디와 아래 카드가 같은 목록에서 나오므로, 코스를 먼저 정하고
    // 그다음에 그린다.
    var all = ["hangul", "core"].concat(extras);
    var courses = all.filter(function (k) {
      if (k === "hangul") return Number(lv) < 2;
      if (k === "core") return Number(lv) < 5;
      return true;
    });
    if (!courses.length) courses = [all[all.length - 1]];

    // 세로축: 지금 레벨에서 목표 레벨까지. 맨 아래 눈금(지금 레벨)만
    // 진하게 — 그 선이 곧 x축이다.
    var ticks = lvTicks(Number(lv), g.lv), grid = "";
    ticks.forEach(function (t, i) {
      grid += '<line x1="' + PX0 + '" y1="' + t.y.toFixed(1) + '" x2="332" y2="' + t.y.toFixed(1) +
              '" stroke="' + (i ? "#F0F0F0" : "#E1E1E1") + '"/>' +
              '<text x="28" y="' + (t.y + 3.4).toFixed(1) + '" font-size="10" fill="#A0A09B"' +
              ' font-weight="700" text-anchor="end">Lv.' + t.lv + '</text>';
    });
    $(".rep-grid").innerHTML = grid;

    var fast = curveD(FAST_EXP, 1);
    $(".rep-fast").setAttribute("d", fast);
    $(".rep-area").setAttribute("d", fast + "L" + PX1 + " " + PYB + "L" + PX0 + " " + PYB + "Z");
    $(".rep-slow").setAttribute("d", curveD(1.15, SELF_TOP));

    /* ---- 곡선 위의 마디 = 학습 순서의 코스 ----
       점 하나가 코스 하나고, 그 옆의 한 줄은 그 코스를 마치면 할 수 있게
       되는 말이다 — 아래 카드의 흰 줄이 같은 말을 이어서 푼다.
       자리는 코스 길이(w)의 누적으로 잡는다. 균등하게 나누면 한글 읽기가
       핵심 패턴과 같은 기간으로 보인다. */
    var tot = 0, cum = 0, marks = "";
    courses.forEach(function (k) { tot += COURSE[k].w; });
    courses.forEach(function (k, i) {
      var c = COURSE[k], last = i === courses.length - 1;
      cum += c.w;
      var t = last ? 1 : cum / tot;
      var x = PX0 + (PX1 - PX0) * t, y = PYB - (PYB - PYT) * Math.pow(t, FAST_EXP);
      // 한글 한 글자 ≈ 글자 크기와 같은 폭이라, 길이만으로 왼쪽 끝을 어림한다
      var flip = x + 9 - c.can.length * 10.5 < 46;
      if (last) marks += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
                         '" r="15" fill="#B5FD4C" opacity=".35"/>';
      marks +=
        // 마디는 아래 카드의 커버에 붙은 번호와 같은 동그라미다 — 같은 번호를
        // 두 곳에 같은 모양으로 두는 게, 선으로 잇는 것보다 확실하다.
        '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
          '" r="10" fill="#B5FD4C" stroke="#1C1C1C" stroke-width="1.5"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 3.9).toFixed(1) + '" font-size="11.5"' +
          ' fill="#1C1C1C" font-weight="900" text-anchor="middle">' + (i + 1) + '</text>' +
        // 라벨은 점의 왼쪽 위가 기본 — 오른쪽으로 두면 마지막 마디가 화면
        // 밖으로 나간다. 다만 왼쪽으로 뻗다가 세로축 눈금(Lv.n)까지 닿는
        // 이른 마디만 오른쪽으로 넘긴다.
        '<text x="' + (flip ? x + 14 : x + 9).toFixed(1) + '" y="' + (y - 17).toFixed(1) +
          '" font-size="11.5" fill="#457B23" font-weight="' + (last ? 800 : 700) +
          '" text-anchor="' + (flip ? "start" : "end") + '"' +
          ' paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">' +
          c.can + '</text>';
      // 「오늘」 과 붙어 버릴 만큼 이른 마디는 개월 수를 생략한다
      if (x - PX0 > 34) marks +=
        '<text x="' + x.toFixed(1) + '" y="226" font-size="10" fill="#757575" text-anchor="' +
          (last ? "end" : "middle") + '">' + Math.max(1, Math.round(mo * t)) + '개월</text>';
    });
    $(".rep-marks").innerHTML = marks;

    /* ---- 학습 순서 ----
       한 코스가 한 카드다. 대부분 핵심 패턴에서 시작해서, 목표·관심이
       맞으면 상황별로, 목표가 중급 언저리면 프리토킹까지 간다 — 그
       분기는 이미 GOALS[].c 가 들고 있고, 여기서는 그리기만 한다.
       마지막 카드가 목표다. */
    var map = $(".cmap");
    map.innerHTML = "";
    courses.forEach(function (k, i) {
      var c = COURSE[k], last = i === courses.length - 1;
      var card = document.createElement("div");
      card.className = "cst" + (last ? " goal" : "");
      card.innerHTML =
        '<div class="cst-top">' +
          // 커버 위의 번호가 그래프의 마디 번호와 같은 동그라미다
          '<span class="cst-cov" style="background:' + c.tint + '">' +
            '<b class="cst-n">' + (i + 1) + '</b>' +
            '<img src="../assets/art/cov/' + k + '.png" alt="">' +
            '<em>' + c.k + '</em>' +
          '</span>' +
          '<span class="cst-b">' +
            '<span class="cst-t">' + c.t + '</span>' +
            (last ? '<span class="cst-flag">목표</span>' : "") +
            '<span class="cst-s">' + c.s + '</span>' +
          '</span>' +
        '</div>' +
        // 그래프의 마디와 같은 말로 시작해서(c.can), 그 말을 한 줄 더 푼다
        '<div class="cst-l"><i>✓</i><span class="ct">' + c.can +
          '<em>' + c.ex + '</em></span></div>';
      map.appendChild(card);
    });

    // 닫는 줄은 고른 목표의 이유를 따라간다 — 이유를 여럿 골랐어도,
    // 계획이 겨냥한 곳은 목표가 선 사다리 하나다.
    var why = g.w || (pick.why && pick.why.length ? pick.why[0] : "other");
    $(".rep-why").textContent = WHY[why] || WHY.other;
  }

  /* ---- 목표 카드 속은 고른 이유만 남긴다 ----
     카드(=거리)는 넷 그대로고, 그 안의 「할 수 있게 되는 일」 만 이 사람의
     이유로 좁힌다. 아직 이유를 고르지 않았으면 여섯 줄을 다 펴는 대신
     한 줄로 그 사실을 말한다 — 남의 이유가 여섯 줄씩 네 장이면, 정작
     고를 것(거리)이 그 밑에 묻힌다.
     원격 선택도 보드가 옵션을 합성 클릭해 오므로 양쪽이 같은 줄을 본다. */
  function renderGoalCards() {
    var items = [].slice.call(document.querySelectorAll(".glc-i[data-why]"));
    if (!items.length) return;
    var any = pick.why.some(function (w) { return WHY_COURSE[w]; });
    items.forEach(function (it) {
      it.classList.toggle("hide", pick.why.indexOf(it.getAttribute("data-why")) < 0);
    });
    document.querySelectorAll(".glc-e").forEach(function (e) { e.classList.toggle("hide", any); });
  }

  function render() {
    renderGoalCards();
    renderConsole();
    renderLevel();
    renderAspects();
    renderPlan();
  }

  render();
})();
