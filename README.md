# Portfolio

별도 설치나 빌드 없이 `index.html`을 브라우저에서 열 수 있습니다.
로컬 서버로 확인하려면 프로젝트 폴더에서 `python -m http.server 8000`을 실행하고 http://localhost:8000 에 접속합니다.

## 수정할 곳

- `index.html`: 소개 문구, 이름, 연락처, 프로젝트 요약
- `project-groupbuy.html`: 기간, 팀 구성, 실제 담당 범위, 구현 사례, 결과
- `project-family.html`, `project-matching.html`: 상세 기록 준비 페이지
- `css/common.css`: `:root`의 색상, 폰트, 콘텐츠 너비, 여백
- `css/project.css`: 프로젝트 상세 페이지 레이아웃

## 이미지 교체

`assets/images/`에 실제 이미지를 저장한 후 해당 `media-placeholder` 요소를 아래처럼 교체합니다.

```html
<img src="assets/images/groupbuy-home.webp"
     alt="공동구매 서비스 홈 화면의 상품 목록과 검색 영역"
     width="1440" height="900" loading="lazy">
```

이미지의 실제 크기에 맞게 width와 height를 변경하고, alt는 각 화면의 내용에 맞게 작성합니다.
상세 페이지에서는 figure와 figcaption을 유지하고 내부 placeholder만 교체합니다.

## 연락처

확인되지 않은 주소로 연결하지 않도록 현재는 텍스트로 표시합니다.
실제 이메일을 넣을 때 `.contact-pending` 요소를 아래와 같이 링크로 교체합니다.

```html
<a class="text-link" href="mailto:실제이메일주소">실제이메일주소 ↗</a>
```

본문과 타임라인은 Pretendard, 제목·헤더·스킬 pill은 Paperlogy 웹폰트를 사용합니다. css/common.css에서 400·500·600·700·800 굵기를 CDN으로 불러오며, 네트워크 연결이 없으면 시스템 폰트로 대체됩니다.

Pretendard는 assets/PretendardVariable.woff2에서 로컬 로딩합니다. 라이선스는 assets/Pretendard-LICENSE.txt에 포함되어 있습니다.
