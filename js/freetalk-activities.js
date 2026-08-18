/* ================================================================
   FREETALK ACTIVITIES · 자유 대화 과가 쓰는 활동 (공유 스크립트)

     .opt-list[data-pick]  정답이 없는 고르기 (single / multi).
     .sents .sent          예습 지문을 눌러 뜻 보기.

   쓰는 칸(.answer-space)은 activities.js 가 맡는다 — 이 파일은 그 다음에
   오고, 답이 비어 있는 칸은 거기서 자유 작문 칸이 된다.
   ================================================================ */

(function () {
  'use strict';

  /* ---------- 정답이 없는 고르기 ----------
     초록은 여기서 "고른 것"이라는 뜻이고, .on 은 지워지지 않는 클래스라
     늦게 들어온 쪽도 그대로 받는다.

     data-group 이 붙은 칸은 건너뛴다 — 그건 리포트의 답이고 report.js 가
     이미 같은 버튼에 자기 핸들러를 매단다. 둘 다 매달리면 한 번 누를 때
     .on 이 두 번 뒤집혀 아무것도 안 골린 것이 된다. 체험 4과(자유 대화)만
     이 파일과 report.js 를 함께 싣기 때문에, 그 덱에서만 학습 동기가
     영영 안 골라지고 「리포트 저장」 버튼이 끝까지 잠겨 있었다. */
  document.querySelectorAll(".opt-list[data-pick]:not([data-group])").forEach(function (group) {
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

  /* ---------- 예습 지문 · 눌러서 뜻과 낱말 보기 ----------
     공유되는 것은 "어느 문장이 열려 있는가"(.open) 뿐이다. 튜터가 짚은
     문장이 학습자 화면에서도 같이 열린다.

     한 번에 한 줄만 연다. 이유가 둘이다. 여러 줄을 펼쳐 두면 번역이 줄
     사이사이에 끼어 지문이 다시 문단으로 뭉개지고 — 무엇보다 열린 줄이
     "지금 보는 줄" 이라는 뜻을 잃는다. 포인터의 빨간 링이 열린 줄에 그대로
     얹히므로(spotlight.js 의 POINTS), 열린 줄은 언제나 하나여야 한다.
     보드 계약대로 단일 선택은 여기 핸들러의 몫이다: 같은 줄을 다시 누르면
     닫혀야 늦게 들어온 화면도 같은 상태로 수렴한다. */
  document.querySelectorAll(".sents").forEach(function (group) {
    var lines = [].slice.call(group.querySelectorAll(".sent"));
    lines.forEach(function (b) {
      b.addEventListener("click", function (e) {
        /* 열린 칸 안(번역·낱말)을 누른 것은 닫으라는 뜻이 아니다.
           거기서는 튜터가 낱말 하나를 짚거나(spotlight) 글자에 형광펜을
           긋는 중이고, 그때마다 카드가 접히면 짚을 수가 없다. 닫는 것은
           문장 줄이나 꺾쇠를 다시 누르는 것 — 연 자리에서 닫는다. */
        if (e.target.closest(".s-open")) return;
        var was = b.classList.contains("open");
        lines.forEach(function (x) { x.classList.remove("open"); });
        b.classList.toggle("open", !was);
      });
      /* <button> 이 아니라 <div role="button"> 이다 — 버튼이면 그 안의 글이
         형광펜과 포인터 양쪽에서 "위젯 안" 으로 걸러진다(highlight.js 의
         MARKABLE 주석). 대신 버튼이 공짜로 주던 키보드 조작을 여기서 돌려준다. */
      b.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        b.click();
      });
    });
  });

})();
