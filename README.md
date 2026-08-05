# jeju_vibe

제주에서 만든 **정적 랜딩페이지 모음** 저장소입니다.
한 저장소 안에 서로 다른 페이지 두 개가 들어 있고, 각각 별도 주소로 배포됩니다.

## 페이지 목록

| 폴더 | 페이지 | 공개 주소 |
|---|---|---|
| [`LandingPage/`](./LandingPage) | 감귤박 업사이클 원료 소개 | https://jeju-vibe-rho.vercel.app |
| [`landingpage2/`](./landingpage2) | 제주다회 소개 · 참가 신청 | https://landingpage2-woowooff1.vercel.app |

### 1. 감귤박 소개페이지 (`LandingPage/`)
제주 감귤 착즙 후 남는 원료(감귤박)를 산업 원료로 순환시키는 사업을 소개하는 1페이지 사이트입니다.
구성: 히어로 → 순환 구조 → 자원순환/ESG → 원료 규격 → 활용 분야 → 근거 자료 → 회사 소개 → 문의 폼

### 2. 제주다회 랜딩페이지 (`landingpage2/`)
제주다회를 소개하고 참가 신청을 받는 1페이지 사이트입니다.

## 기술 구성

- **프론트**: HTML / CSS / JavaScript만 사용 (프레임워크·빌드 도구 없음)
- **폼 접수**: [Google Apps Script](https://developers.google.com/apps-script) 웹앱
  - 별도 서버가 필요 없고, 신청이 들어오면 ① 구글 시트 저장 ② 담당자 알림 메일 ③ 신청자 자동회신을 한 번에 처리합니다.
  - 각 폴더의 `apps-script/Code.gs`가 그 코드이며, 설치 방법은 폴더 안 `📮 ...설치안내.md`에 단계별로 적어 뒀습니다.
- **배포**: [Vercel](https://vercel.com) — 페이지마다 Vercel 프로젝트를 따로 두어 주소를 분리했습니다.
  `main` 브랜치에 push하면 자동으로 사이트가 갱신됩니다.

## 폴더 구조

```
jeju_vibe/
├── vercel.json          # 루트(/) 요청을 LandingPage/index.html로 연결
├── LandingPage/         # 감귤박 소개페이지
│   ├── index.html
│   └── apps-script/     # 문의 접수용 Apps Script 코드
└── landingpage2/        # 제주다회 랜딩페이지
    ├── index.html
    ├── styles.css
    ├── app.js           # 폼 제출 처리
    └── apps-script/     # 신청 접수용 Apps Script 코드
```

## 로컬에서 열어보기

빌드 과정이 없어서 `index.html`을 브라우저로 바로 열어도 되지만,
폼 전송까지 테스트하려면 간단한 웹 서버로 여는 편이 좋습니다.

```bash
cd landingpage2
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 참고

- 각 폴더의 `🔧 ...진행상황.md`에 작업 이력과 남은 할 일이 정리되어 있습니다.
- `Code.gs`를 수정한 뒤에는 Apps Script에 붙여넣고 **[배포 → 배포 관리 → 연필 → 새 버전]** 으로 재배포해야 반영됩니다.
  (새 배포로 만들면 웹앱 주소가 바뀌어 `index.html`도 함께 고쳐야 합니다.)
