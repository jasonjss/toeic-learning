# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

TOEIC AI Tutor 是一個**純前端、零依賴、單一頁面的 PWA**（沒有建置步驟、沒有 npm、沒有後端）。使用者自行提供 Gemini 或 OpenAI 的 API Key，由 App 即時產生多益閱讀文章、TTS 語音、模擬考題與即時口說對話。本 repo 是 `brucefay1115/toeic-learning` 的 fork，功能修改預期會以 PR 回饋給原作者。部署於 GitHub Pages（CNAME：`toeic-ai-tutor.griiid.tw`）。

## 常用指令

本專案沒有建置、測試或 lint 工具，只需要用靜態伺服器啟動資料夾即可：

```bash
make dev          # python -m http.server 7031
```

在 repo 根目錄執行即可，任何靜態檔案伺服器都行。改完後請用瀏覽器開啟伺服器頁面驗證（建議用手機版畫面）。Service Worker 會積極快取，測試時請強制重新整理，或依照下方說明更新 `version.json`。

## 架構

### 啟動流程與快取破壞（cache-busting）

`index.html` 自己負責啟動 App：內嵌 script 會先抓取 `./version.json?t=<now>`（破壞快取），把內容存成 `window.__TOEIC_VERSION_INFO__`，再以 `?v=<version>` 參數掛載 `styles.css` 與 `assets/js/main.js`。`main.js` 載入完成後會派送 `toeic-app-ready` 事件，移除啟動中的載入畫面。

**新增或修改靜態資源時，必須同時做兩件事：**
1. 新的 JS 檔案要加入 `sw.js` 的 `STATIC_ASSETS`（快取名稱是 `toeic-tutor-static-v4`；改名後綴以讓舊快取失效）。
2. 更新 `version.json` 的 `version`（並在 `changes` 描述異動）——這同時驅動載入時的查詢參數，以及 `updater.js` 對使用者顯示的更新通知。

### 模組之間的接線模式

`assets/js/main.js` 是進入點與控制器：啟動時負責接線跨模組的 callback、管理頁籤切換（`switchTab`），並把少數物件掛到 `window` 上（`speakText`、`speakTextAI`、`finishSrsReview`、`DriveSync`、`switchTab`），因為動態產生的 innerHTML 會用 inline `onclick` 呼叫。

各模組為了避免循環匯入，改用註冊 callback 的方式接線：`history.js` 有 `setDeps({...})`、`vocab.js` 有 `setSrsTrigger(fn)` / `setOnFinish(fn)`、`DriveSync` 有 `setCallbacks({...})`。新增跨模組的掛鉤時請沿用這個模式。

### 雙 AI 供應商的派發層

`apiProvider.js` 會依 `state.provider` 把每個 API 呼叫派發到 `apiGemini.js` 或 `apiOpenAI.js`。兩個供應商模組**實作相同的函式介面**：`fetchGeminiText`、`fetchWordDetails`、`fetchPhraseDetails`、`fetchExamQuestions`、`fetchExamWrongAnswerExplanations`、`fetchTTS`。任何新的 AI 功能都必須在**兩個供應商都實作**（例外：`validateWordWithLanguageTool` 只有 Gemini 有）。`examNormalize.js` 會把兩家供應商回傳的原始考題 JSON 正規化成 `exam.js` 使用的統一結構。

### 共用狀態與 UI

- `state.js`：單一可變動的 App 狀態物件（供應商、API Key、模型、目標分數、目前文章資料、音訊狀態、口說/考試子狀態），以及常數（SVG `ICONS`、模型清單、語音清單、`SRS_INTERVALS = [0,1,3,7,14,30]`）。
- 所有靜態 UI 標記都寫在 `index.html` 裡（頁籤：學習/練習/單字本/紀錄/關於，以及設定、公告、SRS 覆蓋層）。畫面用 `hidden` class 切換顯示，動態內容由各模組渲染到容器元素。
- i18n：`i18n.js` 透過 `data-i18n` / `data-i18n-html` / `data-i18n-placeholder` 屬性翻譯元素。語系檔在 `assets/js/i18n/locales/`（`zh-TW`、`ko`、`ja`）；`ko` 與 `ja` 缺 key 時會回退到 `zh-TW`。AI 提示詞的輸出語言會跟著目前的語系走。

### 資料與功能

- `db.js`：IndexedDB（`ToeicTutorDB`，第 3 版），store 有 `history`、`wordCache`、`settings`、`savedWords`。API Key 放在 `settings`（僅 IndexedDB），刻意不納入 Drive 備份。
- `driveSync.js`：透過 `appDataFolder` 與 Google Identity Services (GIS) OAuth，把歷史紀錄與單字本備份/還原到 Google Drive。
- TTS：`apiProvider.fetchTTS` → AI 語音（Gemini 回傳 PCM、OpenAI 回傳 mp3）；`audioCodec.js` 負責把 PCM 轉成 WAV；`utils.js` 的 `speakTextAI` 在 `state.useAiTTS` 關閉或 API 失敗時會回退到瀏覽器內建的 `speechSynthesis`。`audioPlayer.js` 驅動文章播放列與逐句高亮。
- `speakingLive.js`：使用 GoogleGenAI SDK（`https://esm.run/@google/genai`，native audio 模型）做即時雙向口說，麥克風收音走 `mic-processor.js` 的 AudioWorklet。
- `srs.js`：間隔重複複習覆蓋層（英翻中 / 中翻英 / 聽力三種題型），答對升級、答錯降級。

## 部署注意事項（摘自 README）

- `index.html` 內含 Google Drive OAuth Client ID。重新部署 fork 時請務必替換或移除。
- 授權為 PolyForm Noncommercial 1.0.0。
