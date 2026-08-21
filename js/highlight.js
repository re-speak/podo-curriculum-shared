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
       한 번의 드래그가 여러 블록을 지나면 각 주소에 같은 선택 묶음 g 를
       덧붙인다. 어느 조각을 눌러도 그때 그은 자국 전체가 함께 지워진다.
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

  /* flex 컨테이너의 맨바깥 텍스트는 익명 flex item 이다. 그 일부를 <mark> 로
     바꾸면 표시 전/후가 서로 다른 item 으로 갈라져, 튜터 노트가 두 칼럼처럼
     찢어진다. 노트 원문을 처음부터 한 item 으로 고정해 두면 그 안에서 mark 를
     몇 번 나눠도 줄 흐름은 바뀌지 않는다. 이미 구조를 가진 자유 대화 노트는
     직접 텍스트가 없으므로 건드리지 않는다. */
  (function stabilizeTutorNotes() {
    var notes = phone.querySelectorAll(".tutor-note");
    for (var i = 0; i < notes.length; i++) {
      var children = [].slice.call(notes[i].childNodes);
      for (var j = 0; j < children.length; j++) {
        var node = children[j];
        if (node.nodeType !== 3 || !node.nodeValue.trim()) continue;
        var flow = document.createElement("span");
        flow.className = "hl-flow";
        flow.style.minWidth = "0";
        notes[i].replaceChild(flow, node);
        flow.appendChild(node);
      }
    }
  })();

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

  // 이 블록 안에서 (노드, 오프셋) 이 몇 번째 글자인가. 못 찾으면 -1.
  function offsetIn(anchor, node, off) {
    var nodes = textsOf(anchor), at = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] === node) return at + off;
      at += nodes[i].nodeValue.length;
    }
    return -1;
  }

  /* 브라우저 selection 하나를 실제로 걸친 모든 글 블록의 구간으로 바꾼다.

     한 문장은 시각적으로 이어져도 DOM 에서는 다음처럼 여러 anchor 로 갈린다:
       I <b>can help with</b> + 手伝えること
     예전 코드는 시작 anchor 하나만 읽어서 <b> 를 건너뛰거나, .ending 안에서
     시작한 자국을 그 span 끝에서 잘랐다. 공유 상태는 원래 ranges 배열이므로
     프로토콜을 바꿀 필요 없이, selection 이 실제로 지난 각 anchor 조각을 같은
     한 번의 갱신에 넣으면 된다. 부모 anchor 의 글 노드는 자식 anchor 를 빼고
     세므로 조각끼리 겹치지 않는다. */
  function selectedParts(range) {
    var out = [];
    var anchors = phone.querySelectorAll("[data-hl]");

    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i], nodes = textsOf(anchor), at = 0;
      var start = -1, end = -1;

      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j], len = node.nodeValue.length;
        var hit = range.intersectsNode ? range.intersectsNode(node) : false;
        if (hit) {
          var s = range.startContainer === node ? range.startOffset : 0;
          var e = range.endContainer === node ? range.endOffset : len;
          if (e > s) {
            if (start < 0) start = at + s;
            end = at + e;
          }
        }
        at += len;
      }

      if (start >= 0 && end > start) {
        out.push({
          a: parseInt(anchor.getAttribute("data-hl"), 10),
          s: start,
          e: end
        });
      }
    }
    return out;
  }

  var ranges = [];   // [{ a, s, e, g? }] — g 는 한 번에 그은 조각들의 묶음
  var nextGroup = 1;

  function groupSet(value) {
    var out = {};
    if (typeof value !== "string") return out;
    value.split(" ").forEach(function (group) {
      if (/^[1-9][0-9]*$/.test(group)) out[group] = true;
    });
    return out;
  }

  function groupValue(groups) {
    var list = Object.keys(groups).sort(function (x, y) { return x - y; });
    return list.join(" ");
  }

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
      if (r.g) m.setAttribute("data-hl-groups", r.g);
      mid.parentNode.replaceChild(m, mid);
      m.appendChild(mid);
    }
  }

  function redraw() {
    unpaint();
    ranges.forEach(paint);
  }

  // 겹치는 자국은 하나로 합친다 — <mark> 이 겹쳐 쌓이지 않게.
  function add(a, s, e, group) {
    var keep = [], groups = groupSet(group);
    ranges.forEach(function (r) {
      if (r.a !== a || r.e < s || r.s > e) { keep.push(r); return; }
      s = Math.min(s, r.s);
      e = Math.max(e, r.e);
      var old = groupSet(r.g);
      Object.keys(old).forEach(function (name) { groups[name] = true; });
    });
    var merged = { a: a, s: s, e: e };
    var value = groupValue(groups);
    if (value) merged.g = value;
    keep.push(merged);
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
      }).map(function (r) {
        var clean = { a: r.a, s: r.s, e: r.e };
        var value = groupValue(groupSet(r.g));
        if (value) {
          clean.g = value;
          value.split(" ").forEach(function (group) {
            nextGroup = Math.max(nextGroup, parseInt(group, 10) + 1);
          });
        }
        return clean;
      });
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

    var parts = selectedParts(r);
    if (!parts.length) return;
    var group = String(nextGroup++);
    parts.forEach(function (part) { add(part.a, part.s, part.e, group); });
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
      var clickedGroups = groupSet(mark.getAttribute("data-hl-groups"));
      var hasGroup = Object.keys(clickedGroups).length > 0;
      ranges = ranges.filter(function (r) {
        if (!hasGroup) return !(r.a === a && at >= r.s && at < r.e);
        var groups = groupSet(r.g);
        return !Object.keys(clickedGroups).some(function (name) { return groups[name]; });
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
