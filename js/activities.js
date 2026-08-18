/* ================================================================
   ACTIVITIES · 화이트보드 없이 손가락만으로 푸는 활동 (정적 컨트롤)

   레몬보드 검증기와 라이브 바인더가 같은 DOM 을 보도록 입력 컨트롤은 HTML 에
   미리 적는다. 이 파일은 컨트롤을 새로 만들거나 바꾸지 않고, 이미 서 있는
   컨트롤에 채점·크기·칩 이동 동작만 배선한다.

     input.slot-input[data-answer]   점선 알약에 타이핑. 답 길이에 맞춰 폭을 잡는다.
     input.space-input[data-answer]  채점하는 답 칸.
     textarea.free-input             자유 작문 칸. 쓴 만큼 자란다.
     .build-zone[data-a]             칩을 받는 트레이. data-sync-kind="order".
     .choose-row .opt                둘 중 하나 고르기. data-correct 가 정답 쪽.
     .mission li                     체크리스트 토글.

   채점은 언제나 각자 화면에서 다시 계산한다 — 정답은 오가지 않는다.
   보드 밖(로컬에서 파일을 직접 열 때)에서는 lessonSync 가 없으므로 아무것도
   하지 않는 스텁으로 대체해, 덱 자체는 그대로 동작하게 둔다.

   로드 순서: 페이저(pager.js)보다 먼저. 페이저의 티칭 모드가 여기서 만든
   window.__revealAnswers 를 부른다.
   ================================================================ */

/* ---------- lessonSync 스텁 ----------
   전송(스냅샷·늦은 입장·에코 차단·수렴)은 전부 레몬보드가 한다. 문서는
   "무엇이 공유되는지"만 선언한다 — data-sync-id 가 있는 요소만 공유된다. */
window.lessonSync = window.lessonSync || {
  kinds: {},
  register: function (name, handlers) { this.kinds[name] = handlers; return this; },
  push: function () {}
};

(function () {
  'use strict';

  var sync = window.lessonSync;

  // 띄어쓰기·문장부호는 채점에서 무시한다 ("학생이에요?" == "학생이에요")
  function norm(s) { return (s || "").replace(/[\s　?？.。!！,、·~〜…]/g, ""); }

  /* 칩 안에는 한국어 말고 발음 표기(.yomi)도 들어 있다. 채점이 보는 것은
     한국어뿐이라, 읽는 데 도우라고 붙인 가나가 답에 섞이면 안 된다.
     (textContent 는 display:none 인 것까지 읽으므로, ア 를 껐다고 통과하는
     일도 없다 — 켜든 끄든 같은 문자열이어야 한다.) */
  function koText(el) {
    var s = "";
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) s += n.nodeValue;
      else if (n.nodeType === 1 && !n.classList.contains("yomi")) s += koText(n);
    }
    return s;
  }

  var reorder = new WeakMap();         // build zone -> {pool, answer, chips, reset}

  /* 상대 화면에서 들어온 글은 타이핑 이벤트 없이 꽂힌다 — 보드는 value 에
     바로 쓰고 input 을 쏘지 않는다. 그래서 칸의 value 만 가로채, 글이 어느
     길로 들어왔든 같은 뒤처리(채점·높이)가 돌게 한다. */
  function onValueSet(el, after) {
    var proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
                                          : HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, "value");
    Object.defineProperty(el, "value", {
      configurable: true,
      get: function () { return desc.get.call(this); },
      set: function (v) { desc.set.call(this, v); after(this); }
    });
  }

  /* 오답의 붉은 칠은 스쳐 지나가는 것이라, 다음 시도가 앞 시도의 타이머를
     물려받으면 안 된다 — 방금 칠한 칸이 남의 700ms 에 걸려 먼저 하얘진다.
     그래서 칸마다 자기 타이머를 들고 있다가 갈아 끼운다. */
  var flashes = new WeakMap();
  function flash(el, on) {
    clearTimeout(flashes.get(el));
    el.classList.toggle("wrong", on);
    if (on) flashes.set(el, setTimeout(function () { el.classList.remove("wrong"); }, 700));
  }

  /* ---------- (1) typed blanks ----------
     맞힌 칸도 다시 고칠 수 있다. 한 번 맞히면 칸을 readOnly 로 잠갔었는데,
     그러면 어쩌다 맞은 답도, 지우고 다시 써 보고 싶은 답도 되돌릴 길이 없다.
     대신 글자가 바뀔 때마다 다시 채점한다 — 답이 아니게 되면 초록이 조용히
     걷히고, 되돌려 쓰면 다시 들어온다. 표시가 늘 지금 적힌 글에서 나오므로
     잠가 둘 상태가 없다. */
  function grade(input, commit) {
    var space = input.closest(".answer-space");
    var was = input.classList.contains("correct");
    var ok = !!input.value.trim() && norm(input.value) === norm(input.dataset.answer);

    input.classList.toggle("correct", ok);
    if (space) space.classList.toggle("correct", ok);

    if (ok) {
      input.placeholder = "";          // 맞힌 칸에는 유령 답을 다시 띄우지 않는다
      flash(input, false);
      return;
    }
    // 되돌린 칸은 처음 상태로 — 티칭 모드였다면 유령 답도 같이 돌아온다
    if (was) {
      input.placeholder = document.body.classList.contains("teaching")
        ? (input.dataset.answer || "") : "";
    }
    if (commit && input.value.trim()) flash(input, true);
  }

  // 여기서는 보내지 않는다. 보드가 input 이벤트를 보고 값을 다시 읽어
  // 내보낸다(IME 조합 중에는 붙잡아 둔다). 이 함수는 채점만 한다.
  function wireInput(input) {
    input.addEventListener("input", function () { grade(input, false); });
    input.addEventListener("blur", function () { grade(input, true); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); grade(input, true); }
    });
    /* 채점은 공유되지 않는 값이라 화면마다 스스로 매긴다 — 그런데 상대가 쓴
       글에는 input 이벤트가 없어서 매길 기회 자체가 없었다. 학습자가 답을
       맞혀도 튜터 화면의 칸은 채점 전 그대로였다. */
    onValueSet(input, function (i) { grade(i, false); });
  }

  /* 자유 작문 칸은 쓴 만큼 자란다 — 답이 몇 줄이 될지 우리가 미리 알 수 없다.
     스크롤바가 생기면 학생이 방금 쓴 줄이 화면 밖으로 밀려나고, 튜터 화면에서는
     더 나쁘다: 학생이 말한 문장 전체가 한눈에 안 들어온다.
     높이를 재기 전에 auto 로 되돌리는 것이 줄어드는 쪽을 만든다(지운 만큼 다시
     작아진다). 아래 한계는 시트의 min-height 가 잡으므로 여기서 세지 않는다. */
  function grow(ta) {
    if (!ta.offsetParent) return;      // 지금 장이 아니다 — display:none 은 잴 수 없다
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }

  // 그래서 장이 바뀔 때 페이저가 이 줄을 부른다. 숨어 있는 동안 상대가 써 넣은
  // 글도, 화면에 나오는 그 순간 제 높이를 찾는다.
  window.__resizeInputs = function () {
    document.querySelectorAll(".free-input").forEach(grow);
  };

  // 타이핑만이 아니라 보드가 상대의 글을 넣어 줄 때도 자라야 한다.
  function autoGrow(ta) {
    onValueSet(ta, grow);
    ta.addEventListener("input", function () { grow(ta); });
    grow(ta);
  }

  /* 답을 실제로 그려 보고 그 너비를 잰다. 글자 수 × 상수로 어림하면 한글
     글자마다 다른 자폭이 뭉개져 30~40px 씩 남아돌고, 그 남는 폭이 한 줄에
     들어갈 칸을 아랫줄로 밀어낸다.
     재는 span 은 body 에 붙인다 — 장(.section)은 페이저가 도달하기 전까지
     display:none 이라 그 안에서는 아무것도 잴 수 없지만, 칸의 computed font
     는 숨어 있어도 읽히므로 같은 글꼴을 밖에서 재면 된다. */
  var ruler = document.createElement("span");
  ruler.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre";
  document.body.appendChild(ruler);

  var sized = [];

  function sizeToAnswer(input) {
    var cs = getComputedStyle(input);
    ruler.style.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    ruler.style.letterSpacing = cs.letterSpacing;
    ruler.textContent = input.dataset.answer;
    var pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    // 10px 은 글자가 테두리에 닿지 않을 만큼의 여유. 답보다 긴 답을 쓰는
    // 학생은 어차피 이 폭을 넘기므로 여기서 미리 벌어 두지 않는다.
    input.style.width = Math.ceil(ruler.getBoundingClientRect().width + pad) + 10 + "px";
  }

  /* Pretendard 는 CDN 웹폰트다. 처음 재는 시점에는 아직 대체 글꼴일 수 있고,
     그 폭으로 굳으면 글꼴이 바뀐 뒤 칸만 어긋난 채 남는다. 폰트가 정해지면
     한 번 더 잰다(이미 캐시돼 있으면 같은 값이 나오므로 화면은 그대로다). */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { sized.forEach(sizeToAnswer); });
  }

  // 점선 알약. 답 길이에 맞춰 폭을 잡는다. data-answer 가 없는 칸(이름을 적는
  // 칸)은 채점할 답이 없으므로 건드리지 않는다.
  document.querySelectorAll("input.slot-input[data-answer]").forEach(function (input) {
    sizeToAnswer(input);
    sized.push(input);
    wireInput(input);
  });

  document.querySelectorAll("input.space-input[data-answer]").forEach(wireInput);
  document.querySelectorAll("textarea.free-input").forEach(autoGrow);

  /* ---------- (3) reorder: 칩을 문장 자리에 놓는다 ----------
     .task-block 안의 .choice 칩이 아래 pool 로 내려가고, 답 자리(.build-zone)가
     칩을 받는 트레이가 된다. 트레이의 kind 와 유령 답은 HTML 에 적혀 있다. */
  function settleOrder(zone) {
    var block = reorder.get(zone);
    if (!block) return;
    // 판정은 늘 지금 놓인 칩에서 다시 나온다. 앞의 판정을 지우지 않으면
    // 되돌린 칸에 초록이 그대로 남는다 — 상대 화면에서 온 되돌리기도 그렇다.
    zone.classList.remove("correct", "wrong");
    // 한 조각이라도 놓은 순간부터 되돌릴 수 있어야 한다 — 맞았든 틀렸든
    // 반쯤 놓았든. 다 놓고 나서야 나타나면, 두 번째 칩을 잘못 놓은 사람은
    // 남은 칩을 마저 놓아 틀린 문장을 완성해야 다시 시작할 수 있다.
    if (block.reset) block.reset.hidden = !zone.children.length;
    if (block.pool.children.length) return;      // 아직 다 놓지 않았다
    var built = Array.prototype.map.call(zone.children, function (c) {
      return koText(c).trim();
    }).join(" ");
    zone.classList.add(norm(built) === norm(block.answer) ? "correct" : "wrong");
  }

  document.querySelectorAll(".task-block").forEach(function (block) {
    var chips = [].slice.call(block.querySelectorAll(":scope > .choice"));
    if (!chips.length) return;
    var zone = block.querySelector(".build-zone");
    if (!zone) return;

    /* 조각과 그것으로 짓는 문장은 한 물건이라, 트레이는 답 칸 밖이 아니라
       答 상자 안에 붙는다 — 힌트 띠와 같은 자리, 같은 회색. 칸이 상자의
       가운데 띠가 되면서 오답의 붉은 칠이 상자의 둥근 모서리에 잘리던 것도
       같이 사라진다: 이제 위아래가 모두 각진 이웃이다.
       트레이에는 data-sync-id 가 없다 — 공유되는 것은 칸(.build-zone)뿐이라
       런타임에 만들어도 정적 검증과 어긋나지 않는다. */
    var tray = document.createElement("div");
    tray.className = "chip-tray";
    var pool = document.createElement("div");
    pool.className = "chip-pool";
    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "build-reset";
    reset.textContent = "やり直す";
    reset.hidden = true;
    tray.appendChild(pool);
    tray.appendChild(reset);
    (zone.parentElement || block).appendChild(tray);

    // data-a 는 티칭 모드의 유령 답이자 채점 기준이다(둘 다 HTML 에 적혀 있다).
    reorder.set(zone, {
      pool: pool, answer: zone.getAttribute("data-a") || "", chips: chips, reset: reset
    });
    chips.forEach(function (chip) {
      pool.appendChild(chip);
      chip.addEventListener("click", function () {
        if (zone.classList.contains("correct")) return;
        zone.classList.remove("wrong");
        (chip.parentElement === pool ? zone : pool).appendChild(chip);
        settleOrder(zone);
      });
    });

    // 맞힌 뒤에도 눌린다 — 다시 해 보는 것을 막을 이유가 없다.
    // 칩을 원래 순서대로 되돌리므로 처음 화면과 똑같은 상태가 된다.
    reset.addEventListener("click", function () {
      chips.forEach(function (c) { pool.appendChild(c); });
      zone.classList.remove("correct", "wrong");
      reset.hidden = true;
      // 칩을 옮기는 것은 클릭이 아니라 이 단추 하나로 일어난다 — 보드가
      // 볼 것이 없으므로 직접 알린다. 안 그러면 되돌린 사람의 화면만 비고
      // 상대 화면에는 지은 문장이 그대로 남는다.
      sync.push(zone);
    });
  });

  /* ---------- (2) tap one of two ----------
     공유되는 것은 "고른 쪽"(.chosen) 뿐이다. 맞았는지 틀렸는지는
     양쪽 화면이 각자 data-correct 로 다시 계산한다. */
  document.querySelectorAll(".choose-row").forEach(function (row) {
    var opts = [].slice.call(row.querySelectorAll(".opt"));
    if (!opts.length) return;

    /* 두 번째 탭이 되돌린다 — 맞혔든 틀렸든. 맞힌 줄을 잠가 두었더니
       (row.dataset.done) 되짚어 볼 길이 없었다: 찍어서 맞은 학습자도,
       다시 읽어 보고 싶은 튜터도 그 줄에 두 번 다시 손댈 수 없다.
       다른 활동(.tap-tile, .opt-list)은 이미 다시 눌러 끄는 쪽이라,
       이 줄만 한 번 쓰고 굳는 것이 오히려 예외였다.

       되돌리기가 곧 빈 집합이 되므로 상대 화면에서도 같이 풀린다 —
       보드는 "고른 쪽"의 집합만 나르고, 다른 쪽 화면은 달라진 칩을
       눌러서 그 집합에 맞춘다. 껐다 켜는 것이 그 배선을 그대로 탄다. */
    function clear() {
      opts.forEach(function (o) {
        flash(o, false);
        o.classList.remove("chosen", "correct", "dim");
      });
    }

    opts.forEach(function (opt) {
      opt.setAttribute("role", "button");
      opt.addEventListener("click", function () {
        var was = opt.classList.contains("chosen");
        // 형제의 표시를 먼저 지우는 것이 "하나만 고르기"를 만든다.
        // 보드는 집합만 볼 뿐이고, 그 규칙은 이 문서에 있다.
        clear();
        if (was) return;                 // 고른 것을 다시 눌렀다 — 아무것도 안 고른 상태로
        opt.classList.add("chosen");
        if (opt.hasAttribute("data-correct")) {
          opt.classList.add("correct");
          opts.forEach(function (o) { if (o !== opt) o.classList.add("dim"); });
        } else {
          flash(opt, true);
        }
      });
    });
  });

  /* ---------- mission checklist ---------- */
  document.querySelectorAll(".mission li").forEach(function (li) {
    li.addEventListener("click", function (e) {
      if (e.target.closest(".hint")) return;
      li.classList.toggle("checked");
    });
  });

  /* ---------- 티칭 모드에서 답을 유령으로 띄운다 ----------
     CSS 는 input 안까지 들어가지 못하므로, 타이핑 칸만 여기서 처리한다.
     나머지(고르기·문장 만들기)는 시트에 있다. 공유하지 않는다. */
  window.__revealAnswers = function (on) {
    document.querySelectorAll("input[data-answer], .free-input").forEach(function (el) {
      if (el.classList.contains("correct")) return;
      el.placeholder = on ? (el.dataset.answer || "") : "";
    });
  };

  /* ---------- 조립 중인 문장은 DOM 만으로 읽히지 않는다 ----------
     칩의 "순서"가 상태라서, 이 문서가 read/apply 를 들고 온다. 칸은
     위치가 아니라 칩의 이름(data-item-id)으로 지칭한다. */
  sync.register("order", {
    read: function (zone) {
      return {
        itemIds: Array.prototype.map.call(zone.children, function (c) {
          return c.dataset.itemId;
        }).filter(Boolean)
      };
    },
    apply: function (zone, state) {
      if (!state || !Array.isArray(state.itemIds)) return;
      var block = reorder.get(zone);
      if (!block) return;
      /* 맞힌 칸은 손대지 않는다는 조건이 여기 있었는데, 그것이 되돌리기를
         한쪽 화면에 가둬 두었다 — 문장을 맞힌 뒤 やり直す 를 눌러도 상대
         화면은 지은 문장을 그대로 안고 있었다. apply 는 "지금 무엇이 참인가"
         를 그대로 따르는 자리이고, 빈 칸도 참인 상태다. */
      var known = {};
      block.chips.forEach(function (c) { known[c.dataset.itemId] = c; });
      var seen = {};
      for (var i = 0; i < state.itemIds.length; i++) {
        var id = state.itemIds[i];
        // 이 활동이 선언한 칩만, 한 번씩만 (§8)
        if (typeof id !== "string" || !known[id] || seen[id]) return;
        seen[id] = 1;
      }
      state.itemIds.forEach(function (id) { zone.appendChild(known[id]); });
      block.chips.forEach(function (chip) {
        if (!seen[chip.dataset.itemId]) block.pool.appendChild(chip);
      });
      settleOrder(zone);
    }
  });
})();
