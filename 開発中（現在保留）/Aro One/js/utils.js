/**
 * Aro One ユーティリティ関数
 */

// ローカルストレージ関連
const STORAGE_PREFIX = 'aro_one_';

/**
 * ローカルストレージにデータを保存
 * @param {string} key - キー
 * @param {any} data - 保存するデータ
 */
function saveToStorage(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedData);
    return true;
  } catch (error) {
    console.error('ストレージへの保存に失敗しました:', error);
    return false;
  }
}

/**
 * ローカルストレージからデータを取得
 * @param {string} key - キー
 * @param {any} defaultValue - デフォルト値
 * @returns {any} 取得したデータ
 */
function getFromStorage(key, defaultValue = null) {
  try {
    const serializedData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('ストレージからの取得に失敗しました:', error);
    return defaultValue;
  }
}

/**
 * ローカルストレージからデータを削除
 * @param {string} key - キー
 */
function removeFromStorage(key) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error('ストレージからの削除に失敗しました:', error);
    return false;
  }
}

/**
 * 要素の表示/非表示を切り替える
 * @param {HTMLElement} element - 対象要素
 * @param {boolean} show - 表示するかどうか
 */
function toggleElementVisibility(element, show) {
  if (show) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

/**
 * 要素のクラスを切り替える
 * @param {HTMLElement} element - 対象要素
 * @param {string} className - クラス名
 * @param {boolean} add - 追加するかどうか
 */
function toggleClass(element, className, add) {
  if (add) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * 要素の位置を取得
 * @param {HTMLElement} element - 対象要素
 * @returns {Object} 位置情報
 */
function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

/**
 * ドロップダウンメニューを表示
 * @param {string} menuId - メニューID
 * @param {number} x - X座標
 * @param {number} y - Y座標
 */
function showDropdownMenu(menuId, x, y) {
  // すべてのドロップダウンメニューを非表示にする
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('visible');
  });
  
  const menu = document.getElementById(menuId);
  if (!menu) return;
  
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.classList.add('visible');
  
  // メニュー外クリックで閉じる
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove('visible');
      document.removeEventListener('click', closeMenu);
    }
  };
  
  // 少し遅延させてイベントリスナーを追加（即時クリックを防ぐため）
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 10);
}

/**
 * ファイルをダウンロード
 * @param {string} filename - ファイル名
 * @param {string} content - ファイルの内容
 * @param {string} type - MIMEタイプ
 */
function downloadFile(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * ファイルを読み込む
 * @param {File} file - ファイル
 * @returns {Promise<string>} ファイルの内容
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * 現在の日時を取得
 * @returns {string} フォーマットされた日時
 */
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 要素の子要素をすべて削除
 * @param {HTMLElement} element - 対象要素
 */
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * テキストをクリップボードにコピー
 * @param {string} text - コピーするテキスト
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('クリップボードへのコピーに失敗しました:', error);
    return false;
  }
}

/**
 * 要素の外側クリックを検出するイベントリスナーを追加
 * @param {HTMLElement} element - 対象要素
 * @param {Function} callback - コールバック関数
 * @returns {Function} イベントリスナーを削除する関数
 */
function addOutsideClickListener(element, callback) {
  const listener = (event) => {
    if (!element.contains(event.target)) {
      callback(event);
    }
  };
  
  document.addEventListener('click', listener);
  
  // クリーンアップ関数を返す
  return () => {
    document.removeEventListener('click', listener);
  };
}

/**
 * 要素をドラッグ可能にする
 * @param {HTMLElement} element - ドラッグする要素
 * @param {HTMLElement} handle - ドラッグハンドル（省略可）
 */
function makeDraggable(element, handle = null) {
  const dragHandle = handle || element;
  let offsetX = 0;
  let offsetY = 0;
  
  dragHandle.style.cursor = 'move';
  
  dragHandle.addEventListener('mousedown', startDrag);
  
  function startDrag(e) {
    e.preventDefault();
    
    // 要素内でのクリック位置
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    // グローバルイベントリスナーを追加
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  }
  
  function drag(e) {
    e.preventDefault();
    
    // 新しい位置を計算
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // 要素を移動
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }
  
  function stopDrag() {
    // イベントリスナーを削除
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }
}
