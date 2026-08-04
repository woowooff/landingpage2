/**
 * 제주다회 — 참가 신청 접수 백엔드
 * ────────────────────────────────────────────────────
 * 하는 일 세 가지
 *   1. 구글 시트에 신청 내용 저장
 *   2. 담당자에게 알림 메일 발송
 *   3. 신청자에게 "접수됐습니다" 자동회신 메일 발송
 *
 * ⚠️ 이 스크립트는 개인 계정(woogs4444@gmail.com)으로 만듭니다.
 *    감귤박 소개페이지는 회사 계정(suchang.marketing@gmail.com)이라 서로 다른 스크립트입니다.
 *
 * 설치 방법은 같은 폴더 위의 「📮 참가신청폼 설치안내.md」 참고
 * ────────────────────────────────────────────────────
 */

// ══════ 설정 (여기만 바꾸면 됨) ══════
const ADMIN_EMAIL  = 'woogs4444@gmail.com';   // 신청 알림을 받을 주소 (개인 계정)
const BRAND_NAME   = '제주다회';               // 자동회신 발신자 이름
const SHEET_NAME   = '참가신청';               // 저장될 시트 탭 이름
const REPLY_HOURS  = '1~2일';                 // 자동회신에 안내할 회신 소요 시간
const TIMEZONE     = 'Asia/Seoul';

const HEADERS = ['접수일시', '이름', '이메일', '연락처', '참가 관련 메모', '자동회신', '유입 경로'];

const COL_MESSAGE = 5;   // '참가 관련 메모' 칸 위치 (HEADERS 순서 바꾸면 같이 고칠 것)
const COL_REPLY   = 6;   // '자동회신' 칸 위치


// ══════ 신청 접수 (랜딩페이지에서 호출) ══════
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: '전달된 내용이 없습니다.' });
    }

    const data = JSON.parse(e.postData.contents);

    // 봇 차단 — 사람 눈에 안 보이는 칸(website)에 값이 있으면 봇
    if (data.website) return jsonOut({ ok: true });

    const email = trim(data.email);

    // 필수값 확인
    if (!trim(data.name) || !email) {
      return jsonOut({ ok: false, error: '이름과 이메일은 필수입니다.' });
    }
    if (!isEmail(email)) {
      return jsonOut({ ok: false, error: '이메일 주소 형식이 올바르지 않습니다.' });
    }

    const record = {
      time:    Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      name:    trim(data.name),
      email:   email,
      phone:   trim(data.phone)   || '-',
      message: trim(data.message) || '-',
      source:  trim(data.source)  || '랜딩페이지'
    };

    // 1) 시트 저장 — 저장이 최우선이므로 메일보다 먼저
    saveToSheet(record);

    // 2) 담당자 알림
    let adminSent = false;
    try { notifyAdmin(record); adminSent = true; }
    catch (err) { console.error('담당자 알림 실패: ' + err); }

    // 3) 신청자 자동회신
    let replySent = false;
    try { sendAutoReply(record); replySent = true; }
    catch (err) { console.error('자동회신 실패: ' + err); }

    // 자동회신 발송 여부를 시트 마지막 행에 기록
    markAutoReply(replySent ? '발송' : '실패');

    return jsonOut({ ok: true, autoReply: replySent, adminNotified: adminSent });

  } catch (err) {
    console.error(err);
    return jsonOut({ ok: false, error: String(err) });
  }
}


// ══════ 브라우저로 주소를 열었을 때 (동작 확인용) ══════
function doGet() {
  return jsonOut({ ok: true, message: '제주다회 참가 신청 접수 서버가 정상 동작 중입니다.' });
}


// ══════ 1. 구글 시트에 저장 ══════
function saveToSheet(r) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // 시트가 없으면 만들고 머리글 넣기
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    const head = sheet.getRange(1, 1, 1, HEADERS.length);
    head.setFontWeight('bold').setBackground('#7a4b2e').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);            // 접수일시
    sheet.setColumnWidth(3, 200);            // 이메일
    sheet.setColumnWidth(COL_MESSAGE, 380);  // 참가 관련 메모
  }

  sheet.appendRow([
    r.time, r.name, r.email, r.phone, r.message, '처리중', r.source
  ]);

  // 메모 칸은 줄바꿈 보이게
  sheet.getRange(sheet.getLastRow(), COL_MESSAGE).setWrap(true);
}


// 자동회신 발송 여부를 마지막 행에 기록
function markAutoReply(status) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(sheet.getLastRow(), COL_REPLY).setValue(status);
    }
  } catch (err) {
    console.error('자동회신 상태 기록 실패: ' + err);
  }
}


// ══════ 2. 담당자에게 알림 메일 ══════
function notifyAdmin(r) {
  const subject = '[제주다회] 새 참가 신청 · ' + r.name;

  const body =
    '제주다회 랜딩페이지로 참가 신청이 접수되었습니다.\n' +
    '────────────────────────────\n' +
    '접수일시 : ' + r.time + '\n' +
    '이름     : ' + r.name + '\n' +
    '이메일   : ' + r.email + '\n' +
    '연락처   : ' + r.phone + '\n' +
    '────────────────────────────\n' +
    '참가 관련 메모\n' + r.message + '\n' +
    '────────────────────────────\n' +
    '※ 신청자에게 접수 확인 메일이 자동 발송되었습니다.\n' +
    '※ 이 메일에 그대로 [답장]하면 신청자에게 바로 갑니다.\n' +
    '\n신청 내역 전체는 구글 시트에서 확인하실 수 있습니다.';

  MailApp.sendEmail(ADMIN_EMAIL, subject, body, {
    name: BRAND_NAME + ' 참가 신청',
    replyTo: r.email                     // 답장하면 신청자에게 바로 감
  });
}


// ══════ 3. 신청자에게 자동회신 ══════
function sendAutoReply(r) {
  const subject = '[' + BRAND_NAME + '] 참가 신청이 정상 접수되었습니다';

  const body =
    r.name + ' 님, 안녕하세요.\n' +
    BRAND_NAME + '입니다.\n\n' +
    '보내주신 참가 신청이 정상적으로 접수되었습니다.\n' +
    '내용을 확인한 뒤 ' + REPLY_HOURS + ' 안에 일정과 준비물을 안내드리겠습니다.\n\n' +
    '─────────────────────\n' +
    '신청하신 내용\n' +
    '─────────────────────\n' +
    '이름     : ' + r.name + '\n' +
    '이메일   : ' + r.email + '\n' +
    '연락처   : ' + r.phone + '\n' +
    '메모     : ' + r.message + '\n' +
    '─────────────────────\n\n' +
    '차를 처음 시작하시는 분도 편하게 오시면 됩니다. 따로 준비하실 것은 없습니다.\n' +
    '내용에 잘못된 부분이 있으면 이 메일에 그대로 답장해 주세요.\n\n' +
    '감사합니다.\n\n' +
    '─────────────────────\n' +
    BRAND_NAME + ' · 제주\n' +
    '문의: ' + ADMIN_EMAIL + '\n' +
    '─────────────────────\n' +
    '※ 이 메일은 신청 접수 확인을 위해 자동으로 발송되었습니다.';

  MailApp.sendEmail(r.email, subject, body, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL
  });
}


// ══════ 도우미 ══════
function trim(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(v)); }

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ══════ 설치 후 동작 시험용 (에디터에서 직접 실행) ══════
function 테스트_신청보내기() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        name:    '홍길동',
        email:   ADMIN_EMAIL,          // 본인에게 자동회신이 오는지 확인
        phone:   '010-0000-0000',
        message: '설치가 잘 되었는지 확인하는 시험 신청입니다.',
        source:  '설치 테스트'
      })
    }
  });
  Logger.log(result.getContent());
}
