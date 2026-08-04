/* ═══════════════════ 참가 신청 폼 접수 ═══════════════════
   구글 Apps Script가 ①구글 시트 저장 ②담당자 알림 메일
   ③신청자 자동회신 메일을 한 번에 처리합니다.
   내 PC의 서버가 필요 없고, 24시간 동작합니다.

   ▶ 웹앱 주소를 발급받았다면 아래 GAS_URL 만 바꾸면 됩니다.
     (설치 방법: 같은 폴더의 「📮 참가신청폼 설치안내.md」)
   ═══════════════════════════════════════════════════════ */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxEJFym6F--lJJAxnwG6EE7nWncGo6AQxr7ixN_oGB06Id4KZMWPpF0S-WwM00MjtDFfg/exec';
const MAIL_TO = 'woogs4444@gmail.com'; // 전송 실패 시 안내할 담당자 주소

const form = document.getElementById('applyForm');
const status = document.getElementById('formStatus');

function showStatus(text, kind) {
  if (!status) return;
  status.textContent = text;
  status.className = kind ? `form-status form-status--${kind}` : 'form-status';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

if (form && status) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const d = Object.fromEntries(formData.entries());

    if (!String(d.name || '').trim()) {
      showStatus('이름을 입력해주세요.', 'error');
      return;
    }
    if (!isEmail(d.email)) {
      showStatus('이메일 주소를 다시 확인해주세요. (예: hong@gmail.com)', 'error');
      return;
    }
    if (!d.agree) {
      showStatus('개인정보 수집·이용 동의에 체크해주세요.', 'error');
      return;
    }
    if (GAS_URL.indexOf('PUT_YOUR') === 0) {
      showStatus(`신청 접수 주소가 아직 연결되지 않았습니다. ${MAIL_TO} 로 보내주세요.`, 'error');
      return;
    }

    const payload = {
      name: String(d.name).trim(),
      email: String(d.email).trim(),
      phone: String(d.phone || '').trim(),
      message: String(d.message || '').trim(),
      website: d.website || '', // 봇 차단용
      source: location.hostname || '랜딩페이지',
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '신청 중...';
    }
    showStatus('신청 내용을 접수하고 있습니다.');

    try {
      /* 헤더를 따로 붙이지 않아야 브라우저 보안 검사(preflight) 없이 전송됩니다 */
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        showStatus('참가 신청이 접수되었습니다. 확인 메일을 보내드렸어요.', 'success');
        form.reset();
      } else {
        showStatus(result.error || '신청 처리 중 문제가 발생했습니다.', 'error');
      }
    } catch (error) {
      showStatus(`전송에 실패했습니다. 번거로우시겠지만 ${MAIL_TO} 로 보내주세요.`, 'error');
      console.error(error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '참가 신청하기';
      }
    }
  });
}
