/* ================================================================
   FREETALK ACTIVITIES · 자유 대화 과가 쓰는 활동 (공유 스크립트)

     .opt-list[data-pick]  정답이 없는 고르기 (single / multi).
     .fb                   말한 문장 → 고친 문장 → 달라진 곳(diff).
     .sents .sent          예습 지문을 눌러 뜻 보기.

   쓰는 칸(.answer-space)은 activities.js 가 맡는다 — 이 파일은 그 다음에
   오고, 답이 비어 있는 칸은 거기서 자유 작문 칸이 된다.
   ================================================================ */

(function () {
  'use strict';

  var MAX_TEXT = 2000;                 // 붙여넣기 한 번으로 문서가 부풀지 않게

      /* ---------- (2) 정답이 없는 고르기 ----------
     초록은 여기서 "고른 것"이라는 뜻이고, .on 은 지워지지 않는 클래스라
     늦게 들어온 쪽도 그대로 받는다. */
  document.querySelectorAll(".opt-list[data-pick]").forEach(function (group) {
    var multi = group.getAttribute("data-pick") === "multi";
    var btns = [].slice.call(group.querySelectorAll("button.opt-row"));
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var was = b.classList.contains("on");
        if (!multi) btns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.toggle("on", !was);
      });
    });
  });

  /* ================================================================
     (3) 말한 문장 → 고친 문장 → 달라진 곳

     튜터가 들은 대로 위 칸에 적으면, 아래 칸이 같은 문장으로 따라 채워진다.
     튜터는 다시 치지 않고 고칠 자리만 손대면 되고, 그 순간 세 번째 칸에
     무엇이 빠지고 무엇이 들어왔는지가 색으로 남는다. git 의 word-diff 와
     같은 읽기다: 지운 말은 붉게 그어지고, 새로 넣은 말은 초록으로 들어온다.

     왜 낱말이 아니라 글자까지 쪼개는가 — 한국어에서 고쳐지는 건 대개
     조사나 어미 한두 글자다. 낱말을 통째로 지웠다 다시 쓴 것으로 보이면
     "무엇이 틀렸는지"가 그대로 사라진다. 그래서 한 낱말이 한 낱말로
     바뀐 자리에서만 글자 단위로 한 번 더 쪼갠다.
     ================================================================ */
  function words(s) { return (s || "").trim().split(/\s+/).filter(Boolean); }

  function esc(s) {
    return s.replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  // 공통 부분을 가장 길게 잡는 고전적인 LCS. 한 문장 길이라 이걸로 충분하다.
  function diff(a, b) {
    var n = a.length, m = b.length, d = [], i, j;
    for (i = 0; i <= n; i++) d.push(new Array(m + 1).fill(0));
    for (i = n - 1; i >= 0; i--)
      for (j = m - 1; j >= 0; j--)
        d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1
                                : Math.max(d[i + 1][j], d[i][j + 1]);
    var out = []; i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { out.push({ t: "=", v: a[i] }); i++; j++; }
      else if (d[i + 1][j] >= d[i][j + 1]) { out.push({ t: "-", v: a[i] }); i++; }
      else { out.push({ t: "+", v: b[j] }); j++; }
    }
    while (i < n) out.push({ t: "-", v: a[i++] });
    while (j < m) out.push({ t: "+", v: b[j++] });
    return out;
  }

  function tag(t, s) {
    return t === "=" ? esc(s)
         : t === "-" ? "<del>" + esc(s) + "</del>"
                     : "<ins>" + esc(s) + "</ins>";
  }

  // 이어지는 같은 종류를 하나로 묶는다 — 글자마다 태그를 열면 읽을 수 없다.
  function join(ops) {
    var html = "", run = "", t = "";
    ops.forEach(function (o) {
      if (o.t !== t) { if (run) html += tag(t, run); run = ""; t = o.t; }
      run += o.v;
    });
    return html + (run ? tag(t, run) : "");
  }

  /* 한 낱말이 한 낱말로 바뀐 자리에서, 앞뒤로 그대로인 부분만 떼어 낸다.

     글자 단위로 LCS 를 다시 돌리면 우연히 겹친 글자까지 붙잡는다.
     Student → Teacher 에서 t 와 e 가 여기저기 맞아 떨어지면
     「StudTentacher」 같은 자국이 남는다 — 무엇을 고쳤는지 읽을 수가 없다.

     그래서 낱말 안에서는 앞머리와 꼬리만 본다. 고쳐지는 자리가 가운데
     하나뿐이라, 남는 자국도 하나다. 한국어에서 실제로 고쳐지는 것 —
     조사, 어미, 활용 — 이 정확히 이 모양이다: 선택<del>해</del><ins>할래</ins>요.

     그대로인 부분이 짧으면 물러난다. says 와 modifies 는 끝 s 하나가
     같을 뿐인데, 그걸 붙잡으면 「saymodifies」 가 된다. 남은 부분이 짧은
     쪽 낱말의 절반은 되어야 「같은 말을 고친 것」 으로 본다. */
  var KEEP = 0.5;
  var CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

  function refine(a, b) {
    var i = 0, j = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    while (j + i < a.length && j + i < b.length &&
           a[a.length - 1 - j] === b[b.length - 1 - j]) j++;

    var kept = i + j;
    if (kept < (CJK.test(a) || CJK.test(b) ? 1 : 2)) return null;
    if (kept / Math.min(a.length, b.length) < KEEP) return null;

    var midA = a.slice(i, a.length - j), midB = b.slice(i, b.length - j);
    return esc(a.slice(0, i))
         + (midA ? tag("-", midA) : "")
         + (midB ? tag("+", midB) : "")
         + esc(a.slice(a.length - j));
  }

  function render(a, b) {
    var ops = diff(a, b), html = [], k = 0, t, run, ins, j, i, pairs, r;
    while (k < ops.length) {
      t = ops[k].t;
      run = [];
      while (k < ops.length && ops[k].t === t) run.push(ops[k++].v);

      if (t === "-" && k < ops.length && ops[k].t === "+") {
        ins = [];
        j = k;
        while (j < ops.length && ops[j].t === "+") ins.push(ops[j++].v);

        // 낱말 수가 같으면 한 낱말씩 짝지어 본다. 한 짝도 안 닮았으면
        // 통째로 바뀐 자리다 — 지운 말을 먼저, 넣은 말을 나중에 묶는다.
        if (run.length === ins.length) {
          pairs = run.map(function (w, n) { return refine(w, ins[n]); });
          if (pairs.some(function (x) { return x; })) {
            html.push(pairs.map(function (x, n) {
              return x || (tag("-", run[n]) + tag("+", ins[n]));
            }).join(" "));
            k = j;
            continue;
          }
        } else {
          /* 수가 달라도 앞뒤가 남아 있으면 같이 본다. 한 낱말이 여러
             낱말로 늘어나는 교정(없어요 → 없는 것 같아요)이 흔한데,
             낱말 수만 보고 물러나면 문장 끝이 통째로 지워졌다 다시
             쓰인 것처럼 보여서 정작 무엇을 고쳤는지가 사라진다. */
          r = refine(run.join(" "), ins.join(" "));
          if (r) { html.push(r); k = j; continue; }
        }

        for (i = 0; i < run.length; i++) html.push(tag("-", run[i]));
        for (i = 0; i < ins.length; i++) html.push(tag("+", ins[i]));
        k = j;
        continue;
      }

      for (i = 0; i < run.length; i++) html.push(tag(t, run[i]));
    }
    return html.join(" ");
  }

  // 칸은 내용만큼만 높다. 고정 높이를 주면 한 줄짜리 교정에도 빈 칸이
  // 세 줄씩 깔려서, 카드가 폼처럼 보인다.
  function fit(el) {
    // 숨어 있는 칸은 scrollHeight 가 0 이다. 그대로 재면 높이를 0 으로 박아
    // 두게 되고, 나중에 그 칸을 다시 열었을 때 한 줄짜리로 눌려 나온다.
    if (!el.offsetParent) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  // 칸을 비우고, 비웠다는 걸 보드에도 알린다 — 그래야 상대 화면에서도 사라진다.
  function wipe(fields) {
    fields.forEach(function (el) {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  var groups = [];

  /* 칸은 마크업이 아니라 여기서 찍어 낸다.

     칸 하나에 data-sync-id 를 단 <textarea> 가 셋 들어간다. 보드가 기본
     "value" 로 읽어 주는 자리라 전송도, 한글·일본어 조합 대기도, 늦게 들어온
     쪽 따라잡기도 공짜다 — 대신 id 가 미리 있어야 한다. 그래서 칸 수는 미리
     정해질 수밖에 없고, 그 반복을 덱에 적어 두면 질문 한 장에 6KB 씩 붙는다.
     튜터 노트 칸(tutor-notes.js)과 같은 방식으로 여기서 만든다.

     서른은 "여기서 막혔다" 는 말이 나오지 않을 만큼 넉넉히 잡은 수다. 남는
     칸은 비어 있는 동안 어느 화면에도 나타나지 않으니 세어 두는 값이 없고,
     한 질문에 서른을 다 쓸 일도 없다. 정말로 끝없이 늘리려면 이 묶음 전체를
     직접 읽고 쓰는 kind 로 만들어야 하는데, 그러면 조합 중인 글자가 반쯤
     건너가는 것부터 다시 손대야 한다. */
  var SLOTS = 30;

  function cut(fb) {
    var q = fb.getAttribute("data-fb");
    if (!q) return;                      // 칸을 직접 적어 둔 덱은 그대로 둔다
    var html = "";
    for (var i = 1; i <= SLOTS; i++) {
      html +=
        '<div class="fb-block">' +
          '<button class="fb-del" type="button" aria-label="지우기">✕</button>' +
          '<div class="fb-row orig">' +
            '<span class="fb-cap">학생 문장</span>' +
            '<p class="fb-diff"></p>' +
            '<textarea class="fb-in said" data-sync-id="' + q + '-said-' + i +
              '" rows="1" spellcheck="false"></textarea>' +
          '</div>' +
          '<div class="fb-row fix">' +
            '<span class="fb-cap">교정</span>' +
            '<textarea class="fb-in fixed" data-sync-id="' + q + '-fixed-' + i +
              '" rows="1" spellcheck="false"></textarea>' +
          '</div>' +
          '<div class="fb-row nrow">' +
            '<span class="fb-cap">노트</span>' +
            '<textarea class="fb-in memo" data-sync-id="' + q + '-note-' + i +
              '" rows="1" spellcheck="false"></textarea>' +
          '</div>' +
        '</div>';
    }
    fb.innerHTML = html;
  }

  /* 한 칸은 교정일 수도 노트일 수도 있다.

     처음에는 교정 칸 묶음과 노트 칸 묶음을 따로 두었는데, 그러면 노트가
     늘 교정 아래로 밀린다 — 두 번째 교정을 열면 이미 적어 둔 노트 위로
     끼어드는 것이다. 튜터가 말한 순서와 화면에 쌓이는 순서가 어긋난다.

     그래서 칸을 한 줄로 세우고, 각 칸이 무엇인지는 안에 무엇이 적혔는지로
     정한다. 노트 칸에 글이 있으면 노트, 학생 문장 쪽에 있으면 교정.
     빈 칸은 연 사람이 무엇으로 열었는지를 따르고 — 그건 이 화면의
     사정이라 어차피 상대에게 보이지 않는다. 순서도 성격도 이미 공유되는
     값에서 그대로 나오므로, 따로 보낼 것이 없다. */
  document.querySelectorAll(".fb").forEach(function (fb) {
    cut(fb);

    var bar     = fb.nextElementSibling;
    if (bar && !bar.classList.contains("fb-adds")) bar = null;
    var addFix  = bar && bar.querySelector('[data-add="fix"]');
    var addNote = bar && bar.querySelector('[data-add="note"]');

    var list = [].slice.call(fb.querySelectorAll(".fb-block")).map(function (block) {
      var said  = block.querySelector(".said");
      var fixed = block.querySelector(".fixed");
      var memo  = block.querySelector(".memo");
      var out   = block.querySelector(".fb-diff");

      /* 바뀐 자리는 학생 문장 칸 "안" 에 그려진다. 칸이 하나 줄어드는 것보다
         중요한 건, 고친 결과가 원래 문장 위에 얹혀 보인다는 것이다.
         튜터가 받아 적은 문장을 다시 손봐야 할 때가 있으므로, 그 자리를
         누르면 입력칸으로 돌아온다. */
      out.addEventListener("click", function () {
        block.classList.add("editing");
        fit(said);                       // 방금 보이게 됐으니 이제서야 잴 수 있다
        said.focus();
      });
      said.addEventListener("blur", function () {
        block.classList.remove("editing");
      });
      var last = null;

      function paint() {
        var key = said.value + "\u0000" + fixed.value;
        if (key !== last) {
          last = key;
          // 고친 칸이 말한 칸과 달라진 순간부터는 따라 쓰기를 멈춘다. 이벤트가
          // 아니라 값으로 판단해야, 상대 화면에서 들어온 수정도 지켜진다.
          if (fixed.value && fixed.value !== said.value) fixed.dataset.touched = "1";
          var a = words(said.value), b = words(fixed.value);
          var same = !a.length || !b.length || a.join(" ") === b.join(" ");
          block.classList.toggle("has-diff", !same);
          out.innerHTML = same ? "" : render(a, b);
          fit(said); fit(fixed);
        }
        fit(memo);
        // 적힌 것이 이 칸의 성격을 정한다. 노트가 먼저다 — 노트로 연 칸에는
        // 학생 문장 쪽이 아예 없으니, 둘이 같이 차는 일이 없다.
        return memo.value.trim() ? "note"
             : (said.value.trim() || fixed.value.trim()) ? "fix" : "";
      }

      said.addEventListener("input", function () {
        if (!fixed.dataset.touched) {
          fixed.value = said.value;
          // 보드는 타이핑을 보고 값을 읽으므로, 대신 채운 것도 알려 준다
          fixed.dispatchEvent(new Event("input", { bubbles: true }));
        }
        paint();
      });
      fixed.addEventListener("input", paint);
      memo.addEventListener("input", function () { fit(memo); });

      return { el: block, paint: paint, fields: [said, fixed, memo] };
    });

    /* 한 질문에 교정이 하나만 나오는 건 아니다. 그래서 칸이 여럿이고,
       다음 칸은 튜터가 ＋ 를 눌러야 열린다. 저절로 자라게 뒀더니 아직
       쓰지도 않은 빈 칸이 늘 한 장씩 깔려서, 페이지가 폼처럼 보였다.

       "몇 개 열었는지" 는 이 화면의 사정이라 공유하지 않는다. 대신 글이
       들어 있는 칸은 어느 쪽 화면에서든 열린다 — 열림 여부가 이미
       공유되는 값(칸의 글자)에서 그대로 나오기 때문이다. */
    var shown = 1;
    var want = ["fix"];          // 빈 칸을 무엇으로 열었는가 (이 화면에서만)
    var openN = 1;

    function grow() {
      var have = list.map(function (b) { return b.paint(); });
      var need = 0;
      have.forEach(function (v, i) { if (v) need = i + 1; });
      var n = openN = Math.max(shown, need);

      list.forEach(function (b, i) {
        var kind = have[i] || want[i] || "fix";
        b.el.classList.toggle("as-note", kind === "note");
        b.el.classList.toggle("as-fix", kind !== "note");
        b.el.classList.toggle("hide", i >= n);
        b.el.classList.toggle("empty", !have[i]);
        // 마지막 한 칸이 비어 있으면 지울 것이 없다 — 지워도 그 자리는
        // 다시 열려 있어야 하므로, 눌러도 아무 일이 없는 단추는 숨긴다.
        b.el.classList.toggle("nodel", n === 1 && !have[i]);
      });

      if (bar) bar.classList.toggle("hide", n >= list.length);
    }

    function opener(kind, field) {
      return function () {
        if (openN >= list.length) return;
        want[openN] = kind;
        shown = openN + 1;
        grow();
        // 방금 연 칸으로 커서를 옮긴다 — 튜터는 이미 다음 문장을 듣고 있다
        list[shown - 1].el.querySelector(field).focus();
      };
    }

    if (addFix)  addFix.addEventListener("click", opener("fix", ".said"));
    if (addNote) addNote.addEventListener("click", opener("note", ".memo"));

    /* 지우기는 그 칸을 빼고 뒤에 있는 것들을 한 칸씩 당기는 일이다.

       칸을 비우기만 하면, 가운데를 지웠을 때 빈 칸이 그대로 남아 구멍이 된다.
       또 비어 있는 칸은 지울 것이 없어서 아무 일도 일어나지 않는다 —
       방금 잘못 연 칸을 못 닫는다는 뜻이다. 당겨 오면 둘 다 해결된다.

       "지웠다" 를 따로 보내지 않는 것은 그대로다. 옮겨지는 건 칸의 글자이고,
       그 글자는 이미 공유되는 값이라 상대 화면도 같은 결과에 도달한다. */
    list.forEach(function (b, i) {
      var del = b.el.querySelector(".fb-del");
      if (!del) return;
      del.addEventListener("click", function () {
        for (var j = i; j < list.length - 1; j++) {
          var here = list[j].fields, next = list[j + 1].fields;
          for (var k = 0; k < here.length; k++) {
            here[k].value = next[k].value;
            here[k].dispatchEvent(new Event("input", { bubbles: true }));
          }
          want[j] = want[j + 1];
        }
        wipe(list[list.length - 1].fields);
        want[list.length - 1] = "fix";

        list.forEach(function (x) {
          x.el.classList.remove("editing");
          // 따라 쓰기 여부는 값에서 다시 나온다 — 당겨 온 칸도 마찬가지
          x.fields.forEach(function (f) { delete f.dataset.touched; });
        });

        var need = 0;
        list.forEach(function (x, n) { if (x.paint()) need = n + 1; });
        shown = Math.max(1, need);
        grow();
      });
    });

    // 타이핑은 위임으로 받는다 — 어느 블록에서 쳤든 카드 전체를 다시 재서,
    // 점선이 실선이 되는 것도 다음 블록이 열리는 것도 그 자리에서 일어난다
    // (400ms 뒤에 따라오는 건 늦다).
    fb.addEventListener("input", grow);

    groups.push(grow);
    grow();
  });

  // 상대 화면에서 들어온 값은 타이핑 이벤트 없이 꽂힐 수도 있다. 가끔 다시
  // 읽어, 어느 경로로 들어왔든 차이와 블록 수가 늘 맞게 둔다. 값이 그대로면
  // 위의 key 비교에서 멈추므로, 다시 그리는 일은 바뀔 때만 일어난다.
  if (groups.length) setInterval(function () {
    groups.forEach(function (grow) { grow(); });
  }, 400);

  /* ---------- 예습 지문 · 눌러서 뜻 보기 ----------
     공유되는 것은 "어느 문장이 열려 있는가"(.open) 뿐이다. 튜터가 짚은
     문장이 학습자 화면에서도 같이 열린다. */
  document.querySelectorAll(".sents .sent").forEach(function (b) {
    b.addEventListener("click", function () { b.classList.toggle("open"); });
  });

})();
