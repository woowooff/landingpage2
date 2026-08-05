# jeju_vibe

제주에서 만든 **웹페이지 모음** 저장소입니다.
한 저장소 안에 서로 다른 페이지 세 개가 들어 있고, 각각 별도 주소로 배포됩니다.

## 페이지 목록

| 폴더 | 페이지 | 공개 주소 |
|---|---|---|
| [`LandingPage/`](./LandingPage) | 감귤박 업사이클 원료 소개 | https://jeju-vibe-rho.vercel.app |
| [`landingpage2/`](./landingpage2) | 제주다회 소개 · 참가 신청 | https://landingpage2-woowooff1.vercel.app |
| [`weatherApp/`](./weatherApp) | 날씨 웹앱 (오늘·24시간·7일·미세먼지) | https://weather-app-sigma-three-65.vercel.app |

### 1. 감귤박 소개페이지 (`LandingPage/`)
제주 감귤 착즙 후 남는 원료(감귤박)를 산업 원료로 순환시키는 사업을 소개하는 1페이지 사이트입니다.
구성: 히어로 → 순환 구조 → 자원순환/ESG → 원료 규격 → 활용 분야 → 근거 자료 → 회사 소개 → 문의 폼

### 2. 제주다회 랜딩페이지 (`landingpage2/`)
제주다회를 소개하고 참가 신청을 받는 1페이지 사이트입니다.

### 3. 날씨 웹앱 (`weatherApp/`)
여러 도시를 즐겨찾기 해두고 **오늘 날씨 · 24시간 시간별 예보 · 7일 예보 · 미세먼지**를 한 화면에서 보는 반응형 웹앱입니다.
날씨에 따라 배경 그라데이션이 바뀌고, 밤이면 자동으로 어두운 화면으로 전환됩니다.
앞의 두 페이지와 달리 **Next.js로 만든 앱**이라 빌드가 필요합니다 (아래 "로컬에서 열어보기" 참고).

## 기술 구성

- **프론트**: 랜딩페이지 2개는 HTML / CSS / JavaScript만 사용 (프레임워크·빌드 도구 없음)
  - 날씨앱만 **Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Lucide 아이콘**
- **날씨 데이터**: [Open-Meteo](https://open-meteo.com) — API 키·회원가입 불필요, 비상업 무료
- **폼 접수**: [Google Apps Script](https://developers.google.com/apps-script) 웹앱
  - 별도 서버가 필요 없고, 신청이 들어오면 ① 구글 시트 저장 ② 담당자 알림 메일 ③ 신청자 자동회신을 한 번에 처리합니다.
  - 각 폴더의 `apps-script/Code.gs`가 그 코드이며, 설치 방법은 폴더 안 `📮 ...설치안내.md`에 단계별로 적어 뒀습니다.
- **배포**: [Vercel](https://vercel.com) — 페이지마다 Vercel 프로젝트를 따로 두어 주소를 분리했습니다.
  - 랜딩페이지 2개: `main` 브랜치에 push하면 자동으로 사이트가 갱신됩니다.
  - 날씨앱(`weather-app` 프로젝트): 아직 깃허브 자동배포에 연결하지 않아, 폴더에서 `vercel deploy --prod`로 배포합니다.

## 폴더 구조

```
jeju_vibe/
├── vercel.json          # 루트(/) 요청을 LandingPage/index.html로 연결
├── LandingPage/         # 감귤박 소개페이지
│   ├── index.html
│   └── apps-script/     # 문의 접수용 Apps Script 코드
├── landingpage2/        # 제주다회 랜딩페이지
│   ├── index.html
│   ├── styles.css
│   ├── app.js           # 폼 제출 처리
│   └── apps-script/     # 신청 접수용 Apps Script 코드
└── weatherApp/          # 날씨 웹앱 (Next.js)
    ├── app/             # 페이지·전역 스타일
    ├── components/
    │   ├── ui/          # shadcn/ui 컴포넌트
    │   └── weather/     # 날씨 화면 (현재·시간별·주간·미세먼지 등)
    ├── lib/weather.ts   # Open-Meteo 연결 및 데이터 변환
    └── PRD.md           # 기획서
```

## 로컬에서 열어보기

### 랜딩페이지 2개 (빌드 불필요)

`index.html`을 브라우저로 바로 열어도 되지만, 폼 전송까지 테스트하려면 간단한 웹 서버로 여는 편이 좋습니다.

```bash
cd landingpage2
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

### 날씨앱 (Next.js)

```bash
cd weatherApp
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

## 참고

- 각 폴더의 `🔧 ...진행상황.md`에 작업 이력과 남은 할 일이 정리되어 있습니다.
- `Code.gs`를 수정한 뒤에는 Apps Script에 붙여넣고 **[배포 → 배포 관리 → 연필 → 새 버전]** 으로 재배포해야 반영됩니다.
  (새 배포로 만들면 웹앱 주소가 바뀌어 `index.html`도 함께 고쳐야 합니다.)
