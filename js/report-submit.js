/* ================================================================
   REPORT SUBMIT · 상담이 끝난 리포트를 그대로 남긴다 (공유 스크립트)

   리포트 맨 끝의 「리포트 저장」 한 칸(.rep-send)을 배선한다. 누르면
   report.js 가 지은 스냅샷에 학생·수업 식별자를 붙여 웹훅으로 POST 한다.
   백엔드는 그 JSON 을 le_level_test 한 행으로 받는다 — 평면 칸은 levelTest
   에서, 리포트 전체는 reportSnapshot 에서 온다.
   보내는 값의 규격과 컬럼 대응: trial/report-submit.md

   report.js 다음에 로드해야 한다. window.podoReport 가 없으면 조용히
   아무 일도 하지 않는다 — 리포트가 없는 덱에도 이 파일이 얹힐 수 있다.

   이 칸은 튜터 화면에만 있고(teaching), 상태를 공유하지 않는다. 저장은
   상담이 끝나고 튜터가 하는 일이지 수업 중의 한 수가 아니라서, 학습자
   화면에 「보내는 중」 이 뜰 이유가 없다.
   ================================================================ */

(function () {
  var box = document.querySelector(".rep-send");
  if (!box || !window.podoReport) return;

  var btn = box.querySelector(".rs-btn");
  var msg = box.querySelector(".rs-msg");

  /* 아직 안 고른 것을 튜터가 읽을 이름으로. missing() 은 코드를 돌려주므로
     여기서 옮긴다 — report.js 가 화면 문안까지 들고 있을 이유는 없다. */
  var LABEL = {
    level: "종합 레벨", why: "학습 동기", goal: "목표",
    "ax-acc": "정확성", "ax-voc": "어휘", "ax-flu": "유창성",
    "ax-pron": "발음", "ax-lis": "듣기"
  };

  function metaOf(name) {
    var m = document.querySelector('meta[name="' + name + '"]');
    return m ? m.getAttribute("content") : null;
  }
  var ENDPOINT = metaOf("podo:report-endpoint") || "";

  /* 학생·수업 식별자는 덱 안에 없다 — 덱은 어느 수업에나 그대로 실리는
     문서다. 보드가 URL 로 넘겨주는 값을 받고, 없으면 null 로 둔다.
     지어내면 남의 리포트에 붙는다: 저장 자체가 실패하는 편이 낫다. */
  function context() {
    var q = new URLSearchParams(location.search);
    var c = window.PODO_REPORT_CONTEXT || {};
    var num = function (v) { var n = parseInt(v, 10); return isFinite(n) ? n : null; };
    var take = function (k) { return c[k] != null ? c[k] : q.get(k); };
    return {
      studentId: num(take("studentId")),
      classId: num(take("classId")),
      tutorId: num(take("tutorId")),
      studentName: take("studentName") || null
    };
  }

  /* 보내는 몸통은 둘로 나뉜다.

     reportSnapshot 은 **리포트를 다시 그리는 데 필요한 입력**이다. 앱에서도
     같은 리포트가 열리고 거기서도 report.js 가 계산하므로, 계산 결과를 함께
     보내지 않는다 — 같은 값이 두 곳에 살면 어긋나는 날 어느 쪽이 맞는지
     아무도 모른다.

     levelTest 는 le_level_test 의 **이미 있는 평면 칸**이다. 여기 들어가는
     값 일부(레벨 이름, 항목 셋)는 스냅샷에서 계산해 낸 것이라 엄밀히는
     중복이지만, 그 칸들은 어드민 목록과 집계가 JSON 을 열지 않고 읽는
     자리다. 리포트를 그리는 쪽은 이 칸이 아니라 스냅샷을 읽는다. */
  function payload() {
    var snap = window.podoReport.snapshot();
    var ctx = context();
    var lv = snap.assessment.areas;
    var str = function (v) { return v == null ? null : String(v); };
    return {
      source: "korean-trial-report",
      reportVersion: 2,
      levelTest: {
        studentId: ctx.studentId,
        classId: ctx.classId,
        studentName: ctx.studentName,
        language: "KO",
        level: snap.assessment.level,
        // 레벨 이름은 레벨에서 나오는 값이지만 표가 report.js 안에 있어 백엔드가
        // 스스로 채울 수 없다. 어드민 목록이 읽는 칸이라 비워 두지 않는다.
        levelName: window.podoReport.levelName(),
        url: null,
        job: null,
        reason: snap.answers.why.slice(),
        studyMethod: null,
        listening: str(lv.lis),
        fluency: str(lv.flu),
        pronunciation: str(lv.pron)
      },
      tutorId: ctx.tutorId,
      reportSnapshot: snap
    };
  }

  var sending = false;

  function say(state, text) {
    box.setAttribute("data-state", state);
    msg.textContent = text;
  }

  function refresh() {
    if (sending) return;
    var left = window.podoReport.missing();
    btn.disabled = left.length > 0;
    if (left.length) {
      say("todo", "아직 안 고른 항목이 있어요 — " +
        left.map(function (k) { return LABEL[k] || k; }).join(" · "));
      return;
    }
    say("ready", "이 화면 그대로 저장해요. 저장한 뒤에 고쳐서 다시 보내도 돼요.");
  }

  function send() {
    if (sending || btn.disabled) return;
    if (!ENDPOINT) {
      say("error", "보낼 곳이 없어요 — 덱 머리의 podo:report-endpoint 를 채워 주세요.");
      return;
    }
    sending = true;
    btn.disabled = true;
    say("sending", "보내는 중…");
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload())
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      sending = false;
      btn.disabled = false;
      btn.textContent = "다시 보내기";
      say("done", "저장했어요.");
    })["catch"](function (e) {
      /* 실패해도 리포트는 화면에 그대로 있다 — 다시 누르면 된다. 그래서
         값을 어디에 따로 받아 두지 않는다: 되살릴 원본이 눈앞에 있는데
         숨은 사본을 하나 더 만들면, 어느 쪽이 진짜인지가 문제가 된다. */
      sending = false;
      btn.disabled = false;
      say("error", "보내지 못했어요 (" + (e && e.message ? e.message : "오류") +
        ") — 다시 눌러 주세요.");
    });
  }

  btn.addEventListener("click", send);

  /* 리포트가 바뀌면 안내 문구도 따라간다. 고르는 버튼과 페이스 슬라이더만
     본다 — 아무 탭에나 다시 그리면 「저장했어요」 가 화면을 한 번 건드릴
     때마다 지워진다. report.js 의 핸들러가 먼저 돌도록 한 틱 미룬다. */
  document.addEventListener("click", function (e) {
    if (box.contains(e.target)) return;
    if (!e.target.closest("[data-group] button[data-val]")) return;
    setTimeout(refresh, 0);
  });
  var freq = document.querySelector(".freq-range");
  if (freq) freq.addEventListener("input", function () { setTimeout(refresh, 0); });

  refresh();
})();
