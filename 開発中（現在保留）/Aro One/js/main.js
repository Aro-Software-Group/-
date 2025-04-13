/**
 * Aro One メインスクリプト
 */

// アプリケーションの状態
const appState = {
  currentTab: 'document',
  isDarkMode: false,
  isMenuOpen: false,
  openMenuId: null
};

// DOM要素
let tabs;
let contentAreas;
let menuItems;
let dropdownMenus;
let themeToggle;
let toolbarButtons;

// アプリケーションの状態
// 自動保存用のタイマーID
let autoSaveTimerId = null;

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の取得
  tabs = document.querySelectorAll('.tab');
  contentAreas = document.querySelectorAll('.content-area');
  menuItems = document.querySelectorAll('.menu-item');
  dropdownMenus = document.querySelectorAll('.dropdown-menu');
  themeToggle = document.getElementById('theme-toggle');
  toolbarButtons = document.querySelectorAll('.toolbar-btn');

  // 各機能の初期化
  initDocumentEditor();
  initSpreadsheet();
  initPresentation();

  // イベントリスナーの設定
  setupEventListeners();

  // キーボードショートカットの設定
  setupKeyboardShortcuts();

  // テーマの初期化
  initTheme();

  // 設定の適用
  applyPreferences();

  // 自動保存の設定
  setupAutoSave();

  // ステータスバーの初期化
  updateStatus('準備完了');
});

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // タブ切り替え
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // メニュー項目クリック
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const menuId = item.dataset.menu;
      const menuElement = document.getElementById(`${menuId}-menu`);

      if (menuElement) {
        const rect = item.getBoundingClientRect();
        showDropdownMenu(`${menuId}-menu`, rect.left, rect.bottom);
      }
    });
  });

  // メニューオプションクリック
  document.querySelectorAll('.menu-option').forEach(option => {
    option.addEventListener('click', (e) => {
      handleMenuAction(option.dataset.action);
      // メニューを閉じる
      closeAllDropdownMenus();
    });
  });

  // テーマ切り替え
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // ツールバーボタンクリック
  toolbarButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      handleToolbarAction(button.id);
    });
  });

  // フォント選択
  const fontFamily = document.getElementById('font-family');
  if (fontFamily) {
    fontFamily.addEventListener('change', () => {
      document.execCommand('fontName', false, fontFamily.value);
    });
  }

  // フォントサイズ選択
  const fontSize = document.getElementById('font-size');
  if (fontSize) {
    fontSize.addEventListener('change', () => {
      document.execCommand('fontSize', false, fontSize.value);
    });
  }

  // ドロップダウンメニュー以外をクリックしたときにメニューを閉じる
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-item') && !e.target.closest('.dropdown-menu')) {
      closeAllDropdownMenus();
    }
  });
}

/**
 * タブの切り替え
 * @param {string} tabName - タブ名
 */
function switchTab(tabName) {
  // タブの切り替え
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  // コンテンツエリアの切り替え
  contentAreas.forEach(area => {
    area.classList.toggle('hidden', area.id !== `${tabName}-area`);
  });
  
  // ツールバーの切り替え
  const presentationTools = document.querySelector('.presentation-tools');
  if (presentationTools) {
    presentationTools.style.display = tabName === 'presentation' ? 'flex' : 'none';
  }

  // 現在のタブを保存
  appState.currentTab = tabName;

  // ステータスバーを更新
  updateStatus(`${tabName}モードに切り替えました`);

  // 2秒後に通常のステータスに戻す
  setTimeout(() => {
    switch (tabName) {
      case 'document':
        updateDocumentStatus();
        break;
      case 'spreadsheet':
        updateSpreadsheetStatus();
        break;
      case 'presentation':
        updatePresentationStatus();
        break;
    }
  }, 2000);
}

/**
 * メニューアクションの処理
 * @param {string} action - アクション名
 */
function handleMenuAction(action) {
  switch (action) {
    // ファイルメニュー
    case 'new-document':
      switchTab('document');
      createNewDocument();
      break;
    case 'new-spreadsheet':
      switchTab('spreadsheet');
      createNewSpreadsheet();
      break;
    case 'new-presentation':
      switchTab('presentation');
      createNewPresentation();
      break;
    case 'open':
      openFile();
      break;
    case 'import-csv':
      if (appState.currentTab === 'spreadsheet') {
        importCSV();
      } else {
        switchTab('spreadsheet');
        setTimeout(() => importCSV(), 100);
      }
      break;
    case 'save':
      saveCurrentFile();
      break;
    case 'save-as':
      saveCurrentFileAs();
      break;
    case 'export-pdf':
      exportAsPDF();
      break;
    case 'export-png':
      exportAsPNG();
      break;
    case 'export-jpg':
      exportAsJPG();
      break;
    case 'exit':
      if (confirm('アプリケーションを終了しますか？')) {
        window.close();
      }
      break;

    // 編集メニュー
    case 'undo':
      if (appState.currentTab === 'document') {
        undoDocument();
      } else {
        document.execCommand('undo');
      }
      break;
    case 'redo':
      if (appState.currentTab === 'document') {
        redoDocument();
      } else {
        document.execCommand('redo');
      }
      break;
    case 'cut':
      document.execCommand('cut');
      break;
    case 'copy':
      document.execCommand('copy');
      break;
    case 'paste':
      document.execCommand('paste');
      break;
    case 'select-all':
      document.execCommand('selectAll');
      break;
    case 'find':
      showFindDialog();
      break;
    case 'replace':
      showReplaceDialog();
      break;

    // 表示メニュー
    case 'zoom-in':
      zoomContent(1.1); // 10%拡大
      break;
    case 'zoom-out':
      zoomContent(0.9); // 10%縮小
      break;
    case 'zoom-reset':
      resetZoom();
      break;
    case 'fullscreen':
      toggleFullscreen();
      break;

    // 挿入メニュー
    case 'insert-image':
      if (appState.currentTab === 'document') {
        insertImage();
      } else if (appState.currentTab === 'presentation') {
        insertImageToSlide();
      }
      break;
    case 'insert-table':
      if (appState.currentTab === 'document') {
        insertTable();
      } else if (appState.currentTab === 'presentation') {
        insertTableToSlide();
      }
      break;
    case 'insert-link':
      insertLink();
      break;
    case 'insert-toc':
      if (appState.currentTab === 'document') {
        insertTableOfContents();
      } else {
        alert('目次生成は文書モードでのみ使用できます');
      }
      break;
    case 'insert-footnote':
      if (appState.currentTab === 'document') {
        insertFootnote();
      } else {
        alert('脚注挿入は文書モードでのみ使用できます');
      }
      break;
    case 'insert-citation':
      if (appState.currentTab === 'document') {
        insertCitation();
      } else {
        alert('引用挿入は文書モードでのみ使用できます');
      }
      break;
    case 'insert-special-char':
      showSpecialCharDialog();
      break;
    case 'insert-page-break':
      insertPageBreak();
      break;
    case 'insert-page-number':
      if (appState.currentTab === 'document') {
        insertPageNumber();
      } else {
        alert('ページ番号の挿入は文書モードでのみ使用できます');
      }
      break;
    case 'insert-date-time':
      insertDateTime();
      break;

    // 書式メニュー
    case 'format-bold':
      document.execCommand('bold');
      break;
    case 'format-italic':
      document.execCommand('italic');
      break;
    case 'format-underline':
      document.execCommand('underline');
      break;
    case 'format-strikethrough':
      document.execCommand('strikeThrough');
      break;
    case 'format-text-color':
      showColorPicker('foreColor');
      break;
    case 'format-highlight':
      showColorPicker('hiliteColor');
      break;
    case 'format-align-left':
      document.execCommand('justifyLeft');
      break;
    case 'format-align-center':
      document.execCommand('justifyCenter');
      break;
    case 'format-align-right':
      document.execCommand('justifyRight');
      break;
    case 'format-align-justify':
      document.execCommand('justifyFull');
      break;

    // ツールメニュー
    case 'tools-spell-check':
      if (appState.currentTab === 'document') {
        checkDocumentProofreading();
      } else {
        alert('校正機能は文書モードでのみ使用できます');
      }
      break;
    case 'tools-word-count':
      showWordCount();
      break;
    case 'tools-preferences':
      showPreferences();
      break;

    // ヘルプメニュー
    case 'help-documentation':
      showDocumentation();
      break;
    case 'help-keyboard-shortcuts':
      showKeyboardShortcuts();
      break;
    case 'help-about':
      showAboutDialog();
      break;

    default:
      console.log(`未実装のアクション: ${action}`);
      alert('この機能は現在開発中です');
  }
}

/**
 * ツールバーアクションの処理
 * @param {string} buttonId - ボタンID
 */
function handleToolbarAction(buttonId) {
  switch (buttonId) {
    // ファイル操作
    case 'new-doc-btn':
      switchTab('document');
      createNewDocument();
      break;
    case 'new-sheet-btn':
      switchTab('spreadsheet');
      createNewSpreadsheet();
      break;
    case 'new-pres-btn':
      switchTab('presentation');
      createNewPresentation();
      break;
    case 'save-btn':
      saveCurrentFile();
      break;
    case 'open-btn':
      openFile();
      break;

    // 書式設定
    case 'bold-btn':
      document.execCommand('bold');
      break;
    case 'italic-btn':
      document.execCommand('italic');
      break;
    case 'underline-btn':
      document.execCommand('underline');
      break;

    // 配置
    case 'align-left-btn':
      document.execCommand('justifyLeft');
      break;
    case 'align-center-btn':
      document.execCommand('justifyCenter');
      break;
    case 'align-right-btn':
      document.execCommand('justifyRight');
      break;
  }
}

/**
 * 画像を挿入
 */
function insertImage() {
  // ファイル選択ダイアログを作成
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.style.maxWidth = '100%';
      img.alt = file.name;

      // 選択範囲に画像を挿入
      document.execCommand('insertHTML', false, img.outerHTML);

      // 変更を記録
      if (appState.currentTab === 'document') {
        saveDocumentState();
        documentState.isModified = true;
        updateDocumentStatus();
      } else if (appState.currentTab === 'presentation') {
        presentationState.slides[presentationState.currentSlideIndex].content = slideContent.innerHTML;
        presentationState.isModified = true;
        updatePresentationStatus();
      }
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

/**
 * プレゼンテーションに画像を挿入
 */
function insertImageToSlide() {
  insertImage(); // 共通の画像挿入機能を使用
}

/**
 * 表を挿入
 */
function insertTable() {
  // 表の行数と列数を入力するダイアログを表示
  const rows = prompt('行数を入力してください:', '3');
  if (!rows) return;

  const cols = prompt('列数を入力してください:', '3');
  if (!cols) return;

  // 行数と列数を数値に変換
  const numRows = parseInt(rows, 10);
  const numCols = parseInt(cols, 10);

  if (isNaN(numRows) || isNaN(numCols) || numRows <= 0 || numCols <= 0) {
    alert('有効な数値を入力してください');
    return;
  }

  // 表を作成
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginBottom = '1em';
  table.setAttribute('border', '1');

  // theadとtbodyを作成
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // ヘッダー行を作成
  const headerRow = document.createElement('tr');
  for (let i = 0; i < numCols; i++) {
    const th = document.createElement('th');
    th.style.padding = '8px';
    th.style.backgroundColor = '#f2f2f2';
    th.style.borderBottom = '2px solid #ddd';
    th.style.textAlign = 'left';
    th.innerHTML = `列 ${i + 1}`;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  // データ行を作成
  for (let i = 0; i < numRows - 1; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < numCols; j++) {
      const td = document.createElement('td');
      td.style.padding = '8px';
      td.style.borderBottom = '1px solid #ddd';
      td.innerHTML = `セル ${i + 1}-${j + 1}`;
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  // 選択範囲に表を挿入
  document.execCommand('insertHTML', false, table.outerHTML);

  // 変更を記録
  if (appState.currentTab === 'document') {
    saveDocumentState();
    documentState.isModified = true;
    updateDocumentStatus();
  } else if (appState.currentTab === 'presentation') {
    presentationState.slides[presentationState.currentSlideIndex].content = slideContent.innerHTML;
    presentationState.isModified = true;
    updatePresentationStatus();
  }
}

/**
 * プレゼンテーションに表を挿入
 */
function insertTableToSlide() {
  insertTable(); // 共通の表挿入機能を使用
}

/**
 * リンクを挿入
 */
function insertLink() {
  const selection = window.getSelection();
  const selectedText = selection.toString();

  const url = prompt('リンク先URLを入力してください:', 'https://');
  if (!url) return;

  const linkText = selectedText || prompt('リンクテキストを入力してください:', '');
  if (!linkText) return;

  const link = document.createElement('a');
  link.href = url;
  link.textContent = linkText;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  // 選択範囲にリンクを挿入
  document.execCommand('insertHTML', false, link.outerHTML);

  // 変更を記録
  if (appState.currentTab === 'document') {
    saveDocumentState();
    documentState.isModified = true;
    updateDocumentStatus();
  } else if (appState.currentTab === 'presentation') {
    presentationState.slides[presentationState.currentSlideIndex].content = slideContent.innerHTML;
    presentationState.isModified = true;
    updatePresentationStatus();
  }
}

/**
 * 特殊文字ダイアログを表示
 */
function showSpecialCharDialog() {
  // 既存のダイアログがあれば削除
  const existingDialog = document.getElementById('special-char-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // 特殊文字のリスト
  const specialChars = [
    '&copy;', '&reg;', '&trade;', '&euro;', '&yen;', '&pound;',
    '&sect;', '&para;', '&micro;', '&deg;', '&plusmn;', '&divide;',
    '&times;', '&ne;', '&le;', '&ge;', '&larr;', '&rarr;',
    '&uarr;', '&darr;', '&harr;', '&laquo;', '&raquo;', '&bull;',
    '&hellip;', '&prime;', '&Prime;', '&ndash;', '&mdash;', '&lsquo;',
    '&rsquo;', '&ldquo;', '&rdquo;', '&sbquo;', '&bdquo;', '&dagger;',
    '&Dagger;', '&permil;', '&lsaquo;', '&rsaquo;', '&spades;', '&clubs;',
    '&hearts;', '&diams;'
  ];

  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'special-char-dialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>特殊文字</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <div class="special-char-grid">
        ${specialChars.map(char => `<div class="special-char-item">${char}</div>`).join('')}
      </div>
    </div>
    <div class="dialog-footer">
      <button id="special-char-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#special-char-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('special-char-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  // 特殊文字クリック時の処理
  document.querySelectorAll('.special-char-item').forEach(item => {
    item.addEventListener('click', () => {
      // HTMLエンティティを実際の文字に変換
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.innerHTML;
      const char = tempDiv.textContent;

      // 選択範囲に特殊文字を挿入
      document.execCommand('insertText', false, char);

      // 変更を記録
      if (appState.currentTab === 'document') {
        saveDocumentState();
        documentState.isModified = true;
        updateDocumentStatus();
      } else if (appState.currentTab === 'presentation') {
        presentationState.slides[presentationState.currentSlideIndex].content = slideContent.innerHTML;
        presentationState.isModified = true;
        updatePresentationStatus();
      }

      // ダイアログを閉じる
      document.body.removeChild(dialog);
    });
  });
}

/**
 * ページ区切りを挿入
 */
function insertPageBreak() {
  // ページ区切りを表すHTML要素を作成
  const pageBreak = document.createElement('div');
  pageBreak.className = 'page-break';
  pageBreak.style.pageBreakAfter = 'always';
  pageBreak.style.borderTop = '1px dashed #ccc';
  pageBreak.style.margin = '20px 0';
  pageBreak.innerHTML = '<span style="color: #999; font-size: 12px; background: #fff; padding: 0 10px;">ページ区切り</span>';

  // 選択範囲にページ区切りを挿入
  document.execCommand('insertHTML', false, pageBreak.outerHTML);

  // 変更を記録
  if (appState.currentTab === 'document') {
    saveDocumentState();
    documentState.isModified = true;
    updateDocumentStatus();
  }
}

/**
 * 日付と時刻を挿入
 */
function insertDateTime() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  const dateTimeString = now.toLocaleDateString('ja-JP', options);

  // 選択範囲に日付と時刻を挿入
  document.execCommand('insertText', false, dateTimeString);

  // 変更を記録
  if (appState.currentTab === 'document') {
    saveDocumentState();
    documentState.isModified = true;
    updateDocumentStatus();
  } else if (appState.currentTab === 'presentation') {
    presentationState.slides[presentationState.currentSlideIndex].content = slideContent.innerHTML;
    presentationState.isModified = true;
    updatePresentationStatus();
  }
}

/**
 * スペルチェックの切り替え
 */
function toggleSpellCheck() {
  // 現在のエディタを取得
  let editor;
  switch (appState.currentTab) {
    case 'document':
      editor = documentEditor;
      break;
    case 'presentation':
      editor = slideContent;
      break;
    default:
      alert('現在のタブではスペルチェック機能を使用できません');
      return;
  }

  // 現在のスペルチェック状態を取得
  const isSpellCheckEnabled = editor.spellcheck;

  // スペルチェックの切り替え
  editor.spellcheck = !isSpellCheckEnabled;

  // ステータスを更新
  updateStatus(`スペルチェック: ${editor.spellcheck ? '有効' : '無効'}`);

  // 設定を保存
  saveToStorage('spell_check_enabled', editor.spellcheck);
}

/**
 * 文字数カウントを表示
 */
function showWordCount() {
  // 現在のエディタを取得
  let editor;
  switch (appState.currentTab) {
    case 'document':
      editor = documentEditor;
      break;
    case 'presentation':
      editor = slideContent;
      break;
    default:
      alert('現在のタブでは文字数カウント機能を使用できません');
      return;
  }

  // テキストを取得
  const text = editor.textContent || '';

  // 文字数、単語数、行数を計算
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const lineCount = text.split(/\r\n|\r|\n/).length;

  // 文字数ダイアログを表示
  const existingDialog = document.getElementById('word-count-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  const dialog = document.createElement('div');
  dialog.id = 'word-count-dialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>文字数カウント</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <p>文字数: ${charCount}</p>
      <p>単語数: ${wordCount}</p>
      <p>行数: ${lineCount}</p>
    </div>
    <div class="dialog-footer">
      <button id="word-count-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#word-count-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('word-count-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

/**
 * 設定ダイアログを表示
 */
function showPreferences() {
  // 既存の設定ダイアログがあれば削除
  const existingDialog = document.getElementById('preferences-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // 現在の設定を取得
  const isDarkMode = document.body.classList.contains('dark-mode');
  const spellCheckEnabled = getFromStorage('spell_check_enabled') || false;
  const autoSaveEnabled = getFromStorage('auto_save_enabled') || false;
  const autoSaveInterval = getFromStorage('auto_save_interval') || 5;
  const defaultFontFamily = getFromStorage('default_font_family') || 'Noto Sans JP';
  const defaultFontSize = getFromStorage('default_font_size') || '16px';

  // 設定ダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'preferences-dialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>設定</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <div class="form-group">
        <label><input type="checkbox" id="pref-dark-mode" ${isDarkMode ? 'checked' : ''}> ダークモード</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="pref-spell-check" ${spellCheckEnabled ? 'checked' : ''}> スペルチェックを有効化</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="pref-auto-save" ${autoSaveEnabled ? 'checked' : ''}> 自動保存を有効化</label>
      </div>
      <div class="form-group">
        <label for="pref-auto-save-interval">自動保存間隔 (分):</label>
        <input type="number" id="pref-auto-save-interval" class="form-control" min="1" max="60" value="${autoSaveInterval}">
      </div>
      <div class="form-group">
        <label for="pref-default-font">デフォルトフォント:</label>
        <select id="pref-default-font" class="form-control">
          <option value="Noto Sans JP" ${defaultFontFamily === 'Noto Sans JP' ? 'selected' : ''}>Noto Sans JP</option>
          <option value="Meiryo" ${defaultFontFamily === 'Meiryo' ? 'selected' : ''}>メイリオ</option>
          <option value="MS Gothic" ${defaultFontFamily === 'MS Gothic' ? 'selected' : ''}>メイリオ</option>
          <option value="Yu Gothic" ${defaultFontFamily === 'Yu Gothic' ? 'selected' : ''}>游ゴシック</option>
          <option value="Hiragino Kaku Gothic ProN" ${defaultFontFamily === 'Hiragino Kaku Gothic ProN' ? 'selected' : ''}>ヒラギノ角ゴ ProN</option>
        </select>
      </div>
      <div class="form-group">
        <label for="pref-default-font-size">デフォルトフォントサイズ:</label>
        <select id="pref-default-font-size" class="form-control">
          <option value="12px" ${defaultFontSize === '12px' ? 'selected' : ''}>12px</option>
          <option value="14px" ${defaultFontSize === '14px' ? 'selected' : ''}>14px</option>
          <option value="16px" ${defaultFontSize === '16px' ? 'selected' : ''}>16px</option>
          <option value="18px" ${defaultFontSize === '18px' ? 'selected' : ''}>18px</option>
          <option value="20px" ${defaultFontSize === '20px' ? 'selected' : ''}>20px</option>
          <option value="24px" ${defaultFontSize === '24px' ? 'selected' : ''}>24px</option>
        </select>
      </div>
    </div>
    <div class="dialog-footer">
      <button id="pref-save-btn" class="btn btn-primary">保存</button>
      <button id="pref-cancel-btn" class="btn">キャンセル</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#preferences-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('pref-cancel-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('pref-save-btn').addEventListener('click', () => {
    // 設定を保存
    const newDarkMode = document.getElementById('pref-dark-mode').checked;
    const newSpellCheck = document.getElementById('pref-spell-check').checked;
    const newAutoSave = document.getElementById('pref-auto-save').checked;
    const newAutoSaveInterval = parseInt(document.getElementById('pref-auto-save-interval').value, 10) || 5;
    const newDefaultFont = document.getElementById('pref-default-font').value;
    const newDefaultFontSize = document.getElementById('pref-default-font-size').value;

    // ダークモードの切り替え
    if (newDarkMode !== isDarkMode) {
      if (newDarkMode) {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
    }

    // スペルチェックの設定
    saveToStorage('spell_check_enabled', newSpellCheck);

    // 自動保存の設定
    saveToStorage('auto_save_enabled', newAutoSave);
    saveToStorage('auto_save_interval', newAutoSaveInterval);

    // フォント設定
    saveToStorage('default_font_family', newDefaultFont);
    saveToStorage('default_font_size', newDefaultFontSize);

    // 設定を適用
    applyPreferences();

    // ダイアログを閉じる
    document.body.removeChild(dialog);

    // ステータスを更新
    updateStatus('設定を保存しました');
  });
}

/**
 * 設定を適用
 */
function applyPreferences() {
  // スペルチェックの設定を適用
  const spellCheckEnabled = getFromStorage('spell_check_enabled') || false;
  documentEditor.spellcheck = spellCheckEnabled;
  if (slideContent) {
    slideContent.spellcheck = spellCheckEnabled;
  }

  // フォント設定を適用
  const defaultFontFamily = getFromStorage('default_font_family') || 'Noto Sans JP';
  const defaultFontSize = getFromStorage('default_font_size') || '16px';

  // ドキュメントエディタに適用
  documentEditor.style.fontFamily = defaultFontFamily;
  documentEditor.style.fontSize = defaultFontSize;

  // プレゼンテーションエディタに適用
  if (slideContent) {
    slideContent.style.fontFamily = defaultFontFamily;
    slideContent.style.fontSize = defaultFontSize;
  }

  // フォントセレクターのデフォルト値を設定
  const fontFamilySelect = document.getElementById('font-family');
  if (fontFamilySelect) {
    fontFamilySelect.value = defaultFontFamily;
  }

  const fontSizeSelect = document.getElementById('font-size');
  if (fontSizeSelect) {
    // フォントサイズの単位を除去して値を設定
    const sizeValue = defaultFontSize.replace('px', '');
    fontSizeSelect.value = sizeValue;
  }
}

/**
 * 自動保存の設定
 */
function setupAutoSave() {
  // 既存の自動保存タイマーをクリア
  if (autoSaveTimerId) {
    clearInterval(autoSaveTimerId);
    autoSaveTimerId = null;
  }

  // 自動保存が有効か確認
  const autoSaveEnabled = getFromStorage('auto_save_enabled') || false;
  if (!autoSaveEnabled) return;

  // 自動保存の間隔を取得
  const autoSaveInterval = getFromStorage('auto_save_interval') || 5;
  const intervalMs = autoSaveInterval * 60 * 1000; // 分をミリ秒に変換

  // 自動保存タイマーを設定
  autoSaveTimerId = setInterval(() => {
    // 現在のタブに応じて保存処理を実行
    if (appState.currentTab === 'document' && documentState.isModified) {
      saveDocument();
      updateStatus('ドキュメントを自動保存しました');
    } else if (appState.currentTab === 'spreadsheet' && spreadsheetState.isModified) {
      saveSpreadsheet();
      updateStatus('表計算を自動保存しました');
    } else if (appState.currentTab === 'presentation' && presentationState.isModified) {
      savePresentation();
      updateStatus('プレゼンテーションを自動保存しました');
    }
  }, intervalMs);
}

/**
 * ドキュメントを表示
 */
function showDocumentation() {
  // 既存のダイアログがあれば削除
  const existingDialog = document.getElementById('documentation-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // ドキュメントダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'documentation-dialog';
  dialog.className = 'dialog';
  dialog.style.width = '600px';
  dialog.style.maxWidth = '90%';
  dialog.style.height = '70vh';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>Aro One ドキュメント</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <h4>はじめに</h4>
      <p>Aro Oneは、ドキュメント編集、表計算、プレゼンテーション作成をオールインワンで行えるソフトウェアです。</p>

      <h4>基本操作</h4>
      <ul>
        <li><strong>ドキュメント作成</strong>: 「ファイル」メニューから「新規作成」を選択します。</li>
        <li><strong>保存</strong>: 「ファイル」メニューから「保存」または「名前を付けて保存」を選択します。</li>
        <li><strong>開く</strong>: 「ファイル」メニューから「開く」を選択します。</li>
      </ul>

      <h4>ドキュメント編集</h4>
      <p>ドキュメントタブでは、テキストの編集や書式設定が行えます。</p>
      <ul>
        <li><strong>書式設定</strong>: ツールバーのボタンや「書式」メニューを使用します。</li>
        <li><strong>画像挿入</strong>: 「挿入」メニューから「画像」を選択します。</li>
        <li><strong>表挿入</strong>: 「挿入」メニューから「表」を選択します。</li>
      </ul>

      <h4>表計算</h4>
      <p>表計算タブでは、セルにデータや数式を入力できます。</p>
      <ul>
        <li><strong>セルの編集</strong>: セルをクリックして値を入力します。</li>
        <li><strong>数式</strong>: =で始まる数式を入力します。例: =SUM(A1:A5)</li>
      </ul>

      <h4>プレゼンテーション</h4>
      <p>プレゼンテーションタブでは、スライドショーを作成できます。</p>
      <ul>
        <li><strong>スライド追加</strong>: 「新規スライド」ボタンをクリックします。</li>
        <li><strong>スライドショー開始</strong>: 「スライドショー」ボタンをクリックします。</li>
      </ul>
    </div>
    <div class="dialog-footer">
      <button id="doc-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#documentation-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('doc-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

/**
 * キーボードショートカットを表示
 */
function showKeyboardShortcuts() {
  // 既存のダイアログがあれば削除
  const existingDialog = document.getElementById('shortcuts-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // ショートカットダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'shortcuts-dialog';
  dialog.className = 'dialog';
  dialog.style.width = '500px';
  dialog.style.maxWidth = '90%';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>キーボードショートカット</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <h4>一般</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+S</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">保存</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+O</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">開く</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+P</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">印刷</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>F1</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">ヘルプ</td>
        </tr>
      </table>

      <h4>編集</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+Z</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">元に戻す</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+Y</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">やり直す</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+X</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">切り取り</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+C</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">コピー</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+V</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">貼り付け</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+A</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">すべて選択</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+F</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">検索</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+H</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">置換</td>
        </tr>
      </table>

      <h4>書式</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+B</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">太字</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+I</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">斜体</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);"><strong>Ctrl+U</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">下線</td>
        </tr>
      </table>
    </div>
    <div class="dialog-footer">
      <button id="shortcuts-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#shortcuts-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('shortcuts-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

/**
 * Aro Oneについてダイアログを表示
 */
function showAboutDialog() {
  // 既存のダイアログがあれば削除
  const existingDialog = document.getElementById('about-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // バージョン情報
  const version = '1.0.0';
  const buildDate = '2023年10月15日';

  // Aboutダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'about-dialog';
  dialog.className = 'dialog';
  dialog.style.width = '400px';
  dialog.style.maxWidth = '90%';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>Aro Oneについて</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content" style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
      <h2 style="margin-bottom: 8px;">Aro One</h2>
      <p style="margin-bottom: 16px;">オールインワンオフィススイート</p>
      <p style="margin-bottom: 8px;">バージョン: ${version}</p>
      <p style="margin-bottom: 16px;">ビルド日: ${buildDate}</p>
      <p>© 2023 Aro Software Group. All rights reserved.</p>
    </div>
    <div class="dialog-footer">
      <button id="about-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#about-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('about-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrlキーが押されている場合
    if (e.ctrlKey) {
      switch (e.key) {
        // ファイル操作
        case 's': // Ctrl+S: 保存
          e.preventDefault();
          saveCurrentFile();
          break;
        case 'o': // Ctrl+O: 開く
          e.preventDefault();
          openFile();
          break;
        case 'p': // Ctrl+P: 印刷
          e.preventDefault();
          printCurrentDocument();
          break;

        // 編集
        case 'z': // Ctrl+Z: 元に戻す
          // デフォルトの動作を使用するので何もしない
          break;
        case 'y': // Ctrl+Y: やり直す
          // デフォルトの動作を使用するので何もしない
          break;
        case 'x': // Ctrl+X: 切り取り
          // デフォルトの動作を使用するので何もしない
          break;
        case 'c': // Ctrl+C: コピー
          // デフォルトの動作を使用するので何もしない
          break;
        case 'v': // Ctrl+V: 貼り付け
          // デフォルトの動作を使用するので何もしない
          break;
        case 'a': // Ctrl+A: すべて選択
          // デフォルトの動作を使用するので何もしない
          break;
        case 'f': // Ctrl+F: 検索
          e.preventDefault();
          showFindDialog();
          break;
        case 'h': // Ctrl+H: 置換
          e.preventDefault();
          showReplaceDialog();
          break;

        // 書式
        case 'b': // Ctrl+B: 太字
          // デフォルトの動作を使用するので何もしない
          break;
        case 'i': // Ctrl+I: 斜体
          // デフォルトの動作を使用するので何もしない
          break;
        case 'u': // Ctrl+U: 下線
          // デフォルトの動作を使用するので何もしない
          break;

        // 挿入
        case 'k': // Ctrl+K: リンク挿入
          e.preventDefault();
          insertLink();
          break;
      }

      // Ctrl+Shiftの組み合わせ
      if (e.shiftKey) {
        switch (e.key) {
          case 'I': // Ctrl+Shift+I: 画像挿入
            e.preventDefault();
            insertImage();
            break;
          case 'T': // Ctrl+Shift+T: 表挿入
            e.preventDefault();
            insertTable();
            break;
          case 'X': // Ctrl+Shift+X: 取り消し線
            e.preventDefault();
            document.execCommand('strikeThrough');
            break;
        }
      }
    } else {
      // 他のキー
      switch (e.key) {
        case 'F1': // F1: ヘルプ
          e.preventDefault();
          showDocumentation();
          break;
      }
    }
  });
}

/**
 * 現在のドキュメントを印刷
 */
function printCurrentDocument() {
  // 印刷用のスタイルを設定
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      .content-area:not(.hidden), .content-area:not(.hidden) * {
        visibility: visible;
      }
      .content-area:not(.hidden) {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
    }
  `;
  document.head.appendChild(style);

  // 印刷ダイアログを表示
  window.print();

  // 印刷後にスタイルを削除
  document.head.removeChild(style);
}

/**
 * カラーピッカーを表示
 * @param {string} command - 実行するcommand
 */
function showColorPicker(command) {
  // 既存のカラーピッカーがあれば削除
  const existingDialog = document.getElementById('color-picker-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // カラーパレット
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#1c4587', '#0b5394', '#20124d', '#4c1130'
  ];

  // カラーピッカーダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'color-picker-dialog';
  dialog.className = 'dialog';
  dialog.style.width = '360px';
  dialog.style.maxWidth = '90%';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>${command === 'foreColor' ? '文字色' : '背景色'}</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <div class="color-picker-grid">
        ${colors.map(color => `<div class="color-item" data-color="${color}" style="background-color: ${color};"></div>`).join('')}
      </div>
    </div>
    <div class="dialog-footer">
      <button id="color-picker-close-btn" class="btn">キャンセル</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.querySelector('#color-picker-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('color-picker-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  // 色選択時の処理
  document.querySelectorAll('.color-item').forEach(item => {
    item.addEventListener('click', () => {
      const color = item.getAttribute('data-color');

      // 選択した色を適用
      document.execCommand(command, false, color);

      // 変更を記録
      if (appState.currentTab === 'document') {
        saveDocumentState();
        documentState.isModified = true;
        updateDocumentStatus();
      } else if (appState.currentTab === 'presentation') {
        presentationState.slides[presentationState.currentSlideIndex].content = slideContent.innerHTML;
        presentationState.isModified = true;
        updatePresentationStatus();
      }

      // ダイアログを閉じる
      document.body.removeChild(dialog);
    });
  });
}

/**
 * 現在のファイルを保存
 */
function saveCurrentFile() {
  switch (appState.currentTab) {
    case 'document':
      saveDocument();
      break;
    case 'spreadsheet':
      saveSpreadsheet();
      break;
    case 'presentation':
      savePresentation();
      break;
  }
}

/**
 * 現在のファイルを別名で保存
 */
function saveCurrentFileAs() {
  // 現在のファイルを別名で保存する処理
  // （実際にはローカルストレージに新しいIDで保存）
  switch (appState.currentTab) {
    case 'document':
      documentState.currentDocument = null;
      saveDocument();
      break;
    case 'spreadsheet':
      spreadsheetState.currentSpreadsheet = null;
      saveSpreadsheet();
      break;
    case 'presentation':
      presentationState.currentPresentation = null;
      savePresentation();
      break;
  }
}

/**
 * ファイルを開く
 */
function openFile() {
  // ファイル選択ダイアログを表示（実際のアプリでは実装が必要）
  alert('ファイルを開く機能は現在開発中です');

  // 実際のアプリでは、ローカルストレージから保存済みファイルのリストを表示し、
  // 選択されたファイルを読み込む処理を実装する
}

/**
 * PDFとしてエクスポート
 */
function exportAsPDF() {
  alert('PDF出力機能は現在開発中です');
  // 実際のアプリでは、html2pdfなどのライブラリを使用してPDF出力を実装する
}

/**
 * テーマの初期化
 */
function initTheme() {
  // ローカルストレージからテーマ設定を読み込む
  const savedTheme = getFromStorage('theme');

  // システムのダークモード設定を確認
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (savedTheme === null && prefersDarkMode)) {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
}

/**
 * テーマの切り替え
 */
function toggleTheme() {
  if (appState.isDarkMode) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }

  // 設定を保存
  saveToStorage('theme', appState.isDarkMode ? 'dark' : 'light');
}

/**
 * ダークモードを有効化
 */
function enableDarkMode() {
  document.body.classList.add('dark-mode');
  appState.isDarkMode = true;

  if (themeToggle) {
    const iconSpan = themeToggle.querySelector('.material-icon');
    if (iconSpan) {
      iconSpan.textContent = 'light_mode';
    }
    themeToggle.title = 'ライトモードに切り替え';
  }
}

/**
 * ダークモードを無効化
 */
function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  appState.isDarkMode = false;

  if (themeToggle) {
    const iconSpan = themeToggle.querySelector('.material-icon');
    if (iconSpan) {
      iconSpan.textContent = 'dark_mode';
    }
    themeToggle.title = 'ダークモードに切り替え';
  }
}

/**
 * ズームレベルを変更
 * @param {number} factor - ズーム値の乗数
 */
function zoomContent(factor) {
  // 現在のズーム値を取得
  const currentZoom = parseFloat(appState.zoomLevel || 1);

  // 新しいズーム値を計算
  let newZoom = currentZoom * factor;

  // ズームの上限と下限を設定
  newZoom = Math.max(0.5, Math.min(2.0, newZoom));

  // ズーム値を適用
  applyZoom(newZoom);

  // ステータスバーに表示
  updateStatus(`ズーム: ${Math.round(newZoom * 100)}%`);
}

/**
 * ズーム値をリセット
 */
function resetZoom() {
  applyZoom(1);
  updateStatus('ズーム: 100%');
}

/**
 * ズーム値を適用
 * @param {number} zoomLevel - ズーム値
 */
function applyZoom(zoomLevel) {
  // ズーム値を保存
  appState.zoomLevel = zoomLevel;

  // 現在のタブに応じてズームを適用
  switch (appState.currentTab) {
    case 'document':
      documentEditor.style.transform = `scale(${zoomLevel})`;
      documentEditor.style.transformOrigin = 'top left';
      break;
    case 'spreadsheet':
      spreadsheetContainer.style.transform = `scale(${zoomLevel})`;
      spreadsheetContainer.style.transformOrigin = 'top left';
      break;
    case 'presentation':
      slideEditor.style.transform = `scale(${zoomLevel})`;
      slideEditor.style.transformOrigin = 'top left';
      break;
  }

  // ズーム設定を保存
  saveToStorage('zoom_settings', {
    global: zoomLevel,
    document: appState.currentTab === 'document' ? zoomLevel : null,
    spreadsheet: appState.currentTab === 'spreadsheet' ? zoomLevel : null,
    presentation: appState.currentTab === 'presentation' ? zoomLevel : null
  });
}

/**
 * 全画面表示の切り替え
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // 全画面表示に切り替え
    document.documentElement.requestFullscreen().catch(err => {
      alert(`全画面表示に切り替えられませんでした: ${err.message}`);
    });
  } else {
    // 全画面表示を終了
    document.exitFullscreen();
  }
}

/**
 * ドロップダウンメニューを表示
 * @param {string} menuId - メニューID
 * @param {number} x - X座標
 * @param {number} y - Y座標
 */
function showDropdownMenu(menuId, x, y) {
  // 他のメニューを閉じる
  closeAllDropdownMenus();

  const menu = document.getElementById(menuId);
  if (!menu) return;

  // 位置を設定
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // 表示
  menu.classList.add('visible');
  appState.isMenuOpen = true;
  appState.openMenuId = menuId;

  // 画面外に出ないように調整
  const rect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (rect.right > viewportWidth) {
    menu.style.left = `${viewportWidth - rect.width - 10}px`;
  }

  if (rect.bottom > viewportHeight) {
    menu.style.top = `${y - rect.height}px`;
  }
}

/**
 * すべてのドロップダウンメニューを閉じる
 */
function closeAllDropdownMenus() {
  dropdownMenus.forEach(menu => {
    menu.classList.remove('visible');
  });

  appState.isMenuOpen = false;
  appState.openMenuId = null;
}

/**
 * 検索ダイアログを表示
 */
function showFindDialog() {
  // 既存の検索ダイアログがあれば削除
  const existingDialog = document.getElementById('find-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // 検索ダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'find-dialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>検索</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <div class="form-group">
        <label for="find-text">検索する文字列:</label>
        <input type="text" id="find-text" class="form-control">
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="find-case-sensitive"> 大文字と小文字を区別する</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="find-whole-word"> 単語単位で検索</label>
      </div>
    </div>
    <div class="dialog-footer">
      <button id="find-prev-btn" class="btn">前へ</button>
      <button id="find-next-btn" class="btn btn-primary">次へ</button>
      <button id="find-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.getElementById('find-text').focus();

  document.querySelector('#find-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('find-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('find-next-btn').addEventListener('click', () => {
    findText('forward');
  });

  document.getElementById('find-prev-btn').addEventListener('click', () => {
    findText('backward');
  });

  // Enterキーで検索実行
  document.getElementById('find-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findText('forward');
    }
  });
}

/**
 * 置換ダイアログを表示
 */
function showReplaceDialog() {
  // 既存の置換ダイアログがあれば削除
  const existingDialog = document.getElementById('replace-dialog');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }

  // 置換ダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'replace-dialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>置換</h3>
      <button class="dialog-close-btn">×</button>
    </div>
    <div class="dialog-content">
      <div class="form-group">
        <label for="replace-find-text">検索する文字列:</label>
        <input type="text" id="replace-find-text" class="form-control">
      </div>
      <div class="form-group">
        <label for="replace-text">置換後の文字列:</label>
        <input type="text" id="replace-text" class="form-control">
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="replace-case-sensitive"> 大文字と小文字を区別する</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="replace-whole-word"> 単語単位で検索</label>
      </div>
    </div>
    <div class="dialog-footer">
      <button id="replace-find-btn" class="btn">検索</button>
      <button id="replace-btn" class="btn">置換</button>
      <button id="replace-all-btn" class="btn btn-primary">すべて置換</button>
      <button id="replace-close-btn" class="btn">閉じる</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // ダイアログを中央に配置
  const rect = dialog.getBoundingClientRect();
  dialog.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  dialog.style.top = `${(window.innerHeight - rect.height) / 3}px`;

  // イベントリスナーを設定
  document.getElementById('replace-find-text').focus();

  document.querySelector('#replace-dialog .dialog-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('replace-close-btn').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  document.getElementById('replace-find-btn').addEventListener('click', () => {
    findTextForReplace();
  });

  document.getElementById('replace-btn').addEventListener('click', () => {
    replaceSelection();
  });

  document.getElementById('replace-all-btn').addEventListener('click', () => {
    replaceAll();
  });
}

/**
 * 指定した方向にテキストを検索
 * @param {string} direction - 検索方向 ('forward' または 'backward')
 */
function findText(direction) {
  const searchText = document.getElementById('find-text').value;
  if (!searchText) return;

  const caseSensitive = document.getElementById('find-case-sensitive').checked;
  const wholeWord = document.getElementById('find-whole-word').checked;

  // 現在のエディタを取得
  let editor;
  switch (appState.currentTab) {
    case 'document':
      editor = documentEditor;
      break;
    case 'presentation':
      editor = slideContent;
      break;
    default:
      alert('現在のタブでは検索機能を使用できません');
      return;
  }

  // 現在の選択範囲を取得
  const selection = window.getSelection();
  const currentRange = selection.getRangeAt(0);

  // 検索範囲を設定
  let range;
  if (direction === 'forward') {
    range = document.createRange();
    range.setStart(currentRange.endContainer, currentRange.endOffset);
    range.setEnd(editor, editor.childNodes.length);
  } else {
    range = document.createRange();
    range.setStart(editor, 0);
    range.setEnd(currentRange.startContainer, currentRange.startOffset);
  }

  // 検索テキストを正規表現に変換
  let flags = 'g';
  if (!caseSensitive) flags += 'i';

  let regexPattern = searchText;
  if (wholeWord) regexPattern = `\\b${regexPattern}\\b`;

  try {
    const regex = new RegExp(regexPattern, flags);

    // 検索範囲のテキストを取得
    const textContent = range.toString();

    // 検索実行
    const match = regex.exec(textContent);

    if (match) {
      // 検索結果が見つかった場合
      const matchIndex = match.index;

      // テキストノードとオフセットを特定
      let currentNode = range.startContainer;
      let currentOffset = range.startOffset;
      let charCount = 0;

      // テキストノードを走査して一致した位置を特定
      const nodeIterator = document.createNodeIterator(editor, NodeFilter.SHOW_TEXT);
      let textNode;

      while ((textNode = nodeIterator.nextNode())) {
        const nodeLength = textNode.nodeValue.length;

        if (charCount + nodeLength > matchIndex) {
          // 一致したノードを見つけた
          const startOffset = matchIndex - charCount;
          const endOffset = startOffset + match[0].length;

          // 新しい範囲を作成して選択
          const newRange = document.createRange();
          newRange.setStart(textNode, startOffset);
          newRange.setEnd(textNode, endOffset);

          selection.removeAllRanges();
          selection.addRange(newRange);

          // 選択範囲が表示されるようにスクロール
          const selectedElement = selection.anchorNode.parentElement;
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          return true;
        }

        charCount += nodeLength;
      }
    } else {
      // 検索結果が見つからなかった場合
      alert('検索文字列が見つかりませんでした');
      return false;
    }
  } catch (error) {
    alert(`検索エラー: ${error.message}`);
    return false;
  }
}

/**
 * 置換用にテキストを検索
 */
function findTextForReplace() {
  const searchText = document.getElementById('replace-find-text').value;
  if (!searchText) return;

  const caseSensitive = document.getElementById('replace-case-sensitive').checked;
  const wholeWord = document.getElementById('replace-whole-word').checked;

  // 現在のエディタを取得
  let editor;
  switch (appState.currentTab) {
    case 'document':
      editor = documentEditor;
      break;
    case 'presentation':
      editor = slideContent;
      break;
    default:
      alert('現在のタブでは置換機能を使用できません');
      return;
  }

  // 検索テキストを正規表現に変換
  let flags = 'g';
  if (!caseSensitive) flags += 'i';

  let regexPattern = searchText;
  if (wholeWord) regexPattern = `\\b${regexPattern}\\b`;

  try {
    const regex = new RegExp(regexPattern, flags);

    // 検索範囲のテキストを取得
    const textContent = editor.textContent;

    // 検索実行
    const match = regex.exec(textContent);
    if (match) {
      // 検索結果が見つかった場合
      const matchIndex = match.index;

      // テキストノードとオフセットを特定
      let charCount = 0;

      // テキストノードを走査して一致した位置を特定
      const nodeIterator = document.createNodeIterator(editor, NodeFilter.SHOW_TEXT);
      let textNode;

      while ((textNode = nodeIterator.nextNode())) {
        const nodeLength = textNode.nodeValue.length;

        if (charCount + nodeLength > matchIndex) {
          // 一致したノードを見つけた
          const startOffset = matchIndex - charCount;
          const endOffset = startOffset + match[0].length;

          // 新しい範囲を作成して選択
          const newRange = document.createRange();
          newRange.setStart(textNode, startOffset);
          newRange.setEnd(textNode, endOffset);

          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(newRange);

          // 選択範囲が表示されるようにスクロール
          const selectedElement = selection.anchorNode.parentElement;
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          return true;
        }

        charCount += nodeLength;
      }
    } else {
      // 検索結果が見つからなかった場合
      alert('検索文字列が見つかりませんでした');
      return false;
    }
  } catch (error) {
    alert(`検索エラー: ${error.message}`);
    return false;
  }
}

/**
 * 選択範囲を置換
 */
function replaceSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    alert('置換するテキストが選択されていません');
    return;
  }

  const replaceText = document.getElementById('replace-text').value;

  // 選択範囲を置換
  document.execCommand('insertText', false, replaceText);

  // 次の検索結果を探す
  findTextForReplace();
}

/**
 * すべての一致を置換
 */
function replaceAll() {
  const searchText = document.getElementById('replace-find-text').value;
  if (!searchText) return;

  const replaceText = document.getElementById('replace-text').value;
  const caseSensitive = document.getElementById('replace-case-sensitive').checked;
  const wholeWord = document.getElementById('replace-whole-word').checked;

  // 現在のエディタを取得
  let editor;
  switch (appState.currentTab) {
    case 'document':
      editor = documentEditor;
      break;
    case 'presentation':
      editor = slideContent;
      break;
    default:
      alert('現在のタブでは置換機能を使用できません');
      return;
  }

  // 検索テキストを正規表現に変換
  let flags = 'g';
  if (!caseSensitive) flags += 'i';

  let regexPattern = searchText;
  if (wholeWord) regexPattern = `\\b${regexPattern}\\b`;

  try {
    const regex = new RegExp(regexPattern, flags);

    // エディタの内容を取得
    const content = editor.innerHTML;

    // 置換実行
    const newContent = content.replace(regex, replaceText);

    // 変更を適用
    editor.innerHTML = newContent;

    // 変更を履歴に追加
    if (appState.currentTab === 'document') {
      saveDocumentState();
      documentState.isModified = true;
      updateDocumentStatus();
    } else if (appState.currentTab === 'presentation') {
      presentationState.slides[presentationState.currentSlideIndex].content = newContent;
      presentationState.isModified = true;
      updatePresentationStatus();
    }

    // 置換数をカウント
    const matchCount = (content.match(regex) || []).length;
    alert(`${matchCount}個の項目を置換しました`);
  } catch (error) {
    alert(`置換エラー: ${error.message}`);
  }
}

/**
 * ステータスバーの更新
 * @param {string} message - 表示するメッセージ
 */
function updateStatus(message) {
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = message;
  }
}

