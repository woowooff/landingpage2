/**
 * (주)수창 — 감귤 업사이클 원료 소개페이지 문의 접수 백엔드
 * ────────────────────────────────────────────────────
 * 하는 일 세 가지
 *   1. 구글 시트에 문의 내용 저장
 *   2. 담당자(수창마케팅)에게 알림 메일 발송
 *   3. 신청자에게 "접수됐습니다" 자동회신 메일 발송
 *
 * 설치 방법은 같은 폴더의 「📮 문의폼 설치안내.md」 참고
 * ────────────────────────────────────────────────────
 */

// ══════ 설정 (여기만 바꾸면 됨) ══════
const ADMIN_EMAIL  = 'suchang.marketing@gmail.com';  // 문의 알림을 받을 주소
const COMPANY_NAME = '(주)수창';                      // 자동회신 발신자 이름
const SHEET_NAME   = '문의접수';                      // 저장될 시트 탭 이름
const REPLY_HOURS  = '영업일 기준 1~2일';             // 자동회신에 안내할 회신 소요 시간
const TIMEZONE     = 'Asia/Seoul';

const HEADERS = ['접수일시','회사명','담당자','연락처','관심 분야','검토 단계','문의 내용','자동회신','유입 경로'];


// ══════ 문의 접수 (랜딩페이지에서 호출) ══════
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: '전달된 내용이 없습니다.' });
    }

    const data = JSON.parse(e.postData.contents);

    // 봇 차단 — 사람 눈에 안 보이는 칸(website)에 값이 있으면 봇
    if (data.website) return jsonOut({ ok: true });

    // 필수값 확인
    if (!trim(data.company) || !trim(data.name) || !trim(data.contact)) {
      return jsonOut({ ok: false, error: '회사명·담당자·연락처는 필수입니다.' });
    }

    const record = {
      time:    Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      company: trim(data.company),
      name:    trim(data.name),
      contact: trim(data.contact),
      field:   trim(data.field)   || '-',
      stage:   trim(data.stage)   || '-',
      message: trim(data.message) || '-',
      source:  trim(data.source)  || '소개페이지'
    };

    // 1) 시트 저장 — 저장이 최우선이므로 메일보다 먼저
    saveToSheet(record);

    // 2) 담당자 알림
    let adminSent = false;
    try { notifyAdmin(record); adminSent = true; }
    catch (err) { console.error('담당자 알림 실패: ' + err); }

    // 3) 신청자 자동회신 — 연락처가 이메일 형식일 때만
    let replySent = false;
    if (isEmail(record.contact)) {
      try { sendAutoReply(record); replySent = true; }
      catch (err) { console.error('자동회신 실패: ' + err); }
    }

    // 자동회신 발송 여부를 시트 마지막 행에 기록
    markAutoReply(replySent ? '발송' : (isEmail(record.contact) ? '실패' : '해당없음(전화번호)'));

    return jsonOut({ ok: true, autoReply: replySent, adminNotified: adminSent });

  } catch (err) {
    console.error(err);
    return jsonOut({ ok: false, error: String(err) });
  }
}


// ══════ 브라우저로 주소를 열었을 때 (동작 확인용) ══════
function doGet() {
  return jsonOut({ ok: true, message: '수창 문의 접수 서버가 정상 동작 중입니다.' });
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
    head.setFontWeight('bold').setBackground('#2c6249').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150); // 접수일시
    sheet.setColumnWidth(2, 160); // 회사명
    sheet.setColumnWidth(7, 380); // 문의 내용
  }

  sheet.appendRow([
    r.time, r.company, r.name, r.contact,
    r.field, r.stage, r.message, '처리중', r.source
  ]);

  // 문의 내용 칸은 줄바꿈 보이게
  sheet.getRange(sheet.getLastRow(), 7).setWrap(true);
}


// 자동회신 발송 여부를 마지막 행에 기록
function markAutoReply(status) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(sheet.getLastRow(), 8).setValue(status);
    }
  } catch (err) {
    console.error('자동회신 상태 기록 실패: ' + err);
  }
}


// ══════ 2. 담당자에게 알림 메일 ══════
function notifyAdmin(r) {
  const subject = '[문의] ' + r.company + ' · ' + r.field;

  const body =
    '감귤 업사이클 원료 소개페이지로 문의가 접수되었습니다.\n' +
    '────────────────────────────\n' +
    '접수일시 : ' + r.time + '\n' +
    '회사명   : ' + r.company + '\n' +
    '담당자   : ' + r.name + '\n' +
    '연락처   : ' + r.contact + '\n' +
    '관심 분야 : ' + r.field + '\n' +
    '검토 단계 : ' + r.stage + '\n' +
    '────────────────────────────\n' +
    '문의 내용\n' + r.message + '\n' +
    '────────────────────────────\n' +
    (isEmail(r.contact)
      ? '※ 신청자에게 접수 확인 메일이 자동 발송되었습니다.\n※ 이 메일에 그대로 [답장]하면 신청자에게 바로 갑니다.\n'
      : '※ 연락처가 전화번호라 자동회신은 발송되지 않았습니다. 전화로 연락 바랍니다.\n') +
    '\n문의 내역 전체는 구글 시트에서 확인하실 수 있습니다.';

  const options = { name: COMPANY_NAME + ' 문의 접수' };
  if (isEmail(r.contact)) options.replyTo = r.contact;   // 답장하면 신청자에게 바로 감

  MailApp.sendEmail(ADMIN_EMAIL, subject, body, options);
}


// ══════ 3. 신청자에게 자동회신 ══════
function sendAutoReply(r) {
  const subject = '[' + COMPANY_NAME + '] 문의가 정상 접수되었습니다';

  const body =
    r.name + ' 님, 안녕하세요.\n' +
    COMPANY_NAME + '입니다.\n\n' +
    '감귤 업사이클 원료에 관해 보내주신 문의가 정상적으로 접수되었습니다.\n' +
    '담당자가 내용을 확인한 뒤 ' + REPLY_HOURS + ' 안에 회신드리겠습니다.\n\n' +
    '─────────────────────\n' +
    '접수하신 내용\n' +
    '─────────────────────\n' +
    '회사명   : ' + r.company + '\n' +
    '담당자   : ' + r.name + '\n' +
    '연락처   : ' + r.contact + '\n' +
    '관심 분야 : ' + r.field + '\n' +
    '검토 단계 : ' + r.stage + '\n' +
    '문의 내용 : ' + r.message + '\n' +
    '─────────────────────\n\n' +
    '요청하신 분야의 규격 자료와 근거 자료를 함께 준비해 보내드리겠습니다.\n' +
    '샘플을 원하시는 경우, 필요 수량과 받으실 주소를 이 메일에 답장으로 알려주시면 더 빠르게 진행됩니다.\n\n' +
    '내용에 잘못된 부분이 있으면 이 메일에 그대로 답장해 주세요.\n\n' +
    '감사합니다.\n\n' +
    '─────────────────────\n' +
    COMPANY_NAME + ' · 제주특별자치도\n' +
    '감귤 자원순환(업사이클) 원료 공급\n' +
    '문의: ' + ADMIN_EMAIL + '\n' +
    '─────────────────────\n' +
    '※ 이 메일은 문의 접수 확인을 위해 자동으로 발송되었습니다.';

  MailApp.sendEmail(r.contact, subject, body, {
    name: COMPANY_NAME,
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
function 테스트_문의보내기() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        company: '테스트상사',
        name:    '홍길동',
        contact: ADMIN_EMAIL,          // 본인에게 자동회신이 오는지 확인
        field:   '가축 사료',
        stage:   '정보 수집 중',
        message: '설치가 잘 되었는지 확인하는 시험 문의입니다.',
        source:  '설치 테스트'
      })
    }
  });
  Logger.log(result.getContent());
}
