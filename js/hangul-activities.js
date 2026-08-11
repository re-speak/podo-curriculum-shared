/* ================================================================
   HANGUL ACTIVITIES · 자모를 다루는 활동 (공유 스크립트)

   글자를 배우는 과가 쓰는 두 가지. 문장 활동(activities.js)과 겹치지 않으며,
   두 파일을 같이 불러도 서로의 마크업을 건드리지 않는다.

     .tap-grid        타일을 눌러 고르기 — 듣고 고르기·찾기 활동.
     .builder         자모 키패드로 음절을 조립하기. 조립 중인 상태는 DOM 만
                      으로 읽히지 않으므로 이 파일이 read/apply 를 들고 온다.

   activities.js 다음에 온다 — lessonSync 스텁이 거기서 선다.
   ================================================================ */

(function () {
  var sync = window.lessonSync;

  /* ---------- (1) tap to choose ----------
     data-sync-kind="selection" 이라 등록할 것이 없다. 보드는 활성 클래스를
     가진 [data-sync-option] 의 집합만 실어 나르고, 아래 토글이 양쪽에서
     똑같이 돌아 right/wrong 을 각자 만든다 — 정답이 전파되지 않는다. */
  document.querySelectorAll(".tap-grid").forEach(function (grid) {
    grid.querySelectorAll(".tap-tile").forEach(function (t) {
      t.addEventListener("click", function () {
        if (t.classList.contains("right") || t.classList.contains("wrong")) {
          t.classList.remove("right", "wrong");     // tap again to undo
        } else {
          t.classList.add(t.hasAttribute("data-ok") ? "right" : "wrong");
        }
      });
    });
  });

  /* ---------- (2) syllable builder ---------- */
  var CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  var JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
  /* vertical vowels sit to the right. The y- and e-vowels (과 7) are the
     same shapes with one more stroke, so they take the same seat — left out,
     a keypad paints ㅑ into the bottom half and contradicts the placement
     rule the deck taught in 과 1. Compound vowels (과 8) are neither, and
     want a layout of their own rather than a line here. */
  var TALL = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅣ"];

  function compose(c, v) {
    return String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28);
  }

  /* 조립기의 상태는 DOM 이 아니라 클로저에 있다(고른 자음/모음, 작업 중인 칸).
     그래서 보드의 기본 kind 로는 읽을 수 없고, 이 문서가 read/apply 를 들고 온다.
     공유되는 것은 "끝낸 글자 / 지금 칸 / 반쯤 고른 것" 이라는 의미이고,
     칸은 위치가 아니라 그 칸이 요구하는 글자로 지칭한다. */
  sync.register("builder", {
    read: function (b) { return b.__sync ? b.__sync.read() : null; },
    apply: function (b, state) { if (b.__sync) b.__sync.apply(state); }
  });

  document.querySelectorAll(".builder").forEach(function (b) {
    var answers = (b.getAttribute("data-answers") || "").split(",");
    var slots = [].slice.call(b.querySelectorAll(".build-slot"));
    var keys = [].slice.call(b.querySelectorAll(".key"));
    var active = 0;
    var pick = { c: null, v: null };
    var missed = null;              // slot holding a wrong pair, waiting to clear
    slots.forEach(function (s, i) { s.setAttribute("data-a", answers[i] || ""); });

    /* A wrong pair empties its slot again — see check(). Either the timer
       gets here or the learner's next tap does, whichever comes first: half
       a second in, a tap means "let me try again", and editing one letter of
       a guess that has already been marked wrong is not a thing to support. */
    function clearMiss() {
      var s = missed;
      missed = null;
      if (!s || slots[active] !== s || s.classList.contains("done")) return false;
      pick = { c: null, v: null };
      draw();
      return true;
    }

    function draw() {
      slots.forEach(function (s, i) {
        s.classList.toggle("active", i === active && !s.classList.contains("done"));
      });
      keys.forEach(function (k) {
        k.classList.toggle("on", k.dataset.c === pick.c || k.dataset.v === pick.v);
      });
      var s = slots[active];
      if (!s || s.classList.contains("done")) return;   // never repaint a finished slot
      s.classList.remove("lr", "tb");
      if (pick.v) s.classList.add(TALL.indexOf(pick.v) >= 0 ? "lr" : "tb");
      s.querySelector(".zone.c").className = "zone c" + (pick.c ? " seat-c" : "");
      s.querySelector(".zone.v").className = "zone v" + (pick.v ? " seat-v" : "");
      s.querySelector(".glyph").textContent =
        pick.c && pick.v ? compose(pick.c, pick.v) : (pick.c || pick.v || "");
    }

    function check() {
      if (!pick.c || !pick.v) return;
      var s = slots[active];
      if (compose(pick.c, pick.v) === answers[active]) {
        s.classList.add("done");
        s.classList.remove("active");
        pick = { c: null, v: null };
        var next = slots.findIndex(function (x, i) { return i > active && !x.classList.contains("done"); });
        if (next < 0) next = slots.findIndex(function (x) { return !x.classList.contains("done"); });
        active = next;                                   // -1 once every slot is built
        draw();
      } else {
        /* Wrong pair: shake, then put the slot back to empty on its own.
           The shake used to be the whole answer, so the wrong letter stayed
           in the slot with both keys still lit — the learner's next tap
           edited a guess that had already been marked wrong, and nothing on
           screen said the attempt was over. 800ms is long enough to read
           what they built and short enough to just try again. */
        missed = s;
        s.classList.add("miss");
        setTimeout(function () { s.classList.remove("miss"); }, 320);
        setTimeout(function () {
          if (missed === s && clearMiss()) sync.push(b);
        }, 800);
      }
    }

    function markDone(s) {
      s.classList.add("done");
      s.classList.remove("active", "lr", "tb");
      s.querySelector(".zone.c").className = "zone c seat-c";
      s.querySelector(".zone.v").className = "zone v seat-v";
      s.querySelector(".glyph").textContent = s.getAttribute("data-a");
    }

    function clearSlot(s) {
      s.classList.remove("done", "lr", "tb");
      s.querySelector(".zone.c").className = "zone c";
      s.querySelector(".zone.v").className = "zone v";
      s.querySelector(".glyph").textContent = "";
    }

    b.__sync = {
      read: function () {
        return {
          done: slots.filter(function (s) { return s.classList.contains("done"); })
                     .map(function (s) { return s.getAttribute("data-a"); }),
          active: active >= 0 && slots[active] ? slots[active].getAttribute("data-a") : null,
          c: pick.c,
          v: pick.v
        };
      },
      apply: function (p) {
        if (!Array.isArray(p.done)) return false;
        missed = null;              // the other screen's state wins over a pending clear
        // every value has to be one this builder actually declares (§8)
        var seen = {};
        for (var i = 0; i < p.done.length; i++) {
          if (answers.indexOf(p.done[i]) < 0 || seen[p.done[i]]) return false;
          seen[p.done[i]] = 1;
        }
        if (p.active !== null && p.active !== undefined && answers.indexOf(p.active) < 0) return false;
        if (p.c !== null && p.c !== undefined && CHO.indexOf(p.c) < 0) return false;
        if (p.v !== null && p.v !== undefined && JUNG.indexOf(p.v) < 0) return false;

        slots.forEach(function (s) {
          if (seen[s.getAttribute("data-a")]) markDone(s);
          else clearSlot(s);
        });
        active = p.active ? answers.indexOf(p.active) : -1;
        pick = { c: p.c || null, v: p.v || null };
        draw();
        return true;
      }
    };

    keys.forEach(function (k) {
      k.addEventListener("click", function () {
        clearMiss();
        if (k.dataset.c) pick.c = pick.c === k.dataset.c ? null : k.dataset.c;
        else pick.v = pick.v === k.dataset.v ? null : k.dataset.v;
        draw();
        check();
        sync.push(b);
      });
    });

    slots.forEach(function (s, i) {
      s.addEventListener("click", function () {          // tap a slot to redo it
        missed = null;
        active = i;
        clearSlot(s);
        pick = { c: null, v: null };
        draw();
        sync.push(b);
      });
    });

    draw();
  });
})();
