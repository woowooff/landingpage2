const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { google } = require('googleapis');

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '.data');
const DATA_FILE = path.join(DATA_DIR, 'applications.json');

function hasConfiguredValue(value) {
  if (typeof value !== 'string') return false;

  const normalized = value.trim();
  if (!normalized) return false;

  // 주의: 아래 비교는 소문자로 하므로 패턴도 반드시 소문자로 적을 것
  const blockedPatterns = [
    'your-',
    'your_',
    'put_your',
    'put-your',
    '_here',
    'example',
    'replace',
    'changeme',
    'gmail-app-password',
    'gmail_app_password',
    'private_key',
    'placeholder',
  ];

  return !blockedPatterns.some((pattern) => normalized.toLowerCase().includes(pattern));
}

function getConfigStatus() {
  return {
    mail: hasConfiguredValue(process.env.GMAIL_USER) && hasConfiguredValue(process.env.GMAIL_APP_PASSWORD),
    sheets: hasConfiguredValue(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) && hasConfiguredValue(process.env.GOOGLE_PRIVATE_KEY) && hasConfiguredValue(process.env.GOOGLE_SHEET_ID),
    recipientEmail: process.env.RECIPIENT_EMAIL || 'woogs4444@gmail.com',
  };
}

app.use(cors());
app.use(express.json({ limit: '1mb', strict: false }));
app.use(express.static(__dirname));

app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || (err.status === 400 && err.body))) {
    return res.status(400).json({ success: false, error: '요청 본문이 올바른 JSON 형식이 아닙니다.' });
  }

  console.error(err);
  return res.status(500).json({ success: false, error: '서버 처리 중 오류가 발생했습니다.' });
});

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function createTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!hasConfiguredValue(GMAIL_USER) || !hasConfiguredValue(GMAIL_APP_PASSWORD)) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

async function sendMail(transporter, to, subject, html, text) {
  return transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
    text,
  });
}

async function appendToGoogleSheet(payload) {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } = process.env;

  if (!hasConfiguredValue(GOOGLE_SERVICE_ACCOUNT_EMAIL) || !hasConfiguredValue(GOOGLE_PRIVATE_KEY) || !hasConfiguredValue(GOOGLE_SHEET_ID)) {
    return false;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const values = [[
    new Date().toISOString(),
    payload.name,
    payload.email,
    payload.phone || '',
    payload.message || '',
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: 'Sheet1!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  return true;
}

function saveLocalApplication(payload, results) {
  ensureDataFile();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  data.push({
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...payload,
    results,
  });

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/apply', async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: '이름과 이메일은 필수입니다.',
    });
  }

  const payload = {
    name,
    email,
    phone: phone || '',
    message: message || '',
  };

  const config = getConfigStatus();
  const results = {
    adminEmail: false,
    autoReply: false,
    googleSheets: false,
    localBackup: true,
    mailConfigured: config.mail,
    sheetsConfigured: config.sheets,
    warnings: [],
  };

  try {
    const transporter = createTransporter();

    if (!transporter) {
      results.warnings.push('Gmail 앱 비밀번호 설정이 없어 메일 전송이 건너뛰었습니다.');
    }

    if (transporter) {
      const recipientEmail = process.env.RECIPIENT_EMAIL || 'woogs4444@gmail.com';
      const adminSubject = '[제주다회] 새 참가 신청이 접수되었습니다';
      const adminHtml = `
        <h2>새 참가 신청</h2>
        <p><strong>이름:</strong> ${payload.name}</p>
        <p><strong>이메일:</strong> ${payload.email}</p>
        <p><strong>연락처:</strong> ${payload.phone || '없음'}</p>
        <p><strong>문의 내용:</strong> ${payload.message || '없음'}</p>
      `;

      // 메일이 실패해도 신청 접수 자체는 살린다. 신청자가 실패 화면을 보면 안 되므로.
      try {
        await sendMail(transporter, recipientEmail, adminSubject, adminHtml, adminHtml.replace(/<[^>]*>/g, ''));
        results.adminEmail = true;
      } catch (mailError) {
        results.warnings.push(`담당자 알림 메일 발송 실패: ${mailError.message}`);
        console.error('admin mail failed:', mailError.message);
      }

      const autoReplySubject = '[제주다회] 참가 신청이 접수되었습니다';
      const autoReplyHtml = `
        <h2>제주다회 참가 신청이 접수되었습니다.</h2>
        <p>${payload.name}님, 신청해주셔서 감사합니다.</p>
        <p>곧 제주다회 팀에서 연락드리겠습니다.</p>
      `;

      try {
        await sendMail(transporter, payload.email, autoReplySubject, autoReplyHtml, autoReplyHtml.replace(/<[^>]*>/g, ''));
        results.autoReply = true;
      } catch (mailError) {
        results.warnings.push(`신청자 자동회신 발송 실패: ${mailError.message}`);
        console.error('auto reply failed:', mailError.message);
      }
    }

    if (!config.sheets) {
      results.warnings.push('Google Sheets 설정이 없어 시트 저장이 건너뛰었습니다.');
    }

    try {
      results.googleSheets = await appendToGoogleSheet(payload);
    } catch (sheetError) {
      results.warnings.push(`Google Sheets 저장 실패: ${sheetError.message}`);
      results.googleSheets = false;
    }

    saveLocalApplication(payload, results);

    return res.json({
      success: true,
      message: '참가 신청이 접수되었습니다. 설정이 완료되면 메일과 시트 저장도 자동으로 이어집니다.',
      data: results,
    });
  } catch (error) {
    console.error('application submission failed:', error);
    saveLocalApplication(payload, { ...results, error: error.message });

    return res.status(500).json({
      success: false,
      error: '신청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  const config = getConfigStatus();
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Mail configured: ${config.mail}`);
  console.log(`Google Sheets configured: ${config.sheets}`);
  if (!config.mail || !config.sheets) {
    console.log('Set GMAIL_USER/GMAIL_APP_PASSWORD and GOOGLE_* values in .env for full automation.');
  }
});
