/* ================================================================
   TUTOR NOTES · 페이지마다 한 줄 메모 — 튜터가 쓰면 학생에게 보인다
   ----------------------------------------------------------------
   화이트보드가 없으니, 수업 중에 즉석으로 적어 줄 곳이 필요하다.
   페이지마다 <textarea> 를 하나씩 끼워 넣는다. 비어 있으면 아무에게도
   안 보이고, 티칭 모드에서만 "여기 적으세요" 로 나타난다. 튜터가 한 글자라도
   적는 순간 양쪽 화면에 뜬다.

   레몬보드의 data-sync 계약에서 제일 싼 자리를 쓴다 — 등록할 kind 가 없다.
   <textarea data-sync-id> 는 기본 제공 "value" 로 추론되므로, 전송·IME 조합
   대기·길이 제한·에코 차단·늦은 입장 스냅샷을 전부 보드가 해 준다. 이 파일은
   "메모 칸을 어디에 놓고, 언제 보이게 할지" 만 정한다.

   보이고 숨는 규칙은 CSS 한 줄이다(lesson-card.css 의 .note-input):
     · 기본           → display:none
     · body.teaching  → 보인다 (튜터는 빈 칸도 봐야 쓸 수 있으니)
     · 내용이 있으면  → 보인다 (:placeholder-shown 이 아닌 상태)
   :placeholder-shown 은 value 를 스크립트로 넣어도 즉시 반영되므로,
   원격에서 도착한 메모도 이벤트 하나 없이 그대로 떠오른다. 티칭 모드는
   공유하지 않는 상태라(페이저 참고) 튜터는 빈 칸까지, 학생은 채워진 것만 본다.

   자리: 파란 스크립트 박스(.section-subtitle) 바로 아래 — 튜터가 대사를 읽고
   다음으로 눈이 가는 곳이고, .tutor-note 가 이미 쓰는 자리다. 그 페이지에
   .tutor-note 가 있으면 그 아래로 내려간다. 둘 다 없는 표지·전환 페이지에서만
   맨 뒤에 붙인다 — .section 의 마지막 자식이 되는 일이 없어야 한다.
   :last-child 로 남는 여백을 미는 규칙(trial.css)이 메모 칸에 걸리면
   페이지가 화면을 못 채운다.

   한 덱에 <script src> 한 줄이면 붙는다.
   ================================================================ */
(function () {
  "use strict";

  var phone = document.querySelector(".phone");
  if (!phone) return;

  var pages = [].slice.call(phone.children);

  pages.forEach(function (page, i) {
    // 페이지를 순서가 아니라 이름으로 지칭한다 — 페이지를 끼워 넣어도
    // 이전에 공유된 메모가 엉뚱한 곳으로 옮겨가지 않는다.
    var id = page.getAttribute("data-page-id");
    if (!id) return;                       // 이름 없는 페이지에는 달지 않는다

    var box = document.createElement("textarea");
    box.className = "note-input";
    box.setAttribute("data-sync-id", "note-" + id);
    /* 이 칸이 무엇인지 설명하는 건 이 문구뿐이다. "메모" 만 적혀 있으면
       튜터 혼자 보는 개인 메모로 읽히는데, 실제로는 한 글자만 써도 학생
       화면에 그대로 뜬다. "전하다" 가 방향을 이미 말해 주므로 "학생에게도
       보여요" 같은 설명을 따로 붙이지 않아도 된다. 어미는 덱의 튜터 노트가
       쓰는 해요체(…적어 주세요)에 맞춘다.
       (:placeholder-shown 이 이 문구를 본다. 지우면 칸이 사라진다.) */
    box.setAttribute("placeholder", "학생에게 전하고 싶은 말을 자유롭게 적어 주세요");
    box.setAttribute("aria-label", "학생에게 전하는 말");
    box.setAttribute("rows", "2");
    box.setAttribute("autocomplete", "off");

    // 파란 스크립트 → (있으면) 튜터 노트 → 메모. 없으면 페이지 끝.
    var anchor = page.querySelector(":scope > .tutor-note")
              || page.querySelector(":scope > .section-subtitle");
    if (anchor) anchor.insertAdjacentElement("afterend", box);
    else page.appendChild(box);
  });

  var boxes = [].slice.call(phone.querySelectorAll(".note-input"));
  if (!boxes.length) return;

  /* ---- 쓰는 쪽은 튜터뿐 ----
     학생 화면에도 채워진 메모는 뜨지만, 고칠 수는 없어야 한다. 티칭 모드는
     이 화면에만 있는 상태라 body 의 클래스가 유일한 신호다. */
  function lock() {
    var teaching = document.body.classList.contains("teaching");
    boxes.forEach(function (b) { b.readOnly = !teaching; });
  }
  lock();
  new MutationObserver(lock).observe(document.body, {
    attributes: true, attributeFilter: ["class"]
  });

  /* ---- 페이저의 화살표 키를 먹지 않게 ----
     덱은 ←/→ 로 넘긴다. 메모를 쓰는 중에는 커서 이동이어야 하는데,
     페이저가 document 에서 듣기 때문에 여기서 막아 준다. (페이저도 input,
     textarea 를 걸러 내지만, 메모는 그 판정에 기대지 않고 스스로 막는다.) */
  boxes.forEach(function (b) {
    b.addEventListener("keydown", function (e) { e.stopPropagation(); });
  });
})();
