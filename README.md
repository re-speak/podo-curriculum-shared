# podo-curriculum-shared

`podo-curriculum` 의 공유 런타임(`shared/css`, `shared/js`)을 CDN 으로 배급하기 위한 미러다.

**여기를 직접 고치지 마라.** 원본은 [`re-speak/podo-curriculum`](https://github.com/re-speak/podo-curriculum) 의
`shared/` 이고, 이 레포는 거기서 밀어 넣는다. 여기서 편집하면 다음 밀어넣기에 사라진다.

## 쓰는 법

덱은 **태그로 핀한 URL** 만 참조한다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/re-speak/podo-curriculum-shared@v1.0.0/css/trial.css">
<script src="https://cdn.jsdelivr.net/gh/re-speak/podo-curriculum-shared@v1.0.0/js/activities.js"></script>
```

`@v1.0.0` 처럼 태그를 박은 URL 은 불변이라 CDN 이 영구 캐시한다.
`@main` 은 12 시간마다 다시 확인하므로, 그 12 시간 동안 엣지마다 서로 다른 버전을
내려줄 수 있다 — 수업 중에 어떤 학습자에게만 활동이 죽는 형태로 터진다.
**브랜치 ref 를 덱에 쓰지 마라.**

## 버전 올리기

내용은 덧붙이기만 한다(append-only). 기존 함수·셀렉터를 바꾸지 않으므로
옛 태그를 가리키는 덱은 영향을 받지 않는다. 새 태그를 끊고, 덱은 준비될 때
각자 올린다.
