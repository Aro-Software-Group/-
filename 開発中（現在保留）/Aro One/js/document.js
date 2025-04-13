/**
 * Aro One 文書作成機能
 */

// 文書エディタの状態
const documentState = {
  currentDocument: null,
  isModified: false,
  selection: null,
  history: [],
  historyIndex: -1,
  maxHistorySteps: 50
};

// DOM要素
let documentEditor;

/**
 * 文書機能の初期化
 */
function initDocumentEditor() {
  documentEditor = document.querySelector('.document-editor');
  if (!documentEditor) return;

  // 初期状態を保存
  saveDocumentState();

  // イベントリスナーの設定
  setupDocumentEventListeners();

  updateWordCharCount(); // ← 追加: 初期表示
}

/**
 * 文書エディタのイベントリスナーを設定
 */
function setupDocumentEventListeners() {
  // 入力イベント
  documentEditor.addEventListener('input', () => {
    documentState.isModified = true;
    saveDocumentState();
    updateDocumentStatus();
    updateWordCharCount(); // ← 追加: 文字数・単語数カウントを更新
  });

  // 選択範囲の変更イベント
  document.addEventListener('selectionchange', (e) => {
    // 文書エディタにフォーカスがある場合のみ処理
    if (document.activeElement === documentEditor || documentEditor.contains(document.activeElement)) {
      updateSelectionState();
    }
  });

  // キーボードショートカット
  documentEditor.addEventListener('keydown', handleDocumentKeydown);

  // フォーカスイベント
  documentEditor.addEventListener('focus', () => {
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.disabled = false;
    });
  });

  documentEditor.addEventListener('blur', () => {
    // フォーカスが外れても、ツールバーボタンは無効にしない
  });
}

/**
 * 文書のキーボードショートカットを処理
 * @param {KeyboardEvent} e - キーボードイベント
 */
function handleDocumentKeydown(e) {
  // Ctrl+B: 太字
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault();
    document.execCommand('bold', false, null);
  }

  // Ctrl+I: 斜体
  if (e.ctrlKey && e.key === 'i') {
    e.preventDefault();
    document.execCommand('italic', false, null);
  }

  // Ctrl+U: 下線
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    document.execCommand('underline', false, null);
  }

  // Ctrl+Z: 元に戻す
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undoDocument();
  }

  // Ctrl+Y: やり直し
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redoDocument();
  }

  // Ctrl+S: 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveDocument();
  }
}

/**
 * 選択範囲の状態を更新
 */
function updateSelectionState() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  documentState.selection = selection;

  // 選択範囲のスタイル状態を取得
  const isBold = document.queryCommandState('bold');
  const isItalic = document.queryCommandState('italic');
  const isUnderline = document.queryCommandState('underline');

  // ツールバーボタンの状態を更新
  const boldBtn = document.getElementById('bold-btn');
  const italicBtn = document.getElementById('italic-btn');
  const underlineBtn = document.getElementById('underline-btn');

  if (boldBtn) toggleClass(boldBtn, 'active', isBold);
  if (italicBtn) toggleClass(italicBtn, 'active', isItalic);
  if (underlineBtn) toggleClass(underlineBtn, 'active', isUnderline);
}

/**
 * 文書の状態を保存（履歴用）
 */
function saveDocumentState() {
  // 履歴に現在の状態を追加
  if (documentState.historyIndex < documentState.history.length - 1) {
    // 現在位置より先の履歴を削除
    documentState.history = documentState.history.slice(0, documentState.historyIndex + 1);
  }

  documentState.history.push(documentEditor.innerHTML);
  documentState.historyIndex = documentState.history.length - 1;

  // 履歴の上限を超えた場合、古いものを削除
  if (documentState.history.length > documentState.maxHistorySteps) {
    documentState.history.shift();
    documentState.historyIndex--;
  }
}

/**
 * 元に戻す
 */
function undoDocument() {
  if (documentState.historyIndex > 0) {
    documentState.historyIndex--;
    documentEditor.innerHTML = documentState.history[documentState.historyIndex];
    updateDocumentStatus();
  }
}

/**
 * やり直し
 */
function redoDocument() {
  if (documentState.historyIndex < documentState.history.length - 1) {
    documentState.historyIndex++;
    documentEditor.innerHTML = documentState.history[documentState.historyIndex];
    updateDocumentStatus();
  }
}

/**
 * 文書の状態表示を更新
 */
function updateDocumentStatus() {
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
  }
}

/**
 * 文字数と単語数を計算して表示する
 */
function updateWordCharCount() {
  const wordCountElement = document.getElementById('word-count');
  const charCountElement = document.getElementById('char-count');

  if (!documentEditor || !wordCountElement || !charCountElement) {
    return;
  }

  const text = documentEditor.innerText || documentEditor.textContent || '';
  const charCount = text.length;
  // 連続する空白を一つにまとめ、トリムしてから空白で分割
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  // 空の要素を除外してカウント
  const wordCount = words.filter(word => word !== '').length;


  wordCountElement.textContent = `${wordCount} 単語`;
  charCountElement.textContent = `${charCount} 文字`;
}

/**
 * 新規文書を作成
 */
function createNewDocument() {
  if (documentState.isModified) {
    const confirmSave = confirm('変更が保存されていません。保存しますか？');
    if (confirmSave) {
      saveDocument();
    }
  }

  documentEditor.innerHTML = '<h1>新規文書</h1><p>ここに文章を入力してください。</p>';
  documentState.currentDocument = null;
  documentState.isModified = false;
  documentState.history = [documentEditor.innerHTML];
  documentState.historyIndex = 0;

  updateDocumentStatus();
  updateWordCharCount(); // ← 追加: 新規作成時にも更新
}

/**
 * 文書を保存
 */
function saveDocument() {
  const documentContent = documentEditor.innerHTML;
  const documentTitle = getDocumentTitle();
  const timestamp = getCurrentDateTime();

  const documentData = {
    title: documentTitle,
    content: documentContent,
    lastModified: timestamp,
    type: 'document'
  };

  if (documentState.currentDocument) {
    // 既存文書の更新
    documentData.id = documentState.currentDocument.id;
    saveToStorage(`document_${documentData.id}`, documentData);
  } else {
    // 新規文書の保存
    const id = Date.now().toString();
    documentData.id = id;
    documentState.currentDocument = documentData;
    saveToStorage(`document_${id}`, documentData);

    // 文書リストに追加
    const documents = getFromStorage('documents', []);
    documents.push({
      id: id,
      title: documentTitle,
      lastModified: timestamp,
      type: 'document'
    });
    saveToStorage('documents', documents);
  }

  documentState.isModified = false;
  updateDocumentStatus();

  // 成功メッセージ
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = '文書を保存しました';
    setTimeout(() => {
      statusText.textContent = '保存済み';
    }, 2000);
  }
}

/**
 * 文書のタイトルを取得
 * @returns {string} 文書タイトル
 */
function getDocumentTitle() {
  // h1タグからタイトルを取得
  const h1 = documentEditor.querySelector('h1');
  if (h1 && h1.textContent.trim()) {
    return h1.textContent.trim();
  }

  // h1がない場合は「無題」
  return '無題の文書';
}

/**
 * 文書を読み込む
 * @param {string} id - 文書ID
 */
function loadDocument(id) {
  const documentData = getFromStorage(`document_${id}`);
  if (!documentData) {
    alert('文書の読み込みに失敗しました');
    return;
  }

  documentEditor.innerHTML = documentData.content;
  documentState.currentDocument = documentData;
  documentState.isModified = false;
  documentState.history = [documentData.content];
  documentState.historyIndex = 0;

  updateDocumentStatus();
}

/**
 * 文書をHTMLとしてエクスポート
 */
function exportDocumentAsHTML() {
  const documentContent = documentEditor.innerHTML;
  const documentTitle = getDocumentTitle();

  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { font-size: 24px; margin-bottom: 16px; }
    h2 { font-size: 20px; margin-bottom: 14px; }
    h3 { font-size: 18px; margin-bottom: 12px; }
    p { margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    table, th, td { border: 1px solid #ddd; }
    th, td { padding: 8px; text-align: left; }
    th { background-color: #f8f9fa; }
  </style>
</head>
<body>
  ${documentContent}
</body>
</html>
  `;

  downloadFile(`${documentTitle}.html`, htmlContent, 'text/html');
}

/**
 * 文書をテキストとしてエクスポート
 */
function exportDocumentAsText() {
  // HTMLからプレーンテキストに変換
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = documentEditor.innerHTML;

  // 改行を適切に処理
  const text = convertHtmlToText(tempDiv);

  const documentTitle = getDocumentTitle();
  downloadFile(`${documentTitle}.txt`, text, 'text/plain');
}

/**
 * HTMLをプレーンテキストに変換
 * @param {HTMLElement} element - HTML要素
 * @returns {string} プレーンテキスト
 */
function convertHtmlToText(element) {
  let text = '';

  // 子ノードを処理
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // テキストノード
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 要素ノード
      const tagName = node.tagName.toLowerCase();

      // 特定のタグに対する処理
      if (tagName === 'br') {
        text += '\n';
      } else if (tagName === 'p' || tagName === 'div') {
        text += convertHtmlToText(node) + '\n\n';
      } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
        text += convertHtmlToText(node) + '\n\n';
      } else if (tagName === 'ul' || tagName === 'ol') {
        text += convertHtmlToText(node) + '\n';
      } else if (tagName === 'li') {
        text += '- ' + convertHtmlToText(node) + '\n';
      } else if (tagName === 'table') {
        text += convertHtmlToText(node) + '\n';
      } else if (tagName === 'tr') {
        text += convertHtmlToText(node) + '\n';
      } else if (tagName === 'td' || tagName === 'th') {
        text += convertHtmlToText(node) + '\t';
      } else {
        text += convertHtmlToText(node);
      }
    }
  }

  return text;
}

/**
 * 文書に表を挿入
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 */
function insertTable(rows = 3, cols = 3) {
  const table = document.createElement('table');

  // ヘッダー行
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  for (let i = 0; i < cols; i++) {
    const th = document.createElement('th');
    th.textContent = `列 ${i + 1}`;
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // ボディ行
  const tbody = document.createElement('tbody');

  for (let i = 0; i < rows - 1; i++) {
    const row = document.createElement('tr');

    for (let j = 0; j < cols; j++) {
      const td = document.createElement('td');
      td.textContent = '';
      row.appendChild(td);
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  // 選択範囲に表を挿入
  document.execCommand('insertHTML', false, table.outerHTML);
}

/**
 * 文書に画像を挿入
 */
function insertImage() {
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

      // 選択範囲に画像を挿入
      document.execCommand('insertHTML', false, img.outerHTML);
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

/**
 * 文書にリンクを挿入
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

  // 選択範囲にリンクを挿入
  document.execCommand('insertHTML', false, link.outerHTML);
}

/**
 * 文書をPDFとしてエクスポート
 */
function exportDocumentAsPDF() {
  // ステータスを更新
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = 'PDFを生成中...';
  }
  
  // A4サイズのPDFを作成
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // スタイルを整えたコンテンツを用意する
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = documentEditor.innerHTML;
  contentDiv.style.width = '170mm'; // A4の幅に収まるようにする
  contentDiv.style.padding = '15mm';
  contentDiv.style.fontFamily = 'Noto Sans JP, sans-serif';
  contentDiv.style.fontSize = '11pt';
  contentDiv.style.color = '#000';
  contentDiv.style.backgroundColor = '#fff';
  
  // 一時的にDOMに追加
  contentDiv.style.position = 'absolute';
  contentDiv.style.left = '-9999px';
  document.body.appendChild(contentDiv);
  
  html2canvas(contentDiv, {
    scale: 2, // より高い解像度のために
    useCORS: true,
    logging: false
  }).then(canvas => {
    // PDF生成
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // 最初のページに追加
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // 複数ページに分割
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    const documentTitle = getDocumentTitle();
    // PDFをダウンロード
    doc.save(`${documentTitle}.pdf`);
    
    // DOMから一時的な要素を削除
    document.body.removeChild(contentDiv);
    
    // ステータスを更新
    if (statusText) {
      statusText.textContent = 'PDFをエクスポートしました';
      setTimeout(() => {
        statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
      }, 2000);
    }
  });
}

/**
 * 文書を画像としてエクスポート
 * @param {string} format - 画像形式 ('png' または 'jpg')
 */
function exportDocumentAsImage(format = 'png') {
  // ステータスを更新
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = `${format.toUpperCase()}画像を生成中...`;
  }
  
  // スタイルを整えたコンテンツを用意する
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = documentEditor.innerHTML;
  contentDiv.style.width = '800px';
  contentDiv.style.padding = '40px';
  contentDiv.style.fontFamily = 'Noto Sans JP, sans-serif';
  contentDiv.style.fontSize = '14px';
  contentDiv.style.color = '#000';
  contentDiv.style.backgroundColor = '#fff';
  contentDiv.style.minHeight = '1000px';
  
  // 一時的にDOMに追加
  contentDiv.style.position = 'absolute';
  contentDiv.style.left = '-9999px';
  document.body.appendChild(contentDiv);
  
  html2canvas(contentDiv, {
    scale: 2, // より高い解像度のために
    useCORS: true,
    backgroundColor: '#fff'
  }).then(canvas => {
    // 画像をダウンロード
    const documentTitle = getDocumentTitle();
    let imageType = 'image/png';
    let extension = 'png';
    let quality = 1.0;
    
    if (format === 'jpg') {
      imageType = 'image/jpeg';
      extension = 'jpg';
      quality = 0.9; // JPGの品質
    }
    
    const imgData = canvas.toDataURL(imageType, quality);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `${documentTitle}.${extension}`;
    link.click();
    
    // DOMから一時的な要素を削除
    document.body.removeChild(contentDiv);
    
    // ステータスを更新
    if (statusText) {
      statusText.textContent = `${format.toUpperCase()}画像をエクスポートしました`;
      setTimeout(() => {
        statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
      }, 2000);
    }
  });
}

/**
 * 文書内の見出しから目次を生成して挿入
 */
function insertTableOfContents() {
  // 現在のカーソル位置を記憶
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  
  // 文書内のすべての見出し要素を取得
  const headings = documentEditor.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    alert('文書内に見出しが見つかりません。目次を生成するには見出しが必要です。');
    return;
  }
  
  // 目次のHTMLを生成
  let tocHTML = '<div class="table-of-contents">';
  tocHTML += '<h2>目次</h2>';
  tocHTML += '<ul class="toc-list">';
  
  // 各見出しに一意のIDを付与して目次項目を生成
  headings.forEach((heading, index) => {
    const headingLevel = parseInt(heading.tagName.substring(1));
    const headingText = heading.textContent.trim();
    const headingId = `heading-${index}`;
    
    // 見出しにIDを設定（なければ）
    if (!heading.id) {
      heading.id = headingId;
    }
    
    // 目次項目のインデント
    const indent = (headingLevel - 1) * 20;
    
    // 目次項目
    tocHTML += `<li class="toc-item" style="margin-left: ${indent}px;">`;
    tocHTML += `<a href="#${heading.id}" class="toc-link">${headingText}</a>`;
    tocHTML += '</li>';
  });
  
  tocHTML += '</ul>';
  tocHTML += '</div>';
  
  // カーソル位置に目次を挿入
  document.execCommand('insertHTML', false, tocHTML);
  
  // 変更を履歴に追加
  documentState.isModified = true;
  saveDocumentState();
  updateDocumentStatus();
  
  // 目次の挿入メッセージを表示
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = '目次を挿入しました';
    setTimeout(() => {
      statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
    }, 2000);
  }
}

/**
 * 文書内の目次を更新
 */
function updateTableOfContents() {
  // 文書内の目次要素を取得
  const tocElements = documentEditor.querySelectorAll('.table-of-contents');
  
  if (tocElements.length === 0) {
    // 目次がなければ新規作成
    insertTableOfContents();
    return;
  }
  
  // 文書内のすべての見出し要素を取得
  const headings = documentEditor.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    alert('文書内に見出しが見つかりません。目次を生成するには見出しが必要です。');
    return;
  }
  
  // 各目次を更新
  tocElements.forEach(tocElement => {
    // 目次のタイトルを保持
    const tocTitle = tocElement.querySelector('h2')?.textContent || '目次';
    
    // 新しい目次のHTMLを生成
    let tocHTML = `<h2>${tocTitle}</h2>`;
    tocHTML += '<ul class="toc-list">';
    
    // 各見出しに一意のIDを付与して目次項目を生成
    headings.forEach((heading, index) => {
      const headingLevel = parseInt(heading.tagName.substring(1));
      const headingText = heading.textContent.trim();
      const headingId = `heading-${index}`;
      
      // 見出しにIDを設定（なければ）
      if (!heading.id) {
        heading.id = headingId;
      }
      
      // 目次項目のインデント
      const indent = (headingLevel - 1) * 20;
      
      // 目次項目
      tocHTML += `<li class="toc-item" style="margin-left: ${indent}px;">`;
      tocHTML += `<a href="#${heading.id}" class="toc-link">${headingText}</a>`;
      tocHTML += '</li>';
    });
    
    tocHTML += '</ul>';
    
    // 目次の内容を更新
    tocElement.innerHTML = tocHTML;
  });
  
  // 変更を履歴に追加
  documentState.isModified = true;
  saveDocumentState();
  updateDocumentStatus();
  
  // 目次の更新メッセージを表示
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = '目次を更新しました';
    setTimeout(() => {
      statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
    }, 2000);
  }
}

/**
 * 脚注を挿入
 */
function insertFootnote() {
  // 現在のカーソル位置を取得
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  // 脚注テキストを取得
  const footnoteText = prompt('脚注テキストを入力してください:');
  if (!footnoteText) return;
  
  // 脚注番号を決定（既存の脚注数 + 1）
  const existingFootnotes = documentEditor.querySelectorAll('.footnote-ref');
  const footnoteNumber = existingFootnotes.length + 1;
  
  // 脚注参照を挿入
  const footnoteRefHTML = `<sup class="footnote-ref" id="fnref-${footnoteNumber}">[${footnoteNumber}]</sup>`;
  document.execCommand('insertHTML', false, footnoteRefHTML);
  
  // 脚注セクションがあるか確認
  let footnotesSection = documentEditor.querySelector('.footnotes-section');
  
  if (!footnotesSection) {
    // 脚注セクションがなければ、文書の最後に作成
    const footnoteSectionHTML = '<hr class="footnotes-separator"><div class="footnotes-section"><h3>脚注</h3></div>';
    
    // 文書の最後に脚注セクションを追加
    documentEditor.appendChild(createElementFromHTML(footnoteSectionHTML));
    footnotesSection = documentEditor.querySelector('.footnotes-section');
  }
  
  // 脚注項目を作成
  const footnoteItemHTML = `
    <div class="footnote-item" id="fn-${footnoteNumber}">
      <sup>${footnoteNumber}</sup> ${footnoteText}
      <a href="#fnref-${footnoteNumber}" class="footnote-backref">↩</a>
    </div>
  `;
  
  // 脚注セクションに脚注項目を追加
  footnotesSection.appendChild(createElementFromHTML(footnoteItemHTML));
  
  // 変更を履歴に追加
  documentState.isModified = true;
  saveDocumentState();
  updateDocumentStatus();
  
  // 処理完了メッセージ
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = '脚注を挿入しました';
    setTimeout(() => {
      statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
    }, 2000);
  }
}

/**
 * 引用を挿入
 */
function insertCitation() {
  // 現在の選択範囲を取得
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  // 引用元情報を取得
  const source = prompt('引用元（著者、書籍名、URL等）を入力してください:');
  if (!source) return;
  
  const selectedText = selection.toString();
  let citationHTML;
  
  if (selectedText) {
    // 選択範囲があれば、それを引用としてマークアップ
    citationHTML = `<blockquote class="citation">
      <p>${selectedText}</p>
      <footer>出典: <cite>${source}</cite></footer>
    </blockquote>`;
    
    // 選択範囲を引用に置き換え
    document.execCommand('insertHTML', false, citationHTML);
  } else {
    // 選択範囲がなければ、空の引用を挿入
    citationHTML = `<blockquote class="citation">
      <p>ここに引用文を入力してください</p>
      <footer>出典: <cite>${source}</cite></footer>
    </blockquote>`;
    
    // カーソル位置に引用を挿入
    document.execCommand('insertHTML', false, citationHTML);
  }
  
  // 変更を履歴に追加
  documentState.isModified = true;
  saveDocumentState();
  updateDocumentStatus();
  
  // 処理完了メッセージ
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = '引用を挿入しました';
    setTimeout(() => {
      statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
    }, 2000);
  }
}

/**
 * HTML文字列からDOM要素を作成
 * @param {string} htmlString - HTML文字列
 * @returns {Node} - DOM要素
 */
function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  
  // 最初の子要素を返す
  return div.firstChild;
}

/**
 * ページ番号を挿入
 */
function insertPageNumber() {
  // ページ番号形式の選択ダイアログ
  const pageNumberFormat = prompt('ページ番号の形式を選択してください：\n1. シンプル（1, 2, 3）\n2. ページX / 合計（ページ1 / 8）\n3. - 1 -\n4. カスタム', '1');
  
  if (!pageNumberFormat) return;
  
  // ページ番号の位置
  const pageNumberPosition = prompt('ページ番号の位置を選択してください：\n1. ヘッダー（上部）\n2. フッター（下部）', '2');
  
  if (!pageNumberPosition) return;
  
  // ページ番号の配置
  const pageNumberAlignment = prompt('ページ番号の配置を選択してください：\n1. 左揃え\n2. 中央揃え\n3. 右揃え', '2');
  
  if (!pageNumberAlignment) return;
  
  // 配置スタイルを決定
  let alignStyle = 'text-align: left;';
  if (pageNumberAlignment === '2') {
    alignStyle = 'text-align: center;';
  } else if (pageNumberAlignment === '3') {
    alignStyle = 'text-align: right;';
  }
  
  // ページ番号のHTMLを生成
  let pageNumberHTML = '';
  
  switch (pageNumberFormat) {
    case '1': // シンプル
      pageNumberHTML = '<span class="page-number" style="' + alignStyle + '">{page}</span>';
      break;
    case '2': // ページX / 合計
      pageNumberHTML = '<span class="page-number" style="' + alignStyle + '">ページ {page} / {total}</span>';
      break;
    case '3': // - 1 -
      pageNumberHTML = '<span class="page-number" style="' + alignStyle + '">- {page} -</span>';
      break;
    case '4': // カスタム
      const customFormat = prompt('カスタム形式を入力してください（{page}は現在のページ番号、{total}は総ページ数に置き換えられます）', 'ページ {page}');
      if (!customFormat) return;
      pageNumberHTML = '<span class="page-number" style="' + alignStyle + '">' + customFormat + '</span>';
      break;
    default:
      return;
  }
  
  // ページ番号の挿入位置を決定
  if (pageNumberPosition === '1') {
    // ヘッダーに挿入
    
    // 既存のヘッダーを確認
    let header = documentEditor.querySelector('.document-header');
    
    if (!header) {
      // ヘッダーがなければ作成
      header = document.createElement('div');
      header.className = 'document-header';
      header.style.borderBottom = '1px solid #ccc';
      header.style.marginBottom = '15px';
      header.style.paddingBottom = '5px';
      
      // 文書の先頭に挿入
      documentEditor.insertBefore(header, documentEditor.firstChild);
    }
    
    // ヘッダーにページ番号を設定
    header.innerHTML = pageNumberHTML;
    
  } else {
    // フッターに挿入
    
    // 既存のフッターを確認
    let footer = documentEditor.querySelector('.document-footer');
    
    if (!footer) {
      // フッターがなければ作成
      footer = document.createElement('div');
      footer.className = 'document-footer';
      footer.style.borderTop = '1px solid #ccc';
      footer.style.marginTop = '15px';
      footer.style.paddingTop = '5px';
      
      // 文書の最後に追加
      documentEditor.appendChild(footer);
    }
    
    // フッターにページ番号を設定
    footer.innerHTML = pageNumberHTML;
  }
  
  // 処理完了メッセージ
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = 'ページ番号を設定しました（印刷/PDFエクスポート時に反映）';
    setTimeout(() => {
      statusText.textContent = documentState.isModified ? '未保存の変更があります' : '保存済み';
    }, 3000);
  }
  
  // 変更を履歴に追加
  documentState.isModified = true;
  saveDocumentState();
  updateDocumentStatus();
}

/**
 * 文書の校正（表記ゆれチェック）
 */
function checkDocumentProofreading() {
  // 文書のテキストを取得
  const docText = documentEditor.innerText || documentEditor.textContent || '';
  
  // 表記ゆれパターンの定義（一般的な日本語の表記ゆれ例）
  const variationPatterns = [
    { pattern: /行なう/g, suggestion: '行う' },
    { pattern: /打消し/g, suggestion: '打ち消し' },
    { pattern: /ちょっと/g, suggestion: '少し' },
    { pattern: /お勧め/g, suggestion: 'おすすめ' },
    { pattern: /但し/g, suggestion: 'ただし' },
    { pattern: /事/g, suggestion: 'こと' },
    { pattern: /訳/g, suggestion: 'わけ' },
    { pattern: /丁度/g, suggestion: 'ちょうど' },
    { pattern: /ご覧/g, suggestion: '閲覧' },
    { pattern: /出来る/g, suggestion: 'できる' },
    { pattern: /故/g, suggestion: 'ゆえ' },
    { pattern: /迄/g, suggestion: 'まで' },
    { pattern: /より/g, suggestion: 'から' },
    { pattern: /従って/g, suggestion: 'したがって' },
    { pattern: /且つ/g, suggestion: 'かつ' },
    { pattern: /及び/g, suggestion: 'および' },
    { pattern: /或いは/g, suggestion: 'あるいは' },
    { pattern: /又は/g, suggestion: 'または' },
    { pattern: /尚/g, suggestion: 'なお' },
    { pattern: /勿論/g, suggestion: 'もちろん' }
  ];
  
  // 重複語のパターン
  const duplicatePatterns = [
    { pattern: /する事が出来る/g, suggestion: 'できる' },
    { pattern: /する事ができる/g, suggestion: 'できる' },
    { pattern: /すること出来る/g, suggestion: 'できる' },
    { pattern: /することができる/g, suggestion: 'できる' },
    { pattern: /する事が可能/g, suggestion: 'できる' },
    { pattern: /することが可能/g, suggestion: 'できる' },
    { pattern: /大きく拡大/g, suggestion: '拡大' },
    { pattern: /小さく縮小/g, suggestion: '縮小' },
    { pattern: /全て全部/g, suggestion: 'すべて' },
    { pattern: /完全に全部/g, suggestion: '完全に' },
    { pattern: /完全に全て/g, suggestion: '完全に' }
  ];
  
  // 誤字脱字のパターン
  const typoPatterns = [
    { pattern: /おすすすめ/g, suggestion: 'おすすめ' },
    { pattern: /こんにんは/g, suggestion: 'こんにちは' },
    { pattern: /ありがとうごさいます/g, suggestion: 'ありがとうございます' },
    { pattern: /わたし/g, suggestion: 'わたし' }, // 平仮名チェック例
    { pattern: /御願いします/g, suggestion: 'お願いします' }
  ];
  
  // 全パターンをマージ
  const allPatterns = [...variationPatterns, ...duplicatePatterns, ...typoPatterns];
  
  // 検出結果
  const results = [];
  
  // 各パターンでチェック
  allPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.pattern.exec(docText)) !== null) {
      results.push({
        position: match.index,
        original: match[0],
        suggestion: pattern.suggestion
      });
    }
  });
  
  // 結果の表示
  if (results.length === 0) {
    alert('表記ゆれや誤字は見つかりませんでした。');
  } else {
    // 結果ダイアログを作成
    const dialogHTML = `
      <div class="proofreading-dialog">
        <h3>校正結果: ${results.length}件の表記ゆれ</h3>
        <div class="proofreading-results">
          ${results.map((result, index) => `
            <div class="proofreading-item">
              <div class="proofreading-original">${result.original}</div>
              <div class="proofreading-arrow">→</div>
              <div class="proofreading-suggestion">${result.suggestion}</div>
              <button class="replace-btn" data-index="${index}">置換</button>
            </div>
          `).join('')}
        </div>
        <div class="proofreading-actions">
          <button class="replace-all-btn">すべて置換</button>
          <button class="close-btn">閉じる</button>
        </div>
      </div>
    `;
    
    // ダイアログを表示
    const dialogElement = document.createElement('div');
    dialogElement.className = 'modal-overlay';
    dialogElement.innerHTML = dialogHTML;
    document.body.appendChild(dialogElement);
    
    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .proofreading-dialog {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        padding: 20px;
        width: 80%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .proofreading-results {
        margin: 15px 0;
        max-height: 50vh;
        overflow-y: auto;
      }
      .proofreading-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid #eee;
      }
      .proofreading-original {
        color: #d32f2f;
        text-decoration: line-through;
        margin-right: 10px;
        flex: 1;
      }
      .proofreading-arrow {
        margin: 0 10px;
        color: #666;
      }
      .proofreading-suggestion {
        color: #388e3c;
        margin-right: 10px;
        flex: 1;
      }
      .proofreading-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .proofreading-actions button {
        margin-left: 10px;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .replace-btn {
        background-color: #2196f3;
        color: white;
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .replace-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .replace-all-btn {
        background-color: #388e3c;
        color: white;
      }
      .close-btn {
        background-color: #f5f5f5;
        color: #333;
      }
    `;
    document.head.appendChild(style);
    
    // 個別置換ボタン
    dialogElement.querySelectorAll('.replace-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const result = results[index];
        
        // 文書内の該当箇所を置換
        const range = findTextInDocument(result.original);
        if (range) {
          range.deleteContents();
          range.insertNode(document.createTextNode(result.suggestion));
          
          // 変更を履歴に追加
          documentState.isModified = true;
          saveDocumentState();
          updateDocumentStatus();
          
          // 置換済みの項目を無効化
          btn.disabled = true;
          btn.textContent = '置換済み';
        }
      });
    });
    
    // すべて置換ボタン
    dialogElement.querySelector('.replace-all-btn').addEventListener('click', () => {
      let replacedCount = 0;
      
      // 置換未済みの項目を処理
      dialogElement.querySelectorAll('.replace-btn:not([disabled])').forEach(btn => {
        btn.click();
        replacedCount++;
      });
      
      alert(`${replacedCount}件の表記ゆれを置換しました。`);
    });
    
    // 閉じるボタン
    dialogElement.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(dialogElement);
      document.head.removeChild(style);
    });
    
    // モーダル背景のクリックで閉じる
    dialogElement.addEventListener('click', (e) => {
      if (e.target === dialogElement) {
        document.body.removeChild(dialogElement);
        document.head.removeChild(style);
      }
    });
  }
}

/**
 * 文書内でテキストを検索
 * @param {string} searchText - 検索するテキスト
 * @returns {Range|null} - 検索結果のRange、見つからない場合はnull
 */
function findTextInDocument(searchText) {
  // 現在選択範囲を保存
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const savedSelection = selection.getRangeAt(0).cloneRange();
  }
  
  // 文書内検索（簡易版）
  const text = documentEditor.innerHTML;
  const index = text.indexOf(searchText);
  
  if (index === -1) return null;
  
  // テキストノードを走査して該当箇所を見つける
  const nodeIterator = document.createNodeIterator(documentEditor, NodeFilter.SHOW_TEXT);
  let currentNode;
  let currentOffset = 0;
  
  // 各テキストノードを調べる
  while (currentNode = nodeIterator.nextNode()) {
    const nodeText = currentNode.nodeValue;
    const nodeTextIndex = nodeText.indexOf(searchText);
    
    // このノードに検索テキストが含まれていれば
    if (nodeTextIndex !== -1) {
      const range = document.createRange();
      range.setStart(currentNode, nodeTextIndex);
      range.setEnd(currentNode, nodeTextIndex + searchText.length);
      return range;
    }
  }
  
  return null;
}
