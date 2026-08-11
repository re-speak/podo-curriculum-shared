/* ================================================================
   HIGHLIGHT · 글자 위에 긋는 형광펜 — 그은 자국이 상대 화면에도 남는다
   ----------------------------------------------------------------
   스포트라이트가 블록 하나를 "여기 보세요" 로 켠다면, 이쪽은 그 안의
   낱말·글자에 자국을 남긴다. 대칭이다 — 누가 긋든 상대에게 간다. 지울 때는
   그은 자리를 누른다.

   레몬보드의 data-sync 계약을 그대로 탄다. 보드 수정도 배포도 없다:
     · 공유되는 상태는 "지금 어디에 자국이 있나" 하나 — { ranges: [...] }.
       드래그(이벤트)가 아니라 결과라, 늦게 들어오거나 새로고침해도 스냅샷
       하나로 따라온다. 여러 개를 남길 수 있고, 남긴 것은 페이지를 넘겨도
       그대로 있다(형광펜이니까).
     · 자국의 주소는 { a, s, e } — a 는 글이 든 블록의 전역 인덱스,
       s·e 는 그 블록 안에서 몇 번째 글자부터 몇 번째 글자까지인가.
       좌표도 아니고 DOM 경로도 아니라서, 두 사람의 창 크기가 달라도,
       스크롤 위치가 달라도 같은 글자를 가리킨다.
     · data-hl 은 로드 때 덱 전체에 문서 순서대로 매긴다. 두 사람이 같은
       문서를 받으니 "n 번째 텍스트 블록" 이 양쪽에서 같은 요소다.

   왜 미리 낱말을 <span> 으로 싸 두지 않나: 한국어·일본어에는 낱말 사이
   공백이 없어 토큰이 문장 하나로 뭉치고, 통째로 감싸면 로드 때 텍스트 노드를
   훑는 다른 스크립트(ja→ko 툴팁)와 부딪힌다. 대신 로드 때는 속성만 매기고,
   실제 <mark> 은 자국이 생길 때만 만든다.

   한 덱에 <script src> 한 줄이면 붙는다. lessonSync 가 없으면(파일 직접 열기)
   스텁으로 대체돼, 덱은 그대로 동작하되 동기화만 안 한다.
   ================================================================ */
(function () {
  "use strict";

  var phone = document.querySelector(".phone");
  if (!phone) return;

  var sync = (window.lessonSync = window.lessonSync || {
    kinds: {},
    register: function (name, handlers) { this.kinds[name] = handlers; return this; },
    push: function () {}
  });

  // 자기 클릭·자기 텍스트를 이미 소유한 것들 — 형광펜이 건드리지 않는다.
  // 스포트라이트와 같은 목록이다(조립기의 글자처럼 내용이 바뀌는 것도 여기 걸린다).
  var INTERACTIVE =
    "button,a,input,textarea,select,label,[contenteditable]," +
    "[data-sync-id],[data-sync-option],[data-ok]";

  /* 위젯이지만 그 안의 글은 여전히 글인 것.

     예습 지문의 한 줄은 눌러서 여는 것이라 data-sync-option 을 달고 있고,
     그래서 위 목록에 통째로 걸린다 — 이 덱에서 튜터가 가장 오래 들여다보며
     "이 낱말이요" 하고 짚는 바로 그 글인데도 형광펜이 닿지 않았다.
     제외 규칙이 막으려던 것은 「글자가 바뀌는 자리에 자국을 남기지 마라」다.
     지문의 글자는 수업 내내 한 글자도 안 바뀌므로 그 이유가 없다.

     드래그와 탭이 부딪히지 않는 것은 이미 아래 capture 클릭이 해 준다:
     그은 뒤 따라오는 클릭은 거기서 멈춘다 — 줄이 열리고 닫히지 않는다. */
  var MARKABLE = ".sents .sent";

  function offLimits(el) {
    return el.closest(INTERACTIVE) && !el.closest(MARKABLE);
  }

  /* 문장 한가운데 끼워 넣은 강조 — 블록이 아니라 부모의 글의 일부다.

     낱말 하나를 <span> 으로 싸면 아래 stamp 가 그것도 한 블록으로 세고,
     그 순간 부모 문장이 토막 난다. 그러면 강조를 가로질러 그은 자국이
     그 낱말만 건너뛰고 남는다 — 문장 전체에 형광펜을 그었는데 가운데
     한 낱말만 하얗게 뚫려 있는 그림이다. 번호를 안 주면 부모가 자기
     글의 일부로 그대로 안고 가므로, 글자 세는 자리도 하나로 남는다. */
  var INLINE = ".s-key";

  /* ---- 글이 든 블록에 번호 매기기 ----
     "자기 텍스트를 직접 가진 요소" 가 한 블록이다. 자식이 또 글을 가지고
     있으면 그 자식이 자기 블록을 따로 가지므로, 글은 겹치지 않게 나뉜다. */
  (function stamp() {
    var n = 0;
    var all = phone.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (offLimits(el) || el.matches(INLINE)) continue;
      for (var c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3 && c.nodeValue.trim()) {
          el.setAttribute("data-hl", String(n++));
          break;
        }
      }
    }
  })();

  /* 한 블록이 가진 텍스트 노드를, 화면에 읽히는 순서대로.
     자기 <mark> 안쪽은 포함하고(자국이 이미 있어도 글자 수는 그대로),
     자기 블록을 따로 가진 자식과 위젯은 건너뛴다. */
  function textsOf(anchor) {
    var out = [];
    (function walk(node) {
      for (var n = node.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) { out.push(n); continue; }
        if (n.nodeType !== 1) continue;
        if (n.hasAttribute("data-hl")) continue;
        if (n.matches(INTERACTIVE) && !n.closest(MARKABLE)) continue;
        walk(n);
      }
    })(anchor);
    return out;
  }

  function lengthOf(anchor) {
    return textsOf(anchor).reduce(function (t, n) { return t + n.nodeValue.length; }, 0);
  }

  // 이 블록 안에서 (노드, 오프셋) 이 몇 번째 글자인가. 못 찾으면 -1.
  function offsetIn(anchor, node, off) {
    var nodes = textsOf(anchor), at = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] === node) return at + off;
      at += nodes[i].nodeValue.length;
    }
    return -1;
  }

  var ranges = [];   // [{ a, s, e }] — 공유되는 상태 전부

  // ---- 그리기 ----
  function unpaint() {
    var marks = phone.querySelectorAll("mark.hl");
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i], p = m.parentNode;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
      p.normalize();      // 쪼개 둔 텍스트 노드를 되돌린다 — 오프셋 계산의 전제
    }
  }

  function paint(r) {
    var anchor = phone.querySelector('[data-hl="' + r.a + '"]');
    if (!anchor) return;                       // 이 덱에 없는 블록이면 조용히 무시
    var nodes = textsOf(anchor), at = 0;
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i], len = t.nodeValue.length, from = at;
      at += len;
      var a = Math.max(r.s, from), b = Math.min(r.e, at);
      if (a >= b) continue;
      var mid = t.splitText(a - from);
      mid.splitText(b - a);
      var m = document.createElement("mark");
      m.className = "hl";
      mid.parentNode.replaceChild(m, mid);
      m.appendChild(mid);
    }
  }

  function redraw() {
    unpaint();
    ranges.forEach(paint);
  }

  // 겹치는 자국은 하나로 합친다 — <mark> 이 겹쳐 쌓이지 않게.
  function add(a, s, e) {
    var keep = [];
    ranges.forEach(function (r) {
      if (r.a !== a || r.e < s || r.s > e) { keep.push(r); return; }
      s = Math.min(s, r.s);
      e = Math.max(e, r.e);
    });
    keep.push({ a: a, s: s, e: e });
    ranges = keep;
    sort();
  }

  // read 가 같은 상태에 늘 같은 결과를 내야 해서(안 그러면 매번 다시 발행된다)
  // 정렬해 둔다.
  function sort() {
    ranges.sort(function (x, y) { return x.a - y.a || x.s - y.s || x.e - y.e; });
  }

  sync.register("highlight", {
    read: function () { return { ranges: ranges }; },
    apply: function (_el, state) {
      var list = state && state.ranges;
      if (!Array.isArray(list)) return;
      ranges = list.filter(function (r) {
        return r && typeof r.a === "number" && typeof r.s === "number" &&
               typeof r.e === "number" && r.e > r.s;
      }).map(function (r) { return { a: r.a, s: r.s, e: r.e }; });
      sort();
      redraw();
    }
  });

  // sync-id 를 달아 둘 껍데기. 상태는 클로저에 있으니 요소 자체는 비어 있어도 된다.
  var carrier = document.createElement("div");
  carrier.setAttribute("data-sync-id", "deck-highlight");
  carrier.setAttribute("data-sync-kind", "highlight");
  carrier.style.display = "none";
  document.body.appendChild(carrier);

  // ---- 그으면 자국이 남는다 ----
  phone.addEventListener("mouseup", function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    var r = sel.getRangeAt(0);
    var start = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    if (!start || !start.closest) return;
    if (offLimits(start)) return;                        // 위젯 안은 긋지 않는다

    var anchor = start.closest("[data-hl]");
    if (!anchor || !phone.contains(anchor)) return;

    var s = offsetIn(anchor, r.startContainer, r.startOffset);
    if (s < 0) return;
    // 끝이 다른 블록으로 넘어갔으면 이 블록 끝까지만 긋는다
    var e = offsetIn(anchor, r.endContainer, r.endOffset);
    if (e < 0) e = lengthOf(anchor);
    if (e <= s) return;

    add(parseInt(anchor.getAttribute("data-hl"), 10), s, e);
    redraw();
    sync.push(carrier);
    // 파란 선택 막은 지우지 않는다 — 뒤따라오는 click 을 스포트라이트가
    // "블록을 눌렀다" 로 읽지 않게 하는 표시로 쓰고, 아래에서 치운다.
  });

  // ---- 자국을 누르면 지운다 ----
  // capture 로 먼저 받아 스포트라이트까지 내려가지 않게 한다.
  document.addEventListener("click", function (e) {
    var t = e.target;
    var mark = t && t.closest ? t.closest("mark.hl") : null;

    if (mark) {
      e.stopPropagation();
      var anchor = mark.closest("[data-hl]");
      var a = parseInt(anchor.getAttribute("data-hl"), 10);
      var at = offsetIn(anchor, mark.firstChild, 0);
      ranges = ranges.filter(function (r) {
        return !(r.a === a && at >= r.s && at < r.e);
      });
      redraw();
      sync.push(carrier);
      window.getSelection().removeAllRanges();
      return;
    }

    // 방금 그은 드래그의 꼬리 클릭. 선택만 치우고, 아무 일도 일어나지 않게 한다.
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      e.stopPropagation();
      sel.removeAllRanges();
    }
  }, true);
})();
