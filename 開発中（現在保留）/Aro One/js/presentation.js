/**
 * Aro One プレゼンテーション機能
 */

// プレゼンテーションの状態
const presentationState = {
  currentPresentation: null,
  isModified: false,
  slides: [
    {
      id: 'slide-1',
      content: '<h1>新規プレゼンテーション</h1><p>ここにコンテンツを追加してください</p>',
      notes: ''
    }
  ],
  currentSlideIndex: 0,
  presentationMode: false
};

// DOM要素
let slidesPanel;
let slideEditor;
let slideContent;

/**
 * プレゼンテーション機能の初期化
 */
function initPresentation() {
  slidesPanel = document.querySelector('.slides-panel');
  slideEditor = document.querySelector('.slide-editor');
  slideContent = document.querySelector('.slide-content');

  if (!slidesPanel || !slideEditor || !slideContent) return;

  // スライドサムネイルの生成
  generateSlideThumbnails();

  // イベントリスナーの設定
  setupPresentationEventListeners();
  
  // プレゼンテーションツールバーのイベント設定
  setupPresentationToolbar();
}

/**
 * スライドサムネイルを生成
 */
function generateSlideThumbnails() {
  // 「+ スライド追加」ボタン以外のサムネイルを削除
  const addSlideBtn = slidesPanel.querySelector('.add-slide-btn');
  clearElement(slidesPanel);

  // スライドサムネイルを生成
  presentationState.slides.forEach((slide, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'slide-thumbnail';
    thumbnail.dataset.slideId = slide.id;

    if (index === presentationState.currentSlideIndex) {
      thumbnail.classList.add('active');
    }

    const thumbnailContent = document.createElement('div');
    thumbnailContent.className = 'thumbnail-content';
    thumbnailContent.innerHTML = slide.content;

    thumbnail.appendChild(thumbnailContent);
    slidesPanel.appendChild(thumbnail);
  });

  // 「+ スライド追加」ボタンを再追加
  if (addSlideBtn) {
    slidesPanel.appendChild(addSlideBtn);
  } else {
    const newAddSlideBtn = document.createElement('button');
    newAddSlideBtn.className = 'add-slide-btn';
    newAddSlideBtn.textContent = '+ スライド追加';
    newAddSlideBtn.addEventListener('click', addNewSlide);
    slidesPanel.appendChild(newAddSlideBtn);
  }
}

/**
 * プレゼンテーションのイベントリスナーを設定
 */
function setupPresentationEventListeners() {
  // スライドサムネイルのクリックイベント
  slidesPanel.addEventListener('click', (e) => {
    const thumbnail = e.target.closest('.slide-thumbnail');
    if (!thumbnail) return;

    const slideId = thumbnail.dataset.slideId;
    const slideIndex = presentationState.slides.findIndex(slide => slide.id === slideId);

    if (slideIndex !== -1) {
      switchToSlide(slideIndex);
    }
  });

  // スライド内容の変更イベント
  slideContent.addEventListener('input', () => {
    // 現在のスライドの内容を更新
    const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
    if (currentSlide) {
      currentSlide.content = slideContent.innerHTML;

      // サムネイルも更新
      const thumbnail = slidesPanel.querySelector(`.slide-thumbnail[data-slide-id="${currentSlide.id}"] .thumbnail-content`);
      if (thumbnail) {
        thumbnail.innerHTML = currentSlide.content;
      }

      // 変更フラグを設定
      presentationState.isModified = true;

      // ステータスバーを更新
      updatePresentationStatus();
    }
  });

  // 「+ スライド追加」ボタンのクリックイベント
  const addSlideBtn = slidesPanel.querySelector('.add-slide-btn');
  if (addSlideBtn) {
    addSlideBtn.addEventListener('click', addNewSlide);
  }

  // キーボードショートカット
  // プレゼンテーションモードの場合のみ処理するので、イベントリスナーはプレゼンテーションモード開始時に設定
}

/**
 * プレゼンテーションのキーボードショートカットを処理
 * @param {KeyboardEvent} e - キーボードイベント
 */
function handlePresentationKeydown(e) {
  // プレゼンテーションモードでのみ処理
  if (presentationState.presentationMode) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      previousSlide();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitPresentationMode();
    }
  }
}

/**
 * 指定したスライドに切り替え
 * @param {number} slideIndex - スライドインデックス
 */
function switchToSlide(slideIndex) {
  if (slideIndex < 0 || slideIndex >= presentationState.slides.length) return;

  // 現在のスライドの選択を解除
  const currentThumbnail = slidesPanel.querySelector('.slide-thumbnail.active');
  if (currentThumbnail) {
    currentThumbnail.classList.remove('active');
  }

  // 新しいスライドを選択
  presentationState.currentSlideIndex = slideIndex;
  const newThumbnail = slidesPanel.querySelector(`.slide-thumbnail[data-slide-id="${presentationState.slides[slideIndex].id}"]`);
  if (newThumbnail) {
    newThumbnail.classList.add('active');

    // スクロール位置を調整
    newThumbnail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // スライド内容を更新
  slideContent.innerHTML = presentationState.slides[slideIndex].content;

  // ステータスバーを更新
  updatePresentationStatus();
}

/**
 * 次のスライドに移動
 */
function nextSlide() {
  if (presentationState.currentSlideIndex < presentationState.slides.length - 1) {
    switchToSlide(presentationState.currentSlideIndex + 1);
  }
}

/**
 * 前のスライドに移動
 */
function previousSlide() {
  if (presentationState.currentSlideIndex > 0) {
    switchToSlide(presentationState.currentSlideIndex - 1);
  }
}

/**
 * 新しいスライドを追加
 */
function addNewSlide() {
  const newSlideId = `slide-${Date.now()}`;
  const newSlide = {
    id: newSlideId,
    content: '<h1>新しいスライド</h1><p>ここにコンテンツを追加してください</p>',
    notes: ''
  };

  // 現在のスライドの次に挿入
  presentationState.slides.splice(presentationState.currentSlideIndex + 1, 0, newSlide);

  // サムネイルを再生成
  generateSlideThumbnails();

  // 新しいスライドに切り替え
  switchToSlide(presentationState.currentSlideIndex + 1);

  // 変更フラグを設定
  presentationState.isModified = true;

  // ステータスバーを更新
  updatePresentationStatus();
}

/**
 * プレゼンテーションツールバーの設定
 */
function setupPresentationToolbar() {
  // テンプレートボタン
  const templateBtn = document.getElementById('template-btn');
  templateBtn.addEventListener('click', () => {
    showTemplateSelectionDialog();
  });
  
  // 追加ボタン
  const addSlideBtn = document.getElementById('add-slide-btn');
  addSlideBtn.addEventListener('click', () => {
    addNewSlide();
  });
  
  // 削除ボタン
  const deleteSlideBtn = document.getElementById('delete-slide-btn');
  deleteSlideBtn.addEventListener('click', () => {
    if (presentationState.slides.length > 1) {
      if (confirm('現在のスライドを削除しますか？')) {
        deleteCurrentSlide();
      }
    } else {
    alert('最後のスライドは削除できません');
    }
  });
  
  // 上へボタン
  const slideUpBtn = document.getElementById('slide-up-btn');
  slideUpBtn.addEventListener('click', () => {
    moveCurrentSlideUp();
  });
  
  // 下へボタン
  const slideDownBtn = document.getElementById('slide-down-btn');
  slideDownBtn.addEventListener('click', () => {
    moveCurrentSlideDown();
  });
  
  // テキストボックス追加ボタン
  const textBoxBtn = document.getElementById('text-box-btn');
  textBoxBtn.addEventListener('click', () => {
    addTextBoxToSlide();
  });
  
  // 図形挿入ボタン
  const shapeBtn = document.getElementById('shape-btn');
  shapeBtn.addEventListener('click', () => {
    showShapeSelectionDialog();
  });
  
  // 画像挿入ボタン
  const imageBtn = document.getElementById('image-btn');
  imageBtn.addEventListener('click', () => {
    insertImageToSlide();
  });
  
  // テーブル挿入ボタン
  const tableBtn = document.getElementById('table-btn');
  tableBtn.addEventListener('click', () => {
    showTableInsertionDialog();
  });
  
  // グラフ挿入ボタン
  const chartBtn = document.getElementById('chart-btn');
  chartBtn.addEventListener('click', () => {
    showChartCreationDialog();
  });
  
  // 整列ボタン
  const alignBtn = document.getElementById('align-btn');
  alignBtn.addEventListener('click', () => {
    showAlignmentOptions();
  });
  
  // グループ化ボタン
  const groupBtn = document.getElementById('group-btn');
  groupBtn.addEventListener('click', () => {
    toggleGroupSelectedElements();
  });
  
  // レイヤー操作ボタン
  const layerBtn = document.getElementById('layer-btn');
  layerBtn.addEventListener('click', () => {
    showLayerManagementDialog();
  });
  
  // 背景設定ボタン
  const backgroundBtn = document.getElementById('background-btn');
  backgroundBtn.addEventListener('click', () => {
    showBackgroundSettingsDialog();
  });
  
  // グリッド表示ボタン
  const gridBtn = document.getElementById('grid-btn');
  gridBtn.addEventListener('click', () => {
    toggleGridDisplay();
  });
  
  // 切り替え効果ボタン
  const transitionEffectBtn = document.getElementById('transition-effect-btn');
  transitionEffectBtn.addEventListener('click', () => {
    showTransitionEffectDialog();
  });
  
  // 要素アニメーションボタン
  const elementAnimationBtn = document.getElementById('element-animation-btn');
  elementAnimationBtn.addEventListener('click', () => {
    showElementAnimationDialog();
  });
  
  // 発表者ノートボタン
  const presenterNotesBtn = document.getElementById('presenter-notes-btn');
  presenterNotesBtn.addEventListener('click', () => {
    showPresenterNotesDialog();
  });
  
  // プレゼン開始ボタン
  const presentBtn = document.getElementById('present-btn');
  presentBtn.addEventListener('click', () => {
    startPresentationMode();
  });
}

/**
 * プレゼンテーションモードを開始
 */
function startPresentationMode() {
  // 全画面モードを準備
  const presentationContainer = document.createElement('div');
  presentationContainer.className = 'presentation-fullscreen-container';

  const presentationControls = document.createElement('div');
  presentationControls.className = 'presentation-controls';
  presentationControls.innerHTML = `
    <div class="presentation-nav">
      <button class="presentation-prev-btn"><i class="fas fa-chevron-left"></i></button>
      <div class="presentation-progress">
        <span class="current-slide">1</span>/<span class="total-slides">${presentationState.slides.length}</span>
      </div>
      <button class="presentation-next-btn"><i class="fas fa-chevron-right"></i></button>
    </div>
    <button class="presentation-exit-btn"><i class="fas fa-times"></i></button>
  `;
  
  const presentationDisplay = document.createElement('div');
  presentationDisplay.className = 'presentation-display';
  
  // 最初のスライドの内容を表示
  const firstSlide = presentationState.slides[0];
  presentationDisplay.innerHTML = `<div class="presentation-slide">${firstSlide.content}</div>`;
  
  // 発表者ノートエリア
  const presenterNotesArea = document.createElement('div');
  presenterNotesArea.className = 'presenter-notes-area';
  presenterNotesArea.innerHTML = `
    <div class="presenter-notes-toggle">
      <button class="toggle-notes-btn"><i class="fas fa-sticky-note"></i></button>
    </div>
    <div class="presenter-notes-content" style="display: none;">
      <h4>発表者ノート</h4>
      <div class="note-content">${firstSlide.notes || 'このスライドにはノートがありません'}</div>
    </div>
  `;
  
  presentationContainer.appendChild(presentationDisplay);
  presentationContainer.appendChild(presentationControls);
  presentationContainer.appendChild(presenterNotesArea);
  document.body.appendChild(presentationContainer);
  
  // スタイルを追加
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .presentation-fullscreen-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #111;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .presentation-display {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .presentation-slide {
      background-color: white;
      width: 90%;
      height: 90%;
      max-width: 1200px;
      max-height: 800px;
      overflow: auto;
      padding: 30px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .presentation-controls {
      position: absolute;
      bottom: 20px;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: center;
      color: white;
      z-index: 100;
    }
    .presentation-nav {
      display: flex;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 10px 15px;
      border-radius: 30px;
    }
    .presentation-progress {
      margin: 0 15px;
      font-size: 14px;
    }
    .presentation-prev-btn, .presentation-next-btn, .presentation-exit-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
      padding: 5px 10px;
    }
    .presentation-exit-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .presenter-notes-area {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 101;
    }
    .presenter-notes-toggle {
      text-align: right;
    }
    .toggle-notes-btn {
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
    }
    .presenter-notes-content {
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      margin-top: 10px;
      width: 300px;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    }
    .presenter-notes-content h4 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
      color: #333;
    }
    .note-content {
      font-size: 14px;
      line-height: 1.4;
      color: #555;
    }
    
    /* スライド切り替え効果 */
    .slide-transition {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: white;
      padding: 30px;
      box-sizing: border-box;
    }
    .slide-transition.fade {
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .slide-transition.slide-left {
      transform: translateX(100%);
      transition: transform 0.5s ease;
    }
    .slide-transition.slide-right {
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }
    .slide-transition.slide-up {
      transform: translateY(100%);
      transition: transform 0.5s ease;
    }
    .slide-transition.slide-down {
      transform: translateY(-100%);
      transition: transform 0.5s ease;
    }
    .slide-transition.zoom {
      transform: scale(0);
      opacity: 0;
      transition: transform 0.5s ease, opacity 0.5s ease;
    }
    .slide-transition.flip {
      transform: rotateY(90deg);
      transition: transform 0.5s ease;
    }
    .slide-transition.rotate {
      transform: rotate(180deg) scale(0.2);
      opacity: 0;
      transition: transform 0.5s ease, opacity 0.5s ease;
    }
    
    /* 速度バリエーション */
    .transition-speed-slow {
      transition-duration: 1.2s !important;
    }
    .transition-speed-medium {
      transition-duration: 0.8s !important;
    }
    .transition-speed-fast {
      transition-duration: 0.4s !important;
    }
    
    /* 表示中のスライド */
    .slide-visible {
      opacity: 1 !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(styleElement);
  
  // プレゼンテーションの状態管理
  let currentSlideIndex = 0;
  let isAnimating = false;
  
  // ナビゲーション関数
  function navigateToSlide(index) {
    if (isAnimating) return;
    
    if (index < 0) index = 0;
    if (index >= presentationState.slides.length) index = presentationState.slides.length - 1;
    
    if (index === currentSlideIndex) return;
    
    isAnimating = true;
    
    // 現在のスライド情報
    const currentSlide = presentationState.slides[currentSlideIndex];
    // 次のスライド情報
    const nextSlide = presentationState.slides[index];
    
    // 切り替え効果を決定
    const effect = nextSlide.transitionEffect || 'fade';
    const speed = nextSlide.transitionSpeed || 'medium';
    
    // 現在のスライド要素
    const currentSlideElement = presentationDisplay.querySelector('.presentation-slide');
    
    // 新しいスライド要素を作成
    const newSlideElement = document.createElement('div');
    newSlideElement.className = `slide-transition ${effect} transition-speed-${speed}`;
    newSlideElement.innerHTML = nextSlide.content;
    
    // アニメーション要素を処理
    const animatedElements = newSlideElement.querySelectorAll('[data-animation]');
    animatedElements.forEach(el => {
      const animation = el.dataset.animation;
      const delay = el.dataset.animationDelay || '0';
      const duration = el.dataset.animationDuration || '1';
      
      el.classList.add(animation);
      el.style.animationDelay = `${delay}s`;
      el.style.animationDuration = `${duration}s`;
      
      // 最初は非表示
      el.style.opacity = '0';
      el.style.animationPlayState = 'paused';
    });
    
    // スライドを追加して表示
    presentationDisplay.appendChild(newSlideElement);
    
    // 少し遅延させて表示（DOMに追加されるタイミングの問題を回避）
    setTimeout(() => {
      newSlideElement.classList.add('slide-visible');
      
      // アニメーション完了後の処理
      setTimeout(() => {
        // 古いスライドを削除
        if (currentSlideElement) {
          presentationDisplay.removeChild(currentSlideElement);
        }
        
        // 新しいスライドから切り替えクラスを削除し、通常のスライドクラスに変更
        newSlideElement.className = 'presentation-slide';
        
        // アニメーション要素を処理
        animatedElements.forEach(el => {
          el.style.opacity = '';
          el.style.animationPlayState = 'running';
        });
        
        // 進行状況を更新
        presentationControls.querySelector('.current-slide').textContent = index + 1;
        
        // 発表者ノートを更新
        const noteContent = presenterNotesArea.querySelector('.note-content');
        noteContent.textContent = nextSlide.notes || 'このスライドにはノートがありません';
        
        currentSlideIndex = index;
        isAnimating = false;
      }, getTransitionDuration(speed));
    }, 50);
  }
  
  // 切り替え速度に基づいてミリ秒単位の時間を取得
  function getTransitionDuration(speed) {
    switch (speed) {
      case 'slow': return 1200;
      case 'fast': return 400;
      default: return 800; // medium
    }
  }
  
  // 前へボタンのクリックイベント
  const prevButton = presentationControls.querySelector('.presentation-prev-btn');
  prevButton.addEventListener('click', () => {
    navigateToSlide(currentSlideIndex - 1);
  });
  
  // 次へボタンのクリックイベント
  const nextButton = presentationControls.querySelector('.presentation-next-btn');
  nextButton.addEventListener('click', () => {
    navigateToSlide(currentSlideIndex + 1);
  });
  
  // 終了ボタンのクリックイベント
  const exitButton = presentationControls.querySelector('.presentation-exit-btn');
  exitButton.addEventListener('click', () => {
    document.body.removeChild(presentationContainer);
    document.head.removeChild(styleElement);
    document.removeEventListener('keydown', handlePresentationKeydown);
  });
  
  // 発表者ノートの表示／非表示切り替え
  const toggleNotesButton = presenterNotesArea.querySelector('.toggle-notes-btn');
  const notesContent = presenterNotesArea.querySelector('.presenter-notes-content');
  toggleNotesButton.addEventListener('click', () => {
    const isVisible = notesContent.style.display !== 'none';
    notesContent.style.display = isVisible ? 'none' : 'block';
  });
  
  // キーボードイベント
  document.addEventListener('keydown', handlePresentationKeydown);

  function handlePresentationKeydown(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        navigateToSlide(currentSlideIndex - 1);
        break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        navigateToSlide(currentSlideIndex + 1);
        break;
      case 'Escape':
        document.body.removeChild(presentationContainer);
        document.head.removeChild(styleElement);
        document.removeEventListener('keydown', handlePresentationKeydown);
        break;
    }
  }
  
  // 最初のスライドのアニメーション要素を処理
  const firstSlideAnimations = presentationDisplay.querySelectorAll('[data-animation]');
  firstSlideAnimations.forEach(el => {
    const animation = el.dataset.animation;
    const delay = el.dataset.animationDelay || '0';
    const duration = el.dataset.animationDuration || '1';
    
    el.classList.add(animation);
    el.style.animationDelay = `${delay}s`;
    el.style.animationDuration = `${duration}s`;
  });
}

/**
 * 現在のスライドを削除
 */
function deleteCurrentSlide() {
  const currentIndex = presentationState.currentSlideIndex;
  const slides = presentationState.slides;
  
  // スライドを削除
  slides.splice(currentIndex, 1);
  
  // インデックスを更新（最後のスライドだった場合は一つ前に移動）
  if (currentIndex >= slides.length) {
    presentationState.currentSlideIndex = slides.length - 1;
  }
  
  // 変更フラグを設定
  presentationState.isModified = true;
  updatePresentationStatus();
  
  // サムネイルを更新
  generateSlideThumbnails();
  
  // 現在のスライドを表示
  switchToSlide(presentationState.currentSlideIndex);
}

/**
 * スライドの順序を上に移動
 */
function moveCurrentSlideUp() {
  const currentIndex = presentationState.currentSlideIndex;
  if (currentIndex <= 0) {
    return; // 既に先頭にある場合は何もしない
  }
  
  // 入れ替え
  const slides = presentationState.slides;
  const temp = slides[currentIndex];
  slides[currentIndex] = slides[currentIndex - 1];
  slides[currentIndex - 1] = temp;
  
  // インデックスを更新
  presentationState.currentSlideIndex = currentIndex - 1;
  
  // 変更フラグを設定
  presentationState.isModified = true;
  updatePresentationStatus();
  
  // サムネイルを更新
  generateSlideThumbnails();
}

/**
 * スライドの順序を下に移動
 */
function moveCurrentSlideDown() {
  const currentIndex = presentationState.currentSlideIndex;
  const slides = presentationState.slides;
  
  if (currentIndex >= slides.length - 1) {
    return; // 既に末尾にある場合は何もしない
  }
  
  // 入れ替え
  const temp = slides[currentIndex];
  slides[currentIndex] = slides[currentIndex + 1];
  slides[currentIndex + 1] = temp;
  
  // インデックスを更新
  presentationState.currentSlideIndex = currentIndex + 1;
  
  // 変更フラグを設定
  presentationState.isModified = true;
  updatePresentationStatus();
  
  // サムネイルを更新
  generateSlideThumbnails();
}

/**
 * スライドを下に移動
 */
function moveSlideDown() {
  if (presentationState.currentSlideIndex >= presentationState.slides.length - 1) return;
  
  // スライドを入れ替え
  const temp = presentationState.slides[presentationState.currentSlideIndex];
  presentationState.slides[presentationState.currentSlideIndex] = presentationState.slides[presentationState.currentSlideIndex + 1];
  presentationState.slides[presentationState.currentSlideIndex + 1] = temp;
  
  // カレントインデックスを更新
  presentationState.currentSlideIndex++;
  
  // サムネイル再生成
  generateSlideThumbnails();
  
  // 変更フラグ設定
  presentationState.isModified = true;
  updatePresentationStatus();
}

/**
 * プレゼンテーションの状態表示を更新
 */
function updatePresentationStatus() {
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = `スライド ${presentationState.currentSlideIndex + 1}/${presentationState.slides.length} ${presentationState.isModified ? '(未保存)' : ''}`;
  }
}

/**
 * 新規プレゼンテーションを作成
 */
function createNewPresentation() {
  if (presentationState.isModified) {
    const confirmSave = confirm('変更が保存されていません。保存しますか？');
    if (confirmSave) {
      savePresentation();
    }
  }

  presentationState.currentPresentation = null;
  presentationState.isModified = false;
  presentationState.slides = [
    {
      id: 'slide-1',
      content: '<h1>新規プレゼンテーション</h1><p>ここにコンテンツを追加してください</p>',
      notes: ''
    }
  ];
  presentationState.currentSlideIndex = 0;

  // サムネイルを再生成
  generateSlideThumbnails();

  // スライド内容を更新
  slideContent.innerHTML = presentationState.slides[0].content;

  // ステータスバーを更新
  updatePresentationStatus();
}

/**
 * プレゼンテーションを保存
 */
function savePresentation() {
  const timestamp = getCurrentDateTime();

  // 最初のスライドのh1からタイトルを取得
  let title = '無題のプレゼンテーション';
  const firstSlideContent = presentationState.slides[0].content;
  const titleMatch = /<h1[^>]*>(.*?)<\/h1>/i.exec(firstSlideContent);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  const presentationData = {
    title: title,
    slides: presentationState.slides,
    lastModified: timestamp,
    type: 'presentation'
  };

  if (presentationState.currentPresentation) {
    // 既存プレゼンテーションの更新
    presentationData.id = presentationState.currentPresentation.id;
    saveToStorage(`presentation_${presentationData.id}`, presentationData);
  } else {
    // 新規プレゼンテーションの保存
    const id = Date.now().toString();
    presentationData.id = id;
    presentationState.currentPresentation = presentationData;
    saveToStorage(`presentation_${id}`, presentationData);

    // プレゼンテーションリストに追加
    const presentations = getFromStorage('presentations', []);
    presentations.push({
      id: id,
      title: title,
      lastModified: timestamp,
      type: 'presentation'
    });
    saveToStorage('presentations', presentations);
  }

  presentationState.isModified = false;

  // 成功メッセージ
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = 'プレゼンテーションを保存しました';
    setTimeout(() => {
      updatePresentationStatus();
    }, 2000);
  }
}

/**
 * プレゼンテーションを読み込む
 * @param {string} id - プレゼンテーションID
 */
function loadPresentation(id) {
  const presentationData = getFromStorage(`presentation_${id}`);
  if (!presentationData) {
    alert('プレゼンテーションの読み込みに失敗しました');
    return;
  }

  presentationState.currentPresentation = presentationData;
  presentationState.slides = presentationData.slides || [];
  presentationState.currentSlideIndex = 0;
  presentationState.isModified = false;

  // スライドが空の場合、デフォルトスライドを追加
  if (presentationState.slides.length === 0) {
    presentationState.slides.push({
      id: 'slide-1',
      content: '<h1>新規プレゼンテーション</h1><p>ここにコンテンツを追加してください</p>',
      notes: ''
    });
  }

  // サムネイルを再生成
  generateSlideThumbnails();

  // スライド内容を更新
  slideContent.innerHTML = presentationState.slides[0].content;

  // ステータスバーを更新
  updatePresentationStatus();
}

/**
 * プレゼンテーションをHTMLとしてエクスポート
 */
function exportPresentationAsHTML() {
  // 最初のスライドのh1からタイトルを取得
  let title = '無題のプレゼンテーション';
  const firstSlideContent = presentationState.slides[0].content;
  const titleMatch = /<h1[^>]*>(.*?)<\/h1>/i.exec(firstSlideContent);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // HTMLの生成
  let htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .slide {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .slide-content {
      width: 80%;
      max-width: 960px;
      height: 80%;
      max-height: 540px;
      background-color: white;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      padding: 32px;
      overflow: hidden;
    }
    .slide-content h1 {
      font-size: 36px;
      margin-bottom: 24px;
    }
    .slide-content h2 {
      font-size: 28px;
      margin-bottom: 20px;
    }
    .slide-content p {
      font-size: 18px;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .slide-content ul, .slide-content ol {
      margin-bottom: 16px;
      padding-left: 24px;
    }
    .slide-content li {
      font-size: 18px;
      margin-bottom: 12px;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 8px 16px;
      border-radius: 20px;
      z-index: 100;
    }
    .control-btn {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .control-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    .slide-number {
      position: fixed;
      bottom: 10px;
      right: 10px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="presentation">
`;

  // スライドの追加
  presentationState.slides.forEach((slide, index) => {
    htmlContent += `
    <div class="slide" id="slide-${index + 1}" style="display: ${index === 0 ? 'flex' : 'none'}">
      <div class="slide-content">
        ${slide.content}
      </div>
      <div class="slide-number">${index + 1} / ${presentationState.slides.length}</div>
    </div>
`;
  });

  // コントロールと JavaScript の追加
  htmlContent += `
  <div class="controls">
    <button class="control-btn prev-btn">◀</button>
    <button class="control-btn next-btn">▶</button>
  </div>

  <script>
    // スライドナビゲーション
    let currentSlide = 1;
    const totalSlides = ${presentationState.slides.length};

    function showSlide(slideNumber) {
      // すべてのスライドを非表示
      document.querySelectorAll('.slide').forEach(slide => {
        slide.style.display = 'none';
      });

      // 指定したスライドを表示
      const slide = document.getElementById('slide-' + slideNumber);
      if (slide) {
        slide.style.display = 'flex';
      }

      // 現在のスライド番号を更新
      currentSlide = slideNumber;
    }

    function nextSlide() {
      if (currentSlide < totalSlides) {
        showSlide(currentSlide + 1);
      }
    }

    function prevSlide() {
      if (currentSlide > 1) {
        showSlide(currentSlide - 1);
      }
    }

    // イベントリスナーの設定
    document.querySelector('.next-btn').addEventListener('click', nextSlide);
    document.querySelector('.prev-btn').addEventListener('click', prevSlide);

    // キーボードナビゲーション
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        prevSlide();
      }
    });
  </script>
</body>
</html>
`;

  downloadFile(`${title}.html`, htmlContent, 'text/html');
}

/**
 * スライドに画像を挿入
 */
function insertImageToSlide() {
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
      img.style.maxHeight = '400px';

      // 選択範囲に画像を挿入
      document.execCommand('insertHTML', false, img.outerHTML);

      // スライドの内容を更新
      const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
      if (currentSlide) {
        currentSlide.content = slideContent.innerHTML;

        // サムネイルも更新
        const thumbnail = slidesPanel.querySelector(`.slide-thumbnail[data-slide-id="${currentSlide.id}"] .thumbnail-content`);
        if (thumbnail) {
          thumbnail.innerHTML = currentSlide.content;
        }

        // 変更フラグを設定
        presentationState.isModified = true;

        // ステータスバーを更新
        updatePresentationStatus();
      }
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

/**
 * スライドテンプレート
 */
const slideTemplates = {
  // タイトルスライド
  titleSlide: `
    <div class="slide-template title-slide">
      <h1 class="presentation-title">プレゼンテーションタイトル</h1>
      <h3 class="presentation-subtitle">サブタイトル</h3>
      <div class="presentation-author">発表者名</div>
      <div class="presentation-date">発表日</div>
    </div>
  `,
  
  // セクションタイトル
  sectionTitle: `
    <div class="slide-template section-title">
      <h2 class="section-heading">セクションタイトル</h2>
    </div>
  `,
  
  // 箇条書きリスト
  bulletList: `
    <div class="slide-template bullet-list">
      <h2 class="slide-title">スライドタイトル</h2>
      <ul>
        <li>箇条書き項目 1</li>
        <li>箇条書き項目 2</li>
        <li>箇条書き項目 3</li>
        <li>箇条書き項目 4</li>
      </ul>
    </div>
  `,
  
  // 番号付きリスト
  numberedList: `
    <div class="slide-template numbered-list">
      <h2 class="slide-title">スライドタイトル</h2>
      <ol>
        <li>項目 1</li>
        <li>項目 2</li>
        <li>項目 3</li>
        <li>項目 4</li>
      </ol>
    </div>
  `,
  
  // 2列レイアウト
  twoColumns: `
    <div class="slide-template two-columns">
      <h2 class="slide-title">スライドタイトル</h2>
      <div class="columns-container">
        <div class="column">
          <h3>左側の見出し</h3>
          <p>左側のコンテンツをここに記述します。</p>
        </div>
        <div class="column">
          <h3>右側の見出し</h3>
          <p>右側のコンテンツをここに記述します。</p>
        </div>
      </div>
    </div>
  `,
  
  // 比較スライド
  comparison: `
    <div class="slide-template comparison">
      <h2 class="slide-title">比較</h2>
      <div class="comparison-container">
        <div class="comparison-item">
          <h3>項目 A</h3>
          <ul>
            <li>特徴 1</li>
            <li>特徴 2</li>
            <li>特徴 3</li>
          </ul>
        </div>
        <div class="comparison-vs">VS</div>
        <div class="comparison-item">
          <h3>項目 B</h3>
          <ul>
            <li>特徴 1</li>
            <li>特徴 2</li>
            <li>特徴 3</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  
  // 画像スライド
  imageSlide: `
    <div class="slide-template image-slide">
      <h2 class="slide-title">画像スライド</h2>
      <div class="image-placeholder">
        <div class="image-icon">🖼️</div>
        <div class="image-text">ここをクリックして画像を挿入</div>
      </div>
      <p class="image-caption">画像の説明文</p>
    </div>
  `,
  
  // 引用スライド
  quoteSlide: `
    <div class="slide-template quote-slide">
      <blockquote class="quote">
        <p>ここに引用文を入力してください。印象的なメッセージや重要な引用を記載します。</p>
      </blockquote>
      <div class="quote-author">- 引用元</div>
    </div>
  `,
  
  // 最終スライド
  endSlide: `
    <div class="slide-template end-slide">
      <h2 class="thank-you">ご清聴ありがとうございました</h2>
      <div class="contact-info">
        <p>お問い合わせ先：example@example.com</p>
      </div>
    </div>
  `
};

/**
 * テンプレートからスライドを追加
 * @param {string} templateName - テンプレート名
 */
function addSlideFromTemplate(templateName) {
  const template = slideTemplates[templateName];
  if (!template) return;
  
  // 新しいスライドIDを生成
  const newSlideId = `slide-${Date.now()}`;
  
  // 新しいスライドを作成
  const newSlide = {
    id: newSlideId,
    content: template,
    notes: ''
  };
  
  // 現在のスライドの次に挿入
  const insertIndex = presentationState.currentSlideIndex + 1;
  presentationState.slides.splice(insertIndex, 0, newSlide);
  
  // サムネイルを再生成
  generateSlideThumbnails();
  
  // 新しいスライドに切り替え
  switchToSlide(insertIndex);
  
  // 変更フラグを設定
  presentationState.isModified = true;
  updatePresentationStatus();
}

/**
 * テンプレート選択ダイアログを表示
 */
function showTemplateSelectionDialog() {
  // ダイアログを生成
  const dialogHTML = `
    <div class="template-dialog">
      <h3>スライドテンプレートを選択</h3>
      <div class="template-grid">
        <div class="template-item" data-template="titleSlide">
          <div class="template-preview">
            <div class="preview-title">タイトル</div>
            <div class="preview-subtitle">サブタイトル</div>
          </div>
          <div class="template-name">タイトルスライド</div>
        </div>
        <div class="template-item" data-template="sectionTitle">
          <div class="template-preview">
            <div class="preview-section">セクション</div>
          </div>
          <div class="template-name">セクションタイトル</div>
        </div>
        <div class="template-item" data-template="bulletList">
          <div class="template-preview">
            <div class="preview-bullets">
              <div class="preview-bullet"></div>
              <div class="preview-bullet"></div>
              <div class="preview-bullet"></div>
            </div>
          </div>
          <div class="template-name">箇条書きリスト</div>
        </div>
        <div class="template-item" data-template="numberedList">
          <div class="template-preview">
            <div class="preview-numbers">
              <div class="preview-number">1.</div>
              <div class="preview-number">2.</div>
              <div class="preview-number">3.</div>
            </div>
          </div>
          <div class="template-name">番号付きリスト</div>
        </div>
        <div class="template-item" data-template="twoColumns">
          <div class="template-preview">
            <div class="preview-columns">
              <div class="preview-column"></div>
              <div class="preview-column"></div>
            </div>
          </div>
          <div class="template-name">2列レイアウト</div>
        </div>
        <div class="template-item" data-template="comparison">
          <div class="template-preview">
            <div class="preview-comparison">
              <div class="preview-side"></div>
              <div class="preview-vs">VS</div>
              <div class="preview-side"></div>
            </div>
          </div>
          <div class="template-name">比較スライド</div>
        </div>
        <div class="template-item" data-template="imageSlide">
          <div class="template-preview">
            <div class="preview-image">🖼️</div>
          </div>
          <div class="template-name">画像スライド</div>
        </div>
        <div class="template-item" data-template="quoteSlide">
          <div class="template-preview">
            <div class="preview-quote">"</div>
          </div>
          <div class="template-name">引用スライド</div>
        </div>
        <div class="template-item" data-template="endSlide">
          <div class="template-preview">
            <div class="preview-end">完</div>
          </div>
          <div class="template-name">最終スライド</div>
        </div>
      </div>
      <div class="template-dialog-actions">
        <button class="close-btn">キャンセル</button>
      </div>
    </div>
  `;
  
  // スタイルを定義
  const styleContent = `
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
    .template-dialog {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      width: 80%;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .template-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .template-item {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .template-item:hover {
      border-color: #2196f3;
      box-shadow: 0 0 5px rgba(33, 150, 243, 0.3);
    }
    .template-preview {
      height: 100px;
      background-color: #f5f5f5;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .template-name {
      text-align: center;
      font-size: 14px;
    }
    .preview-title {
      font-size: 18px;
      font-weight: bold;
    }
    .preview-subtitle {
      font-size: 14px;
      color: #666;
    }
    .preview-section {
      font-size: 24px;
      font-weight: bold;
    }
    .preview-bullets, .preview-numbers {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 80%;
    }
    .preview-bullet, .preview-number {
      height: 6px;
      background-color: #666;
      margin: 5px 0;
    }
    .preview-bullet {
      width: 80%;
      border-radius: 3px;
    }
    .preview-number {
      width: 85%;
      border-radius: 3px;
      display: flex;
      align-items: center;
    }
    .preview-columns {
      display: flex;
      width: 90%;
      height: 80%;
    }
    .preview-column {
      flex: 1;
      background-color: #ddd;
      margin: 0 5px;
      border-radius: 3px;
    }
    .preview-comparison {
      display: flex;
      width: 90%;
      align-items: center;
    }
    .preview-side {
      flex: 1;
      height: 50px;
      background-color: #ddd;
      border-radius: 3px;
    }
    .preview-vs {
      margin: 0 10px;
      font-weight: bold;
    }
    .preview-image {
      font-size: 36px;
    }
    .preview-quote {
      font-size: 48px;
      font-family: serif;
      color: #888;
    }
    .preview-end {
      font-size: 32px;
      font-weight: bold;
    }
    .template-dialog-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .template-dialog-actions button {
      padding: 8px 16px;
      background-color: #f5f5f5;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .template-dialog-actions button:hover {
      background-color: #e0e0e0;
    }
  `;
  
  // ダイアログを表示
  const dialogElement = document.createElement('div');
  dialogElement.className = 'modal-overlay';
  dialogElement.innerHTML = dialogHTML;
  document.body.appendChild(dialogElement);
  
  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = styleContent;
  document.head.appendChild(style);
  
  // テンプレート選択イベント
  dialogElement.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', () => {
      const templateName = item.dataset.template;
      addSlideFromTemplate(templateName);
      
      // ダイアログを閉じる
      document.body.removeChild(dialogElement);
      document.head.removeChild(style);
    });
  });
  
  // キャンセルボタン
  dialogElement.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // 背景クリックで閉じる
  dialogElement.addEventListener('click', (e) => {
    if (e.target === dialogElement) {
      document.body.removeChild(dialogElement);
      document.head.removeChild(style);
    }
  });
}

/**
 * スライド切り替え効果のオプション
 */
const slideTransitionEffects = {
  fade: 'fade',         // フェード
  slideLeft: 'slide-left',   // 左からスライド
  slideRight: 'slide-right', // 右からスライド
  slideUp: 'slide-up',     // 上からスライド
  slideDown: 'slide-down',   // 下からスライド
  zoom: 'zoom',         // ズーム
  flip: 'flip',         // フリップ
  rotate: 'rotate'       // 回転
};

/**
 * スライド要素のアニメーション効果
 */
const elementAnimations = {
  fadeIn: 'animate-fade-in',        // フェードイン
  slideInLeft: 'animate-slide-in-left',  // 左からスライドイン
  slideInRight: 'animate-slide-in-right', // 右からスライドイン
  slideInUp: 'animate-slide-in-up',    // 上からスライドイン
  slideInDown: 'animate-slide-in-down',  // 下からスライドイン
  zoomIn: 'animate-zoom-in',        // ズームイン
  bounce: 'animate-bounce',        // バウンス
  pulse: 'animate-pulse',         // パルス
  shake: 'animate-shake'          // シェイク
};

/**
 * プレゼンテーションの発表者ノート
 */
function showPresenterNotesDialog() {
  // 現在のスライドのノートを取得
  const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
  const notes = currentSlide.notes || '';
  
  // ダイアログを作成
  const dialogHTML = `
    <div class="presenter-notes-dialog">
      <h3>発表者ノート</h3>
      <textarea class="presenter-notes-textarea" placeholder="このスライドの発表者ノートを入力してください...">${notes}</textarea>
      <div class="presenter-notes-actions">
        <button class="save-notes-btn">保存</button>
        <button class="close-btn">キャンセル</button>
      </div>
    </div>
  `;
  
  // スタイルを定義
  const styleContent = `
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
    .presenter-notes-dialog {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .presenter-notes-textarea {
      width: 100%;
      height: 200px;
      padding: 10px;
      margin: 15px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
    }
    .presenter-notes-actions {
      display: flex;
      justify-content: flex-end;
    }
    .presenter-notes-actions button {
      padding: 8px 16px;
      margin-left: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .save-notes-btn {
      background-color: #2196f3;
      color: white;
    }
    .close-btn {
      background-color: #f5f5f5;
      color: #333;
    }
    @media (max-width: 576px) {
      .presenter-notes-dialog {
        width: 95%;
        padding: 15px;
      }
      .presenter-notes-textarea {
        height: 150px;
      }
      .presenter-notes-actions button {
        padding: 6px 12px;
        font-size: 14px;
      }
    }
  `;
  
  // ダイアログを表示
  const dialogElement = document.createElement('div');
  dialogElement.className = 'modal-overlay';
  dialogElement.innerHTML = dialogHTML;
  document.body.appendChild(dialogElement);
  
  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = styleContent;
  document.head.appendChild(style);
  
  // テキストエリアにフォーカス
  const textarea = dialogElement.querySelector('.presenter-notes-textarea');
  textarea.focus();
  
  // 保存ボタン
  dialogElement.querySelector('.save-notes-btn').addEventListener('click', () => {
    // ノートを保存
    const newNotes = textarea.value;
    currentSlide.notes = newNotes;
    
    // 変更フラグを設定
    presentationState.isModified = true;
    updatePresentationStatus();
    
    // ダイアログを閉じる
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // キャンセルボタン
  dialogElement.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // 背景クリックで閉じる
  dialogElement.addEventListener('click', (e) => {
    if (e.target === dialogElement) {
      document.body.removeChild(dialogElement);
      document.head.removeChild(style);
    }
  });
}

/**
 * スライド切り替え効果設定ダイアログを表示
 */
function showTransitionEffectDialog() {
  // 現在のスライドの切り替え効果を取得
  const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
  const currentEffect = currentSlide.transitionEffect || 'fade';
  
  // ダイアログを作成
  const dialogHTML = `
    <div class="transition-effect-dialog">
      <h3>スライド切り替え効果</h3>
      <div class="effect-options">
        ${Object.entries(slideTransitionEffects).map(([key, value]) => `
          <div class="effect-option ${currentEffect === value ? 'selected' : ''}">
            <input type="radio" name="transition-effect" id="effect-${key}" value="${value}" ${currentEffect === value ? 'checked' : ''}>
            <label for="effect-${key}">${key}</label>
            <div class="effect-preview effect-preview-${value}"></div>
          </div>
        `).join('')}
      </div>
      <div class="transition-speed">
        <label for="transition-speed">切り替え速度:</label>
        <select id="transition-speed" class="transition-speed-select">
          <option value="slow" ${currentSlide.transitionSpeed === 'slow' ? 'selected' : ''}>ゆっくり</option>
          <option value="medium" ${!currentSlide.transitionSpeed || currentSlide.transitionSpeed === 'medium' ? 'selected' : ''}>普通</option>
          <option value="fast" ${currentSlide.transitionSpeed === 'fast' ? 'selected' : ''}>速い</option>
        </select>
      </div>
      <div class="transition-actions">
        <button class="save-transition-btn">適用</button>
        <button class="close-btn">キャンセル</button>
      </div>
    </div>
  `;
  
  // スタイルを定義
  const styleContent = `
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
    .transition-effect-dialog {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .effect-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .effect-option {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .effect-option.selected {
      border-color: #2196f3;
      background-color: #e3f2fd;
    }
    .effect-option:hover {
      border-color: #2196f3;
    }
    .effect-preview {
      height: 60px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .effect-preview:after {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      background-color: #2196f3;
      border-radius: 4px;
    }
    @keyframes preview-fade {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }
    @keyframes preview-slide-left {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(0); }
    }
    @keyframes preview-slide-right {
      0%, 100% { transform: translateX(100%); }
      50% { transform: translateX(0); }
    }
    @keyframes preview-slide-up {
      0%, 100% { transform: translateY(-100%); }
      50% { transform: translateY(0); }
    }
    @keyframes preview-slide-down {
      0%, 100% { transform: translateY(100%); }
      50% { transform: translateY(0); }
    }
    @keyframes preview-zoom {
      0%, 100% { transform: scale(0); }
      50% { transform: scale(1); }
    }
    @keyframes preview-flip {
      0%, 100% { transform: rotateY(180deg); opacity: 0; }
      50% { transform: rotateY(0); opacity: 1; }
    }
    @keyframes preview-rotate {
      0%, 100% { transform: rotate(180deg) scale(0.5); opacity: 0; }
      50% { transform: rotate(0) scale(1); opacity: 1; }
    }
    .effect-preview-fade:after {
      animation: preview-fade 2s infinite;
    }
    .effect-preview-slide-left:after {
      animation: preview-slide-left 2s infinite;
    }
    .effect-preview-slide-right:after {
      animation: preview-slide-right 2s infinite;
    }
    .effect-preview-slide-up:after {
      animation: preview-slide-up 2s infinite;
    }
    .effect-preview-slide-down:after {
      animation: preview-slide-down 2s infinite;
    }
    .effect-preview-zoom:after {
      animation: preview-zoom 2s infinite;
    }
    .effect-preview-flip:after {
      animation: preview-flip 2s infinite;
    }
    .effect-preview-rotate:after {
      animation: preview-rotate 2s infinite;
    }
    .transition-speed {
      margin: 15px 0;
      display: flex;
      align-items: center;
    }
    .transition-speed-select {
      margin-left: 10px;
      padding: 5px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .transition-actions {
      display: flex;
      justify-content: flex-end;
    }
    .transition-actions button {
      padding: 8px 16px;
      margin-left: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .save-transition-btn {
      background-color: #2196f3;
      color: white;
    }
    .close-btn {
      background-color: #f5f5f5;
      color: #333;
    }
    @media (max-width: 768px) {
      .effect-options {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 576px) {
      .transition-effect-dialog {
        width: 95%;
        padding: 15px;
      }
      .effect-options {
        grid-template-columns: 1fr;
      }
      .transition-speed {
        flex-direction: column;
        align-items: flex-start;
      }
      .transition-speed-select {
        margin-left: 0;
        margin-top: 5px;
        width: 100%;
      }
      .transition-actions button {
        padding: 6px 12px;
        font-size: 14px;
      }
    }
  `;
  
  // ダイアログを表示
  const dialogElement = document.createElement('div');
  dialogElement.className = 'modal-overlay';
  dialogElement.innerHTML = dialogHTML;
  document.body.appendChild(dialogElement);
  
  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = styleContent;
  document.head.appendChild(style);
  
  // ラジオボタンのクリックイベント
  dialogElement.querySelectorAll('.effect-option').forEach(option => {
    option.addEventListener('click', () => {
      // 他のすべてのオプションから選択状態を削除
      dialogElement.querySelectorAll('.effect-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // クリックされたオプションを選択状態に
      option.classList.add('selected');
      
      // ラジオボタンをチェック
      const radio = option.querySelector('input[type="radio"]');
      radio.checked = true;
    });
  });
  
  // 保存ボタン
  dialogElement.querySelector('.save-transition-btn').addEventListener('click', () => {
    // 選択された効果を取得
    const selectedEffect = dialogElement.querySelector('input[name="transition-effect"]:checked').value;
    const selectedSpeed = dialogElement.querySelector('#transition-speed').value;
    
    // スライドに効果を設定
    currentSlide.transitionEffect = selectedEffect;
    currentSlide.transitionSpeed = selectedSpeed;
    
    // 変更フラグを設定
    presentationState.isModified = true;
    updatePresentationStatus();
    
    // ダイアログを閉じる
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // キャンセルボタン
  dialogElement.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // 背景クリックで閉じる
  dialogElement.addEventListener('click', (e) => {
    if (e.target === dialogElement) {
      document.body.removeChild(dialogElement);
      document.head.removeChild(style);
    }
  });
}

/**
 * 要素アニメーション設定ダイアログを表示
 */
function showElementAnimationDialog() {
  // 現在選択されている要素を取得
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    alert('アニメーションを適用する要素を選択してください');
    return;
  }
  
  const range = selection.getRangeAt(0);
  const selectedNode = range.commonAncestorContainer;
  
  // 選択範囲がテキストノードの場合は親要素を取得
  const selectedElement = selectedNode.nodeType === Node.TEXT_NODE ? selectedNode.parentElement : selectedNode;
  
  // 現在のアニメーション設定を取得
  const currentAnimation = selectedElement.dataset.animation || '';
  const currentDelay = selectedElement.dataset.animationDelay || '0';
  const currentDuration = selectedElement.dataset.animationDuration || '1';
  
  // ダイアログを作成
  const dialogHTML = `
    <div class="element-animation-dialog">
      <h3>要素のアニメーション設定</h3>
      <div class="animation-options">
        <div class="option-group">
          <label>アニメーション効果:</label>
          <select id="animation-effect" class="animation-select">
            <option value="" ${!currentAnimation ? 'selected' : ''}>なし</option>
            ${Object.entries(elementAnimations).map(([key, value]) => `
              <option value="${value}" ${currentAnimation === value ? 'selected' : ''}>${key}</option>
            `).join('')}
          </select>
        </div>
        <div class="option-group">
          <label>遅延時間 (秒):</label>
          <input type="number" id="animation-delay" class="animation-input" min="0" max="10" step="0.1" value="${currentDelay}">
        </div>
        <div class="option-group">
          <label>再生時間 (秒):</label>
          <input type="number" id="animation-duration" class="animation-input" min="0.1" max="10" step="0.1" value="${currentDuration}">
        </div>
        <div class="animation-preview">
          <div id="preview-element" class="${currentAnimation}">プレビュー</div>
          <button id="play-preview-btn">再生</button>
        </div>
      </div>
      <div class="animation-actions">
        <button class="apply-animation-btn">適用</button>
        <button class="remove-animation-btn">削除</button>
        <button class="close-btn">キャンセル</button>
      </div>
    </div>
  `;
  
  // スタイルを定義
  const styleContent = `
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
    .element-animation-dialog {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      padding: 20px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .animation-options {
      margin: 15px 0;
    }
    .option-group {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .option-group label {
      flex: 0 0 120px;
    }
    .animation-select, .animation-input {
      flex: 1;
      padding: 5px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .animation-preview {
      margin-top: 20px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
      text-align: center;
      position: relative;
    }
    #preview-element {
      display: inline-block;
      padding: 10px 20px;
      background-color: #2196f3;
      color: white;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    #play-preview-btn {
      padding: 5px 15px;
      border: none;
      border-radius: 4px;
      background-color: #4caf50;
      color: white;
      cursor: pointer;
    }
    .animation-actions {
      display: flex;
      justify-content: flex-end;
    }
    .animation-actions button {
      padding: 8px 16px;
      margin-left: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .apply-animation-btn {
      background-color: #2196f3;
      color: white;
    }
    .remove-animation-btn {
      background-color: #f44336;
      color: white;
    }
    .close-btn {
      background-color: #f5f5f5;
      color: #333;
    }
    @media (max-width: 576px) {
      .element-animation-dialog {
        width: 95%;
        padding: 15px;
      }
      .option-group {
        flex-direction: column;
        align-items: flex-start;
      }
      .option-group label {
        margin-bottom: 5px;
      }
      .animation-select, .animation-input {
        width: 100%;
      }
      .animation-actions {
        flex-wrap: wrap;
        gap: 5px;
      }
      .animation-actions button {
        flex: 1;
        padding: 6px;
        margin-left: 0;
        font-size: 14px;
        white-space: nowrap;
      }
    }
    
    /* アニメーション効果 */
    .animate-fade-in {
      animation: fade-in 1s ease;
    }
    .animate-slide-in-left {
      animation: slide-in-left 1s ease;
    }
    .animate-slide-in-right {
      animation: slide-in-right 1s ease;
    }
    .animate-slide-in-up {
      animation: slide-in-up 1s ease;
    }
    .animate-slide-in-down {
      animation: slide-in-down 1s ease;
    }
    .animate-zoom-in {
      animation: zoom-in 1s ease;
    }
    .animate-bounce {
      animation: bounce 1s ease;
    }
    .animate-pulse {
      animation: pulse 1s ease infinite;
    }
    .animate-shake {
      animation: shake 0.5s ease infinite;
    }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slide-in-left {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-in-right {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-in-up {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slide-in-down {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes zoom-in {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-30px); }
      60% { transform: translateY(-15px); }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;
  
  // ダイアログを表示
  const dialogElement = document.createElement('div');
  dialogElement.className = 'modal-overlay';
  dialogElement.innerHTML = dialogHTML;
  document.body.appendChild(dialogElement);
  
  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = styleContent;
  document.head.appendChild(style);
  
  // エフェクト選択時のプレビュー更新
  const effectSelect = dialogElement.querySelector('#animation-effect');
  const previewElement = dialogElement.querySelector('#preview-element');
  
  effectSelect.addEventListener('change', () => {
    // 既存のアニメーションクラスをすべて削除
    Object.values(elementAnimations).forEach(animClass => {
      previewElement.classList.remove(animClass);
    });
    
    // 選択されたアニメーションクラスを追加
    const selectedAnimation = effectSelect.value;
    if (selectedAnimation) {
      previewElement.classList.add(selectedAnimation);
    }
  });
  
  // プレビュー再生ボタン
  const playPreviewBtn = dialogElement.querySelector('#play-preview-btn');
  playPreviewBtn.addEventListener('click', () => {
    // 現在のアニメーションをリセット
    const animation = effectSelect.value;
    if (animation) {
      previewElement.classList.remove(animation);
      
      // アニメーションのリセットをトリガーするためのリフロー
      void previewElement.offsetWidth;
      
      // アニメーションを再適用
      previewElement.classList.add(animation);
    }
  });
  
  // 適用ボタン
  dialogElement.querySelector('.apply-animation-btn').addEventListener('click', () => {
    // 選択された設定を取得
    const selectedAnimation = effectSelect.value;
    const selectedDelay = dialogElement.querySelector('#animation-delay').value;
    const selectedDuration = dialogElement.querySelector('#animation-duration').value;
    
    // 要素にアニメーション属性を設定
    if (selectedAnimation) {
      selectedElement.dataset.animation = selectedAnimation;
      selectedElement.dataset.animationDelay = selectedDelay;
      selectedElement.dataset.animationDuration = selectedDuration;
      
      // CSSを使用したスタイルの適用
      selectedElement.classList.add(selectedAnimation);
      selectedElement.style.animationDelay = `${selectedDelay}s`;
      selectedElement.style.animationDuration = `${selectedDuration}s`;
    }
    
    // 変更フラグを設定
    presentationState.isModified = true;
    updatePresentationStatus();
    
    // 現在のスライドの内容を更新
    const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
    currentSlide.content = slideContent.innerHTML;
    
    // サムネイルを更新
    const thumbnail = slidesPanel.querySelector(`.slide-thumbnail[data-slide-id="${currentSlide.id}"] .thumbnail-content`);
    if (thumbnail) {
      thumbnail.innerHTML = currentSlide.content;
    }
    
    // ダイアログを閉じる
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // 削除ボタン
  dialogElement.querySelector('.remove-animation-btn').addEventListener('click', () => {
    // 要素からアニメーション属性を削除
    delete selectedElement.dataset.animation;
    delete selectedElement.dataset.animationDelay;
    delete selectedElement.dataset.animationDuration;
    
    // CSSクラスを削除
    Object.values(elementAnimations).forEach(animClass => {
      selectedElement.classList.remove(animClass);
    });
    
    // スタイルをリセット
    selectedElement.style.animationDelay = '';
    selectedElement.style.animationDuration = '';
    
    // 変更フラグを設定
    presentationState.isModified = true;
    updatePresentationStatus();
    
    // 現在のスライドの内容を更新
    const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
    currentSlide.content = slideContent.innerHTML;
    
    // サムネイルを更新
    const thumbnail = slidesPanel.querySelector(`.slide-thumbnail[data-slide-id="${currentSlide.id}"] .thumbnail-content`);
    if (thumbnail) {
      thumbnail.innerHTML = currentSlide.content;
    }
    
    // ダイアログを閉じる
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // キャンセルボタン
  dialogElement.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(dialogElement);
    document.head.removeChild(style);
  });
  
  // 背景クリックで閉じる
  dialogElement.addEventListener('click', (e) => {
    if (e.target === dialogElement) {
      document.body.removeChild(dialogElement);
      document.head.removeChild(style);
    }
  });
}

/**
 * スライドにテキストボックスを追加
 */
function addTextBoxToSlide() {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // テキストボックス要素を作成
  const textBox = document.createElement('div');
  textBox.className = 'slide-element text-box-element';
  textBox.contentEditable = true;
  textBox.innerHTML = 'テキストを入力';
  textBox.style.position = 'absolute';
  textBox.style.top = '50%';
  textBox.style.left = '50%';
  textBox.style.transform = 'translate(-50%, -50%)';
  textBox.style.minWidth = '200px';
  textBox.style.minHeight = '50px';
  textBox.style.padding = '10px';
  textBox.style.border = '1px dashed #ccc';
  textBox.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  
  // ドラッグ機能を設定
  makeElementDraggable(textBox);
  
  // リサイズハンドルを追加
  addResizeHandles(textBox);
  
  // スライドに追加
  slideContent.appendChild(textBox);
  
  // フォーカスを設定
  textBox.focus();
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * 図形選択ダイアログを表示
 */
function showShapeSelectionDialog() {
  // ダイアログ用のオーバーレイを作成
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3 class="dialog-title">図形を選択</h3>
      <button class="dialog-close">&times;</button>
    </div>
    <div class="dialog-body">
      <div class="shape-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div class="shape-option" data-shape="rectangle" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="5" width="30" height="20" />
          </svg>
        </div>
        <div class="shape-option" data-shape="circle" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="20" cy="15" r="10" />
          </svg>
        </div>
        <div class="shape-option" data-shape="triangle" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="20,5 5,25 35,25" />
          </svg>
        </div>
        <div class="shape-option" data-shape="arrow" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5,15 H30 M25,7 L35,15 L25,23" />
          </svg>
        </div>
        <div class="shape-option" data-shape="star" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="20,2 24,10 33,12 27,18 28,28 20,23 12,28 13,18 7,12 16,10" />
          </svg>
        </div>
        <div class="shape-option" data-shape="hexagon" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="30,15 25,25 15,25 10,15 15,5 25,5" />
          </svg>
        </div>
        <div class="shape-option" data-shape="cloud" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10,20 C6,20 6,15 10,15 C10,10 17,10 18,15 C22,11 30,15 28,20 C32,20 32,25 28,25 C28,25 12,25 12,25 C8,25 8,20 10,20 Z" />
          </svg>
        </div>
        <div class="shape-option" data-shape="diamond" style="height: 60px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="20,5 30,15 20,25 10,15" />
          </svg>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <label for="shape-color" style="display: block; margin-bottom: 5px;">色:</label>
        <input type="color" id="shape-color" value="#4285f4" style="width: 100%;">
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-btn cancel">キャンセル</button>
      <button class="dialog-btn primary">図形を追加</button>
    </div>
  `;
  
  // ダイアログをオーバーレイに追加
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // ダイアログ閉じるイベント
  const closeButton = dialog.querySelector('.dialog-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // キャンセルボタンイベント
  const cancelButton = dialog.querySelector('.dialog-btn.cancel');
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // 図形オプションクリックイベント
  const shapeOptions = dialog.querySelectorAll('.shape-option');
  let selectedShape = null;
  
  shapeOptions.forEach(option => {
    option.addEventListener('click', () => {
      // 以前に選択された図形の選択を解除
      shapeOptions.forEach(opt => opt.style.border = '1px solid #ddd');
      
      // 新しい図形を選択
      option.style.border = '2px solid #4285f4';
      selectedShape = option.dataset.shape;
    });
  });
  
  // 図形追加ボタンイベント
  const addButton = dialog.querySelector('.dialog-btn.primary');
  addButton.addEventListener('click', () => {
    if (selectedShape) {
      const color = document.getElementById('shape-color').value;
      addShapeToSlide(selectedShape, color);
      document.body.removeChild(overlay);
    } else {
      alert('図形を選択してください');
    }
  });
}

/**
 * スライドに図形を追加
 * @param {string} shapeType - 図形タイプ
 * @param {string} color - 図形の色
 */
function addShapeToSlide(shapeType, color) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // 図形要素を作成
  const shape = document.createElement('div');
  shape.className = `slide-element shape-element ${shapeType}`;
  shape.style.position = 'absolute';
  shape.style.top = '50%';
  shape.style.left = '50%';
  shape.style.transform = 'translate(-50%, -50%)';
  shape.style.width = '100px';
  shape.style.height = '100px';
  shape.style.backgroundColor = color;
  
  // 図形に応じたスタイル設定
  switch (shapeType) {
    case 'circle':
      shape.style.borderRadius = '50%';
      break;
    case 'rectangle':
      // デフォルトのまま
      break;
    case 'triangle':
      shape.style.width = '0';
      shape.style.height = '0';
      shape.style.backgroundColor = 'transparent';
      shape.style.borderLeft = '50px solid transparent';
      shape.style.borderRight = '50px solid transparent';
      shape.style.borderBottom = `100px solid ${color}`;
      break;
    case 'arrow':
      shape.innerHTML = `<svg width="100" height="100" viewBox="0 0 40 30" fill="${color}" stroke="black" stroke-width="1">
        <path d="M5,15 H30 M25,7 L35,15 L25,23" />
      </svg>`;
      break;
    case 'star':
      shape.innerHTML = `<svg width="100" height="100" viewBox="0 0 40 30" fill="${color}" stroke="black" stroke-width="1">
        <polygon points="20,2 24,10 33,12 27,18 28,28 20,23 12,28 13,18 7,12 16,10" />
      </svg>`;
      break;
    case 'hexagon':
      shape.innerHTML = `<svg width="100" height="100" viewBox="0 0 40 30" fill="${color}" stroke="black" stroke-width="1">
        <polygon points="30,15 25,25 15,25 10,15 15,5 25,5" />
      </svg>`;
      break;
    case 'cloud':
      shape.innerHTML = `<svg width="100" height="100" viewBox="0 0 40 30" fill="${color}" stroke="black" stroke-width="1">
        <path d="M10,20 C6,20 6,15 10,15 C10,10 17,10 18,15 C22,11 30,15 28,20 C32,20 32,25 28,25 C28,25 12,25 12,25 C8,25 8,20 10,20 Z" />
      </svg>`;
      break;
    case 'diamond':
      shape.innerHTML = `<svg width="100" height="100" viewBox="0 0 40 30" fill="${color}" stroke="black" stroke-width="1">
        <polygon points="20,5 30,15 20,25 10,15" />
      </svg>`;
      break;
  }
  
  // ドラッグ機能を設定
  makeElementDraggable(shape);
  
  // リサイズハンドルを追加
  addResizeHandles(shape);
  
  // スライドに追加
  slideContent.appendChild(shape);
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * 要素をドラッグ可能にする
 * @param {HTMLElement} element - ドラッグ可能にする要素
 */
function makeElementDraggable(element) {
  let startX, startY, startLeft, startTop;
  
  element.addEventListener('mousedown', startDrag);
  
  function startDrag(e) {
    // 編集中にドラッグを開始しない
    if (e.target.isContentEditable) return;
    
    e.preventDefault();
    
    // ドラッグ中のクラスを追加
    element.classList.add('dragging');
    
    // 全ての選択済み要素から選択を解除
    document.querySelectorAll('.slide-element.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // この要素を選択
    element.classList.add('selected');
    
    // 開始位置を記録
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = element.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    // ドラッグイベントを追加
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  }
  
  function drag(e) {
    e.preventDefault();
    
    // マウス移動量を計算
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // 親要素内の座標を取得
    const parentRect = element.parentElement.getBoundingClientRect();
    const newLeft = startLeft - parentRect.left + dx;
    const newTop = startTop - parentRect.top + dy;
    
    // 位置を更新
    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
    element.style.transform = 'none'; // translate(-50%, -50%)を解除
  }
  
  function stopDrag() {
    // ドラッグ中のクラスを削除
    element.classList.remove('dragging');
    
    // イベントリスナーを削除
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    
    // スライドの変更を保存
    saveSlideChanges();
  }
}

/**
 * 要素にリサイズハンドルを追加
 * @param {HTMLElement} element - リサイズハンドルを追加する要素
 */
function addResizeHandles(element) {
  const handles = [
    { class: 'top-left', cursor: 'nwse-resize' },
    { class: 'top-right', cursor: 'nesw-resize' },
    { class: 'bottom-left', cursor: 'nesw-resize' },
    { class: 'bottom-right', cursor: 'nwse-resize' }
  ];
  
  handles.forEach(handleInfo => {
    const handle = document.createElement('div');
    handle.className = `slide-element-resize-handle ${handleInfo.class}`;
    handle.style.cursor = handleInfo.cursor;
    element.appendChild(handle);
  });
}

/**
 * スライドの変更を保存
 */
function saveSlideChanges() {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
  if (currentSlide) {
    currentSlide.content = slideContent.innerHTML;
    
    // サムネイルも更新
    const thumbnail = slidesPanel.querySelector(`.slide-thumbnail[data-slide-id="${currentSlide.id}"] .thumbnail-content`);
    if (thumbnail) {
      thumbnail.innerHTML = currentSlide.content;
    }
  }
}

/**
 * テーブル挿入ダイアログを表示
 */
function showTableInsertionDialog() {
  // ダイアログ用のオーバーレイを作成
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3 class="dialog-title">テーブルを挿入</h3>
      <button class="dialog-close">&times;</button>
    </div>
    <div class="dialog-body">
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1;">
          <label for="table-rows" style="display: block; margin-bottom: 5px;">行数:</label>
          <input type="number" id="table-rows" min="1" max="20" value="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="flex: 1;">
          <label for="table-cols" style="display: block; margin-bottom: 5px;">列数:</label>
          <input type="number" id="table-cols" min="1" max="10" value="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="table-header" style="display: block; margin-bottom: 5px;">ヘッダー行:</label>
        <select id="table-header" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="none">なし</option>
          <option value="first-row" selected>最初の行</option>
          <option value="first-col">最初の列</option>
          <option value="both">両方</option>
        </select>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="table-style" style="display: block; margin-bottom: 5px;">スタイル:</label>
        <select id="table-style" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="simple" selected>シンプル</option>
          <option value="zebra">シマ模様</option>
          <option value="minimal">ミニマル</option>
          <option value="bordered">ボーダー</option>
        </select>
      </div>
      <div>
        <label for="table-width" style="display: block; margin-bottom: 5px;">幅:</label>
        <select id="table-width" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="auto">自動調整</option>
          <option value="100" selected>100%</option>
          <option value="75">75%</option>
          <option value="50">50%</option>
        </select>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-btn cancel">キャンセル</button>
      <button class="dialog-btn primary">テーブルを挿入</button>
    </div>
  `;
  
  // ダイアログをオーバーレイに追加
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // ダイアログ閉じるイベント
  const closeButton = dialog.querySelector('.dialog-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // キャンセルボタンイベント
  const cancelButton = dialog.querySelector('.dialog-btn.cancel');
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // テーブル挿入ボタンイベント
  const insertButton = dialog.querySelector('.dialog-btn.primary');
  insertButton.addEventListener('click', () => {
    const rows = parseInt(document.getElementById('table-rows').value, 10);
    const cols = parseInt(document.getElementById('table-cols').value, 10);
    const headerType = document.getElementById('table-header').value;
    const tableStyle = document.getElementById('table-style').value;
    const tableWidth = document.getElementById('table-width').value;
    
    insertTableToSlide(rows, cols, headerType, tableStyle, tableWidth);
    document.body.removeChild(overlay);
  });
}

/**
 * スライドにテーブルを挿入
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @param {string} headerType - ヘッダータイプ
 * @param {string} tableStyle - テーブルスタイル
 * @param {string} tableWidth - テーブル幅
 */
function insertTableToSlide(rows, cols, headerType, tableStyle, tableWidth) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // テーブル要素を作成
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'slide-element';
  tableWrapper.style.position = 'absolute';
  tableWrapper.style.top = '50%';
  tableWrapper.style.left = '50%';
  tableWrapper.style.transform = 'translate(-50%, -50%)';
  tableWrapper.style.width = tableWidth === 'auto' ? 'auto' : `${tableWidth}%`;
  
  // テーブル作成
  let tableHTML = `<table class="presentation-table ${tableStyle}" style="width: 100%; border-collapse: collapse;">`;
  
  // テーブルの行を作成
  for (let i = 0; i < rows; i++) {
    tableHTML += '<tr>';
    
    // テーブルのセルを作成
    for (let j = 0; j < cols; j++) {
      const isHeaderRow = headerType === 'first-row' || headerType === 'both' ? i === 0 : false;
      const isHeaderCol = headerType === 'first-col' || headerType === 'both' ? j === 0 : false;
      
      if (isHeaderRow || isHeaderCol) {
        tableHTML += `<th style="border: 1px solid #ccc; padding: 8px; text-align: center; background-color: #f5f5f5;">見出し</th>`;
      } else {
        tableHTML += `<td style="border: 1px solid #ccc; padding: 8px; text-align: left;">データ</td>`;
      }
    }
    
    tableHTML += '</tr>';
  }
  
  tableHTML += '</table>';
  tableWrapper.innerHTML = tableHTML;
  
  // ドラッグ機能を設定
  makeElementDraggable(tableWrapper);
  
  // リサイズハンドルを追加
  addResizeHandles(tableWrapper);
  
  // スライドに追加
  slideContent.appendChild(tableWrapper);
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * グラフ作成ダイアログを表示
 */
function showChartCreationDialog() {
  // ダイアログ用のオーバーレイを作成
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3 class="dialog-title">グラフを作成</h3>
      <button class="dialog-close">&times;</button>
    </div>
    <div class="dialog-body">
      <div style="margin-bottom: 20px;">
        <label for="chart-type" style="display: block; margin-bottom: 5px;">グラフタイプ:</label>
        <select id="chart-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="bar" selected>棒グラフ</option>
          <option value="line">折れ線グラフ</option>
          <option value="pie">円グラフ</option>
          <option value="doughnut">ドーナツグラフ</option>
        </select>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="chart-title" style="display: block; margin-bottom: 5px;">グラフタイトル:</label>
        <input type="text" id="chart-title" value="グラフタイトル" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="chart-data-series" style="display: block; margin-bottom: 5px;">データ系列数:</label>
        <input type="number" id="chart-data-series" min="1" max="5" value="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="chart-data-labels" style="display: block; margin-bottom: 5px;">ラベル (カンマ区切り):</label>
        <input type="text" id="chart-data-labels" value="項目1, 項目2, 項目3, 項目4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div id="data-series-container" style="margin-bottom: 20px;">
        <div class="data-series" style="margin-bottom: 10px;">
          <label for="data-series-1" style="display: block; margin-bottom: 5px;">データ系列1 (カンマ区切り):</label>
          <input type="text" id="data-series-1" value="10, 20, 30, 40" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="chart-width" style="display: block; margin-bottom: 5px;">グラフサイズ:</label>
        <select id="chart-width" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="small">小 (300x200)</option>
          <option value="medium" selected>中 (400x300)</option>
          <option value="large">大 (600x400)</option>
        </select>
      </div>
      
      <div>
        <label for="chart-color-scheme" style="display: block; margin-bottom: 5px;">カラースキーム:</label>
        <select id="chart-color-scheme" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="default" selected>デフォルト</option>
          <option value="pastel">パステル</option>
          <option value="vivid">ビビッド</option>
          <option value="monochrome">モノクローム</option>
        </select>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-btn cancel">キャンセル</button>
      <button class="dialog-btn primary">グラフを挿入</button>
    </div>
  `;
  
  // ダイアログをオーバーレイに追加
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // データ系列数の変更イベント
  const dataSeriesInput = dialog.querySelector('#chart-data-series');
  const dataSeriesContainer = dialog.querySelector('#data-series-container');
  
  dataSeriesInput.addEventListener('change', () => {
    const seriesCount = parseInt(dataSeriesInput.value, 10);
    
    // 現在のデータ系列入力欄をクリア
    dataSeriesContainer.innerHTML = '';
    
    // 新しいデータ系列入力欄を作成
    for (let i = 0; i < seriesCount; i++) {
      const seriesInput = document.createElement('div');
      seriesInput.className = 'data-series';
      seriesInput.style.marginBottom = '10px';
      seriesInput.innerHTML = `
        <label for="data-series-${i+1}" style="display: block; margin-bottom: 5px;">データ系列${i+1} (カンマ区切り):</label>
        <input type="text" id="data-series-${i+1}" value="10, 20, 30, 40" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      `;
      dataSeriesContainer.appendChild(seriesInput);
    }
  });
  
  // ダイアログ閉じるイベント
  const closeButton = dialog.querySelector('.dialog-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // キャンセルボタンイベント
  const cancelButton = dialog.querySelector('.dialog-btn.cancel');
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // グラフ挿入ボタンイベント
  const insertButton = dialog.querySelector('.dialog-btn.primary');
  insertButton.addEventListener('click', () => {
    const chartType = document.getElementById('chart-type').value;
    const chartTitle = document.getElementById('chart-title').value;
    const chartDataLabels = document.getElementById('chart-data-labels').value.split(',').map(label => label.trim());
    const seriesCount = parseInt(document.getElementById('chart-data-series').value, 10);
    const chartWidth = document.getElementById('chart-width').value;
    const colorScheme = document.getElementById('chart-color-scheme').value;
    
    // データ系列を収集
    const dataSeries = [];
    for (let i = 0; i < seriesCount; i++) {
      const seriesData = document.getElementById(`data-series-${i+1}`).value.split(',').map(value => parseFloat(value.trim()));
      dataSeries.push(seriesData);
    }
    
    // グラフを挿入
    insertChartToSlide(chartType, chartTitle, chartDataLabels, dataSeries, chartWidth, colorScheme);
    document.body.removeChild(overlay);
  });
}

/**
 * スライドにグラフを挿入
 * @param {string} chartType - グラフタイプ
 * @param {string} title - グラフタイトル
 * @param {string[]} labels - データラベル
 * @param {number[][]} dataSeries - データ系列
 * @param {string} size - グラフサイズ
 * @param {string} colorScheme - カラースキーム
 */
function insertChartToSlide(chartType, title, labels, dataSeries, size, colorScheme) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // サイズの設定
  let width, height;
  switch (size) {
    case 'small':
      width = 300;
      height = 200;
      break;
    case 'large':
      width = 600;
      height = 400;
      break;
    case 'medium':
    default:
      width = 400;
      height = 300;
      break;
  }
  
  // カラースキームの設定
  let colors;
  switch (colorScheme) {
    case 'pastel':
      colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
      break;
    case 'vivid':
      colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#f94144', '#f3722c'];
      break;
    case 'monochrome':
      colors = ['#303030', '#505050', '#707070', '#909090', '#b0b0b0', '#d0d0d0', '#f0f0f0'];
      break;
    case 'default':
    default:
      colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#8958ff', '#00C49F', '#2196F3'];
      break;
  }
  
  // グラフ要素を作成
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'slide-element chart-element';
  chartWrapper.style.position = 'absolute';
  chartWrapper.style.top = '50%';
  chartWrapper.style.left = '50%';
  chartWrapper.style.transform = 'translate(-50%, -50%)';
  chartWrapper.style.width = `${width}px`;
  chartWrapper.style.height = `${height}px`;
  chartWrapper.style.backgroundColor = 'white';
  chartWrapper.style.border = '1px solid #ddd';
  chartWrapper.style.borderRadius = '4px';
  chartWrapper.style.overflow = 'hidden';
  
  // グラフのデータ属性を設定
  chartWrapper.dataset.chartType = chartType;
  chartWrapper.dataset.chartTitle = title;
  chartWrapper.dataset.chartLabels = JSON.stringify(labels);
  chartWrapper.dataset.chartData = JSON.stringify(dataSeries);
  chartWrapper.dataset.chartColors = JSON.stringify(colors);
  
  // グラフのプレビューを描画（実際のプレゼンテーションでは適切なグラフライブラリを使用）
  chartWrapper.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; text-align: center;">${title}</h3>
      <div style="flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
        <svg width="100%" height="100%" viewBox="0 0 ${width - 40} ${height - 60}" style="font-family: sans-serif; font-size: 12px;">
          ${generateChartSVG(chartType, labels, dataSeries, colors, width - 40, height - 60)}
        </svg>
      </div>
    </div>
  `;
  
  // ドラッグ機能を設定
  makeElementDraggable(chartWrapper);
  
  // リサイズハンドルを追加
  addResizeHandles(chartWrapper);
  
  // スライドに追加
  slideContent.appendChild(chartWrapper);
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * グラフのSVGを生成
 * @param {string} chartType - グラフタイプ
 * @param {string[]} labels - データラベル
 * @param {number[][]} dataSeries - データ系列
 * @param {string[]} colors - 色の配列
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @returns {string} SVG要素文字列
 */
function generateChartSVG(chartType, labels, dataSeries, colors, width, height) {
  switch (chartType) {
    case 'bar':
      return generateBarChartSVG(labels, dataSeries, colors, width, height);
    case 'line':
      return generateLineChartSVG(labels, dataSeries, colors, width, height);
    case 'pie':
      return generatePieChartSVG(labels, dataSeries[0], colors, width, height);
    case 'doughnut':
      return generateDoughnutChartSVG(labels, dataSeries[0], colors, width, height);
    default:
      return generateBarChartSVG(labels, dataSeries, colors, width, height);
  }
}

/**
 * 棒グラフのSVGを生成
 * @param {string[]} labels - データラベル
 * @param {number[][]} dataSeries - データ系列
 * @param {string[]} colors - 色の配列
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @returns {string} SVG要素文字列
 */
function generateBarChartSVG(labels, dataSeries, colors, width, height) {
  // 簡易的な棒グラフの描画
  const padding = { top: 30, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 最大値を計算
  let maxValue = 0;
  dataSeries.forEach(series => {
    const seriesMax = Math.max(...series);
    if (seriesMax > maxValue) maxValue = seriesMax;
  });
  
  // スケールを設定
  const yScale = chartHeight / maxValue;
  const barGroupWidth = chartWidth / labels.length;
  const barWidth = barGroupWidth / (dataSeries.length + 1) * 0.8;
  
  let svg = '';
  
  // Y軸を描画
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#ccc" />`;
  
  // X軸を描画
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#ccc" />`;
  
  // Y軸の目盛りとグリッドラインを描画
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const yValue = maxValue * (yTickCount - i) / yTickCount;
    const yPos = padding.top + chartHeight * i / yTickCount;
    
    // 目盛りの線
    svg += `<line x1="${padding.left - 5}" y1="${yPos}" x2="${padding.left}" y2="${yPos}" stroke="#666" />`;
    
    // 目盛りのラベル
    svg += `<text x="${padding.left - 10}" y="${yPos + 4}" text-anchor="end" font-size="10" fill="#666">${Math.round(yValue)}</text>`;
    
    // グリッドライン
    svg += `<line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#eee" stroke-dasharray="3,3" />`;
  }
  
  // 棒グラフを描画
  dataSeries.forEach((series, seriesIndex) => {
    series.forEach((value, valueIndex) => {
      const barHeight = value * yScale;
      const barX = padding.left + barGroupWidth * valueIndex + barWidth * seriesIndex + barWidth * 0.5;
      const barY = height - padding.bottom - barHeight;
      
      // 棒を描画
      svg += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${colors[seriesIndex % colors.length]}" />`;
    });
  });
  
  // X軸のラベルを描画
  labels.forEach((label, index) => {
    const labelX = padding.left + barGroupWidth * index + barGroupWidth / 2;
    const labelY = height - padding.bottom + 15;
    
    svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="#666">${label}</text>`;
  });
  
  return svg;
}

/**
 * 折れ線グラフのSVGを生成
 * @param {string[]} labels - データラベル
 * @param {number[][]} dataSeries - データ系列
 * @param {string[]} colors - 色の配列
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @returns {string} SVG要素文字列
 */
function generateLineChartSVG(labels, dataSeries, colors, width, height) {
  // 簡易的な折れ線グラフの描画
  const padding = { top: 30, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 最大値を計算
  let maxValue = 0;
  dataSeries.forEach(series => {
    const seriesMax = Math.max(...series);
    if (seriesMax > maxValue) maxValue = seriesMax;
  });
  
  // スケールを設定
  const yScale = chartHeight / maxValue;
  const xStep = chartWidth / (labels.length - 1);
  
  let svg = '';
  
  // Y軸を描画
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#ccc" />`;
  
  // X軸を描画
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#ccc" />`;
  
  // Y軸の目盛りとグリッドラインを描画
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const yValue = maxValue * (yTickCount - i) / yTickCount;
    const yPos = padding.top + chartHeight * i / yTickCount;
    
    // 目盛りの線
    svg += `<line x1="${padding.left - 5}" y1="${yPos}" x2="${padding.left}" y2="${yPos}" stroke="#666" />`;
    
    // 目盛りのラベル
    svg += `<text x="${padding.left - 10}" y="${yPos + 4}" text-anchor="end" font-size="10" fill="#666">${Math.round(yValue)}</text>`;
    
    // グリッドライン
    svg += `<line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#eee" stroke-dasharray="3,3" />`;
  }
  
  // 折れ線グラフを描画
  dataSeries.forEach((series, seriesIndex) => {
    let pathData = '';
    
    series.forEach((value, valueIndex) => {
      const x = padding.left + xStep * valueIndex;
      const y = height - padding.bottom - value * yScale;
      
      if (valueIndex === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    
    // 折れ線を描画
    svg += `<path d="${pathData}" fill="none" stroke="${colors[seriesIndex % colors.length]}" stroke-width="2" />`;
    
    // データポイントを描画
    series.forEach((value, valueIndex) => {
      const x = padding.left + xStep * valueIndex;
      const y = height - padding.bottom - value * yScale;
      
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${colors[seriesIndex % colors.length]}" stroke="white" stroke-width="1" />`;
    });
  });
  
  // X軸のラベルを描画
  labels.forEach((label, index) => {
    const labelX = padding.left + xStep * index;
    const labelY = height - padding.bottom + 15;
    
    svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="#666">${label}</text>`;
  });
  
  return svg;
}

/**
 * 円グラフのSVGを生成
 * @param {string[]} labels - データラベル
 * @param {number[]} data - データ
 * @param {string[]} colors - 色の配列
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @returns {string} SVG要素文字列
 */
function generatePieChartSVG(labels, data, colors, width, height) {
  // 簡易的な円グラフの描画
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.8;
  
  // 合計値を計算
  const total = data.reduce((acc, value) => acc + value, 0);
  
  let svg = '';
  let startAngle = 0;
  
  // 円グラフのスライスを描画
  data.forEach((value, index) => {
    const angle = (value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    
    // スライスのパスを計算
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    
    // スライスを描画
    svg += `<path d="${pathData}" fill="${colors[index % colors.length]}" stroke="white" stroke-width="1" />`;
    
    // ラベルを描画
    const labelAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);
    
    // パーセンテージを計算
    const percentage = Math.round((value / total) * 100);
    
    if (percentage >= 5) { // 小さすぎるスライスにはラベルを表示しない
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="white" font-weight="bold">${percentage}%</text>`;
    }
    
    startAngle = endAngle;
  });
  
  // 凡例を描画
  const legendItemHeight = 20;
  let legendY = height - data.length * legendItemHeight / 2;
  
  labels.forEach((label, index) => {
    const legendX = width * 0.85;
    
    // カラーマーカー
    svg += `<rect x="${legendX - 15}" y="${legendY - 8}" width="10" height="10" fill="${colors[index % colors.length]}" />`;
    
    // ラベル
    svg += `<text x="${legendX}" y="${legendY}" text-anchor="start" font-size="10" fill="#666">${label}</text>`;
    
    legendY += legendItemHeight;
  });
  
  return svg;
}

/**
 * ドーナツグラフのSVGを生成
 * @param {string[]} labels - データラベル
 * @param {number[]} data - データ
 * @param {string[]} colors - 色の配列
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @returns {string} SVG要素文字列
 */
function generateDoughnutChartSVG(labels, data, colors, width, height) {
  // 簡易的なドーナツグラフの描画
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(centerX, centerY) * 0.8;
  const innerRadius = outerRadius * 0.6;
  
  // 合計値を計算
  const total = data.reduce((acc, value) => acc + value, 0);
  
  let svg = '';
  let startAngle = 0;
  
  // ドーナツグラフのスライスを描画
  data.forEach((value, index) => {
    const angle = (value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    
    // 外側のアーク
    const outerX1 = centerX + outerRadius * Math.cos(startAngle);
    const outerY1 = centerY + outerRadius * Math.sin(startAngle);
    const outerX2 = centerX + outerRadius * Math.cos(endAngle);
    const outerY2 = centerY + outerRadius * Math.sin(endAngle);
    
    // 内側のアーク
    const innerX1 = centerX + innerRadius * Math.cos(endAngle);
    const innerY1 = centerY + innerRadius * Math.sin(endAngle);
    const innerX2 = centerX + innerRadius * Math.cos(startAngle);
    const innerY2 = centerY + innerRadius * Math.sin(startAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = `
      M ${outerX1} ${outerY1}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
      L ${innerX1} ${innerY1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}
      Z
    `;
    
    // スライスを描画
    svg += `<path d="${pathData}" fill="${colors[index % colors.length]}" stroke="white" stroke-width="1" />`;
    
    // 中央の値を表示
    if (index === 0) {
      svg += `<text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-size="14" fill="#666">合計</text>`;
      svg += `<text x="${centerX}" y="${centerY + 14}" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">${total}</text>`;
    }
    
    startAngle = endAngle;
  });
  
  // 凡例を描画
  const legendItemHeight = 20;
  let legendY = height - data.length * legendItemHeight / 2;
  
  labels.forEach((label, index) => {
    const legendX = width * 0.85;
    
    // カラーマーカー
    svg += `<rect x="${legendX - 15}" y="${legendY - 8}" width="10" height="10" fill="${colors[index % colors.length]}" />`;
    
    // ラベル
    svg += `<text x="${legendX}" y="${legendY}" text-anchor="start" font-size="10" fill="#666">${label}</text>`;
    
    legendY += legendItemHeight;
  });
  
  return svg;
}

/**
 * 背景設定ダイアログを表示
 */
function showBackgroundSettingsDialog() {
  // ダイアログ用のオーバーレイを作成
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  
  // 背景色とグラデーションのプリセット
  const colorPresets = [
    { name: 'ホワイト', value: '#ffffff' },
    { name: 'ライトグレー', value: '#f5f5f5' },
    { name: 'ブルー', value: '#e8f0fe' },
    { name: 'グリーン', value: '#e6f4ea' },
    { name: 'イエロー', value: '#fef6e0' },
    { name: 'ピンク', value: '#fce4ec' },
    { name: 'パープル', value: '#f3e5f5' }
  ];
  
  const gradientPresets = [
    { name: 'ブルーグラデーション', value: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)' },
    { name: 'グリーングラデーション', value: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
    { name: 'オレンジグラデーション', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
    { name: 'パープルグラデーション', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { name: 'レッドグラデーション', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { name: 'ダークグラデーション', value: 'linear-gradient(135deg, #434343 0%, #000000 100%)' }
  ];
  
  // 画像プリセット (Base64エンコードされた画像はサイズの都合上、実際の実装では外部ファイルを使用すべき)
  const imagePresets = [
    { name: 'パターン1', value: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="50" height="50" fill="%23f5f5f5"/><rect x="50" y="50" width="50" height="50" fill="%23f5f5f5"/><rect x="50" y="0" width="50" height="50" fill="%23ffffff"/><rect x="0" y="50" width="50" height="50" fill="%23ffffff"/></svg>')` },
    { name: 'パターン2', value: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="%23f5f5f5" stroke-width="2" fill="white"/></svg>')` },
    { name: 'パターン3', value: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M0,0 L100,100 M0,100 L100,0" stroke="%23f5f5f5" stroke-width="1"/></svg>')` }
  ];
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3 class="dialog-title">背景設定</h3>
      <button class="dialog-close">&times;</button>
    </div>
    <div class="dialog-body">
      <div style="margin-bottom: 20px;">
        <label for="background-type" style="display: block; margin-bottom: 5px;">背景タイプ:</label>
        <select id="background-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="color" selected>単色</option>
          <option value="gradient">グラデーション</option>
          <option value="image">画像</option>
          <option value="pattern">パターン</option>
        </select>
      </div>
      
      <div id="color-options" class="background-options">
        <div style="margin-bottom: 15px;">
          <label for="bg-color-picker" style="display: block; margin-bottom: 5px;">色を選択:</label>
          <input type="color" id="bg-color-picker" value="#ffffff" style="width: 100%; height: 40px;">
        </div>
        
        <label style="display: block; margin-bottom: 5px;">プリセット:</label>
        <div class="background-settings">
          ${colorPresets.map(preset => `
            <div class="background-option" data-value="${preset.value}" style="background-color: ${preset.value};" title="${preset.name}"></div>
          `).join('')}
        </div>
      </div>
      
      <div id="gradient-options" class="background-options" style="display: none;">
        <label style="display: block; margin-bottom: 5px;">グラデーションを選択:</label>
        <div class="background-settings">
          ${gradientPresets.map(preset => `
            <div class="background-option" data-value="${preset.value}" style="background: ${preset.value};" title="${preset.name}"></div>
          `).join('')}
        </div>
      </div>
      
      <div id="image-options" class="background-options" style="display: none;">
        <div style="margin-bottom: 15px;">
          <label for="bg-image-url" style="display: block; margin-bottom: 5px;">画像URL:</label>
          <input type="text" id="bg-image-url" placeholder="https://example.com/image.jpg" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="bg-image-upload" style="display: block; margin-bottom: 5px;">または画像をアップロード:</label>
          <input type="file" id="bg-image-upload" accept="image/*" style="width: 100%;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="bg-image-size" style="display: block; margin-bottom: 5px;">サイズ:</label>
          <select id="bg-image-size" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="cover" selected>カバー (cover)</option>
            <option value="contain">コンテイン (contain)</option>
            <option value="100% 100%">引き伸ばし (stretch)</option>
            <option value="auto">自動 (auto)</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="bg-image-position" style="display: block; margin-bottom: 5px;">位置:</label>
          <select id="bg-image-position" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="center" selected>中央</option>
            <option value="top">上</option>
            <option value="bottom">下</option>
            <option value="left">左</option>
            <option value="right">右</option>
            <option value="top left">左上</option>
            <option value="top right">右上</option>
            <option value="bottom left">左下</option>
            <option value="bottom right">右下</option>
          </select>
        </div>
      </div>
      
      <div id="pattern-options" class="background-options" style="display: none;">
        <label style="display: block; margin-bottom: 5px;">パターンを選択:</label>
        <div class="background-settings">
          ${imagePresets.map(preset => `
            <div class="background-option" data-value="${preset.value}" style="background: ${preset.value};" title="${preset.name}"></div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <label for="bg-opacity" style="display: block; margin-bottom: 5px;">不透明度: <span id="opacity-value">100%</span></label>
        <input type="range" id="bg-opacity" min="0" max="100" value="100" style="width: 100%;">
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-btn cancel">キャンセル</button>
      <button class="dialog-btn primary">適用</button>
    </div>
  `;
  
  // ダイアログをオーバーレイに追加
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // 背景タイプの切り替え
  const backgroundType = dialog.querySelector('#background-type');
  const optionsContainers = dialog.querySelectorAll('.background-options');
  
  backgroundType.addEventListener('change', () => {
    const selectedType = backgroundType.value;
    
    optionsContainers.forEach(container => {
      container.style.display = 'none';
    });
    
    dialog.querySelector(`#${selectedType}-options`).style.display = 'block';
  });
  
  // 不透明度スライダーの更新
  const opacitySlider = dialog.querySelector('#bg-opacity');
  const opacityValue = dialog.querySelector('#opacity-value');
  
  opacitySlider.addEventListener('input', () => {
    opacityValue.textContent = `${opacitySlider.value}%`;
  });
  
  // 背景オプションのクリックイベント
  const backgroundOptions = dialog.querySelectorAll('.background-option');
  
  backgroundOptions.forEach(option => {
    option.addEventListener('click', () => {
      const container = option.closest('.background-options');
      
      // 同じカテゴリー内の選択を解除
      container.querySelectorAll('.background-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // 新しいオプションを選択
      option.classList.add('selected');
      
      // カラーピッカーを更新（単色の場合）
      if (container.id === 'color-options') {
        dialog.querySelector('#bg-color-picker').value = option.dataset.value;
      }
    });
  });
  
  // カラーピッカーの変更イベント
  const colorPicker = dialog.querySelector('#bg-color-picker');
  colorPicker.addEventListener('input', () => {
    // 選択済みのプリセットを解除
    dialog.querySelectorAll('#color-options .background-option').forEach(opt => {
      opt.classList.remove('selected');
    });
  });
  
  // ダイアログ閉じるイベント
  const closeButton = dialog.querySelector('.dialog-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // キャンセルボタンイベント
  const cancelButton = dialog.querySelector('.dialog-btn.cancel');
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // 適用ボタンイベント
  const applyButton = dialog.querySelector('.dialog-btn.primary');
  applyButton.addEventListener('click', () => {
    const type = backgroundType.value;
    const opacity = opacitySlider.value / 100;
    let backgroundValue = '';
    
    switch (type) {
      case 'color':
        backgroundValue = colorPicker.value;
        break;
      case 'gradient':
        const selectedGradient = dialog.querySelector('#gradient-options .background-option.selected');
        if (selectedGradient) {
          backgroundValue = selectedGradient.dataset.value;
        }
        break;
      case 'image':
        const imageUrl = dialog.querySelector('#bg-image-url').value;
        const imageSize = dialog.querySelector('#bg-image-size').value;
        const imagePosition = dialog.querySelector('#bg-image-position').value;
        
        if (imageUrl) {
          backgroundValue = `url('${imageUrl}')`;
          setSlideBackgroundImage(backgroundValue, imageSize, imagePosition, opacity);
          document.body.removeChild(overlay);
          return;
        }
        
        const imageFile = dialog.querySelector('#bg-image-upload').files[0];
        if (imageFile) {
          const reader = new FileReader();
          reader.onload = function(e) {
            backgroundValue = `url('${e.target.result}')`;
            setSlideBackgroundImage(backgroundValue, imageSize, imagePosition, opacity);
          };
          reader.readAsDataURL(imageFile);
          document.body.removeChild(overlay);
          return;
        }
        break;
      case 'pattern':
        const selectedPattern = dialog.querySelector('#pattern-options .background-option.selected');
        if (selectedPattern) {
          backgroundValue = selectedPattern.dataset.value;
        }
        break;
    }
    
    if (backgroundValue) {
      setSlideBackground(backgroundValue, opacity);
    }
    
    document.body.removeChild(overlay);
  });
}

/**
 * スライドの背景を設定
 * @param {string} background - 背景値
 * @param {number} opacity - 不透明度
 */
function setSlideBackground(background, opacity = 1) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // 背景を設定
  slideContent.style.backgroundColor = 'transparent';
  slideContent.style.backgroundImage = 'none';
  
  if (background.startsWith('#') || background.startsWith('rgb')) {
    // 単色の場合
    const rgb = hexToRgb(background);
    if (rgb) {
      slideContent.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    } else {
      slideContent.style.backgroundColor = background;
    }
  } else if (background.startsWith('linear-gradient')) {
    // グラデーションの場合
    slideContent.style.backgroundImage = background;
    slideContent.style.opacity = opacity;
  } else if (background.startsWith('url')) {
    // パターンの場合
    slideContent.style.backgroundImage = background;
    slideContent.style.opacity = opacity;
  }
  
  // 現在のスライドの背景を保存
  const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
  if (currentSlide) {
    currentSlide.background = {
      value: background,
      opacity: opacity
    };
    
    // 変更フラグを設定
    presentationState.isModified = true;
    
    // ステータスバーを更新
    updatePresentationStatus();
  }
}

/**
 * スライドの背景画像を設定
 * @param {string} imageUrl - 画像URL
 * @param {string} size - サイズ
 * @param {string} position - 位置
 * @param {number} opacity - 不透明度
 */
function setSlideBackgroundImage(imageUrl, size, position, opacity = 1) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // 背景画像を設定
  slideContent.style.backgroundImage = imageUrl;
  slideContent.style.backgroundSize = size;
  slideContent.style.backgroundPosition = position;
  slideContent.style.backgroundRepeat = 'no-repeat';
  slideContent.style.opacity = opacity;
  
  // 現在のスライドの背景を保存
  const currentSlide = presentationState.slides[presentationState.currentSlideIndex];
  if (currentSlide) {
    currentSlide.background = {
      value: imageUrl,
      size: size,
      position: position,
      opacity: opacity
    };
    
    // 変更フラグを設定
    presentationState.isModified = true;
    
    // ステータスバーを更新
    updatePresentationStatus();
  }
}

/**
 * HTMLカラーコードをRGB形式に変換
 * @param {string} hex - HTMLカラーコード
 * @returns {Object|null} RGB値のオブジェクト
 */
function hexToRgb(hex) {
  // #を削除
  hex = hex.replace(/^#/, '');
  
  // 短縮形式を展開
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 整列オプションを表示
 */
function showAlignmentOptions() {
  // 選択された要素をチェック
  const selectedElements = document.querySelectorAll('.slide-element.selected');
  if (selectedElements.length < 1) {
    alert('整列する要素を選択してください');
    return;
  }
  
  // 小さなフローティングメニューを作成
  const menu = document.createElement('div');
  menu.className = 'floating-menu';
  menu.style.position = 'absolute';
  menu.style.backgroundColor = 'white';
  menu.style.border = '1px solid #ccc';
  menu.style.borderRadius = '4px';
  menu.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  menu.style.padding = '5px';
  menu.style.zIndex = '1000';
  
  // ツールバーの位置を取得
  const alignBtn = document.getElementById('align-btn');
  const rect = alignBtn.getBoundingClientRect();
  
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;
  
  // メニュー項目を作成
  menu.innerHTML = `
    <div class="menu-options" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
      <button class="align-option" data-align="left" title="左揃え">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="4" x2="5" y2="20" />
          <rect x="5" y="6" width="10" height="5" />
          <rect x="5" y="14" width="15" height="5" />
        </svg>
      </button>
      <button class="align-option" data-align="center-h" title="水平中央揃え">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="4" x2="12" y2="20" />
          <rect x="7" y="6" width="10" height="5" />
          <rect x="4.5" y="14" width="15" height="5" />
        </svg>
      </button>
      <button class="align-option" data-align="right" title="右揃え">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="4" x2="19" y2="20" />
          <rect x="9" y="6" width="10" height="5" />
          <rect x="4" y="14" width="15" height="5" />
        </svg>
      </button>
      <button class="align-option" data-align="top" title="上揃え">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="5" x2="20" y2="5" />
          <rect x="6" y="5" width="5" height="10" />
          <rect x="14" y="5" width="5" height="15" />
        </svg>
      </button>
      <button class="align-option" data-align="center-v" title="垂直中央揃え">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="12" x2="20" y2="12" />
          <rect x="6" y="7" width="5" height="10" />
          <rect x="14" y="4.5" width="5" height="15" />
        </svg>
      </button>
      <button class="align-option" data-align="bottom" title="下揃え">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="19" x2="20" y2="19" />
          <rect x="6" y="9" width="5" height="10" />
          <rect x="14" y="4" width="5" height="15" />
        </svg>
      </button>
      <button class="align-option" data-align="distribute-h" title="水平方向に等間隔に配置">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="8" width="4" height="8" />
          <rect x="10" y="8" width="4" height="8" />
          <rect x="18" y="8" width="4" height="8" />
          <path d="M2,5 L22,5 M2,19 L22,19" stroke-dasharray="2" />
        </svg>
      </button>
      <button class="align-option" data-align="distribute-v" title="垂直方向に等間隔に配置">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="8" y="2" width="8" height="4" />
          <rect x="8" y="10" width="8" height="4" />
          <rect x="8" y="18" width="8" height="4" />
          <path d="M5,2 L5,22 M19,2 L19,22" stroke-dasharray="2" />
        </svg>
      </button>
      <button class="align-option" data-align="center-slide" title="スライドの中央に配置">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <rect x="8" y="8" width="8" height="8" />
        </svg>
      </button>
    </div>
  `;
  
  // ドキュメントに追加
  document.body.appendChild(menu);
  
  // メニュー外をクリックしたら閉じる
  document.addEventListener('click', closeMenu);
  
  function closeMenu(e) {
    if (!menu.contains(e.target) && e.target !== alignBtn) {
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  }
  
  // アライメントオプションのクリックイベント
  const alignOptions = menu.querySelectorAll('.align-option');
  alignOptions.forEach(option => {
    option.addEventListener('click', () => {
      const alignment = option.dataset.align;
      alignElements(alignment);
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    });
  });
}

/**
 * 要素を整列
 * @param {string} alignment - 整列タイプ
 */
function alignElements(alignment) {
  const selectedElements = document.querySelectorAll('.slide-element.selected');
  if (selectedElements.length < 1) return;
  
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  const slideRect = slideContent.getBoundingClientRect();
  
  // 複数の要素を揃える場合には、最初の要素を基準にする
  const firstElement = selectedElements[0];
  const firstRect = firstElement.getBoundingClientRect();
  
  // 等間隔配置の場合は要素をソート
  let sortedElements = [];
  if (alignment === 'distribute-h' || alignment === 'distribute-v') {
    sortedElements = Array.from(selectedElements);
    
    if (alignment === 'distribute-h') {
      sortedElements.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.left - rectB.left;
      });
    } else {
      sortedElements.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });
    }
  }
  
  selectedElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    let left, top;
    
    switch (alignment) {
      case 'left':
        // 左端に揃える
        left = firstRect.left - slideRect.left;
        element.style.left = `${left}px`;
        break;
      case 'center-h':
        // 水平中央に揃える
        left = firstRect.left + (firstRect.width - rect.width) / 2 - slideRect.left;
        element.style.left = `${left}px`;
        break;
      case 'right':
        // 右端に揃える
        left = firstRect.right - rect.width - slideRect.left;
        element.style.left = `${left}px`;
        break;
      case 'top':
        // 上端に揃える
        top = firstRect.top - slideRect.top;
        element.style.top = `${top}px`;
        break;
      case 'center-v':
        // 垂直中央に揃える
        top = firstRect.top + (firstRect.height - rect.height) / 2 - slideRect.top;
        element.style.top = `${top}px`;
        break;
      case 'bottom':
        // 下端に揃える
        top = firstRect.bottom - rect.height - slideRect.top;
        element.style.top = `${top}px`;
        break;
      case 'center-slide':
        // スライドの中央に配置
        left = (slideRect.width - rect.width) / 2;
        top = (slideRect.height - rect.height) / 2;
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        break;
    }
  });
  
  // 等間隔配置
  if (alignment === 'distribute-h' && sortedElements.length > 2) {
    const first = sortedElements[0].getBoundingClientRect();
    const last = sortedElements[sortedElements.length - 1].getBoundingClientRect();
    const totalWidth = last.right - first.left;
    
    for (let i = 1; i < sortedElements.length - 1; i++) {
      const element = sortedElements[i];
      const rect = element.getBoundingClientRect();
      const newLeft = first.left + (totalWidth - rect.width) * i / (sortedElements.length - 1) - slideRect.left;
      element.style.left = `${newLeft}px`;
    }
  } else if (alignment === 'distribute-v' && sortedElements.length > 2) {
    const first = sortedElements[0].getBoundingClientRect();
    const last = sortedElements[sortedElements.length - 1].getBoundingClientRect();
    const totalHeight = last.bottom - first.top;
    
    for (let i = 1; i < sortedElements.length - 1; i++) {
      const element = sortedElements[i];
      const rect = element.getBoundingClientRect();
      const newTop = first.top + (totalHeight - rect.height) * i / (sortedElements.length - 1) - slideRect.top;
      element.style.top = `${newTop}px`;
    }
  }
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * 選択された要素のグループ化をトグル
 */
function toggleGroupSelectedElements() {
  const selectedElements = document.querySelectorAll('.slide-element.selected');
  
  if (selectedElements.length < 2) {
    // 選択された要素が1つ以下の場合、グループ解除を試みる
    const groupElement = document.querySelector('.slide-element.selected.element-group');
    if (groupElement) {
      ungroupElements(groupElement);
    } else {
      alert('グループ化するには2つ以上の要素を選択してください');
    }
    return;
  }
  
  // 選択された要素をグループ化
  groupElements(selectedElements);
}

/**
 * 要素をグループ化
 * @param {NodeList} elements - グループ化する要素
 */
function groupElements(elements) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  // グループの範囲を計算
  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;
  
  elements.forEach(element => {
    const rect = element.getBoundingClientRect();
    const slideRect = slideContent.getBoundingClientRect();
    
    const left = rect.left - slideRect.left;
    const top = rect.top - slideRect.top;
    const right = left + rect.width;
    const bottom = top + rect.height;
    
    minLeft = Math.min(minLeft, left);
    minTop = Math.min(minTop, top);
    maxRight = Math.max(maxRight, right);
    maxBottom = Math.max(maxBottom, bottom);
  });
  
  // グループ要素を作成
  const groupElement = document.createElement('div');
  groupElement.className = 'slide-element element-group selected';
  groupElement.style.position = 'absolute';
  groupElement.style.left = `${minLeft}px`;
  groupElement.style.top = `${minTop}px`;
  groupElement.style.width = `${maxRight - minLeft}px`;
  groupElement.style.height = `${maxBottom - minTop}px`;
  groupElement.style.border = '1px dashed #4285f4';
  groupElement.style.backgroundColor = 'transparent';
  
  // グループの子要素を追加
  elements.forEach(element => {
    // 選択を解除
    element.classList.remove('selected');
    
    // 元の位置を保存
    const rect = element.getBoundingClientRect();
    const slideRect = slideContent.getBoundingClientRect();
    
    const originalLeft = rect.left - slideRect.left;
    const originalTop = rect.top - slideRect.top;
    
    // グループ内の相対位置を計算
    element.style.left = `${originalLeft - minLeft}px`;
    element.style.top = `${originalTop - minTop}px`;
    element.style.position = 'absolute';
    
    // 要素をグループに移動
    groupElement.appendChild(element);
  });
  
  // ドラッグ機能を設定
  makeElementDraggable(groupElement);
  
  // リサイズハンドルを追加
  addResizeHandles(groupElement);
  
  // スライドに追加
  slideContent.appendChild(groupElement);
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * グループを解除
 * @param {HTMLElement} groupElement - グループ要素
 */
function ungroupElements(groupElement) {
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent || !groupElement.classList.contains('element-group')) return;
  
  // グループの位置を取得
  const groupRect = groupElement.getBoundingClientRect();
  const slideRect = slideContent.getBoundingClientRect();
  
  const groupLeft = groupRect.left - slideRect.left;
  const groupTop = groupRect.top - slideRect.top;
  
  // 子要素をスライドに移動
  const children = Array.from(groupElement.children);
  children.forEach(child => {
    const childLeft = parseFloat(child.style.left || '0');
    const childTop = parseFloat(child.style.top || '0');
    
    // スライド内の絶対位置を計算
    child.style.left = `${groupLeft + childLeft}px`;
    child.style.top = `${groupTop + childTop}px`;
    
    // 子要素をスライドに移動
    slideContent.appendChild(child);
    
    // 子要素を選択
    child.classList.add('selected');
  });
  
  // グループ要素を削除
  slideContent.removeChild(groupElement);
  
  // スライドの変更を保存
  saveSlideChanges();
}

/**
 * レイヤー管理ダイアログを表示
 */
function showLayerManagementDialog() {
  // スライド内の要素を取得
  const slideContent = document.querySelector('.slide-content');
  if (!slideContent) return;
  
  const elements = slideContent.querySelectorAll('.slide-element');
  if (elements.length === 0) {
    alert('スライドに要素がありません');
    return;
  }
  
  // ダイアログ用のオーバーレイを作成
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3 class="dialog-title">レイヤー管理</h3>
      <button class="dialog-close">&times;</button>
    </div>
    <div class="dialog-body">
      <div class="layer-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">要素</th>
              <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd; width: 80px;">表示</th>
              <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd; width: 120px;">アクション</th>
            </tr>
          </thead>
          <tbody id="layer-items">
            ${Array.from(elements).reverse().map((element, index) => {
              let elementName = '要素';
              if (element.classList.contains('text-box-element')) {
                elementName = 'テキスト: ' + (element.textContent.substring(0, 20) || 'テキスト');
              } else if (element.classList.contains('shape-element')) {
                elementName = '図形';
                if (element.classList.contains('circle')) elementName = '円形';
                if (element.classList.contains('rectangle')) elementName = '長方形';
                if (element.classList.contains('triangle')) elementName = '三角形';
              } else if (element.classList.contains('chart-element')) {
                elementName = 'グラフ: ' + (element.dataset.chartTitle || 'グラフ');
              } else if (element.querySelector('table')) {
                elementName = 'テーブル';
              } else if (element.classList.contains('element-group')) {
                elementName = 'グループ要素';
              }
              
              const isHidden = element.style.display === 'none';
              
              return `
                <tr class="layer-item" data-element-index="${index}" style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">${elementName}</td>
                  <td style="padding: 8px; text-align: center;">
                    <input type="checkbox" class="layer-visibility" ${isHidden ? '' : 'checked'}>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <button class="layer-up-btn" title="上へ移動" style="margin-right: 5px;">↑</button>
                    <button class="layer-down-btn" title="下へ移動">↓</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-btn cancel">閉じる</button>
    </div>
  `;
  
  // ダイアログをオーバーレイに追加
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // レイヤー操作のイベント
  const layerItems = dialog.querySelectorAll('.layer-item');
  
  layerItems.forEach(item => {
    const index = parseInt(item.dataset.elementIndex, 10);
    const element = Array.from(elements).reverse()[index];
    
    // 表示/非表示の切り替え
    const visibilityCheckbox = item.querySelector('.layer-visibility');
    visibilityCheckbox.addEventListener('change', () => {
      element.style.display = visibilityCheckbox.checked ? '' : 'none';
      saveSlideChanges();
    });
    
    // 上へ移動
    const upBtn = item.querySelector('.layer-up-btn');
    upBtn.addEventListener('click', () => {
      if (index > 0) {
        const nextElement = Array.from(elements).reverse()[index - 1];
        slideContent.insertBefore(element, nextElement);
        saveSlideChanges();
        
        // リストを更新
        refreshLayerList();
      }
    });
    
    // 下へ移動
    const downBtn = item.querySelector('.layer-down-btn');
    downBtn.addEventListener('click', () => {
      if (index < elements.length - 1) {
        const nextElement = Array.from(elements).reverse()[index + 1];
        slideContent.insertBefore(nextElement, element);
        saveSlideChanges();
        
        // リストを更新
        refreshLayerList();
      }
    });
    
    // 要素クリックで選択
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        // 全ての選択を解除
        document.querySelectorAll('.slide-element.selected').forEach(el => {
          el.classList.remove('selected');
        });
        
        // 要素を選択
        element.classList.add('selected');
        
        // レイヤーリストの選択状態を更新
        layerItems.forEach(li => li.style.backgroundColor = '');
        item.style.backgroundColor = '#e8f0fe';
      }
    });
  });
  
  // レイヤーリストを更新
  function refreshLayerList() {
    const layerItemsContainer = dialog.querySelector('#layer-items');
    const updatedElements = slideContent.querySelectorAll('.slide-element');
    
    layerItemsContainer.innerHTML = Array.from(updatedElements).reverse().map((element, index) => {
      let elementName = '要素';
      if (element.classList.contains('text-box-element')) {
        elementName = 'テキスト: ' + (element.textContent.substring(0, 20) || 'テキスト');
      } else if (element.classList.contains('shape-element')) {
        elementName = '図形';
        if (element.classList.contains('circle')) elementName = '円形';
        if (element.classList.contains('rectangle')) elementName = '長方形';
        if (element.classList.contains('triangle')) elementName = '三角形';
      } else if (element.classList.contains('chart-element')) {
        elementName = 'グラフ: ' + (element.dataset.chartTitle || 'グラフ');
      } else if (element.querySelector('table')) {
        elementName = 'テーブル';
      } else if (element.classList.contains('element-group')) {
        elementName = 'グループ要素';
      }
      
      const isHidden = element.style.display === 'none';
      const isSelected = element.classList.contains('selected');
      
      return `
        <tr class="layer-item" data-element-index="${index}" style="border-bottom: 1px solid #eee; background-color: ${isSelected ? '#e8f0fe' : ''}">
          <td style="padding: 8px;">${elementName}</td>
          <td style="padding: 8px; text-align: center;">
            <input type="checkbox" class="layer-visibility" ${isHidden ? '' : 'checked'}>
          </td>
          <td style="padding: 8px; text-align: center;">
            <button class="layer-up-btn" title="上へ移動" style="margin-right: 5px;">↑</button>
            <button class="layer-down-btn" title="下へ移動">↓</button>
          </td>
        </tr>
      `;
    }).join('');
    
    // イベントを再設定
    const newLayerItems = dialog.querySelectorAll('.layer-item');
    newLayerItems.forEach(item => {
      const index = parseInt(item.dataset.elementIndex, 10);
      const element = Array.from(updatedElements).reverse()[index];
      
      // 表示/非表示の切り替え
      const visibilityCheckbox = item.querySelector('.layer-visibility');
      visibilityCheckbox.addEventListener('change', () => {
        element.style.display = visibilityCheckbox.checked ? '' : 'none';
        saveSlideChanges();
      });
      
      // 上へ移動
      const upBtn = item.querySelector('.layer-up-btn');
      upBtn.addEventListener('click', () => {
        if (index > 0) {
          const nextElement = Array.from(updatedElements).reverse()[index - 1];
          slideContent.insertBefore(element, nextElement);
          saveSlideChanges();
          refreshLayerList();
        }
      });
      
      // 下へ移動
      const downBtn = item.querySelector('.layer-down-btn');
      downBtn.addEventListener('click', () => {
        if (index < updatedElements.length - 1) {
          const nextElement = Array.from(updatedElements).reverse()[index + 1];
          slideContent.insertBefore(nextElement, element);
          saveSlideChanges();
          refreshLayerList();
        }
      });
      
      // 要素クリックで選択
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
          // 全ての選択を解除
          document.querySelectorAll('.slide-element.selected').forEach(el => {
            el.classList.remove('selected');
          });
          
          // 要素を選択
          element.classList.add('selected');
          
          // レイヤーリストの選択状態を更新
          newLayerItems.forEach(li => li.style.backgroundColor = '');
          item.style.backgroundColor = '#e8f0fe';
        }
      });
    });
  }
  
  // ダイアログ閉じるイベント
  const closeButton = dialog.querySelector('.dialog-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // キャンセル（閉じる）ボタンイベント
  const cancelButton = dialog.querySelector('.dialog-btn.cancel');
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}