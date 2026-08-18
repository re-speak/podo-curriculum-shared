/* ================================================================
   REPORT · 체험 레슨 리포트와 안내 페이지의 배선 (공유 스크립트)

     .lvcheck      10단계 레벨 체크 — 고르면 접힌다
     .axsteps      항목별 진단 다섯 줄 + 레이더
     .tcon         목표 레벨까지 · 커리큘럼 로드맵
     .fold         길어지는 카드의 더 보기

   튜터가 수업 중에 채우고, 그 결과가 학습자 화면에도 그대로 간다.
   레슨 활동(activities.js)과 겹치는 마크업이 없으므로 둘을 같이 불러도
   서로를 건드리지 않는다.
   ================================================================ */

(function () {
  // 로드맵의 칸은 클로저에 있어 DOM 만으로는 읽을 수 없다 — register 로 넘긴다
  var sync = window.lessonSync;

  /* ---------- 10단계 레벨 ----------
     사내 레벨표(CEFR·JLPT 대응)를 한국어 학습으로 옮긴 것이다. 눈금 10칸이
     곧 레벨 1~10 이고, 튜터가 고른 이 값이 리포트 전체의 기준점이 된다.
     출처: Figma「❤️ PODO JP」> 일본어 리포트 > 레벨표.
     한 레벨에 그림 한 장(assets/levels/lv-N.png) — 열 장이 한 줄로 이어지는
     성장 그림이라, 번호가 아니라 그림만 봐도 어디쯤인지 읽힌다. */
  var LADDER_STEPS = 10;
  var LV = {
    "1":  { name: "첫걸음",
            line: '한글을 <b>하나씩 읽어요</b>',
            diag: '간단한 인사와 자기소개는 <b>따라 말할 수 있어요.</b> 아직 글자를 붙여 읽는 게 느리고, 문장은 한 번에 하나씩 나와요. 지금은 소리와 글자를 손에 익히는 단계예요.',
            cert: ["1급", "준비 단계 · 아직 응시 전"] },
    "2":  { name: "글자 떼기",
            line: '한글을 <b>막힘 없이 읽어요</b>',
            diag: '받침이 있는 글자까지 <b>소리 내어 읽어요.</b> 일상적인 주제로 짧은 대화가 오가고, 가게에서 메뉴를 물어보는 정도는 돼요. 아직 아는 단어가 적어서, 읽어도 뜻이 바로 붙지는 않아요.',
            cert: ["1급", "기본 인사와 소개 가능"] },
    "3":  { name: "문장 시작",
            line: '원하는 대로 <b>주문할 수 있어요</b>',
            diag: '배운 패턴으로 <b>짧은 문장을 스스로 만들어요.</b> 가게에서 원하는 대로 주문하고, 가족·친구·취미처럼 익숙한 주제로 간단히 이야기해요. 조사와 말끝은 아직 자주 흔들려요.',
            cert: ["2급", "한국어로 일상 회화 가능"] },
    "4":  { name: "일상 회화",
            line: '여행에서 <b>혼자서도 괜찮아요</b>',
            diag: '익숙한 주제라면 <b>주고받는 대화가 이어져요.</b> 여행지에서 만난 한국인과 가벼운 수다도 가능해요. 낯선 화제로 넘어가면 말이 끊기고, 문법도 말할 때는 자주 흔들려요.',
            cert: ["2급", "익숙한 주제로 대화 가능"] },
    "5":  { name: "대화의 폭",
            line: '익숙한 주제를 <b>구체적으로 말해요</b>',
            diag: '익숙한 주제를 <b>더 구체적이고 분명하게 말해요.</b> 일 이야기도 가벼운 스몰톡 정도는 오가요. 아직 표현의 폭이 좁아 같은 말이 반복돼요.',
            cert: ["3급", "일상 · 업무 대화 가능"] },
    "6":  { name: "내 생각",
            line: '이유를 붙여 <b>내 의견을 말해요</b>',
            diag: '자기 생각에 <b>이유를 붙여 말할 수 있어요.</b> 가벼운 사회 이슈로도 의견을 주고받아요. 긴 이야기는 아직 앞뒤가 느슨해져요.',
            cert: ["3~4급", "이유를 붙여 의견 전달 가능"] },
    "7":  { name: "논리",
            line: '추상적인 주제도 <b>논리적으로 말해요</b>',
            diag: '추상적인 주제로도 <b>깊은 대화가 이어져요.</b> 사회 이슈를 두고 원어민과 논리적으로 설명하고 되받을 수 있어요. 어휘 선택은 아직 무난한 쪽으로 몰려요.',
            cert: ["4급", "사회 주제도 설명 가능"] },
    "8":  { name: "자연스러움",
            line: '다양한 표현으로 <b>흐름을 이어가요</b>',
            diag: '다양한 어휘와 표현을 쓰며 <b>대화의 흐름이 자연스러워요.</b> 한국에서 일하게 되어도 빠르게 적응할 수 있는 수준이에요.',
            cert: ["4~5급", "자연스러운 흐름으로 대화 가능"] },
    "9":  { name: "유학파",
            line: '복잡한 이야기도 <b>바로 알아들어요</b>',
            diag: '복잡한 내용으로 <b>심층적인 논의가 가능해요.</b> 전문적인 어휘를 쓰고, 어려운 글의 함축적인 의미까지 읽어내요.',
            cert: ["5급", "전문적인 내용도 이해 가능"] },
    "10": { name: "전문가",
            line: '어떤 자리에서도 <b>막힘이 없어요</b>',
            diag: '까다로운 주제로 <b>깊이 있는 토론이 가능해요.</b> 전문 분야에서도 자유롭게 소통하고, 전문 지식이 필요한 글도 서슴없이 읽고 말해요.',
            cert: ["6급", "어떤 자리에서도 자유롭게 소통"] }
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
  /* 항목별 문안은 아래 항목별 체크의 보기 다섯 줄이 원본이다. 보기 하나가
     두 문장을 든다: 버튼에 보이는 짧은 말은 튜터가 수업 직후에 고르는
     관찰("가끔 틀렸어요")이고, data-say 는 그 관찰을 학습자가 읽을 문장으로
     옮긴 것이다. 리포트는 뒤엣것을 쓴다 — 표를 여기 또 적지 않고 DOM 에서
     읽으므로, 튜터가 고른 칸과 리포트에 실리는 문장이 어긋날 수 없다. 한 칸이 두 레벨(1–2 · 3–4 …)을 덮으므로 색인은
     (lv - 1) / 2 이고, band() 가 짝수 값이 들어와도 같은 칸으로 접는다. */
  var BAND = {};
  document.querySelectorAll(".axq").forEach(function (q) {
    BAND[q.getAttribute("data-ax")] = [].map.call(
      q.querySelectorAll(".axq-opts button"),
      function (b) { return b.getAttribute("data-say"); });
  });

  /* 코멘트에 들어갈 「무엇을 하면 느는가」. HINT 와 따로 두는 이유는 꼴이
     달라서다 — HINT 는 목록에 놓이는 「…하기」 이고, 이쪽은 문장 가운데에
     들어가 「…것이 중요해요」 로 닫힌다. */
  var GROW = {
    acc: "단어와 문법의 뜻·쓰임을 정확히 알고, 맞는 상황에서 직접 써 보는 것",
    voc: "많이 읽어 단어를 알고, 그 단어를 대화에서 실제로 써 보는 것",
    flu: "여러 사람과 자주 주고받으며 말하는 양을 늘리는 것",
    pron: "원어민의 발음과 억양을 많이 듣고 그대로 따라 해 보는 것",
    lis: "여러 속도와 억양에 익숙해질 때까지 자주 들어 보는 것"
  };
  /* 받침이 있으면 과/이, 없으면 와/가. 항목 이름이 다섯뿐이라 표로 둘 수도
     있지만, 코멘트가 이름을 조합해 문장을 만들므로 규칙으로 두는 편이 안전하다. */
  function hasBatchim(word) {
    var c = word.charCodeAt(word.length - 1) - 0xac00;
    return c >= 0 && c <= 11171 && c % 28 !== 0;
  }
  function josa(word, withT, withoutT) { return word + (hasBatchim(word) ? withT : withoutT); }

  var HINT = {
    flu: "다양한 상황에서 소통하는 경험을 늘리기 — 사람과 한국어로 주고받은 양이 그대로 유창성이 돼요.",
    acc: "단어와 문법의 정확한 뜻·쓰임을 이해하고, 맞는 상황에서 직접 써 보며 충분히 연습하기.",
    pron: "정확한 발음·억양·리듬을 쓰는 원어민의 한국어를 많이 듣고, 그대로 따라 하며 내 것으로 만들기.",
    lis: "한국어의 다양한 억양과 속도에 친숙해지기 — 빠르게 말해도 들릴 때까지 여러 사람과 대화해 보기.",
    voc: "많이 읽어 단어를 알고, 그 단어가 어떤 맥락에서 쓰이는지 원어민과 대화하며 계속 익히기."
  };

  /* ---------- 견줄 자리 ----------
     포도 수강생 전체의 항목별 평균. 목표선 대신 이걸 옆에 두는 이유는, 처음
     온 사람에게 "Lv.3" 은 아무 크기도 아니어서다 — 옆에 사람이 서 있어야
     비로소 높이가 보인다.

     다섯 값이 고르지 않은 건 일본어 화자가 한국어를 배울 때 실제로 그렇게
     기울기 때문이다. 어휘가 가장 높다(한자어가 그대로 겹친다: 約束-약속,
     無理-무리). 정확성이 그다음 — 어순도 조사도 경어도 거의 같은 자리에
     있어서 문장 구조가 일찍 잡힌다. 듣기는 겹치는 어휘 덕에 중간.
     유창성은 알아듣는 것보다 늘 늦게 오고, 발음이 가장 낮다: 모음이 5개뿐이라
     ㅓ/ㅗ·ㅜ/ㅡ가 붙고, 평음·경음·격음 3항 대립이 없으며, 받침이 없다.
     TODO(데이터): 실제 코호트 수치가 나오면 숫자만 갈아끼운다 —
     레이더와 막대가 함께 따라간다. */
  var AVG = { voc: 4.4, acc: 3.8, lis: 3.4, flu: 2.9, pron: 2.3 };

  /* ---------- 목표 ----------
     학습 동기 하나가 사다리 하나고, 그 사다리의 세 칸이 여기 세 줄이다.
     lv 는 그 목표가 도착하는 레벨이고, 걸리는 레슨 수는 따로 두지 않고
     DONE[lv] 에서 읽는다 — 같은 레벨인데 어느 줄을 눌렀느냐로 기간이
     달라지면 튜터가 설명할 수 없다. */
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
  /* 마지막 마디에서 계획을 처음 고른 이유로 되묶는 한 줄. 로드맵의 끝은 코스가
     끝나는 자리가 아니라 「이걸 하려고 배웠지」 로 돌아오는 자리다. */
  var WHY = {
    kpop:   "K-POP·드라마를 자막 없이 즐기는 데까지, 이 순서가 가장 빨라요.",
    travel: "여행 전에 맞추려고 읽는 힘과 가게에서 쓰는 표현을 먼저 넣었어요.",
    friend: "한국인 친구·연인과 이야기하려면 반말까지가 사정권이에요.",
    work:   "일에서 쓰려면 문법 토대가 필요해서 패턴을 두껍게 잡았어요.",
    topik:  "TOPIK의 토대가 되는 문법부터 차례대로 쌓는 순서예요.",
    self:   "무리 없이 이어갈 수 있게, 조금씩 쌓이는 순서로 짰어요.",
    other:  "오늘 들은 희망에 맞춰 순서를 짰어요."
  };
  // the tutor's level call -> lessons already effectively covered.
  var DONE = { "1": 0, "2": 11, "3": 25, "4": 45, "5": 70,
               "6": 90, "7": 110, "8": 130, "9": 150, "10": 170 };

  /* 이름과 순서는 뒤의 「커리큘럼」 장과 같다 — 리포트가 추천한 코스를
     그 장에서 그대로 짚어 설명할 수 있어야 한다.

     can = 그 코스를 마치면 할 수 있게 되는 일. 카드에서 두 번째로 큰 글자다.
           「간판이 읽혀요」 처럼 두 마디로 끊으면 짧은 대신 무엇을 읽는다는
           건지가 빠지므로, 대상까지 넣어 한 문장으로 세운다.
     art = 그 코스에서 실제로 하는 일 한 장. 설명문 대신 이것이 카드의 가운데를
           차지한다. 코스가 배우는 일의 모양이 서로 달라 한 틀에 못 담기므로
           kind 가 셋이다 — han(글자를 조립한다) · pat(틀을 갈아 낀다) ·
           talk(말을 주고받는다). 그리는 곳은 artHTML().
     ico = ✓ 띠에 서는 그림. 니즈 페이지 「학습 동기」 의 그림을 키로 가리킨다 —
           새 그림을 만들지 않는 것이 핵심이다. 여행 코스의 얼굴이 「여행」 이라는
           이유의 얼굴과 같아야, 처음 고른 이유와 지금 보고 있는 코스가 같은
           물건으로 이어진다. 아직 짝이 없는 코스는 비워 둔다 — 없는 그림을
           엉뚱한 것으로 메우느니 ✓ 로 남는 편이 낫다(doMark()).
           새 그림이 필요한 셋은 trial/assets/course-icons-prompt.md 에 적어 두었다.

     n = 그 코스의 레슨 수(tracks/ 의 목차 그대로). 핵심 패턴만 n 이 없다 —
     통째로 떼고 넘어가는 코스가 아니라서, 다음 코스의 입장 바닥까지만 세고
     나머지 과는 그 뒤로도 계속 함께 간다. courseLen() 이 그때그때 잰다. */
  var COURSE = {
    hangul: { n: 14, t: "한글 읽기", ico: "hangul",
              can: "거리 간판과 메뉴판을 소리 내어 읽어요",
              art: { kind: "han",
                     blocks: [{ c: "ㅋ", v: "ㅏ", s: "카" }, { c: "ㅍ", v: "ㅔ", s: "페" }],
                     cap: "자음과 모음이 만나 한 글자 — 그래서 「카페」가 읽혀요" } },
    core:   { t: "핵심 패턴", ico: "core",
              can: "내 소개와 하루 일을 문장으로 말해요",
              art: { kind: "pat", pre: "저는", slot: "일본사람", post: "입니다.",
                     words: ["학생", "요리사"],
                     cap: "문장 구조는 그대로, 가운데 한 자리만 내 단어로" } },
    travel: { n: 40, t: "상황별 · 여행", ico: "travel",
              can: "가게에서 주문하고 길을 물어요",
              art: { kind: "talk", pics: ["travel1", "travel2", "travel3"],
                     turns: [["me", "혹시 명동역이 [어딘지 아세요]?"],
                             ["", "이쪽으로 [쭉 가시면 돼요]."]],
                     cap: "길에서 · 가게에서 진짜 오가는 말을 그대로" } },
    drama:  { n: 40, t: "상황별 · 드라마", ico: "drama",
              can: "드라마 대사가 자막 없이 들려요",
              art: { kind: "talk", pics: ["drama1", "drama2", "drama3"],
                     turns: [["", "우리 어디서 [본 적 있지 않아요]?"],
                             ["me", "아… 저 그 카페에서 [봤어요]."]],
                     cap: "드라마에 나온 대사를 그대로 주고받아요" } },
    banmal: { n: 20, t: "상황별 · 반말 수다", ico: "friend",
              can: "친구에게 말을 놓고 수다 떨어요",
              art: { kind: "talk", pics: ["banmal1", "banmal2", "banmal3"],
                     turns: [["", "너 지금 어디 [가는 거야]?"],
                             ["me", "나 편의점. 같이 [갈래]?"]],
                     cap: "요를 떼고, 친구에게 하는 말투로" } },
    // 프리토킹은 끝이 없다(주제가 매주 는다). 40 은 「한 번에 이만큼 판다」 는
    // 명목값이지 트랙의 분량이 아니다 — plan-logic.md 에 그렇게 적어 두었다.
    free:   { n: 40, t: "프리토킹", ico: "free",
              can: "내 생각과 그 이유까지 말해요",
              art: { kind: "talk", pics: ["free1", "free2", "free3"],
                     turns: [["", "돈과 시간, 하나만 가질 수 있다면요?"],
                             ["me", "저는 시간이요. [돈은 다시 벌 수 있으니까요]."]],
                     cap: "생각 하나에 이유 하나 — 문장을 이어서 말해요" } }
  };
  var CORE_N = 116;                    // 핵심 패턴 전체 과 수
  /* 상황별 커리큘럼의 입장 바닥 — 핵심 몇 과까지 하면 들어갈 수 있는가.
     tracks/3-contextual-korean 의 표 그대로다. 문(gate)이 아니라 권고라서,
     그 위의 문법은 「덩어리」로 통째로 익히고 넘어간다.
     프리토킹은 트랙이 「이미 초중급 패턴을 쥔 학습자」를 전제하므로 초중급 끝(65). */
  var ENTRY = { drama: 71, travel: 57, banmal: 45, free: 65 };

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
        // 항목 하나를 고르면 「고치는 중」 은 끝난다 — 다음 항목이 열린다
        if (key.indexOf("ax-") === 0) editing = null;
        if (key === "level") lvEditing = false;
        render();
      });
    });
  });

  /* ---- 지금 서 있는 레벨들 ----
     종합은 아직 안 골랐으면 1 — 레벨 체크의 "대부분 1이에요" 가 말하는 그
     기본값이다. 항목별은 손대지 않았으면 종합을 그대로 따라간다. */
  function overall() { return clamp(Number(pick.level || 1)); }
  /* 아직 안 고른 항목은 0 이다 — 종합 레벨로 대신 채우지 않는다. 채워 두면
     레벨을 고르는 순간 오각형이 이미 완성돼 버려서, 튜터가 다섯 항목을
     고르는 동안 학습자 화면에서는 아무 일도 일어나지 않는다. 종합 레벨은
     이제 보기 옆의 「추천」 으로만 남는다: 제안이지 값이 아니다. */
  function areaLv(k) { var v = Number(pick["ax-" + k]); return v ? clamp(v) : 0; }
  function rated(k) { return !!pick["ax-" + k]; }
  function allRated() { return AREAS.every(function (a) { return rated(a.k); }); }
  function clamp(n) { return Math.max(1, Math.min(LADDER_STEPS, n || 1)); }
  // 한 칸이 두 레벨을 덮는다: 1–2 → 0, 3–4 → 1 … 9–10 → 4
  function band(lv) { return Math.max(0, Math.ceil(clamp(lv) / 2) - 1); }
  // 10칸 사다리 위의 자리. 평균은 2.6 처럼 칸 사이에 서므로 칸 중앙이 아니라
  // 눈금값 그대로 재야 레이더(반지름 = lv/10)와 같은 곳을 가리킨다.
  function pct(lv) { return lv ? clamp(lv) * 10 : 0; }
  // 항목을 잘하는 순으로. 「좋아요/아쉬운 점」·막대 색·추천이 모두 이 한
  // 줄에서 나오므로, 세 곳이 서로 다른 항목을 가리키는 일이 없다.
  function ranked() {
    return AREAS.filter(function (a) { return rated(a.k); })
                .sort(function (a, b) { return areaLv(b.k) - areaLv(a.k); });
  }

  /* ---- 날짜 ----
     리포트 머리글의 날짜와 수강료 쿠폰의 마감일은 같은 "오늘" 에서 나온다.
     상담은 오늘 하는 것이라, 문서에 날짜를 적어 두면 반드시 어긋난다. */
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function stampDates() {
    var d = new Date(), el = document.querySelector(".rm-date");
    if (el) {
      el.textContent = d.getFullYear() + "." +
        String(d.getMonth() + 1).padStart(2, "0") + "." +
        String(d.getDate()).padStart(2, "0");
    }
    // 쿠폰은 오늘 포함 나흘째 자정에 닫힌다(D+3)
    var end = new Date(d.getTime() + 3 * 86400000);
    var big = document.querySelector(".dl-date");
    if (big) big.textContent = (end.getMonth() + 1) + "월 " + end.getDate() + "일(" +
      DOW[end.getDay()] + ") 23:59";
    var cells = document.querySelectorAll(".dl-days > div");
    for (var i = 0; i < cells.length; i++) {
      var x = new Date(d.getTime() + i * 86400000);
      cells[i].querySelector(".d").textContent = (x.getMonth() + 1) + "/" + x.getDate();
      if (i > 0 && i < cells.length - 1) cells[i].querySelector(".w").textContent = DOW[x.getDay()];
    }
  }

  /* ---- 레벨 체크는 고르고 나면 접힌다 ----
     고른 뒤에도 다섯 줄이 펼쳐져 있으면, 카드에서 정작 봐야 할 것(레벨과
     근거)보다 고르는 칸이 더 길다. 접으면 고른 한 줄만 남는다.
     「다시 고르기」 는 이 화면만의 상태라 공유하지 않는다 — 튜터가 무엇을
     열어 두었는지는 학습자와 아무 상관이 없다. */
  var lvEditing = false;
  var lvcheck = document.querySelector(".lvcheck");
  if (lvcheck) {
    lvcheck.querySelector(".lvcheck-redo").addEventListener("click", function () {
      lvEditing = true;
      render();
    });
  }

  function renderLevelPick() {
    if (!lvcheck) return;
    lvcheck.classList.toggle("folded", !!pick.level && !lvEditing);
  }

  /* ---- 항목별 체크 · 한 번에 한 항목 ----
     다음 차례는 「아직 안 고른 첫 항목」 이다 — 어디까지 했는지를 따로 세지
     않으니 되돌아가 고쳐도 순서가 꼬이지 않는다. 칩을 누르면 그 항목을 다시
     열고(editing), 고르는 순간 다시 자동 진행으로 돌아간다.
     editing 은 공유하지 않는다: 튜터가 지금 어느 칸을 보고 있는지는 튜터의
     화면 사정이고, 학습자에게는 이 블록 자체가 없다. */
  var editing = null;
  var steps = document.querySelector(".axsteps");
  var chips = steps && steps.querySelector(".axst-chips");

  if (chips) {
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-ax]");
      if (!b) return;
      editing = b.getAttribute("data-ax");
      render();
    });
  }

  function renderAxSteps() {
    if (!steps) return;
    var nextUp = null;
    AREAS.forEach(function (a) { if (!nextUp && !pick["ax-" + a.k]) nextUp = a.k; });
    var open = editing || nextUp;

    chips.innerHTML = "";
    AREAS.forEach(function (a) {
      var own = pick["ax-" + a.k];
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-ax", a.k);
      b.className = (own ? "done" : "") + (a.k === open ? " now" : "");
      b.textContent = a.n;
      chips.appendChild(b);
    });

    steps.querySelectorAll(".axq").forEach(function (q) {
      var k = q.getAttribute("data-ax");
      q.classList.toggle("now", k === open);
      /* 종합 레벨과 같은 칸을 「추천」 으로 짚어 준다. 값을 넣지는 않는다 —
         튜터가 눌러야 값이 된다. 이미 고른 항목에는 표시하지 않는다:
         고른 뒤에도 남으면 자기가 고른 것과 제안이 헷갈린다. */
      q.querySelectorAll(".rung-row").forEach(function (b) {
        b.classList.toggle("sug",
          !rated(k) && Number(b.getAttribute("data-val")) === overall());
      });
    });
    steps.classList.toggle("all", !nextUp && !editing);
  }

  /* ---- ① 내 레벨 카드 ---- */
  var card = document.querySelector(".lvcard");

  function renderLevel() {
    if (!card) return;
    var n = overall(), d = LV[String(n)];
    card.querySelector(".lvbig-n b").textContent = "Lv." + n;
    card.querySelector(".lvbig-l").innerHTML = d.line;
    card.querySelector(".lvbig-img").src = srcOf(".lv-src", "lv", n);
    card.querySelector(".lvbig-img").alt = "Lv." + n + " · " + d.name;
    card.querySelector(".topikrow i").textContent = "TOPIK " + d.cert[0];
    card.querySelector(".topikrow span").textContent = d.cert[1];

    /* 근거는 실제로 체크한 항목에서만 나온다 — 가장 잘 되는 둘. 아직 하나도
       체크하지 않았으면 근거 칸 자체를 비워 둔다: 없는 근거를 지어내느니
       레벨과 한 줄 설명만 보이는 편이 낫다. */
    var top2 = ranked().slice(0, 2), ul = card.querySelector(".lv-ev");
    ul.innerHTML = "";
    ul.classList.toggle("hide", !top2.length);
    top2.forEach(function (a) {
      var li = document.createElement("li");
      li.innerHTML = '<i>✓</i><span>' + a.n + " · " + BAND[a.k][band(areaLv(a.k))] + '</span>';
      ul.appendChild(li);
    });
  }

  /* ---- ② 항목별 진단 · 레이더 + 다섯 줄 ---- */
  var bars = document.querySelector(".axbars");

  function renderAspects() {
    growRadar();
    if (!bars) return;
    var order = ranked();

    // 다섯 줄은 언제나 같은 순서(정확성→듣기)로 선다. 순위대로 세우면
    // 튜터가 값을 고칠 때마다 줄이 자리를 바꿔, 어디를 보는지 놓친다.
    bars.innerHTML = "";
    AREAS.forEach(function (a) {
      var row = document.createElement("div");
      row.className = "axb";
      /* 평균은 두 번째 막대가 아니라, 트랙의 0→평균 구간을 그대로 따라 그린
         점선 캡슐이다 — 막대와 같은 높이·같은 자리에 겹치므로 줄이 두꺼워지지
         않고, 그러면서도 평균이 「길이」 로 말해진다. 캡슐은 초록 위에 얹혀
         끝까지 보인다(trial.css 의 .axb-avg). */
      row.innerHTML = '<span class="axb-n">' + a.n + '</span>' +
        '<span class="axb-t"><b class="axb-avg" style="width:' + pct(AVG[a.k]) + '%"></b>' +
        '<i class="axb-f" style="width:' + pct(areaLv(a.k)) + '%"></i></span>';
      bars.appendChild(row);
    });

    /* 다섯을 다 보기 전에는 잘하는 쪽도 아쉬운 쪽도 말할 수 없고, 다섯이
       모두 같으면 말할 것이 없다. 둘 중 하나라도 걸리면 두 상자를 접는다 —
       아직 안 본 항목을 약점이라고 말해 버리는 것이 가장 나쁜 결과다. */
    var flat = !order.length || !allRated() ||
               areaLv(order[0].k) === areaLv(order[order.length - 1].k);
    document.querySelector(".axsum").classList.toggle("hide", flat);
    document.querySelector(".axtip").classList.toggle("hide", flat);
    if (flat) return;

    /* 항목은 이름만 적힌 줄이 아니라 그림을 단 칩으로 선다. 두 상자가 나란히
       서 있고 각 상자에 둘씩이라, 네 항목을 훑는 눈이 글자를 읽기 전에 그림으로
       먼저 짚는다. 그림이 아직 없는 항목(발음)은 글자만 있는 칩으로 남는다 —
       빈 네모를 두느니 없는 채로 두는 편이 낫다. */
    var chip = function (a) {
      var src = srcOf(".ax-src", "ax", a.k);
      return "<li>" + (src ? '<i><img src="' + src + '" alt=""></i>' : "") +
             "<b>" + a.n + "</b></li>";
    };
    var good = document.querySelector(".axs:not(.weak) ul");
    var weak = document.querySelector(".axs.weak ul");
    good.innerHTML = ""; weak.innerHTML = "";
    order.slice(0, 2).forEach(function (a) { good.innerHTML += chip(a); });
    order.slice(-2).forEach(function (a) { weak.innerHTML += chip(a); });

    /* 코멘트는 위 두 상자를 한 문장으로 잇는다: 잘하는 둘을 이름으로 부르고,
       아쉬운 둘을 기르는 방법을 붙인다. 방법은 가장 처지는 항목의 HINT 다 —
       둘 다 적으면 문단이 길어지고, 튜터가 읽어 줄 말이 아니게 된다. */
    var good2 = order.slice(0, 2), weak2 = order.slice(-2);
    // 이름을 이을 때도 문장을 닫을 때도 앞말의 받침을 따라간다
    var nm = function (xs) {
      return xs.map(function (a, i) {
        var b = "<b>" + a.n + "</b>";
        return i < xs.length - 1 ? b + (hasBatchim(a.n) ? "과 " : "와 ") : b;
      }).join("");
    };
    var lastOf = function (xs) { return xs[xs.length - 1].n; };
    document.querySelector(".axtip p").innerHTML =
      "포도님은 " + nm(good2) + (hasBatchim(lastOf(good2)) ? "이" : "가") + " 좋은 편이에요.<br>" +
      nm(weak2) + (hasBatchim(lastOf(weak2)) ? "을" : "를") + " 키우려면 " +
      GROW[order[order.length - 1].k] + "이 중요해요.";
  }

  /* 오각형. 지금(초록 채움)은 튜터가 고른 항목별 레벨, 점선 외곽은 체험
     수업을 받은 분들의 평균이다. 평균은 배경 쪽 정보라 점만 찍지 않고
     윤곽선으로만 두고, 초록 면을 그 위에 얹는다. */
  var svg = document.getElementById("radar");

  /* 지금 화면에 그려져 있는 값. 목표값(areaLv)과 따로 두는 이유는 항목을
     하나 고를 때마다 그 축이 자라나는 게 보여야 해서다 — 튜터는 고르고,
     학습자는 자기 오각형이 커지는 걸 본다. 0 에서 시작하므로 첫 그림도
     가운데에서 피어난다. */
  var shown = {};
  AREAS.forEach(function (a) { shown[a.k] = 0; });
  var raf = null;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function growRadar() {
    var from = {}, to = {}, moved = false;
    AREAS.forEach(function (a) {
      from[a.k] = shown[a.k];
      to[a.k] = areaLv(a.k);
      if (Math.abs(to[a.k] - from[a.k]) > 0.01) moved = true;
    });
    if (!moved) { drawRadar(); return; }
    if (still) {
      AREAS.forEach(function (a) { shown[a.k] = to[a.k]; });
      drawRadar();
      return;
    }
    if (raf) cancelAnimationFrame(raf);
    var t0 = null, DUR = 420;
    raf = requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      var e = 1 - Math.pow(1 - p, 3);          // 빠르게 나갔다 부드럽게 멎는다
      AREAS.forEach(function (a) { shown[a.k] = from[a.k] + (to[a.k] - from[a.k]) * e; });
      drawRadar();
      raf = p < 1 ? requestAnimationFrame(step) : null;
    });
  }

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
                       "font-weight": "700", fill: "#2b2b2b",
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
    for (i = 0; i < N; i++) np.push(P(i, shown[AREAS[i].k] / LADDER_STEPS));
    svg.appendChild(el("polygon", { points: poly(np), fill: "rgba(106,190,54,.20)", stroke: "#6abe36",
                                    "stroke-width": "1.75", "stroke-linejoin": "round" }));
    for (i = 0; i < N; i++) {
      d = P(i, shown[AREAS[i].k] / LADDER_STEPS);
      svg.appendChild(el("circle", { cx: d[0].toFixed(1), cy: d[1].toFixed(1), r: "2.6",
                                     fill: "#6abe36", stroke: "#fff", "stroke-width": "1" }));
    }
  }

  /* ---- 학습 순서는 한 곳에서만 정해진다 ----
     ④-A 시작 커리큘럼 카드, 그래프의 마디, 아래 학습 순서 카드가 모두 이
     목록을 읽는다. 세 곳이 각자 고르면 언젠가 서로 다른 코스를 말한다.
     무엇을 배우는지는 이유가, 어디까지 가는지는 목표가 정한다. 상황별은
     둘까지만 얹는다 — 마디가 다섯이 되면 그래프 라벨이 서로 겹치고,
     학습 순서라기보다 목록이 된다. */
  function courseList(goalLv) {
    var lv = overall();
    var extras = [], why0 = pick.why && pick.why.length ? pick.why[0] : null;
    (pick.why || []).forEach(function (w) {
      var k = WHY_COURSE[w];
      if (k && extras.indexOf(k) < 0) extras.push(k);
    });
    // Lv.8 위는 프리토킹 없이 설명이 안 되는 높이라, 그 자리를 비워 둔다
    extras = goalLv >= 8
      ? extras.filter(function (k) { return k !== "free"; }).slice(0, 1).concat("free")
      : extras.slice(0, 2);
    // 첫 번째 이유의 코스는 맨 뒤로. 마지막 마디가 곧 「목표」 라서, 리포트가
    // 부르는 목표 이름과 다른 코스가 끝에 서면 도착점이 두 개로 읽힌다.
    var mainC = why0 && WHY_COURSE[why0];
    if (mainC && extras.length > 1 && extras.indexOf(mainC) >= 0 && extras[extras.length - 1] !== "free") {
      extras = extras.filter(function (k) { return k !== mainC; }).concat(mainC);
    }
    // never recommend a course the learner has already passed
    var all = ["hangul", "core"].concat(extras);
    var out = all.filter(function (k) {
      if (k === "hangul") return lv < 2;
      if (k === "core") return lv < 5;
      return true;
    });
    return out.length ? out : [all[all.length - 1]];
  }

  /* ---- ③ 원하는 레벨까지 ----
     주당 횟수는 앞의 「학습 페이스」 장에서 한 번 정해지고, 여기 슬라이더가
     그 값을 이어받아 실제로 굴린다. 둘은 같은 것을 가리키므로 한쪽을 움직이면
     다른 쪽도 따라간다 — 상담 중에 「그럼 주 6회면요?」 를 손으로 답하는 자리다. */
  var freq = document.querySelector(".freq-range");
  if (freq) {
    freq.addEventListener("input", function () {
      pick.pace = freq.value;
      render();
    });
  }
  /* 이어받는 쪽이 없으면 「이어받는다」 는 말은 주석에만 있는 것이다 — 앞 장에서
     주 5회를 골라도 슬라이더가 3 에 그대로 서 있었고, perWeek() 는 언제나 값이
     있는 슬라이더를 먼저 읽으므로 고른 페이스가 계획에 한 번도 닿지 않았다.
     그래서 그리기 전에 한 번 맞춘다. 값을 코드로 넣는 것은 input 을 일으키지
     않으므로 되돌아오는 고리는 생기지 않고, 슬라이더를 끌면 그쪽이 pick.pace 를
     덮으므로 마지막에 만진 것이 이긴다.
     보드로 건너가는 것은 「앞 장에서 무엇을 골랐나」 하나뿐이다 — 슬라이더 위치는
     양쪽이 각자 같은 규칙으로 다시 얻는다(interaction-protocol.md 의 「파생된
     값은 보내지 않는다」). */
  function syncFreq() {
    if (freq && pick.pace && Number(freq.value) !== Number(pick.pace)) freq.value = pick.pace;
  }
  function perWeek() { return Number((freq && freq.value) || pick.pace || 3); }

  var rcourse = document.querySelector(".freq");
  var rjCourse = document.querySelector(".rj-course");

  /* 기간·레슨·페이스 세 칸. 셋이 길과 한 덩어리라, 목표가 없어서 숫자를 못
     내놓을 때는 덩어리째 감추고 「고르러 가기」 한 줄만 남긴다 — 빈 칸을 남겨
     두면 붙어 있는 이음매가 어긋나 한 판이 깨져 보인다. */
  function renderCourseCard() {
    if (!rcourse) return;
    var g = GOALS[pick.goal], fuse = document.querySelector(".pm-fuse");
    // 페이스는 슬라이더가 늘 값을 들고 있으므로, 비어 있을 수 있는 건 목표뿐이다
    if (!g) {
      if (fuse) fuse.classList.add("hide");
      if (rjCourse) {
        rjCourse.classList.remove("hide");
        rjCourse.href = "#p-goal";
        rjCourse.querySelector(".rj-t").textContent = "목표를 아직 안 골랐어요";
      }
      return;
    }
    if (fuse) fuse.classList.remove("hide");
    if (rjCourse) rjCourse.classList.add("hide");

    var per = perWeek(), need = planNeed();
    if (freq) freq.value = per;
    rcourse.querySelector(".freq-n").textContent = per;
    document.querySelector(".eta").textContent = months(need, per) + "개월";
    /* 레슨 수는 페이스와 무관하다 — 주 1회든 7회든 배울 분량은 같고 걸리는
       기간만 달라진다. 슬라이더를 끌 때 이 칸이 안 움직이는 것이 정상이다. */
    document.querySelector(".need").textContent = need;
  }


  /* ---- ④ 커리큘럼 로드맵 ----
     길은 Figma 삽화 그대로 고정된 뱀 모양이고 점이 일곱이다. 다음/이전은 그
     점을 하나씩 밟는다 — 칸을 코스 수로 나누면 추천이 두 코스일 때 점 일곱 중
     다섯이 아무도 서지 않는 자리가 된다. 그림에 점이 일곱이면 걸음도 여섯이다.
     칸 i 는 여정의 i/6 지점이라 모퉁이 점(2·4·6)이 정확히 ⅓·⅔·끝에 떨어지고,
     그림에 박힌 「1개월·2개월·3개월」 라벨이 바로 그 세 자리다. */
  var roadCard = document.querySelector(".road-card");
  var road = roadCard && roadCard.querySelector(".road-svg");
  var roadStep = 0;
  /* 걸음은 추천 코스의 수다. 전에는 그림에 박힌 점 일곱이 걸음 수였는데, 그러면
     코스가 셋인 사람도 일곱 번을 눌러야 하고 그중 넷은 앞 칸과 같은 코스를 다시
     보여 주는 빈 걸음이었다. 이제 마디 하나가 코스 하나고, 0칸은 「지금」 이다. */
  var STEPS = 1;

  function roadStops() {
    var g = GOALS[pick.goal];
    return courseList(g ? g.lv : overall() + 2);
  }
  /* 칸 하나가 코스 하나 — 0칸이 곧 첫 코스다. 마지막 칸만 코스가 없다:
     거기는 밟는 자리가 아니라 다다른 자리라서, 코스 대신 도착한 레벨을 편다. */
  function courseAt(step) {
    var cs = roadStops();
    return step >= cs.length ? null : cs[step];
  }

  /* 목표까지 남은 레슨 수. 기간도 마디의 시각도 전부 이 하나에서 나온다 —
     분모가 둘이면 「45과만 하면 되는 반말」이 「71과가 필요한 드라마」보다 늦게
     갈라지는 것처럼 그려진다(코스 목록이 짧을수록 각 코스의 몫이 커져서다). */
  function planNeed() {
    var g = GOALS[pick.goal];
    return g ? Math.max(6, DONE[String(g.lv)] - DONE[String(overall())]) : 24;
  }
  // 지금 레벨이면 핵심 패턴을 몇 과까지 뗀 셈인가 (누적 레슨에서 한글을 뺀다)
  function coreDone() {
    return Math.max(0, Math.min(CORE_N, (DONE[String(overall())] || 0) - COURSE.hangul.n));
  }
  /* 코스가 로드맵에서 차지하는 길이. 핵심 패턴만 계산해서 낸다 — 116과를
     통째로 떼고 나서야 다음으로 넘어가는 코스가 아니기 때문이다. 필요한 만큼만
     밟고 상황별·프리토킹으로 넘어간 뒤, 나머지 과는 그 뒤로도 계속 함께 간다.
     그래서 여기서 세는 것은 「끝낼 분량」이 아니라 「넘어가기 전까지의 분량」이고,
     그 값은 다음 코스의 입장 바닥이다. 핵심이 마지막 코스면 목표 레벨까지. */
  function courseLen(key, stops, i) {
    if (COURSE[key].n) return COURSE[key].n;
    var next = stops[i + 1], g = GOALS[pick.goal];
    var upto = next ? (ENTRY[next] || CORE_N)
                    : Math.min(CORE_N, Math.max(0, (DONE[String(g ? g.lv : overall() + 2)] || 0) - COURSE.hangul.n));
    return Math.max(6, upto - coreDone());
  }

  /* 길과 점은 Figma 에서 내려받은 좌표 그대로다. 손으로 다시 풀면 모퉁이
     반지름이 좌우로 다르다는 것(오른쪽 18.13, 왼쪽 19.87)부터 놓친다.
     양 끝만 원본(x=6 … x=248.819)에서 첫 점·끝 점의 한가운데로 당겨 두었다.
     원본은 길이 점 밖으로 8 남짓 더 나가는데, 회색일 때는 안 보이던 그 꼬리가
     초록이 차오르면 「지금」 왼쪽에 반달로 튀어나온다 — 둥근 마감이 점 밑에
     정확히 묻히도록 끝을 점 중심에 맞춘다. */
  var ROAD_D = "M14.06 10.3438H127.409H230.688C240.701 10.3438 248.819 18.4612 248.819 " +
    "28.4745C248.819 38.4878 240.701 46.6052 230.688 46.6052H131.525H34.1004C23.1269 " +
    "46.6052 14.2311 55.501 14.2311 66.4745C14.2311 77.448 23.1269 86.3438 34.1004 " +
    "86.3438H131.525H248.879";
  /* 그림에 박힌 일곱 자리. 코스가 둘이든 넷이든 길은 언제나 같은 모양이어야
     하므로 점의 수는 고정이고, 코스는 그중 몇 자리에만 선다 — 나머지는 이름
     없는 눈금으로 남는다. 좌표는 Figma 원본 그대로. */
  var ROAD_DOTS = [[14.06, 10.3438], [127.06, 10.3438], [248.879, 28.4745],
                   [127.06, 46.6052], [14.1207, 66.4745], [127.06, 86.3438],
                   [248.879, 86.3438]];
  var LAST_DOT = ROAD_DOTS.length - 1;
  var roadEls = null, roadFracs = null, roadShown = 0, roadRaf = null;
  // 일곱 자리의 길 위 비율 / 코스가 선 자리 / 코스가 끝나는 진짜 비율
  var dotFracs = null, stopAt = null, stopTrue = null;

  /* 점이 길의 몇 퍼센트 지점인가. 호가 섞인 경로라 손으로 푸는 대신 길을 잘게
     훑어 가장 가까운 표본을 고른다 — 길 모양을 고쳐도 따라온다. */
  function measureDots(p) {
    var L = p.getTotalLength(), N = 600, pts = [], i;
    for (i = 0; i <= N; i++) pts.push(p.getPointAtLength(L * i / N));
    return ROAD_DOTS.map(function (d) {
      var best = 0, bd = Infinity, k;
      for (k = 0; k <= N; k++) {
        var dx = pts[k].x - d[0], dy = pts[k].y - d[1], q = dx * dx + dy * dy;
        if (q < bd) { bd = q; best = k; }
      }
      return best / N;
    });
  }

  /* 코스가 끝나는 자리를 일곱 점 중 하나로 스냅한다. 자리는 코스 길이의 누적
     비율이고 — 균등하게 나누면 14과짜리 한글 읽기가 116과짜리 핵심 패턴과 같은
     폭을 먹는다 — 그 비율에 가장 가까운 점을 고른다.
     뒤에 남은 코스만큼 점을 남겨 둬야 두 코스가 한 점에 겹치지 않는다.
     마지막 코스는 언제나 끝점이다: 거기가 목표다. */
  /* 라벨이 설 자리. 길은 세 줄이고 줄과 줄 사이 빈 띠가 라벨의 자리인데, 그
     띠의 한쪽 끝은 굽이가 차지하고 있다 — 오른쪽 굽이는 첫째 띠의 오른쪽을,
     왼쪽 굽이는 둘째 띠의 왼쪽을 먹는다. 점이 굽이에 서면 라벨을 그 반대편
     안쪽으로 밀어 붙인다. 셋째 띠(길 아래)는 끝까지 비어 있다.
     자리는 점마다 고정이므로 라벨도 점마다 하나씩 미리 세워 두고, 나중에 글자만
     갈아 끼운다 — 계획이 바뀔 때마다 SVG 를 다시 짓지 않아도 된다.
     y 는 기준선이라 글자 크기를 줄이면 라벨이 통째로 내려앉는다. 띠 안에서
     보이는 자리(글자의 윗줄)를 그대로 두려고, 줄어든 어센트만큼(3.7) 세 줄을
     함께 끌어올려 둔 값이다. */
  function capPlace(i) {
    if (i === 0) return { x: 14.06, y: 27.3, a: "middle" };          // 지금
    if (i === LAST_DOT) return { x: 254.879, y: 108.3, a: "end" };   // 도착
    var x = ROAD_DOTS[i][0], y = ROAD_DOTS[i][1];
    if (y < 30) return x > 232 ? { x: 232, y: 27.3, a: "end" } : { x: x, y: 27.3, a: "middle" };
    if (y < 70) return x < 31 ? { x: 31, y: 66.3, a: "start" } : { x: x, y: 66.3, a: "middle" };
    return { x: x, y: 108.3, a: "middle" };
  }

  /* 뼈대는 한 번만 짓는다 — 길, 일곱 점, 일곱 후광, 일곱 라벨 자리. 어느 점이
     정거장이고 무엇이 적히는지는 계획이 정하는 것이라 layoutRoad()·drawRoad()
     가 매번 다시 칠한다. 전에는 이 둘이 한 덩어리라, 코스 목록은 그대로인데
     목표·레벨만 바뀌면(=마디 자리는 달라지는데) 다시 짓지 않아 옛 자리가 굳었다. */
  function buildRoad() {
    var NS = "http://www.w3.org/2000/svg";
    var el = function (t, at) { var e = document.createElementNS(NS, t);
      for (var q in at) e.setAttribute(q, at[q]); return e; };
    road.innerHTML = "";
    /* 그림을 270 폭 한가운데에 세우는 값 — 근거는 아래 첫 점·도착점의 바깥
       반지름 계산. 자세한 내력은 git 이력에 있다. */
    var g = el("g", { transform: "translate(3.4 0)" });
    road.appendChild(g);

    g.appendChild(el("path", { "class": "rd-track", d: ROAD_D, fill: "none",
                               "stroke-width": "12", "stroke-linecap": "round" }));
    /* 채워지는 쪽. pathLength 를 1 로 정규화해 두면 dasharray 를 비율로 쓸 수
       있어서, 길의 실제 길이를 몰라도 「몇 퍼센트」 로 자를 수 있다. */
    var fill = el("path", { "class": "rd-fill", d: ROAD_D, fill: "none",
                            "stroke-width": "12", "stroke-linecap": "round",
                            pathLength: "1", "stroke-dasharray": "1 1",
                            "stroke-dashoffset": "1" });
    g.appendChild(fill);
    dotFracs = measureDots(fill);

    /* 크기·색은 전부 trial.css 가 쥔다. 여기서 r 을 한 번 적어 두는 것은 CSS
       기하 속성을 모르는 브라우저용 바닥값이다. */
    var dots = ROAD_DOTS.map(function (d) {
      var c = el("circle", { "class": "rd-dot", cx: d[0], cy: d[1], r: 6 });
      g.appendChild(c); return c;
    });
    var caps = ROAD_DOTS.map(function (d, i) {
      var q = capPlace(i);
      var e = el("text", { "class": "rd-cap", x: q.x, y: q.y, "text-anchor": q.a });
      g.appendChild(e); return e;
    });
    roadEls = { fill: fill, dots: dots, caps: caps };
  }

  /* 마디를 일곱 자리에 배치한다. 자리는 코스 길이의 누적이고, 분모는 목표까지
     남은 레슨이다(§plan-logic.md). 그림에 박힌 점 중 가장 가까운 자리로 스냅하되
     뒤에 남은 마디 수만큼은 남겨 둔다 — 두 마디가 한 점에 겹치면 안 된다.
     마디 k 는 코스 k 를 「시작하는」 자리다. 끝나는 자리로 잡으면 마지막 코스의
     마디와 도착이 같은 점에서 겹친다. 첫 코스는 지금 시작하므로 0.
     stopTrue 는 스냅하기 전의 진짜 비율 — 눈금의 개월 수는 여기서 나온다.
     점은 그림에 맞춰 당겨지지만, 시각까지 당기면 그림의 근사가 숫자를 흔든다. */
  function layoutRoad(stops) {
    var lens = stops.map(function (k, i) { return courseLen(k, stops, i); });
    var need = planNeed();
    var nodes = stops.length + 1;        // 코스마다 하나 + 도착 하나
    var cum = 0, used = -1;
    stopAt = []; stopTrue = [];
    stops.forEach(function (k, i) {
      var f = i === 0 ? 0 : Math.min(0.92, need ? cum / need : 0);
      stopTrue.push(f);
      var best = 0;
      if (i > 0) {
        var bd = Infinity;
        var room = LAST_DOT - (nodes - 1 - i);   // 뒤 마디들(도착 포함) 몫
        best = used + 1;
        for (var d = used + 1; d <= room; d++) {
          var q = Math.abs(dotFracs[d] - f);
          if (q < bd) { bd = q; best = d; }
        }
      }
      used = best; stopAt.push(best);
      cum += lens[i];
    });
    // 도착 — 코스가 아니라 다다른 자리다. 언제나 끝점.
    stopTrue.push(1);
    stopAt.push(LAST_DOT);
    roadFracs = stopAt.map(function (d) { return dotFracs[d]; });
  }

  /* 초록은 「지금 어디까지 왔나」 다 — 첫 칸은 왼쪽 끝에서 시작하고, 「다음」 을
     누를 때마다 한 마디씩 차오르다가 마지막 칸에서 길 전체가 초록이 된다.
     그 마지막 칸이 도착(축하)이다.
     지나온 점은 초록에 잠겨 사라지고(.done), 지금 선 자리만 흰 속에 초록 테를
     두른다. 도착점은 아직 못 갔어도 테를 두른 채 남는다 — 지도에 목적지가
     찍혀 있어야 길이 어디로 가는지 읽힌다. */
  function setRoadStep(step, animate) {
    var target = roadFracs[step], from = roadShown;
    if (roadRaf) { cancelAnimationFrame(roadRaf); roadRaf = null; }
    /* 점은 걸음이 아니라 차오른 초록을 따른다. 목표 칸을 보고 한 번에 갈아
       끼우면 초록이 아직 기어가는 450ms 동안 초록 점들이 회색 길 위에 떠 있다.
       파도가 지나간 자리부터 하나씩 물드니, 되짚어 갈 때도 그대로 되감긴다. */
    // 지금 서 있는 걸음이 일곱 자리 중 어디인가 — 0칸은 출발점, 그 뒤는 코스 자리
    var atDot = stopAt[Math.max(0, Math.min(step, stopAt.length - 1))];
    var paint = function (f) {
      roadShown = f;
      roadEls.fill.setAttribute("stroke-dashoffset", (1 - f).toFixed(4));
      roadEls.dots.forEach(function (c, i) {
        /* 지났느냐, 지금 서 있느냐, 도착점이냐 — 점이 아는 것은 이 셋뿐이다.
           class 를 통째로 갈아 끼우므로 등급도 상태와 함께 매번 다시 쓴다. */
        var here = f >= dotFracs[i] - 1e-4;
        c.setAttribute("class", "rd-dot" + (i === LAST_DOT ? " goal" : "") +
          (!here ? "" : i === atDot ? " now" : " done"));
      });
    };
    /* 숨은 탭에서는 rAF 가 돌지 않는다 — 애니메이션에 점까지 실려 있으니,
       그대로 두면 길이 중간에 얼어붙은 채 남는다. 못 움직일 때는 건너뛴다. */
    if (!animate || still || document.hidden ||
        Math.abs(target - from) < 0.001) { paint(target); return; }
    var t0 = null, DUR = 450;
    roadRaf = requestAnimationFrame(function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      paint(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      roadRaf = p < 1 ? requestAnimationFrame(tick) : null;
    });
  }

  /* 마디 라벨은 그 코스를 마치는 때다. 자리가 길이의 누적이므로 시각도 같은
     누적에서 나온다 — 마디가 ⅓ 지점에 섰으면 기간의 ⅓ 이 지난 것이다.
     눈금이 카드와 같은 단위를 쓴다: 카드가 「3주차」 인데 길이 「1개월」 을 세고
     있으면 같은 자리를 두 잣대로 재는 셈이다. 짧은 계획에서는 앞 마디와 같은
     수로 눌리기도 하는데, 그때는 되풀이하지 않고 지운다 — 「1주 · 1주 · 2주」 는
     눈금이 아니라 실수로 읽힌다. 끝 눈금은 언제나 남는다: 그게 목표다. */
  function drawRoad(unit, suf, animate) {
    if (!road) return;
    var stops = roadStops();
    if (!roadEls) buildRoad();
    layoutRoad(stops);                 // 자리는 매번 다시 잡는다 — 목표·레벨·페이스가 움직인다
    STEPS = stops.length;              // 마지막 걸음(=도착)의 번호
    if (roadStep > STEPS) roadStep = STEPS;

    /* 눈금은 정거장에만 적는다. 0번은 첫 코스를 지금 시작한다는 뜻이라 개월 대신
       「지금」이고, 마지막은 도착이라 초록으로 한 단 크다. 가운데 눈금이 앞과 같은
       수로 눌리면 되풀이하지 않고 지운다 — 「5개월 · 5개월」 은 눈금이 아니라
       실수로 읽힌다. 끝 눈금은 언제나 남는다: 그게 목표다. */
    var end = Math.max(1, Math.round(unit)), prev = 0, seen = {};
    stopAt.forEach(function (d, i) {
      var last = i === stopAt.length - 1;
      var t = roadEls.caps[d];
      seen[d] = true;
      t.setAttribute("class", "rd-cap " + (i === 0 ? "start" : last ? "dest" : "wp"));
      if (i === 0) { t.textContent = "지금"; return; }
      if (last) { t.textContent = end + suf; return; }
      var v = Math.max(1, Math.round(unit * stopTrue[i]));
      var show = v > prev && v < end;
      t.textContent = show ? v + suf : "";
      if (show) prev = v;
    });
    roadEls.caps.forEach(function (t, d) { if (!seen[d]) t.textContent = ""; });

    setRoadStep(roadStep, animate);
  }

  /* ---- 로드맵 카드 · 지금 밟고 있는 칸이 무엇인가 ---- */
  var curli = document.querySelector(".curli");

  if (roadCard) {
    roadCard.querySelector(".rc-prev").addEventListener("click", function () { stepRoad(-1); });
    roadCard.querySelector(".rc-next").addEventListener("click", function () { stepRoad(1); });
  }
  function stepRoad(by) {
    var next = Math.max(0, Math.min(STEPS, roadStep + by));
    if (next === roadStep) return;
    roadStep = next;
    renderCurriculum(true);        // 움직이는 건 이 카드뿐 — 레이더까지 다시 그리지 않는다
    sync.push(roadCard);
  }
  /* 몇 번째 칸인지는 DOM 만 봐서는 알 수 없으니 직접 읽고 쓴다. 칸 수가 이제
     추천 코스와 무관하게 늘 일곱이라, 번호를 그대로 주고받아도 양쪽이 같은
     점에 선다. */
  sync.register("roadstep", {
    read: function () { return { step: roadStep }; },
    apply: function (el, state) {
      // NaN 도 typeof 는 "number" 다 — 여기서 걸러 내지 않으면 Math.max/min 을
      // 그대로 통과해 칸 번호가 NaN 이 되고, 「NaN주차」 가 상대에게도 실려 간다
      if (!state || typeof state.step !== "number" || !isFinite(state.step)) return;
      var at = Math.max(0, Math.min(STEPS, Math.round(state.step)));
      if (at !== roadStep) { roadStep = at; renderCurriculum(true); }
    }
  });

  /* 갈아 끼우는 그림은 언제나 마크업에 미리 적어 둔 것 중에서 고른다.
     경로를 여기서 지어내면 패키저가 못 보고 지나간다 — 패키저는 마크업의
     src 만 번들·평탄화하므로, 로컬에서는 되고 보드에서 404 가 난다.
     쓰는 곳: 레벨 그림 열 장(.lv-src)과 코스 아이콘(.ico-src). */
  function srcOf(box, attr, key) {
    var img = document.querySelector(box + " [data-" + attr + '="' + key + '"]');
    return img ? img.getAttribute("src") : "";
  }

  /* 「학습 동기」 그림은 니즈 페이지에 이미 한 장씩 서 있다. 리포트는 그것을
     그대로 가리켜 쓴다 — 복사해 두면 파일이 둘이 되고, 경로를 지어내면
     패키저가 못 본다. 마크업의 <img> 를 그대로 가리키는 것이 양쪽을 다 푼다. */
  function whyIcon(key) {
    var img = key && document.querySelector('[data-group="why"] [data-val="' + key + '"] .r-ico');
    return img ? img.getAttribute("src") : "";
  }
  /* ✓ 띠의 표식. 찾는 순서가 곧 규칙이다 —
       ① 코스 전용 그림(.ico-src) : 이유 쪽에 짝이 없는 코스(한글·핵심·프리토킹)
       ② 학습 동기 그림           : 코스가 곧 그 이유인 경우(여행·드라마·반말)
       ③ ✓                       : 아직 그림이 없을 때
     ③ 이 남아 있는 것이 정상 상태다. 그림이 없는 코스에 엉뚱한 그림을 붙이면
     「그림 = 그 코스」 라는 약속이 깨져서, 있는 그림들까지 뜻을 잃는다.
     ① 을 채우는 법은 trial/assets/course-icons-prompt.md 에 있다. */
  function doMark(key) {
    var src = srcOf(".ico-src", "ico", key) || whyIcon(key);
    return src ? '<img class="hy-do-i" src="' + src + '" alt="">' : '<i>✓</i>';
  }

  /* 카드의 머리 한 덩어리 — 그림 하나에 두 줄이 매달린다.
       [그림]  코스 이름 · 레슨 수            n / N
               할 수 있게 되는 일
       ───────────────────────────────────────────
     전에는 이름줄 아래에 연두 띠가 따로 앉아 있었다. 면이 있으니 결론인 건
     알겠는데, 그 결론이 바로 위 코스의 것이라는 말은 어디에도 없어서 띠가
     혼자 떠 있었다. 그림을 두 줄 왼쪽에 하나만 세우면 그림이 둘을 함께
     가리키고, 아래 실선이 거기까지가 머리라고 닫는다 — 면 대신 자리로 말한다.
     니즈 페이지의 「학습 동기」 줄(그림 + 큰 줄 + 작은 줄)과 같은 꼴이라,
     리포트가 덱에 이미 있는 말투를 그대로 쓴다. */
  function headHTML(name, meta, k, mark, line, dim) {
    return '<div class="hy-head">' + mark +
        '<div class="hy-hb">' +
          '<div class="hy-h"><b>' + name + '</b>' +
            (meta ? '<span class="hy-n">' + meta + '</span>' : "") +
            '<span class="hy-no">' + (k + 1) + " / " + (STEPS + 1) + '</span></div>' +
          '<p class="hy-do' + (dim ? " hy-do-e" : "") + '">' + line + '</p>' +
        '</div>' +
      '</div>';
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  /* 대사 안의 [ ] 를 형광펜으로 바꾼다.
     대사 두 줄을 통째로 내밀면 「한국어 문장이 두 개 있다」 까지만 읽힌다 —
     그 코스가 파는 것은 문장이 아니라 문장 안의 한 부분이다: 반말 코스는
     요가 떨어진 말끝, 프리토킹은 뒤에 붙는 이유, 여행은 묻는 틀. 그 부분에만
     형광펜을 그으면 카드가 「이걸 할 수 있게 된다」 를 손가락으로 짚는다.
     쓰는 것은 레슨의 형광펜 그대로다(mark.hl · 라임). 튜터가 화면에 긋는 그
     자국이라 「여기를 보세요」 라는 뜻이 이미 붙어 있고, 새 색을 만들지 않는다.
     아래 그림 설명(art.cap)이 그 형광펜의 범례 노릇을 한다 — 반말 카드라면
     「요를 떼고, 친구에게 하는 말투로」 가 그어진 자리를 그대로 설명한다.
     [ ] 는 이스케이프 뒤에 바꾼다: 대사에 <,& 가 섞여도 안전하다. */
  function hlText(s) {
    return esc(s).replace(/\[([^\]]+)\]/g, '<mark class="hl">$1</mark>');
  }

  /* ---- 코스마다 「그 코스에서 실제로 하는 일」 한 장 ----
     예문 한 줄로는 코스끼리 구별이 안 됐다 — 셋 다 「이런 말을 해요」 였다.
     하는 일의 모양이 서로 다르니 그림도 셋이다. 색은 새로 만들지 않는다:
     자리색은 한글 덱의 것(--c-bg/--v-bg), 갈아 끼우는 자리와 학습자 말풍선은
     초록 = 「고른 것」 으로, 덱에서 쓰던 뜻 그대로다. */
  function artHTML(a) {
    if (a.kind === "han") {
      return '<div class="sp-han">' + a.blocks.map(function (b) {
        return '<div class="hbk">' +
            '<div class="hbk-j"><span class="seat-c">' + b.c + '</span>' +
              '<span class="seat-v">' + b.v + '</span></div>' +
            /* 두 자리가 한 글자로 모이는 팔. 좌표는 타일 두 개(47+6+47=100)의 가운데로
               모은다 — 23.5 와 76.5 가 각 타일의 한가운데, 50 이 둘의 한가운데다.
               타일 크기는 trial.css 의 .hbk-j span 이 정하므로 함께 움직인다. */
            '<svg class="hbk-arm" viewBox="0 0 100 19" aria-hidden="true">' +
              '<path d="M23.5 1 L23.5 8 Q23.5 11 27.5 11 L72.5 11 Q76.5 11 76.5 8 L76.5 1 M50 11 L50 18"/></svg>' +
            '<div class="hbk-s seat-lr">' + b.s + '</div>' +
          '</div>';
      }).join("") + '</div>';
    }
    if (a.kind === "pat") {
      /* 갈아 끼우는 자리를 문장 한가운데에 두고, 바꿔 넣을 말을 그 자리 위아래로
         쌓는다. 예전에는 단어들을 문장 아래에 한 줄로 늘어놓고 점선 가름대로
         자리와 이었는데, 선을 눈으로 따라가야 「이 칸이 저 자리에 들어간다」 가
         읽혔다. 위아래로 포개 두면 같은 말을 선 없이 한다 — 자리가 곧 그 칸이고,
         나머지는 그 자리에 들어갈 후보로 보인다.
         첫 낱말이 위, 나머지가 아래다. 칸 하나가 45.7 을 먹으므로 셋을 넘기면
         그림 자리(185.75)를 넘는다 — 후보는 둘이면 족하다. */
      var alt = function (w) { return '<b class="pat-alt">' + w + "</b>"; };
      return '<div class="sp-pat">' +
          '<span class="pat-pre">' + a.pre + '</span>' +
          '<span class="pat-stack">' +
            (a.words[0] ? alt(a.words[0]) : "") +
            '<b class="pat-slot">' + a.slot + '</b>' +
            a.words.slice(1).map(alt).join("") +
          '</span>' +
          '<span class="pat-post">' + a.post + '</span>' +
        '</div>';
    }
    /* 대사는 레슨의 대화 부품을 그대로 쓴다 — .turn > .who(얼굴 + 이름) + .bubble.
       리포트에만 있는 말풍선을 따로 만들면 두 줄짜리 글로 보이는데, 레슨에서
       쓰는 그 꼴을 그대로 세우면 대화 한 장면으로 보인다. 얼굴이 붙는 순간
       「누가 누구에게」 가 그림으로 서고, 첫 수업에서 만날 화면이기도 하다.
       말풍선 · 얼굴 · 꼬리 모양은 lesson-card.css 가 이미 정의해 두었고,
       리포트에서는 크기만 줄여 쓴다(trial.css 의 .hy .turn 아래).
       상대의 이름은 코스마다 다르다(art.who) — 여행이면 행인, 반말이면 친구다.
       누구와 하는 말인지가 그 코스가 파는 것의 절반이라, 「상대」 로 뭉뚱그리면
       코스 넷이 같은 그림이 된다.

       얼굴도 마찬가지다. 사람 아이콘은 「자리가 비어 있다」 는 표시라, 장면 속
       인물에게 붙이면 행인도 친구도 상대역도 같은 회색 실루엣이 된다. 사람이
       정해진 자리(행인·상대역·친구)에는 덱이 쓰는 배역 사진을 붙이고(art.face),
       사람이 아니라 역할인 자리(나·선생님)에만 아이콘을 남긴다. */
    var ICON = '<span class="avatar icon"><svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2.5c-4.7 0-8.5 2.6-8.5 5.8V22h17v-1.7c0-3.2-3.8-5.8-8.5-5.8Z"/>' +
      '</svg></span>';
    /* 장면 사진이 있는 코스는 대사를 그 위에 얹는다. 얼굴 아이콘과 이름표를
       뗀 자리에 사진이 들어서면, 「누가 하는 말인가」 를 배역 이름이 아니라
       장면이 말해 준다 — 드라마 코스가 파는 것이 바로 그 장면이라서다.
       사진이 없는 코스(여행 · 반말 · 프리토킹)는 그대로 얼굴 있는 대화로 선다. */
    if (a.pics) {
      return '<div class="sp-scene">' +
          '<span class="sc-pics" aria-hidden="true">' +
            a.pics.map(function (k) {
              var s = srcOf(".pic-src", "pic", k);
              return s ? '<img src="' + s + '" alt="">' : "";
            }).join("") +
          '</span>' +
          '<span class="sc-lines">' +
            a.turns.map(function (t) {
              return '<span class="sc-b' + (t[0] === "me" ? " me" : "") + '">' +
                hlText(t[1]) + '</span>';
            }).join("") +
          '</span>' +
        '</div>';
    }
    var pic = a.face ? srcOf(".face-src", "face", a.face) : "";
    return '<div class="sp-talk">' + a.turns.map(function (t) {
      var me = t[0] === "me";
      var face = (!me && pic) ? '<img class="avatar" src="' + pic + '" alt="">' : ICON;
      return '<div class="turn ' + (me ? "me" : "other") + '">' +
          '<span class="who">' + face +
            '<span class="who-name">' + (me ? "나" : (a.who || "상대")) + '</span></span>' +
          '<div class="bubble' + (me ? " me" : "") + '">' +
            '<span class="korean">' + hlText(t[1]) + '</span></div>' +
        '</div>';
    }).join("") + '</div>';
  }

  function renderCurriculum(animate) {
    if (!curli || !roadCard) return;
    var stops = roadStops();
    STEPS = stops.length;
    if (roadStep > STEPS) roadStep = STEPS;
    var k = roadStep, key = courseAt(k), c = COURSE[key], g = GOALS[pick.goal];

    // 총 기간은 위 슬라이더가 정한다. 마디 i 의 시각은 그 총량의 roadFracs[i] 다.
    var per = perWeek();
    var need = planNeed();
    var total = months(need, per);
    /* 눈금은 언제나 개월이다. 마디보다 짧은 계획은 「주」로 세는 갈래가 있었는데,
       기간의 바닥이 5개월이고 마디는 많아야 넷이라 닿을 수 없는 길이 됐다. */
    var unit = total, suf = "개월";
    // 마디 자리를 알아야 시각을 매기는데, 자리는 길을 세운 뒤라야 나온다
    if (!roadEls) drawRoad(unit, suf, false);

    /* 칸마다 코스 한 장. 마지막 칸만 코스가 아니라 도착이다 — 다다른 레벨과
       그 레벨이면 무엇을 하는지, 그리고 맨 처음 고른 목표와 이유로 닫는다. */
    if (k < STEPS) {
      /* 읽는 순서는 이름 → 할 수 있게 되는 일 → 그림 → 그림 설명이다.
         레슨 수는 courseLen() 이 잰다 — 핵심 패턴은 목표에 따라 밟는 분량이
         달라져서, COURSE.n 을 그대로 쓰면 이 사람의 계획과 어긋난다. */
      curli.innerHTML =
        '<div class="hy">' +
          headHTML(c.t, courseLen(key, stops, k) + "레슨", k, doMark(c.ico), c.can, false) +
          '<div class="hy-stage">' + artHTML(c.art) + '</div>' +
          '<div class="hy-cap">' + c.art.cap + '</div>' +
        '</div>';
    } else {
      /* 도착 칸도 코스 칸과 같은 카드다 — 머리 · 그림 · 설명.
         전에는 이 칸만 다른 부품(.cli)이라 초록 상자 하나로 끝났고, 앞의 세
         장보다 짧아서 넘길 때마다 아래 리포트가 밀렸다. 길의 마지막 마디가
         가장 초라한 카드일 이유가 없다: 여기가 이 계획이 팔려는 자리다.

         칸마다 무엇을 담는지가 코스 카드와 나란히 대응한다 —
           이름     : 코스 이름 → 「목표 도착」
           수       : N레슨     → N개월 뒤 (언제 닿는지)
           머리 둘째줄 : 할 수 있게 되는 일 → 처음 고른 목표 그 문장
           그림     : 코스에서 하는 일 → 다다른 레벨(레벨 그림 · 한 줄 · TOPIK)
           설명     : 그림 설명   → 왜 이 순서인지(처음 고른 이유로 닫는다)
         테두리만 초록이다. 초록은 이 덱에서 「다다른 것」 이라, 마지막 카드에
         한 겹 두르는 것으로 도착이라고 말한다. */
      var lv = g ? g.lv : Math.min(LADDER_STEPS, overall() + 2);
      var d = LV[String(lv)];
      /* 목표 전에도 이 칸은 빈 채로 두지 않는다 — 오늘 실력에서 갈 만한 곳을
         미리 놓아 두고, 목표를 고르면 그 자리가 진짜 도착으로 바뀐다.
         바로 위 점프 링크가 이미 「목표를 아직 안 골랐어요」 라고 말하므로
         여기서 같은 문장을 반복하지 않는다. */
      var why = g ? (WHY[pick.why[0]] || WHY.other)
                  : "지금은 오늘 실력으로 가 볼 만한 곳을 미리 놓아 뒀어요.";
      /* 머리의 그림은 처음 고른 「이유」 의 것이다. 길의 마지막 칸이 맨 첫 장의
         대답으로 닫히는 자리라, 표식도 그 첫 장에서 가져온다. */
      curli.innerHTML =
        '<div class="hy hy-goal">' +
          headHTML("목표 도착",
                   g ? "완주" : "",
                   k,
                   g ? doMark("goal") : '<i>?</i>',
                   g ? g.t : "목표를 고르면 여기가 채워져요",
                   !g) +
          /* 도착은 앞의 세 장과 다른 꼴로 선다 — 코스 카드가 「무엇을 하는가」 를
             보여 준다면 이 장은 「그래서 어디에 닿는가」 라, 도착한 자리를 연둣빛
             판 하나로 감싸 상장처럼 둔다. 그림은 왼쪽, 닿은 레벨은 오른쪽이다.
             TOPIK 급수는 뺐다 — 파는 것은 급수가 아니라 「이만큼 말하게 된다」 고,
             그 말은 바로 옆 두 줄이 이미 하고 있다. */
          '<div class="hy-stage"><div class="sp-goal">' +
            '<img class="gl-face" src="' + srcOf(".lv-src", "lv", lv) + '" alt="">' +
            '<span class="gl-body">' +
              '<span class="gl-top"><b class="gl-lv">Lv.' + lv + '</b>' +
                '<i class="gl-up">Level UP!</i></span>' +
              '<p class="gl-line">' + d.line + '</p>' +
            '</span>' +
          '</div></div>' +
          '<div class="hy-cap">' + why + '</div>' +
        '</div>';
    }

    /* 몇 칸 중 몇 번째인지, 그리고 끝에서 더 못 가는지.
       칸은 코스 STEPS 개 + 도착 한 장이라 모두 STEPS+1 이다 — 카드 머리의
       「n / N」 도 점의 수도 같은 N 을 써야 한다(도착 칸이 「4 / 3」 이 되던
       자리다). */
    var dots = "", i;
    for (i = 0; i <= STEPS; i++) dots += '<i' + (i === k ? ' class="on"' : "") + '></i>';
    roadCard.querySelector(".rc-dots").innerHTML = dots;
    roadCard.querySelector(".rc-prev").disabled = k <= 0;
    roadCard.querySelector(".rc-next").disabled = k >= STEPS;

    drawRoad(unit, suf, animate);
  }

  /* 4.3 = 한 달의 주 수(52÷12). 바닥 5개월은 계산 결과가 아니라 영업 정책이다 —
     가까운 목표에 주 5회 이상이면 산수로는 두 달이 나오지만 그보다 짧은 기간은
     제안하지 않는다. 식을 「고쳐서」 이 바닥을 없애지 마라: 없애면 정책이 사라진다.
     근거는 trial/plan-logic.md. */
  var MIN_MONTHS = 5;
  function months(lessons, perWeek) {
    return Math.max(MIN_MONTHS, Math.round(lessons / (perWeek * 4.3)));
  }

  /* 목표 카드는 이제 도착 레벨 하나만 말한다. 예전에는 카드마다 「그 레벨이
     나한테 뭔데?」 를 고른 이유별로 한 줄씩 폈는데(.glc-i[data-why]), 고를 것은
     넷인데 읽을 것이 열여덟이 되어 고르는 힘이 전부 읽는 데 들어갔다.
     이유는 여전히 계획을 정한다 — 리포트의 추천 코스가 그것을 쓴다. 다만
     고르는 화면에서까지 되풀이하지는 않는다. */

  function render() {
    syncFreq();
    renderLevelPick();
    renderAxSteps();
    renderLevel();
    renderAspects();
    renderCourseCard();
    renderCurriculum();
  }

  /* ================================================================
     스냅샷 · 이 리포트를 다시 그리는 데 필요한 것만
     상담이 끝나면 리포트를 백엔드에 남긴다. 여기서 짓는 값이 그대로
     le_level_test.report_snapshot 에 들어간다 — 규격과 컬럼 대응은
     trial/report-submit.md, 보내는 일은 report-submit.js 다.

     남기는 것은 **입력뿐이다.** 리포트가 학생에게 보여 주는 것은 거의 전부
     이 파일이 입력에서 계산해 낸 것이고(레벨 문안·항목 문장·좋아요/아쉬워요·
     코멘트·기간·코스 순서), 같은 리포트가 앱에서도 열리므로 그쪽도 같은
     계산을 한다. 결과까지 저장하면 같은 값이 두 곳에 살게 되고, 둘이
     어긋나는 날 어느 쪽이 맞는지 아무도 모른다.

     그 대신 contentVersion 을 남긴다: 계산의 재료(레벨표·문안·DONE·5개월 바닥)는
     고쳐지는 것이라, 나중에 다시 그린 리포트가 그날 학생이 본 것과 다를 수 있다.
     어느 판으로 그린 것인지는 알 수 있어야 한다.
     ================================================================ */
  function metaOf(name) {
    var m = document.querySelector('meta[name="' + name + '"]');
    return m ? m.getAttribute("content") : null;
  }

  /* 아직 안 고른 것. 리포트가 반쯤 빈 채로 저장되는 것이 가장 나쁜 결과라
     — 되살릴 때 무엇이 비었는지 알 수 없다 — 보내는 쪽이 이걸 보고 막는다. */
  function missing() {
    var m = [];
    if (!pick.level) m.push("level");
    if (!pick.why || !pick.why.length) m.push("why");
    if (!pick.goal) m.push("goal");
    AREAS.forEach(function (a) { if (!rated(a.k)) m.push("ax-" + a.k); });
    return m;
  }

  function snapshot() {
    var areas = {};
    AREAS.forEach(function (a) { areas[a.k] = rated(a.k) ? areaLv(a.k) : null; });
    return {
      kind: "podo-korean-trial-report",
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      /* 어느 판으로 그린 것인가. 문안과 계산이 이 판에 매여 있다. */
      deck: {
        lessonId: metaOf("podo:lesson-id"),
        contentVersion: metaOf("podo:content-version")
      },
      /* 학습자가 고른 것 */
      answers: {
        why: (pick.why || []).slice(),
        goal: pick.goal || null,
        pace: pick.pace ? Number(pick.pace) : null
      },
      /* 튜터가 판정한 것 */
      assessment: {
        level: pick.level ? overall() : null,
        areas: areas
      },
      /* 상담 중에 실제로 합의한 페이스. 니즈 장의 pace 에서 시작하지만
         슬라이더가 진짜 값이라, 둘이 갈릴 수 있어 따로 남긴다. */
      plan: { perWeek: perWeek() }
    };
  }

  /* le_level_test.level_name 칸 하나를 채우려고 연다. 레벨에서 나오는 값이지만
     표가 이 클로저 안에 있어 백엔드가 스스로 채울 수 없고, 어드민 목록이 읽는
     칸이라 비워 둘 수도 없다. **리포트를 그리는 데 쓰라고 여는 것이 아니다.** */
  function levelName() { return pick.level ? LV[String(overall())].name : null; }

  /* 리포트 밖에서 쓸 수 있는 것은 이 셋뿐이다. 레벨표·기간 계산·코스 목록은
     클로저에 그대로 둔다 — 밖에서 만질 수 있게 열어 두면 계획의 근거가 두 곳이
     된다. 앱이 리포트를 다시 그릴 때 쓰는 것도 이 파일이어야 한다. */
  window.podoReport = { snapshot: snapshot, missing: missing, levelName: levelName };

  stampDates();
  render();
})();
