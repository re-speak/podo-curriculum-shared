/* ================================================================
   발음 표기 스위치 · よみがな (공유 스크립트)

   체험 레슨은 한글을 못 읽는 학습자를 전제로 한국어마다 가나 읽기(.yomi)를
   달고 열린다. 이 파일은 그것을 끄고 켜는 스위치 하나를 놓는다.

   세 가지가 이 설계를 정한다.

   1) 자리는 페이지 오른쪽 위. 페이저 안에 있을 때는 ←/T/→ 사이에 낀 작은
      기호라, 학습자는 그것이 자기 것인 줄 몰랐다. 읽고 있는 카드 위에
      「よみがな」라고 적힌 스위치가 있어야 "내가 끌 수 있는 것"으로 읽힌다.
      그래서 아이콘이 아니라 이름이고, 페이지마다 하나씩 있다.

   2) 상태는 body 에 한 번만 붙는다(body.no-yomi). 스위치가 여러 개여도
      상태는 하나라, 한 장에서 끄면 스물다섯 장이 같이 꺼진다.

   3) 티칭 모드와 달리 이것은 공유한다. 읽기를 끄는 것은 답을 여는 일이
      아니라 수업의 합의라서, 튜터가 "이제 가나 없이 읽어 볼까요?" 하고
      껐을 때 학습자 화면이 그대로면 그 말이 성립하지 않는다.
      상태(꺼짐/켜짐)만 오간다 — 클릭이 아니라. 늦게 들어와도 한 번에 맞는다.

   읽기가 하나도 없는 페이지(표지·마무리)에는 달지 않는다. 끌 것이 없는
   스위치는 알려 주는 것이 없다.

   한 덱에 <script src> 한 줄이면 붙는다. 로드 순서는 자유롭다 — 이 파일은
   페이지 수를 세지도, 다른 모듈이 만든 것을 읽지도 않는다. 형광펜·스포트라이트는
   button 과 [data-sync-id] 를 이미 건너뛰므로 뒤에 와도 앞에 와도 같다.
   ================================================================ */
(function () {
  "use strict";

  var phone = document.querySelector(".phone");
  if (!phone) return;

  var pages = [].slice.call(phone.children).filter(function (p) {
    return p.querySelector(".yomi");
  });
  if (!pages.length) return;                 // 읽기가 없는 덱 — 스위치도 없다

  // 보드 밖(로컬에서 파일을 직접 열 때)에서는 lessonSync 가 없다.
  var sync = window.lessonSync || { register: function () {}, push: function () {} };

  var switches = pages.map(function (page) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "yomi-sw";
    /* 이름이 이 컴포넌트의 전부다. 「よみがな」는 학습자의 말이고, 켜고 끄는
       것이라는 사실은 옆의 트랙이 말한다 — 설명을 덧붙이면 페이지 위에 앉은
       칩이 문장이 되어 버린다. */
    b.innerHTML =
      '<span class="yomi-sw-t">よみがな</span>' +
      '<span class="yomi-sw-k" aria-hidden="true"></span>';
    b.setAttribute("aria-label", "よみがなの表示");

    /* 자리는 두 가지다.

       학습 페이지에는 제목이 맨 위에 있으므로, 제목과 한 줄에 세운다 — 제목을
       머리 줄(.page-head)로 감싸고 그 오른쪽 끝에 놓는다. 흐름 안에 들어가 있는
       것이 요점이다: 제목이 길어지면 스위치 앞에서 줄이 바뀔 뿐, 밑으로 파고들
       일이 없다(제목 오른쪽을 비워 두는 방식은 「이에요와 예요 (이에요 と
       예요、どっち？)」 같은 제목을 두 줄로 접는다).

       표지·전환 페이지는 내용을 세로 가운데에 놓아서 맞출 제목 줄이 없다.
       거기서는 모서리에 띄운다(.corner). */
    var title = page.querySelector(":scope > .section-title");
    if (title) {
      var head = document.createElement("div");
      head.className = "page-head";
      title.parentNode.insertBefore(head, title);
      head.appendChild(title);
      head.appendChild(b);
    } else {
      b.classList.add("corner");
      page.insertBefore(b, page.firstChild);
    }
    b.addEventListener("click", function () {
      // 지금 꺼져 있으면(no-yomi) 켜고, 켜져 있으면 끈다
      set(document.body.classList.contains("no-yomi"));
      sync.push(anchor);
    });
    return b;
  });

  /* 공유되는 것은 스위치가 아니라 "지금 켜져 있는가" 하나뿐이라, id 는 페이지
     밖의 앵커 하나가 든다. 스위치 중 하나에 얹으면 그 페이지를 지우는 순간
     공유가 조용히 사라진다. */
  var anchor = document.createElement("span");
  anchor.className = "yomi-anchor";
  anchor.hidden = true;
  anchor.setAttribute("data-sync-id", "deck-yomi");
  anchor.setAttribute("data-sync-kind", "yomi");
  document.body.appendChild(anchor);

  function set(on) {
    document.body.classList.toggle("no-yomi", !on);
    switches.forEach(function (b) {
      b.classList.toggle("off", !on);
      b.setAttribute("aria-pressed", String(on));
    });
  }
  set(true);                                  // 켜진 채로 연다

  sync.register("yomi", {
    read: function () {
      return { on: !document.body.classList.contains("no-yomi") };
    },
    apply: function (el, state) {
      if (!state || typeof state.on !== "boolean") return;
      set(state.on);
    }
  });
})();
