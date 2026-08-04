const form = document.getElementById('applyForm');
const status = document.getElementById('formStatus');
const API_BASE = window.location.port === '3000' ? '' : 'http://127.0.0.1:3000';

if (form && status) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '신청 중...';
    }

    status.textContent = '신청 내용을 접수하고 있습니다.';
    status.className = 'form-status';

    try {
      const response = await fetch(`${API_BASE}/api/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        status.textContent = result.message || '참가 신청이 접수되었습니다.';
        status.className = 'form-status form-status--success';
        form.reset();
      } else {
        status.textContent = result.error || '신청 처리 중 문제가 발생했습니다.';
        status.className = 'form-status form-status--error';
      }
    } catch (error) {
      status.textContent = '서버와 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.';
      status.className = 'form-status form-status--error';
      console.error(error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '참가 신청하기';
      }
    }
  });
}
