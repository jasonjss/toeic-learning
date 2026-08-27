// Speaking log DOM rendering helpers.

import { t } from './i18n.js';

function buildLogRow(role, text) {
    const row = document.createElement('div');
    row.className = 'speaking-log-item';
    const roleSpan = document.createElement('span');
    roleSpan.className = 'speaking-log-role';
    // 僅「語音轉錄」（ai-transcript）顯示「AI 說：」；其餘（含 modelTurn 文字的 'ai'）維持原本大寫樣式
    const roleLabel = role === 'ai-transcript' ? t('speakingLogRoleAi') : String(role || 'log').toUpperCase();
    roleSpan.textContent = roleLabel;
    row.appendChild(roleSpan);
    row.appendChild(document.createTextNode(String(text || '')));
    return row;
}

export function renderSpeakingLogs(logEl, logs) {
    if (!logEl) return;
    logEl.innerHTML = '';
    (Array.isArray(logs) ? logs : []).forEach((entry) => {
        logEl.prepend(buildLogRow(entry?.role, entry?.text));
    });
}

export function prependSpeakingLog(logEl, role, text) {
    if (!logEl) return;
    logEl.prepend(buildLogRow(role, text));
}
