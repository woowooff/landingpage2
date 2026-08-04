# 메일 / Google Sheets 설정 가이드

## 1. Gmail 자동 메일 설정

1. Gmail 계정으로 로그인합니다.
2. Google 계정 보안 > 2단계 인증을 켭니다.
3. 앱 비밀번호를 생성합니다.
4. 생성된 앱 비밀번호를 .env 파일의 GMAIL_APP_PASSWORD에 넣습니다.
5. GMAIL_USER에는 실제 Gmail 주소를 넣습니다.

예시:

```env
GMAIL_USER=woogs4444@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

## 2. Google Sheets 저장 설정

1. Google Cloud Console에서 새 프로젝트를 만듭니다.
2. Google Sheets API를 활성화합니다.
3. 서비스 계정을 생성합니다.
4. 서비스 계정 키(JSON)를 다운로드합니다.
5. JSON에서 client_email, private_key 값을 추출합니다.
6. Google Spreadsheet에 서비스 계정 이메일을 공유 권한 편집기 이상으로 추가합니다.
7. 시트 ID를 .env에 넣습니다.

예시:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id
```

## 3. 실행

```bash
npm install
node server.js
```

## 4. 테스트

- 브라우저에서 신청 폼 제출
- 메일 수신 여부 확인
- Google Sheets에 행이 추가되는지 확인
