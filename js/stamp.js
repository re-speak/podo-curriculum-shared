/* ================================================================
   STAMP · 참! 잘했어요 — 튜터가 찍어 주는 칭찬 도장.

   찍는 건 튜터만 할 수 있다(버튼이 티칭 모드에서만 보이고, 핸들러도 한 번
   더 확인한다). 찍힌 결과는 양쪽에 보인다 — 칭찬은 학습자가 봐야 의미가
   있으니까. 티칭 모드 자체는 공유하지 않지만(정답이 넘어간다) 도장은
   공유한다. 스포트라이트와 같은 구도다.

   상태는 "도장이 찍힌 페이지들"이고, 페이지는 순서가 아니라 data-page-id
   로 지칭한다(§ 프로토콜: 위치가 아니라 의미로 부른다). 도장을 모아 두므로
   학습자가 앞으로 되돌려 보면 받은 도장이 그대로 남아 있다.

   이 스크립트는 페이지의 DOM 을 건드리지 않는다 — 클래스만 붙인다. 도장
   그림은 .phone 의 형제로 딱 하나 있고, 지금 보이는 페이지에 클래스가
   있는지를 CSS 의 :has() 가 읽어 표시를 결정한다. 페이지 안에 그림을
   넣었더니 그게 :last-child 가 되었고, 트랙 시트가 여덟 종류의 페이지를
   가운데 정렬하려고 마지막 자식에게 주는 margin-bottom: auto 를 가로채
   레이아웃이 깨졌다. 페이지 밖에 두면 그 문제가 생길 수 없다.

   그림 경로는 반드시 덱 마크업에 있어야 한다 — 패키저는 마크업에 적힌
   이미지 경로만 번들·평탄화하므로, JS 로 경로를 만들면 로컬에서만 되고
   보드(S3)에서 404 가 난다. 그래서 이 파일에는 경로가 없다.
   ================================================================ */
(function () {
  var phone = document.querySelector(".phone");
  var art   = document.querySelector(".stamp-art");
  var bar   = document.querySelector(".pager");
  if (!phone || !art || !bar) return;      // 도장을 안 쓰는 덱이면 조용히 빠진다

  var sync = window.lessonSync || (window.lessonSync = {
    kinds: {},
    register: function (name, handlers) { this.kinds[name] = handlers; return this; },
    push: function () {}
  });

  var byId = {};
  var pages = [].slice.call(phone.children).filter(function (p) {
    var id = p.getAttribute("data-page-id");
    if (!id) return false;                 // 페이지가 아닌 것에는 찍지 않는다
    byId[id] = p;
    return true;
  });

  var stamped = {};                        // pageId -> true

  function paint() {
    for (var i = 0; i < pages.length; i++) {
      var id = pages[i].getAttribute("data-page-id");
      pages[i].classList.toggle("stamped", stamped[id] === true);
    }
  }

  /* 공유 상태는 찍힌 페이지 id 의 목록. 정렬해서 내보낸다 — 같은 상태면
     같은 배열이어야 매 상호작용마다 다시 발행하지 않는다. */
  sync.register("stamp", {
    read: function () { return { pages: Object.keys(stamped).sort() }; },
    apply: function (_el, state) {
      if (!state || !Array.isArray(state.pages)) return;   // 모양이 틀리면 그대로 둔다
      var next = {};
      for (var i = 0; i < state.pages.length; i++) {
        var id = state.pages[i];
        if (typeof id === "string" && byId[id]) next[id] = true;  // 없는 id 는 무시
      }
      stamped = next;
      paint();
    }
  });

  var carrier = document.createElement("div");
  carrier.setAttribute("data-sync-id", "deck-stamp");
  carrier.setAttribute("data-sync-kind", "stamp");
  carrier.style.display = "none";
  document.body.appendChild(carrier);

  // ---- 버튼 ----
  // 페이저 안에 만든다. 라벨은 도장 그림을 축소한 것이라, 여기서도 경로를
  // 새로 쓰지 않는다(복제본은 이미 해석된 경로를 그대로 들고 온다).
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pg-btn pg-stamp";
  btn.setAttribute("aria-label", "참 잘했어요 도장");
  btn.appendChild(art.cloneNode(true));
  // 티칭 버튼 왼쪽에 둔다 — 오른쪽 끝은 "다음"의 자리다. DOM 순서 자체를
  // 맞춰서 넣으므로(CSS order 가 아니라), 탭 순서도 보이는 순서와 같다.
  bar.insertBefore(btn, bar.querySelector(".pg-teach") || bar.querySelector(".pg-next"));

  btn.addEventListener("click", function () {
    // 버튼은 티칭 모드에서만 보이지만, 상태로도 한 번 더 막는다.
    if (!document.body.classList.contains("teaching")) return;
    var cur = phone.querySelector(".pg-on");
    var id = cur && cur.getAttribute("data-page-id");
    if (!id || !byId[id]) return;
    if (stamped[id]) delete stamped[id];   // 다시 누르면 취소
    else stamped[id] = true;
    paint();
    sync.push(carrier);
  });
})();
