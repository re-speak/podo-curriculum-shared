/* ================================================================
   REPORT SUBMIT · 상담이 끝난 리포트를 그대로 남긴다 (공유 스크립트)

   리포트 맨 끝의 「리포트 저장」 한 칸(.rep-send)을 배선한다. 누르면
   report.js 가 지은 스냅샷을 **부모 창으로 postMessage 하고 거기서 끝난다.**
   저장은 그다음부터 앱의 일이다 — 앱이 학생·수업 식별자를 붙여 백엔드를
   부르고, 백엔드가 le_level_test 한 행으로 받는다.

   덱이 백엔드를 직접 부르지 않는 이유는 둘이다. 덱에는 로그인 세션이 없어
   자기 힘으로 인증할 수 없고(토큰은 앱의 httpOnly 쿠키에 있어 스크립트가
   읽지 못한다), 어느 수업에나 그대로 실리는 문서라 학생·수업이 누구인지도
   모른다. 그 둘을 아는 것은 앱뿐이다.

   그래서 **보내는 값에 식별자를 담지 않는다.** 덱이 아는 척 실어 보내면
   앱은 그 값을 믿을지 말지를 정해야 하고, 믿는 순간 남의 리포트에 붙일
   길이 열린다. 덱은 리포트만 보내고, 누구의 것인지는 앱이 자기가 아는
   수업에서 채운다.

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

  /* 부모와 주고받는 계약. 보드(lemonboard)의 같은 이름 상수와 맞춰야 한다 —
     한쪽만 고치면 버튼이 조용히 아무 일도 하지 않는다. 덱은 보드 안에
     srcDoc 으로 실리므로 부모는 언제나 보드다. */
  var MESSAGE_SOURCE = "podo-trial-report";

  /* 답이 영영 안 오는 경우(부모가 이 계약을 모르는 옛 보드)에도 버튼이
     「보내는 중」 에 멈춰 있지 않도록 한다. 튜터는 상담을 끝내는 중이라
     기다릴 시간이 없고, 다시 누르는 편이 낫다. */
  var REPLY_TIMEOUT_MS = 15000;

  /* 아직 안 고른 것을 튜터가 읽을 이름으로. missing() 은 코드를 돌려주므로
     여기서 옮긴다 — report.js 가 화면 문안까지 들고 있을 이유는 없다. */
  var LABEL = {
    level: "종합 레벨", why: "학습 동기", goal: "목표",
    "ax-acc": "정확성", "ax-voc": "어휘", "ax-flu": "유창성",
    "ax-pron": "발음", "ax-lis": "듣기"
  };

  /* 받는 창은 보드가 넣어 주는 PODO_REPORT_CONTEXT.parentOrigin 으로만
     정해진다. 덱은 srcDoc 문서라 자기 주소가 없어서(about:srcdoc) URL 로는
     아무것도 받을 수 없고 — location.search 는 비어 있다 — location.origin
     마저 "null" 이라 폴백이 되지 못한다. 실제로 확인했다: 보드가 주입하지
     않으면 버튼은 「저장은 수업방 안에서만 돼요」 에서 멈춘다.

     그래도 폴백을 남겨 두는 것은 덱이 srcDoc 이 아니라 보통의 iframe(src=)
     으로 실리는 경우를 위해서다. 그때는 origin 이 제대로 잡힌다.

     "*" 로는 보내지 않는다. 리포트에는 학생이 상담에서 한 이야기가 들어
     있어서, 받는 창을 특정하지 못하면 보내지 않는 편이 맞다. */
  function parentOrigin() {
    var c = window.PODO_REPORT_CONTEXT || {};
    var origin = c.parentOrigin || location.origin;
    return origin && origin !== "null" ? origin : null;
  }

  /* 보내는 몸통은 둘로 나뉜다.

     reportSnapshot 은 **리포트를 다시 그리는 데 필요한 입력**이다. 앱에서도
     같은 리포트가 열리고 거기서도 report.js 가 계산하므로, 계산 결과를 함께
     보내지 않는다 — 같은 값이 두 곳에 살면 어긋나는 날 어느 쪽이 맞는지
     아무도 모른다.

     levelTest 는 le_level_test 의 **이미 있는 평면 칸**이다. 여기 들어가는
     값은 스냅샷에서 계산해 낸 것이라 엄밀히는 중복이지만, 그 칸들은 어드민
     목록과 집계가 JSON 을 열지 않고 읽는 자리다. 리포트를 그리는 쪽은 이
     칸이 아니라 스냅샷을 읽는다.

     덱이 모르는 칸(studentId·classId·studentName·job·studyMethod·url)은
     아예 넣지 않는다. null 로라도 넣어 두면 받는 쪽에서 "덱이 보낸 빈 값"과
     "덱이 모르는 값"이 구별되지 않는다. */
  function payload() {
    var snap = window.podoReport.snapshot();
    var lv = snap.assessment.areas;
    var str = function (v) { return v == null ? null : String(v); };
    return {
      source: "korean-trial-report",
      reportVersion: 2,
      levelTest: {
        language: "KO",
        level: snap.assessment.level,
        // 레벨 이름은 레벨에서 나오는 값이지만 표가 report.js 안에 있어 백엔드가
        // 스스로 채울 수 없다. 어드민 목록이 읽는 칸이라 비워 두지 않는다.
        levelName: window.podoReport.levelName(),
        reason: snap.answers.why.slice(),
        listening: str(lv.lis),
        fluency: str(lv.flu),
        pronunciation: str(lv.pron)
      },
      reportSnapshot: snap
    };
  }

  var sending = false;
  /* 답을 기다리는 요청의 id. 늦게 온 답이 그다음 요청의 결과로 읽히는 것을
     막는다 — 한 번 실패하고 다시 누르는 흐름이 흔하다. */
  var pending = null;
  var timer = null;

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

  function newRequestId() {
    return "rep-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  /* 실패해도 리포트는 화면에 그대로 있다 — 다시 누르면 된다. 그래서 값을
     어디에 따로 받아 두지 않는다: 되살릴 원본이 눈앞에 있는데 숨은 사본을
     하나 더 만들면, 어느 쪽이 진짜인지가 문제가 된다. */
  function settle(ok, text) {
    if (timer) { clearTimeout(timer); timer = null; }
    pending = null;
    sending = false;
    btn.disabled = false;
    if (ok) btn.textContent = "다시 보내기";
    say(ok ? "done" : "error", text);
  }

  function send() {
    if (sending || btn.disabled) return;

    var origin = parentOrigin();
    if (window.parent === window || !origin) {
      /* 덱만 따로 열어 본 경우다. 튜터가 고친 내용은 화면에 남아 있으니
         잃는 것은 없고, 수업방에서 다시 누르면 된다. */
      say("error", "저장은 수업방 안에서만 돼요.");
      return;
    }

    sending = true;
    btn.disabled = true;
    say("sending", "보내는 중…");

    pending = newRequestId();
    window.parent.postMessage({
      source: MESSAGE_SOURCE,
      type: "submit",
      requestId: pending,
      payload: payload()
    }, origin);

    timer = setTimeout(function () {
      settle(false, "저장 결과를 받지 못했어요 — 다시 눌러 주세요.");
    }, REPLY_TIMEOUT_MS);
  }

  /* 부모가 저장을 끝내고 알려 주는 결과. 보낸 곳에서 온 답만 받고, 지금
     기다리는 요청의 id 와 맞을 때만 화면을 바꾼다. */
  window.addEventListener("message", function (e) {
    var data = e.data;
    if (!data || data.source !== MESSAGE_SOURCE || data.type !== "result") return;
    if (!pending || data.requestId !== pending) return;
    if (e.origin !== parentOrigin()) return;

    if (data.ok) {
      settle(true, "저장했어요.");
      return;
    }
    settle(false, "보내지 못했어요 (" + (data.error || "오류") + ") — 다시 눌러 주세요.");
  });

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
