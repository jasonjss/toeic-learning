# 修改紀錄：移除 Google Analytics（GA）追蹤碼

- **修改日期**：2026-08-26
- **修改者**：jasonjss
- **修改目的**：移除本專案 `index.html` 內嵌的 Google Analytics 追蹤碼，停止蒐集使用者流量資料，以保護使用者隱私。

---

## 一、修改內容

### 1. `index.html` — 移除 GA 追蹤碼區塊

**修改前**（位於 `<head>` 內、`</style>` 之後）：

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZLCHW11LP5"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ZLCHW11LP5');
</script>
```

**修改後**：

```html
</style>
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

**說明**：

- 完整移除追蹤碼外部載入（`googletagmanager.com/gtag/js`）、`dataLayer` 宣告、`gtag` 函式與 `G-ZLCHW11LP5` 設定。
- 保留緊鄰的 Google Identity Services（GIS）`accounts.google.com/gsi/client` 載入——這是 Google Drive 登入功能所需，與 GA 無關，不可一併刪除。

### 2. `CLAUDE.md` — 同步更新部署注意事項

`CLAUDE.md` 原本記載「`index.html` 內含 Google Analytics 追蹤碼（G-ZLCHW11LP5）與 Google Drive OAuth Client ID」；GA 移除後，該敘述已過時，故刪除 GA 部分，僅保留 OAuth Client ID 的提醒，避免誤導未來的開發者。

---

## 二、驗證

1. 以 `grep` 全 repo 搜尋 `gtag`、`G-ZLCHW11LP5`、`googletagmanager`、`dataLayer`、`google-analytics` 等關鍵字，確認**沒有任何程式碼**殘留。搜尋結果僅剩：
   - `README.md` 與 `README.en.md` 中「給開發者的提醒」的說明文字（非程式碼，保留原作者的提醒，供下游 fork 者參考）。
2. `sw.js` 的 fetch 攔截清單原本就未包含 `googletagmanager.com`，故 Service Worker 無需變更。
3. 開啟頁面後，瀏覽器開發者工具的「網路」分頁不應再出現任何 `googletagmanager.com` 請求。

---

## 三、其他說明

- Google Drive 雲端備份功能（GIS 登入）不受影響。
- 若日後需要恢復流量統計，可自行重新加入自有 GA4 的追蹤碼（替換 `G-XXXXXXX` 為自己的 Measurement ID）。
