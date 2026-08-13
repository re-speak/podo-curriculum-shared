/* ================================================================
   SCRIPT LINES · 튜터 대사를 문장 단위로 짝지어 세운다
   ----------------------------------------------------------------
   파란 스크립트 박스는 한국어 한 덩어리 + 일본어 한 덩어리였다.
   두세 문장이 들어가면 튜터가 "지금 어디를 읽고 있는지" 를 눈으로 잡기
   어렵고, 학습자도 어느 일본어가 어느 한국어에 붙는지 알 수 없다.

   그래서 로드 때 문장 단위로 잘라, 한 줄 = 한국어 + 그 밑에 그 문장의
   일본어로 다시 세운다:

       같이 인사해요.
       一緒にあいさつしましょう。

       제가 시작할게요!
       私から始めますね！

   원고는 그대로 둔다. 작성자는 지금처럼 .ko 하나 .ja 하나만 쓰면 되고,
   짝짓기는 이 파일이 한다 — 48 장 넘는 페이지의 마크업을 건드리지 않는다.

   안전장치가 핵심이다: 문장 수가 서로 다르면 아무것도 하지 않는다.
   잘못 짝지어 놓으면 "이 일본어가 이 한국어의 번역" 이라는 거짓말을 화면에
   박아 넣는 셈이라, 애매하면 손대지 않는 쪽이 항상 낫다. 한 문장짜리
   스크립트도 그대로 둔다 — 나눌 것이 없다.

   highlight.js 보다 먼저 실행돼야 한다. 형광펜은 로드 때 문서 순서대로
   글 블록에 번호를 매기므로, 번호가 매겨진 뒤에 DOM 을 바꾸면 안 된다.
   ================================================================ */
(function () {
  "use strict";

  // 문장 끝 부호. 한국어는 라틴 문장부호를, 일본어는 전각을 쓴다.
  var KO_END = ".!?";
  var JA_END = "。！？";

  /* 인용 부호. 짝이 분명한 것만 센다 — 곧은 따옴표(" ')는 여는 것과 닫는 것이
     같은 글자라 깊이를 셀 수 없으므로 일부러 뺐다. 그쪽은 아래 spaced 규칙이 받는다. */
  var QUOTE_OPEN  = "“‘「『";   // “ ‘ 「 『
  var QUOTE_CLOSE = "”’」』";   // ” ’ 」 』

  /* 문장부호를 문장에 붙인 채로 자른다. 부호 뒤의 공백은 먹어 없앤다.
     정규식의 lookbehind 를 쓰지 않는 건 지원이 고르지 않아서다.

     이 덱들은 가르치는 표현을 문장 안에 그대로 인용한다 — 도대체 왜 그랬어?는,
     (으)ㄹ래요?로, 어디 있어요?를. 부호만 보고 자르면 그 물음표에서 문장이
     끊겨, 한국어만 문장 수가 부풀고 짝짓기가 통째로 취소된다. 일본어는 전각
     부호만 세기 때문에 같은 자리에서 끊기지 않아서, 어긋남이 한쪽에서만 생겼다.

     그래서 두 가지를 더 본다:
       depth   인용 부호 안의 부호는 문장을 끝내지 않는다. 양쪽 모두에 적용된다.
       spaced  한국어는 문장 사이를 띄우므로, 부호 뒤에 공백이나 줄 끝이 와야
               문장이 끝난 것으로 본다. 인용된 표현 뒤에는 조사가 공백 없이
               바로 붙는다(그랬어?는). 일본어는 문장 사이를 띄우지 않으니
               이 조건을 걸지 않는다. */
  function split(text, enders, spaced) {
    var out = [], cur = "", depth = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      cur += ch;
      if (QUOTE_OPEN.indexOf(ch) >= 0) depth++;
      else if (QUOTE_CLOSE.indexOf(ch) >= 0 && depth > 0) depth--;

      if (depth === 0 && enders.indexOf(ch) >= 0) {
        var ends = i + 1 >= text.length || /\s/.test(text[i + 1]);
        if (!spaced || ends) {
          while (i + 1 < text.length && /\s/.test(text[i + 1])) cur += text[++i];
          if (cur.trim()) out.push(cur.trim());
          cur = "";
        }
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  document.querySelectorAll(".section-subtitle").forEach(function (box) {
    // The pattern meaning component intentionally keeps one Korean teaching
    // block over one Japanese inset; its own layout owns that pairing.
    if (box.classList.contains("pattern-meaning")) return;

    var ko = box.querySelector(":scope > .ko");
    var ja = box.querySelector(":scope > .ja");
    if (!ko || !ja) return;                       // 한쪽만 있는 박스는 그대로

    var k = split(ko.textContent, KO_END, true);
    var j = split(ja.textContent, JA_END, false);

    // 나눌 것이 없거나, 짝이 맞지 않으면 손대지 않는다
    if (k.length < 2 || k.length !== j.length) return;

    var frag = document.createDocumentFragment();
    for (var i = 0; i < k.length; i++) {
      var line = document.createElement("span");
      line.className = "sline";
      var a = document.createElement("span");
      a.className = "ko";
      a.textContent = k[i];
      var b = document.createElement("span");
      b.className = "ja";
      b.textContent = j[i];
      line.appendChild(a);
      line.appendChild(b);
      frag.appendChild(line);
    }
    // 클래스는 그대로 .ko / .ja 를 쓴다 — 줄바꿈 규칙(word-break)이나
    // ja→ko 툴팁의 제외 목록이 이미 그 이름으로 걸려 있다.
    box.replaceChild(frag, ko);
    box.removeChild(ja);
    box.classList.add("lined");
  });
})();
