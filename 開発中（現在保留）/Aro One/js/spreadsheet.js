/**
 * Aro One 表計算機能
 */

// 表計算の状態
const spreadsheetState = {
  currentSpreadsheet: null,
  isModified: false,
  data: {},
  selectedCell: null,
  selectedRange: null,
  clipboard: null,
  rowCount: 20,
  columnCount: 8
};

// DOM要素
let spreadsheetContainer;
let spreadsheetBody;

/**
 * 表計算機能の初期化
 */
function initSpreadsheet() {
  spreadsheetContainer = document.querySelector('.spreadsheet-container');
  spreadsheetBody = document.querySelector('.spreadsheet-body');
  
  if (!spreadsheetContainer || !spreadsheetBody) return;
  
  // 初期グリッドの生成
  generateSpreadsheetGrid();
  
  // イベントリスナーの設定
  setupSpreadsheetEventListeners();
}

/**
 * 表計算のグリッドを生成
 */
function generateSpreadsheetGrid() {
  clearElement(spreadsheetBody);
  
  // 行の生成
  for (let i = 1; i <= spreadsheetState.rowCount; i++) {
    const row = document.createElement('div');
    row.className = 'spreadsheet-row';
    
    // 行ヘッダー
    const rowHeader = document.createElement('div');
    rowHeader.className = 'cell row-header';
    rowHeader.textContent = i;
    row.appendChild(rowHeader);
    
    // セルの生成
    for (let j = 0; j < spreadsheetState.columnCount; j++) {
      const cellId = `${String.fromCharCode(65 + j)}${i}`;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.cellId = cellId;
      
      // セルにデータがあれば表示
      if (spreadsheetState.data[cellId]) {
        cell.textContent = spreadsheetState.data[cellId].displayValue || '';
        
        // セルの書式を適用
        if (spreadsheetState.data[cellId].format) {
          applyCellFormat(cell, spreadsheetState.data[cellId].format);
        }
      }
      
      row.appendChild(cell);
    }
    
    spreadsheetBody.appendChild(row);
  }
}

/**
 * セルの書式を適用
 * @param {HTMLElement} cell - セル要素
 * @param {Object} format - 書式設定
 */
function applyCellFormat(cell, format) {
  if (!format) return;
  
  if (format.bold) cell.classList.add('bold');
  if (format.italic) cell.classList.add('italic');
  if (format.underline) cell.classList.add('underline');
  
  if (format.align) {
    cell.style.textAlign = format.align;
  }
  
  if (format.type) {
    cell.classList.add(format.type);
  }
  
  if (format.backgroundColor) {
    cell.style.backgroundColor = format.backgroundColor;
  }
  
  if (format.textColor) {
    cell.style.color = format.textColor;
  }
}

/**
 * 表計算のイベントリスナーを設定
 */
function setupSpreadsheetEventListeners() {
  // セルクリックイベント
  spreadsheetBody.addEventListener('click', handleCellClick);
  
  // セルダブルクリックイベント
  spreadsheetBody.addEventListener('dblclick', handleCellDblClick);
  
  // キーボードイベント
  spreadsheetContainer.addEventListener('keydown', handleSpreadsheetKeydown);
}

/**
 * セルクリックの処理
 * @param {MouseEvent} e - マウスイベント
 */
function handleCellClick(e) {
  const cell = e.target.closest('.cell');
  if (!cell || cell.classList.contains('row-header')) return;
  
  // 前に選択されていたセルの選択を解除
  const previouslySelected = spreadsheetBody.querySelector('.cell.selected');
  if (previouslySelected) {
    previouslySelected.classList.remove('selected');
  }
  
  // 新しいセルを選択
  cell.classList.add('selected');
  spreadsheetState.selectedCell = cell.dataset.cellId;
  
  // 選択範囲をリセット
  spreadsheetState.selectedRange = null;
  
  // ステータスバーを更新
  updateSpreadsheetStatus();
}

/**
 * セルダブルクリックの処理
 * @param {MouseEvent} e - マウスイベント
 */
function handleCellDblClick(e) {
  const cell = e.target.closest('.cell');
  if (!cell || cell.classList.contains('row-header')) return;
  
  // セルを編集モードにする
  startCellEditing(cell);
}

/**
 * セル編集の開始
 * @param {HTMLElement} cell - セル要素
 */
function startCellEditing(cell) {
  const cellId = cell.dataset.cellId;
  const cellData = spreadsheetState.data[cellId] || {};
  
  // 入力フィールドを作成
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cell-input';
  input.value = cellData.formula || cellData.value || '';
  
  // 既存の内容をクリア
  cell.textContent = '';
  cell.classList.add('editing');
  
  // 入力フィールドを追加
  cell.appendChild(input);
  
  // フォーカスを設定
  input.focus();
  input.select();
  
  // 入力完了イベント
  input.addEventListener('blur', () => finishCellEditing(cell, input));
  
  // Enterキーで編集完了
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishCellEditing(cell, input);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cell.textContent = cellData.displayValue || '';
      cell.classList.remove('editing');
    }
  });
}

/**
 * セル編集の完了
 * @param {HTMLElement} cell - セル要素
 * @param {HTMLInputElement} input - 入力フィールド
 */
function finishCellEditing(cell, input) {
  const cellId = cell.dataset.cellId;
  const value = input.value.trim();
  
  // 編集モードを解除
  cell.classList.remove('editing');
  
  // 数式かどうかを判定
  const isFormula = value.startsWith('=');
  
  if (isFormula) {
    // 数式の場合
    const formula = value;
    const calculatedValue = evaluateFormula(formula.substring(1), cellId);
    
    spreadsheetState.data[cellId] = {
      formula: formula,
      value: calculatedValue,
      displayValue: calculatedValue
    };
    
    cell.textContent = calculatedValue;
  } else if (value === '') {
    // 空の場合
    delete spreadsheetState.data[cellId];
    cell.textContent = '';
  } else {
    // 通常の値の場合
    spreadsheetState.data[cellId] = {
      value: value,
      displayValue: value
    };
    
    cell.textContent = value;
  }
  
  // 変更フラグを設定
  spreadsheetState.isModified = true;
  
  // 依存するセルを更新
  updateDependentCells(cellId);
  
  // ステータスバーを更新
  updateSpreadsheetStatus();
}

/**
 * 数式を評価
 * @param {string} formula - 数式
 * @param {string} currentCellId - 現在のセルID
 * @returns {string} 計算結果
 */
function evaluateFormula(formula, currentCellId) {
  try {
    // セル参照を置換
    const cellReferenceRegex = /[A-Z]+[0-9]+/g;
    const evaluableFormula = formula.replace(cellReferenceRegex, (match) => {
      // 循環参照チェック
      if (match === currentCellId) {
        throw new Error('循環参照が検出されました');
      }
      
      // セルの値を取得
      const cellData = spreadsheetState.data[match];
      if (!cellData) return '0';
      
      return cellData.value || '0';
    });
    
    // 安全な数式評価
    const result = Function('"use strict"; return (' + evaluableFormula + ')')();
    return isNaN(result) ? '#ERROR' : result.toString();
  } catch (error) {
    console.error('数式の評価エラー:', error);
    return '#ERROR';
  }
}

/**
 * 依存するセルを更新
 * @param {string} changedCellId - 変更されたセルID
 */
function updateDependentCells(changedCellId) {
  // すべてのセルをチェック
  for (const cellId in spreadsheetState.data) {
    const cellData = spreadsheetState.data[cellId];
    
    // 数式を持つセルのみ処理
    if (cellData.formula && cellData.formula.includes(changedCellId)) {
      // 数式を再評価
      const calculatedValue = evaluateFormula(cellData.formula.substring(1), cellId);
      
      // 値を更新
      cellData.value = calculatedValue;
      cellData.displayValue = calculatedValue;
      
      // セル表示を更新
      const cell = spreadsheetBody.querySelector(`.cell[data-cell-id="${cellId}"]`);
      if (cell) {
        cell.textContent = calculatedValue;
      }
      
      // 再帰的に依存セルを更新
      updateDependentCells(cellId);
    }
  }
}

/**
 * 表計算のキーボード操作を処理
 * @param {KeyboardEvent} e - キーボードイベント
 */
function handleSpreadsheetKeydown(e) {
  if (!spreadsheetState.selectedCell) return;
  
  const currentCell = spreadsheetBody.querySelector(`.cell[data-cell-id="${spreadsheetState.selectedCell}"]`);
  if (!currentCell) return;
  
  // 編集中は処理しない
  if (currentCell.classList.contains('editing')) return;
  
  // 矢印キーでのナビゲーション
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    navigateCell(e.key);
  }
  
  // Enterキーで編集開始
  if (e.key === 'Enter') {
    e.preventDefault();
    startCellEditing(currentCell);
  }
  
  // Deleteキーでセルをクリア
  if (e.key === 'Delete') {
    e.preventDefault();
    clearSelectedCells();
  }
  
  // Ctrl+C: コピー
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    copySelectedCells();
  }
  
  // Ctrl+X: 切り取り
  if (e.ctrlKey && e.key === 'x') {
    e.preventDefault();
    cutSelectedCells();
  }
  
  // Ctrl+V: 貼り付け
  if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    pasteToSelectedCell();
  }
  
  // 文字入力で編集開始
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    startCellEditing(currentCell);
    // 最初の文字を入力
    const input = currentCell.querySelector('.cell-input');
    if (input) {
      input.value = e.key;
      input.setSelectionRange(1, 1);
    }
  }
}

/**
 * セル間のナビゲーション
 * @param {string} direction - 方向
 */
function navigateCell(direction) {
  if (!spreadsheetState.selectedCell) return;
  
  const [col, row] = [
    spreadsheetState.selectedCell.charAt(0),
    parseInt(spreadsheetState.selectedCell.substring(1))
  ];
  
  const colIndex = col.charCodeAt(0) - 65; // A=0, B=1, ...
  
  let newCol, newRow;
  
  switch (direction) {
    case 'ArrowUp':
      newCol = col;
      newRow = Math.max(1, row - 1);
      break;
    case 'ArrowDown':
      newCol = col;
      newRow = Math.min(spreadsheetState.rowCount, row + 1);
      break;
    case 'ArrowLeft':
      newCol = String.fromCharCode(Math.max(65, col.charCodeAt(0) - 1));
      newRow = row;
      break;
    case 'ArrowRight':
      newCol = String.fromCharCode(Math.min(65 + spreadsheetState.columnCount - 1, col.charCodeAt(0) + 1));
      newRow = row;
      break;
  }
  
  const newCellId = `${newCol}${newRow}`;
  const newCell = spreadsheetBody.querySelector(`.cell[data-cell-id="${newCellId}"]`);
  
  if (newCell) {
    // 前のセルの選択を解除
    const currentCell = spreadsheetBody.querySelector(`.cell[data-cell-id="${spreadsheetState.selectedCell}"]`);
    if (currentCell) {
      currentCell.classList.remove('selected');
    }
    
    // 新しいセルを選択
    newCell.classList.add('selected');
    spreadsheetState.selectedCell = newCellId;
    
    // スクロール位置を調整
    newCell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    
    // ステータスバーを更新
    updateSpreadsheetStatus();
  }
}

/**
 * 選択されたセルをクリア
 */
function clearSelectedCells() {
  if (!spreadsheetState.selectedCell) return;
  
  const cellId = spreadsheetState.selectedCell;
  delete spreadsheetState.data[cellId];
  
  const cell = spreadsheetBody.querySelector(`.cell[data-cell-id="${cellId}"]`);
  if (cell) {
    cell.textContent = '';
    cell.className = 'cell selected'; // 書式もリセット
  }
  
  // 変更フラグを設定
  spreadsheetState.isModified = true;
  
  // 依存するセルを更新
  updateDependentCells(cellId);
  
  // ステータスバーを更新
  updateSpreadsheetStatus();
}

/**
 * 選択されたセルをコピー
 */
function copySelectedCells() {
  if (!spreadsheetState.selectedCell) return;
  
  const cellId = spreadsheetState.selectedCell;
  const cellData = spreadsheetState.data[cellId];
  
  if (cellData) {
    spreadsheetState.clipboard = {
      type: 'cell',
      data: JSON.parse(JSON.stringify(cellData))
    };
  } else {
    spreadsheetState.clipboard = {
      type: 'cell',
      data: null
    };
  }
  
  // ステータスバーを更新
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = 'セルをコピーしました';
    setTimeout(() => {
      updateSpreadsheetStatus();
    }, 2000);
  }
}

/**
 * 選択されたセルを切り取り
 */
function cutSelectedCells() {
  if (!spreadsheetState.selectedCell) return;
  
  // コピー
  copySelectedCells();
  
  // クリア
  clearSelectedCells();
  
  // ステータスバーを更新
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = 'セルを切り取りました';
    setTimeout(() => {
      updateSpreadsheetStatus();
    }, 2000);
  }
}

/**
 * 選択されたセルに貼り付け
 */
function pasteToSelectedCell() {
  if (!spreadsheetState.selectedCell || !spreadsheetState.clipboard) return;
  
  const cellId = spreadsheetState.selectedCell;
  const clipboard = spreadsheetState.clipboard;
  
  if (clipboard.type === 'cell' && clipboard.data) {
    spreadsheetState.data[cellId] = JSON.parse(JSON.stringify(clipboard.data));
    
    const cell = spreadsheetBody.querySelector(`.cell[data-cell-id="${cellId}"]`);
    if (cell) {
      cell.textContent = clipboard.data.displayValue || '';
      
      // セルの書式を適用
      cell.className = 'cell selected';
      if (clipboard.data.format) {
        applyCellFormat(cell, clipboard.data.format);
      }
    }
    
    // 変更フラグを設定
    spreadsheetState.isModified = true;
    
    // 依存するセルを更新
    updateDependentCells(cellId);
    
    // ステータスバーを更新
    const statusText = document.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = 'セルを貼り付けました';
      setTimeout(() => {
        updateSpreadsheetStatus();
      }, 2000);
    }
  }
}

/**
 * 表計算の状態表示を更新
 */
function updateSpreadsheetStatus() {
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    if (spreadsheetState.selectedCell) {
      statusText.textContent = `セル ${spreadsheetState.selectedCell} を選択中`;
    } else {
      statusText.textContent = spreadsheetState.isModified ? '未保存の変更があります' : '保存済み';
    }
  }
}

/**
 * 新規表計算を作成
 */
function createNewSpreadsheet() {
  if (spreadsheetState.isModified) {
    const confirmSave = confirm('変更が保存されていません。保存しますか？');
    if (confirmSave) {
      saveSpreadsheet();
    }
  }
  
  spreadsheetState.currentSpreadsheet = null;
  spreadsheetState.isModified = false;
  spreadsheetState.data = {};
  spreadsheetState.selectedCell = null;
  
  // グリッドを再生成
  generateSpreadsheetGrid();
  
  // ステータスバーを更新
  updateSpreadsheetStatus();
}

/**
 * 表計算を保存
 */
function saveSpreadsheet() {
  const timestamp = getCurrentDateTime();
  
  const spreadsheetData = {
    title: spreadsheetState.currentSpreadsheet?.title || '無題の表計算',
    data: spreadsheetState.data,
    rowCount: spreadsheetState.rowCount,
    columnCount: spreadsheetState.columnCount,
    lastModified: timestamp,
    type: 'spreadsheet'
  };
  
  if (spreadsheetState.currentSpreadsheet) {
    // 既存表計算の更新
    spreadsheetData.id = spreadsheetState.currentSpreadsheet.id;
    saveToStorage(`spreadsheet_${spreadsheetData.id}`, spreadsheetData);
  } else {
    // 新規表計算の保存
    const id = Date.now().toString();
    spreadsheetData.id = id;
    spreadsheetState.currentSpreadsheet = spreadsheetData;
    saveToStorage(`spreadsheet_${id}`, spreadsheetData);
    
    // 表計算リストに追加
    const spreadsheets = getFromStorage('spreadsheets', []);
    spreadsheets.push({
      id: id,
      title: spreadsheetData.title,
      lastModified: timestamp,
      type: 'spreadsheet'
    });
    saveToStorage('spreadsheets', spreadsheets);
  }
  
  spreadsheetState.isModified = false;
  
  // 成功メッセージ
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = '表計算を保存しました';
    setTimeout(() => {
      statusText.textContent = '保存済み';
    }, 2000);
  }
}

/**
 * 表計算を読み込む
 * @param {string} id - 表計算ID
 */
function loadSpreadsheet(id) {
  const spreadsheetData = getFromStorage(`spreadsheet_${id}`);
  if (!spreadsheetData) {
    alert('表計算の読み込みに失敗しました');
    return;
  }
  
  spreadsheetState.currentSpreadsheet = spreadsheetData;
  spreadsheetState.data = spreadsheetData.data || {};
  spreadsheetState.rowCount = spreadsheetData.rowCount || 20;
  spreadsheetState.columnCount = spreadsheetData.columnCount || 8;
  spreadsheetState.isModified = false;
  spreadsheetState.selectedCell = null;
  
  // グリッドを再生成
  generateSpreadsheetGrid();
  
  // ステータスバーを更新
  updateSpreadsheetStatus();
}

/**
 * 表計算をCSVとしてエクスポート
 */
function exportSpreadsheetAsCSV() {
  let csv = '';
  
  // ヘッダー行
  let headerRow = ',';
  for (let j = 0; j < spreadsheetState.columnCount; j++) {
    headerRow += String.fromCharCode(65 + j) + ',';
  }
  csv += headerRow.slice(0, -1) + '\n';
  
  // データ行
  for (let i = 1; i <= spreadsheetState.rowCount; i++) {
    let row = i + ',';
    
    for (let j = 0; j < spreadsheetState.columnCount; j++) {
      const cellId = `${String.fromCharCode(65 + j)}${i}`;
      const cellData = spreadsheetState.data[cellId];
      
      if (cellData) {
        // CSVエスケープ処理
        let cellValue = cellData.displayValue || '';
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
        }
        row += cellValue;
      }
      
      row += ',';
    }
    
    csv += row.slice(0, -1) + '\n';
  }
  
  const title = spreadsheetState.currentSpreadsheet?.title || '無題の表計算';
  downloadFile(`${title}.csv`, csv, 'text/csv');
}

/**
 * セルの書式を設定
 * @param {string} formatType - 書式タイプ
 * @param {any} value - 設定値
 */
function setCellFormat(formatType, value) {
  if (!spreadsheetState.selectedCell) return;
  
  const cellId = spreadsheetState.selectedCell;
  const cell = spreadsheetBody.querySelector(`.cell[data-cell-id="${cellId}"]`);
  if (!cell) return;
  
  // セルデータがなければ作成
  if (!spreadsheetState.data[cellId]) {
    spreadsheetState.data[cellId] = {
      value: '',
      displayValue: ''
    };
  }
  
  // 書式設定がなければ作成
  if (!spreadsheetState.data[cellId].format) {
    spreadsheetState.data[cellId].format = {};
  }
  
  // 書式を設定
  switch (formatType) {
    case 'bold':
      spreadsheetState.data[cellId].format.bold = value;
      toggleClass(cell, 'bold', value);
      break;
    case 'italic':
      spreadsheetState.data[cellId].format.italic = value;
      toggleClass(cell, 'italic', value);
      break;
    case 'underline':
      spreadsheetState.data[cellId].format.underline = value;
      toggleClass(cell, 'underline', value);
      break;
    case 'align':
      spreadsheetState.data[cellId].format.align = value;
      cell.style.textAlign = value;
      break;
    case 'type':
      spreadsheetState.data[cellId].format.type = value;
      cell.className = 'cell selected';
      cell.classList.add(value);
      break;
    case 'backgroundColor':
      spreadsheetState.data[cellId].format.backgroundColor = value;
      cell.style.backgroundColor = value;
      break;
    case 'textColor':
      spreadsheetState.data[cellId].format.textColor = value;
      cell.style.color = value;
      break;
  }
  
  // 変更フラグを設定
  spreadsheetState.isModified = true;
}

/**
 * CSVファイルをインポート
 */
function importCSV() {
  // ファイル選択ダイアログを作成
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // ステータスを更新
    const statusText = document.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = 'CSVファイルを読み込み中...';
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      parseCSVToSpreadsheet(csv);
      
      if (statusText) {
        statusText.textContent = 'CSVファイルをインポートしました';
        setTimeout(() => {
          updateSpreadsheetStatus();
        }, 2000);
      }
    };
    
    reader.onerror = () => {
      alert('CSVファイルの読み込みに失敗しました');
      if (statusText) {
        statusText.textContent = 'CSVインポートに失敗しました';
        setTimeout(() => {
          updateSpreadsheetStatus();
        }, 2000);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

/**
 * CSVデータを解析して表計算に反映
 * @param {string} csv - CSVデータ
 */
function parseCSVToSpreadsheet(csv) {
  if (!csv) return;
  
  // 現在のデータをクリア（新規シートとして扱う）
  if (confirm('現在のデータは上書きされます。続行しますか？')) {
    spreadsheetState.data = {};
  } else {
    return;
  }
  
  // 改行で分割して行に変換
  const rows = csv.split(/\r\n|\n|\r/);
  if (rows.length === 0) return;
  
  // 必要に応じて行数を更新
  const requiredRows = Math.min(rows.length, 100);  // 最大100行まで
  if (requiredRows > spreadsheetState.rowCount) {
    spreadsheetState.rowCount = requiredRows;
  }
  
  for (let i = 0; i < requiredRows; i++) {
    const rowIndex = i + 1; // 1-based index for cells
    
    // 行をCSVパースして配列に変換
    // 簡易的なCSVパース（カンマ区切り、ダブルクォート内のカンマは考慮する）
    const values = parseCSVRow(rows[i]);
    
    // 必要に応じて列数を更新
    const requiredCols = Math.min(values.length, 26); // 最大26列（A-Z）まで
    if (requiredCols > spreadsheetState.columnCount) {
      spreadsheetState.columnCount = requiredCols;
    }
    
    // セルにデータを設定
    for (let j = 0; j < requiredCols; j++) {
      const cellId = `${String.fromCharCode(65 + j)}${rowIndex}`;
      const value = values[j] ? values[j].trim() : '';
      
      // 数値に変換可能か確認
      const numericValue = parseFloat(value);
      const isNumeric = !isNaN(numericValue) && isFinite(numericValue) && /^-?\d*\.?\d+$/.test(value);
      
      spreadsheetState.data[cellId] = {
        value: isNumeric ? numericValue : value,
        displayValue: value,
        type: isNumeric ? 'number' : 'text'
      };
    }
  }
  
  // 表計算グリッドを再生成
  generateSpreadsheetGrid();
  
  // 変更フラグを設定
  spreadsheetState.isModified = true;
  updateSpreadsheetStatus();
}

/**
 * CSV行を適切に解析する（ダブルクォートを考慮）
 * @param {string} row - CSV行
 * @returns {string[]} 解析された値の配列
 */
function parseCSVRow(row) {
  const result = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      // ダブルクォート内の場合は閉じ、それ以外では開く
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // カンマがあり、かつダブルクォート内でない場合は値を区切る
      result.push(currentValue);
      currentValue = '';
    } else {
      // それ以外の文字は現在の値に追加
      currentValue += char;
    }
  }
  
  // 最後の値を追加
  result.push(currentValue);
  
  return result;
}
