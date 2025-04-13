/**
 * Aro Learn - フロントエンドスクリプト
 * このファイルは、UIのインタラクションとアニメーションを処理します
 */
import chatManager from './chat-manager.js';
import geminiLiveManager from './gemini-live-manager.js';
import { initAPI, getAvailableModels, getCurrentModel, changeModel } from './model-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');
    // 要素の取得
    const cards = document.querySelectorAll('.card');
    const messageInput = document.querySelector('.message-input input');
    const messageForm = document.querySelector('.message-input');
    const plusButton = document.querySelector('.plus-button');
    const voiceButton = document.querySelector('.voice-button');
    const mainContent = document.querySelector('.main-content'); // mainContent をここで取得
    const chatSection = document.querySelector('.chat-section'); // chatSection をここで取得
    const apiKeySettings = document.getElementById('api-key-settings');
    const apiKeyModal = document.getElementById('api-key-modal');
    const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
    const openRouterApiKeyInput = document.getElementById('openrouter-api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const modelSelector = document.getElementById('model-selector');
    const conversationListEl = document.getElementById('conversation-list'); // conversationList 要素を取得
    const newChatButton = document.querySelector('.new-chat-btn');
    const clearConversationsButton = document.getElementById('clear-conversations');
    const conversationContextMenu = document.getElementById('conversation-context-menu');
    const renameConversationButton = document.getElementById('rename-conversation');
    const deleteConversationButton = document.getElementById('delete-conversation');
    const renameModal = document.getElementById('rename-modal');
    const conversationTitleInput = document.getElementById('conversation-title-input');
    const saveConversationTitleButton = document.getElementById('save-conversation-title');
    const modelSwitchButton = document.getElementById('model-switch-button');
    const confirmClearButton = document.getElementById('confirm-clear');
    const cancelClearButtons = document.querySelectorAll('#clear-confirmation .close-confirmation, #clear-confirmation .secondary'); // キャンセルボタンも含むように修正
    const clearConfirmationDialog = document.getElementById('clear-confirmation');


    // チャット関連要素
    let chatContainer = document.querySelector('.chat-messages'); // 既存のものを取得試行
    if (!chatContainer) { // なければ作成して挿入
        console.log('Chat container not found in HTML, creating dynamically.');
        chatContainer = document.createElement('div');
        chatContainer.className = 'chat-messages';
        if (mainContent && chatSection) { // mainContent と chatSection が存在するか確認
            mainContent.insertBefore(chatContainer, chatSection);
            console.log('Chat container inserted before chat section.');
        } else {
            console.error('Error: .main-content or .chat-section not found. Cannot insert chat container.');
            // 代替として body の末尾に追加
            document.body.appendChild(chatContainer);
            console.warn('Chat container appended to body as fallback.');
        }
    } else {
        console.log('Chat container found in HTML.');
    }

    // カードのアクセシビリティとインタラクション設定 (initializeAIより前に移動)
    if (cards.length > 0) {
        cards.forEach(card => {
            // クリックイベント
            card.addEventListener('click', () => {
                selectCard(card);
            });

            // キーボードアクセシビリティ
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectCard(card);
                }
            });
            // console.log('Card event listeners added for:', card.querySelector('.card-title')?.textContent.trim());
        });
        console.log(`Event listeners added for ${cards.length} cards.`);
    } else {
        console.warn('No learning cards found.');
    }

    // メッセージ入力フォームのイベント
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
        messageForm.addEventListener('focus', () => {
            messageForm.classList.add('focused');
        }, true);
        messageForm.addEventListener('blur', () => {
            messageForm.classList.remove('focused');
        }, true);
    } else {
        console.error('Message form not found, cannot add event listeners.');
    }

    // 音声入力ボタンのイベント
    if (voiceButton) {
        voiceButton.addEventListener('click', (e) => {
            createRipple(e);
            toggleVoiceInput();
        });
    } else {
        console.warn('Voice button not found, voice input disabled.');
    }

    // プラスボタンのイベント
    if (plusButton) {
        plusButton.addEventListener('click', createRipple);
        console.log('Plus button event listener added.');
    } else {
        console.warn('Plus button not found.');
    }

    // 設定関連のイベント
    if (apiKeySettings) {
        apiKeySettings.addEventListener('click', () => {
            promptForAPIKey();
        });
        console.log('API key settings event listener added.');
    }

    // クリアコンファメーションダイアログのイベント
    if (clearConversationsButton) {
        clearConversationsButton.addEventListener('click', () => {
            if (clearConfirmationDialog) {
                clearConfirmationDialog.classList.add('visible');
            }
        });
        console.log('Clear conversations button event listener added.');
    }

    if (confirmClearButton) {
        confirmClearButton.addEventListener('click', () => {
            localStorage.removeItem('conversations');
            renderConversationList();
            if (clearConfirmationDialog) {
                clearConfirmationDialog.classList.remove('visible');
            }
        });
    }

    if (cancelClearButtons && cancelClearButtons.length > 0) {
        cancelClearButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (clearConfirmationDialog) {
                    clearConfirmationDialog.classList.remove('visible');
                }
            });
        });
    }

    // 新しいチャットボタンのイベント
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            chatManager.startNewConversation();
            renderConversationList();
        });
    }

    // コンテキストメニュー関連イベント
    if (renameConversationButton) {
        renameConversationButton.addEventListener('click', () => {
            const activeConversationId = conversationContextMenu.dataset.conversationId;
            const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
            const conversation = conversations.find(c => c.id === activeConversationId);
            
            if (conversation && renameModal && conversationTitleInput) {
                conversationTitleInput.value = conversation.title || '';
                renameModal.classList.add('visible');
                renameModal.dataset.conversationId = activeConversationId;
                conversationTitleInput.focus();
                closeContextMenu();
            }
        });
    }

    if (deleteConversationButton) {
        deleteConversationButton.addEventListener('click', () => {
            const activeConversationId = conversationContextMenu.dataset.conversationId;
            let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
            
            conversations = conversations.filter(c => c.id !== activeConversationId);
            localStorage.setItem('conversations', JSON.stringify(conversations));
            
            renderConversationList();
            closeContextMenu();
            
            // 現在表示中の会話が削除された場合は新しい会話を開始
            if (chatManager.currentConversationId === activeConversationId) {
                chatManager.startNewConversation();
            }
        });
    }

    if (saveConversationTitleButton && renameModal) {
        saveConversationTitleButton.addEventListener('click', () => {
            const conversationId = renameModal.dataset.conversationId;
            const newTitle = conversationTitleInput.value.trim();
            
            if (conversationId && newTitle) {
                let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
                const index = conversations.findIndex(c => c.id === conversationId);
                
                if (index !== -1) {
                    conversations[index].title = newTitle;
                    localStorage.setItem('conversations', JSON.stringify(conversations));
                    renderConversationList();
                }
            }
            
            renameModal.classList.remove('visible');
        });
    }

    // モーダルを閉じるボタンのイベント
    if (closeModalButtons && closeModalButtons.length > 0) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.classList.remove('visible');
                }
            });
        });
    }

    // API設定保存ボタンのイベント
    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', async () => {
            const geminiKey = geminiApiKeyInput?.value?.trim();
            const openRouterKey = openRouterApiKeyInput?.value?.trim();
            const selectedModelId = modelSelector?.value;
            
            if (geminiKey) {
                localStorage.setItem('gemini_api_key', geminiKey);
            }
            
            if (openRouterKey) {
                localStorage.setItem('openrouter_api_key', openRouterKey);
            }
            
            if (selectedModelId) {
                localStorage.setItem('selected_model_id', selectedModelId);
            }
            
            // APIキーが変更されたので再初期化
            if (apiKeyModal) {
                apiKeyModal.classList.remove('visible');
            }
            
            try {
                await initializeAI();
                console.log('AI reinitialized with new API settings.');
            } catch (error) {
                console.error('Failed to reinitialize AI:', error);
            }
        });
    }

    // ページが表示されてから効果を開始する
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.body.classList.add('loaded');
            console.log('Body loaded class added.');
            animateCards();
            // initializeAI を非同期で実行し、エラーをキャッチ
            initializeAI().catch(error => {
                console.error("AI Initialization failed:", error);
                // APIキーがない場合や初期化失敗時でも、基本的なUI（会話リストなど）は表示試行
                if (chatContainer && messageInput && voiceButton && !chatManager.isInitialized) {
                     console.log("Attempting to initialize Chat Manager partially due to AI init error.");
                     // API通信を伴わない部分のみ初期化するか、エラー表示を行う
                     // chatManager.init(chatContainer, messageInput, null, voiceButton); // APIなしでのinitは要検討
                     renderConversationList(); // 会話リスト表示は試みる
                     updateCurrentModelDisplay(); // モデル表示も更新試行
                }
                 // 必要に応じてユーザーに通知
                 // alert("AI機能の初期化に失敗しました。APIキー設定を確認してください。");
            });
        }, 100);
    });

    // AIモジュールの初期化
    async function initializeAI() {
        console.log('Initializing AI...');
        // APIキーの取得
        const geminiApiKey = localStorage.getItem('gemini_api_key');
        const openRouterApiKey = localStorage.getItem('openrouter_api_key');

        // 現在選択されているモデルを取得
        const selectedModelId = localStorage.getItem('selected_model_id') || 'gemini-1.5-flash-latest'; // デフォルトを更新

        // 利用可能なモデルリストを取得（APIキー設定前に取得できるように）
        const availableModels = getAvailableModels();

        // モデル選択UIを先に更新（APIキー入力のガイドのため）
        updateModelSelection(availableModels, selectedModelId);

        // どちらかのAPIキーが設定されていればモデルマネージャーを初期化
        if (geminiApiKey || openRouterApiKey) {
            const model = availableModels.find(m => m.id === selectedModelId);
            if (model) {
                const provider = model.provider;
                const apiKey = provider === 'gemini' ? geminiApiKey : openRouterApiKey;

                if (apiKey) {
                    // APIを初期化
                    initAPI(apiKey, provider);
                    changeModel(selectedModelId);

                    // チャットマネージャーの初期化
                    if (chatContainer && messageInput) { // voiceButtonはオプションなので必須から外す
                        chatManager.init(chatContainer, messageInput, null, voiceButton);
                        console.log('Chat Manager initialized successfully.');
                        renderConversationList(); // 初期化後にリスト描画
                    } else {
                         console.error('Chat Manager init failed: Required elements (chatContainer or messageInput) not found.');
                    }

                    console.log(`${provider} API initialized successfully, Model: ${model.name}`);

                    // 現在のモデル名表示を更新
                    updateCurrentModelDisplay();

                    // Gemini Live APIの初期化 (Geminiキーがある場合のみ)
                    if (provider === 'gemini' && geminiApiKey) {
                        try {
                            await geminiLiveManager.init(geminiApiKey, { language: 'ja-JP' });
                            geminiLiveManager.onStateChange((state) => {
                                if (voiceButton) { // voiceButtonが存在するか確認
                                    if (state.listening === true) voiceButton.classList.add('recording');
                                    else if (state.listening === false) voiceButton.classList.remove('recording');
                                }
                                if (state.speaking === true) document.body.classList.add('ai-speaking');
                                else if (state.speaking === false) document.body.classList.remove('ai-speaking');
                            });
                            geminiLiveManager.onMessage((msg) => {
                                if (msg.type === 'transcript' && msg.isFinal && messageInput) { // messageInputが存在するか確認
                                    messageInput.value = msg.text;
                                    // sendMessage(); // 自動送信はコメントアウト
                                }
                            });
                            console.log('Gemini Live API initialized successfully.');
                        } catch (error) {
                            console.error('Gemini Live API initialization error:', error);
                        }
                    }

                } else {
                    console.warn(`${provider} API key is required but not set. Please enter the API key.`);
                    promptForAPIKey();
                    // APIキーがない場合でも会話リストは表示
                    renderConversationList();
                    updateCurrentModelDisplay(); // モデル表示も更新
                    // throw new Error(`${provider} API Key not found.`); // エラーをスローしてcatchさせる
                }
            } else {
                 console.warn(`Selected model (${selectedModelId}) not found in available models. Prompting for API key.`);
                 promptForAPIKey(); // モデルが見つからない場合もキー入力を促す
                 renderConversationList(); // 会話リスト表示
                 updateCurrentModelDisplay(); // モデル表示も更新
                 // throw new Error('Selected model not found.');
            }
        } else {
            console.warn('No API keys set. Please enter API key(s).');
            promptForAPIKey();
            // APIキーがない場合でも会話リストは表示
            renderConversationList();
            updateCurrentModelDisplay(); // モデル表示も更新
            // throw new Error('No API Keys set.'); // エラーをスロー
            return; // APIキーがない場合はここで終了
        }
        console.log('AI Initialization finished.');
    }

    // カードを順番にアニメーションする
    function animateCards() {
        if (cards.length > 0) {
            console.log('Animating cards...');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animated');
                    // console.log('Card animated:', card.querySelector('.card-title')?.textContent.trim());
                }, 80 * index);
            });
        }
    }

    // カード選択時の処理
    function selectCard(card) {
        const titleElement = card.querySelector('.card-title');
        const title = titleElement?.textContent.trim();
        if (!title) {
            console.error('Card title not found for clicked card.');
            return;
        }
        console.log(`Card selected: ${title}`);

        // 以前の選択を解除
        cards.forEach(c => c.classList.remove('selected'));

        // 新しいカードを選択
        card.classList.add('selected');

        // 入力フィールドにフォーカスを移す
        if (messageInput) {
            messageInput.focus();
            messageInput.value = `「${title}」について教えてください。`;
            console.log(`Set message input value to: 「${title}」について教えてください。`);
        } else {
            console.error('messageInput element not found, cannot set value.');
        }
    }

    // リップルエフェクト
    function createRipple(event) {
        const button = event.currentTarget;
        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) existingRipple.remove();

        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    // 主要なボタンにリップルエフェクトを追加
    const rippleButtons = document.querySelectorAll('.plus-button, .voice-button, .new-chat-btn, .btn, .context-menu-item, .nav-item');
    rippleButtons.forEach(button => {
        button.addEventListener('mousedown', createRipple);
    });
    console.log(`Ripple effect added to ${rippleButtons.length} buttons/items.`);

    // メッセージ送信処理
    function sendMessage() {
        if (!messageInput || !chatManager || !chatManager.isInitialized) {
            console.error('Message input or Chat Manager not available for sending message.');
            alert('チャット機能が利用できません。API設定を確認してください。');
            return;
        }
        
        const message = messageInput.value.trim();
        if (message) {
            console.log(`Sending message: ${message}`);
            chatManager.sendUserMessage(message)
                .then(() => {
                    messageInput.value = '';
                    renderConversationList(); // 会話リストを更新
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                    chatManager.displayErrorMessage('メッセージの送信中にエラーが発生しました。後でもう一度お試しください。');
                });
        }
    }

    // 音声入力切替
    function toggleVoiceInput() {
        if (!geminiLiveManager || !geminiLiveManager.isInitialized) {
            console.warn('Gemini Live Manager not initialized. Cannot use voice input.');
            alert('音声入力機能が利用できません。Gemini APIキーを設定してください。');
            return;
        }
        
        if (geminiLiveManager.isListening()) {
            console.log('Stopping voice input...');
            geminiLiveManager.stopListening();
        } else {
            console.log('Starting voice input...');
            geminiLiveManager.startListening()
                .catch(error => {
                    console.error('Error starting voice input:', error);
                    alert('音声入力の開始に失敗しました。マイクへのアクセス権限を確認してください。');
                });
        }
    }

    // Enterキーでメッセージ送信
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enterでの改行を許可
                e.preventDefault();
                sendMessage();
            }
        });
        console.log('Enter key listener added to message input.');
    } else {
         console.error('Message input element not found, cannot add keypress listener.');
    }

    // フォーム送信イベントを処理 (Enterキー送信と重複する可能性があるが、モバイル等での送信ボタン代わりのため残す)
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted.');
            sendMessage();
        });
        console.log('Submit listener added to message form.');
    } else {
        console.error('Message form element not found, cannot add submit listener.');
    }


    // 音声入力機能
    if (voiceButton) {
        voiceButton.addEventListener('click', () => {
            console.log('Voice button clicked.');
            if (geminiLiveManager && geminiLiveManager.isInitialized) {
                 console.log('Using Gemini Live API for voice input.');
                 if (!geminiLiveManager.isListening) {
                     geminiLiveManager.startListening();
                 } else {
                     geminiLiveManager.stopListening();
                     // 停止時に自動送信はしない（ユーザーが送信ボタンを押すかEnterキーを押す）
                     // if (messageInput && messageInput.value.trim()) { sendMessage(); }
                 }
            } else if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                 console.log('Using Web Speech API for voice input.');
                 const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                 recognition.lang = 'ja-JP';
                 recognition.continuous = false; // 単発認識に変更
                 recognition.interimResults = false; // 最終結果のみ取得

                 let isRecording = voiceButton.classList.contains('recording');

                 if (!isRecording) {
                     try {
                         recognition.start();
                         voiceButton.classList.add('recording');
                         console.log('Web Speech API: Recording started.');
                     } catch (error) {
                         console.error('Web Speech API: Start error:', error);
                         voiceButton.classList.remove('recording'); // エラー時はクラス解除
                     }
                 } else {
                     recognition.stop(); // 停止は stop() を呼ぶだけで良い
                     console.log('Web Speech API: Recording stopped by user.');
                     // クラス解除は onend で行う
                 }

                 recognition.onresult = (event) => {
                     const transcript = event.results[0][0].transcript;
                     if (messageInput) messageInput.value = transcript;
                     console.log('Web Speech API: Result received:', transcript);
                     // 結果取得後に自動送信はしない
                     // setTimeout(() => { sendMessage(); }, 500);
                 };

                 recognition.onend = () => {
                     voiceButton.classList.remove('recording');
                     console.log('Web Speech API: Recognition ended.');
                 };

                 recognition.onerror = (event) => {
                     console.error('Web Speech API: Error:', event.error);
                     voiceButton.classList.remove('recording');
                     if (event.error === 'no-speech') {
                         // 無音エラーは無視するか、ユーザーに通知
                     } else if (event.error === 'not-allowed') {
                         alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
                     } else {
                         alert(`音声認識エラーが発生しました: ${event.error}`);
                     }
                 };
            } else {
                console.warn('Web Speech API not supported in this browser.');
                alert('このブラウザは音声認識に対応していません。');
            }
        });
        console.log('Click listener added to voice button.');
    } else {
        console.warn('Voice button element not found.');
    }

    // 入力フィールドのフォーカス/ブラー効果
    if (messageInput && messageForm) {
        messageInput.addEventListener('focus', () => messageForm.classList.add('focused'));
        messageInput.addEventListener('blur', () => messageForm.classList.remove('focused'));
        console.log('Focus/blur listeners added to message input.');
    }

    // ページがスクロールされたときのヘッダー効果
    if (mainContent) {
        mainContent.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                document.body.classList.toggle('scrolled', mainContent.scrollTop > 10);
            });
        });
        console.log('Scroll listener added to main content.');
    } else {
        console.error('Main content element not found, cannot add scroll listener.');
    }


    // ファイル添付機能（プラスボタン）
    if (plusButton) {
        plusButton.addEventListener('click', () => {
            console.log('Plus button clicked.');
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*'; // 画像ファイルのみ

            fileInput.addEventListener('change', (e) => {
                 const file = e.target.files[0];
                 if (file && file.type.startsWith('image/')) {
                     console.log('Image file selected:', file.name);
                     const reader = new FileReader();
                     reader.onload = (event) => {
                         const imageData = event.target.result.split(',')[1];
                         if (chatManager && chatManager.isInitialized) {
                             const message = messageInput?.value.trim() || '添付した画像について説明してください。'; // デフォルトメッセージ変更
                             console.log('Sending message with image via Chat Manager.');
                             chatManager.sendMessageWithImage(message, imageData);
                             if (messageInput) messageInput.value = '';
                         } else {
                             console.warn('Chat Manager not initialized. Cannot send image message.');
                             alert('チャット機能が初期化されていません。API設定を確認してください。');
                         }
                     };
                     reader.onerror = (error) => {
                         console.error('FileReader error:', error);
                         alert('ファイルの読み込み中にエラーが発生しました。');
                     };
                     reader.readAsDataURL(file);
                 } else if (file) {
                     console.warn('Selected file is not an image:', file.type);
                     alert('画像ファイルを選択してください。');
                 }
            });
            fileInput.click(); // ファイル選択ダイアログを開く
        });
        console.log('Click listener added to plus button.');
    } else {
        console.warn('Plus button element not found.');
    }

    // --- API設定モーダル関連 ---
    // 保存されたAPIキーがあれば入力欄に設定
    if (geminiApiKeyInput && localStorage.getItem('gemini_api_key')) {
        geminiApiKeyInput.value = localStorage.getItem('gemini_api_key');
    }
    if (openRouterApiKeyInput && localStorage.getItem('openrouter_api_key')) {
        openRouterApiKeyInput.value = localStorage.getItem('openrouter_api_key');
    }

    // API設定ボタンクリックでモーダルを表示
    if (apiKeySettings && apiKeyModal) {
        apiKeySettings.addEventListener('click', () => {
            console.log('API settings button clicked.');
            updateModelSelection(getAvailableModels(), localStorage.getItem('selected_model_id')); // 表示時に最新状態に更新
            apiKeyModal.classList.add('visible');
        });
        console.log('Click listener added to API settings button.');
    } else {
        console.warn('API settings button or modal element not found.');
    }

    // モーダルを閉じるボタンのイベント
    if (closeModalButtons.length > 0) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalParent = button.closest('.modal');
                if (modalParent) {
                    console.log(`Closing modal: ${modalParent.id}`);
                    modalParent.classList.remove('visible');
                }
            });
        });
        console.log(`Close listeners added to ${closeModalButtons.length} modal close buttons.`);
    }

    // モーダル外クリックで閉じる
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log(`Closing modal via backdrop click: ${modal.id}`);
                modal.classList.remove('visible');
            }
        });
    });
    console.log('Backdrop click listeners added to modals.');


    // APIキー保存ボタンのイベント
    if (saveApiKeyButton && apiKeyModal && modelSelector && geminiApiKeyInput && openRouterApiKeyInput) {
        saveApiKeyButton.addEventListener('click', () => {
            console.log('Save API Key button clicked.');
            const geminiApiKey = geminiApiKeyInput.value.trim();
            const openRouterApiKey = openRouterApiKeyInput.value.trim();
            const selectedModelId = modelSelector.value;

            const models = getAvailableModels();
            const model = models.find(m => m.id === selectedModelId);
            const isValidConfig = model &&
                ((model.provider === 'gemini' && geminiApiKey) ||
                 (model.provider === 'openrouter' && openRouterApiKey));

            if (isValidConfig) {
                console.log('Valid API key configuration for selected model.');
                if (geminiApiKey) localStorage.setItem('gemini_api_key', geminiApiKey);
                else localStorage.removeItem('gemini_api_key'); // 空の場合は削除

                if (openRouterApiKey) localStorage.setItem('openrouter_api_key', openRouterApiKey);
                else localStorage.removeItem('openrouter_api_key'); // 空の場合は削除

                localStorage.setItem('selected_model_id', selectedModelId);
                console.log('API Keys and model selection saved. Reloading page.');
                apiKeyModal.classList.remove('visible');
                window.location.reload();
            } else {
                console.warn('Invalid API key configuration for selected model.');
                alert('選択したモデルに必要なAPIキーを入力してください。');
                // 対応する入力欄にフォーカスを当てるなどの改善も可能
                if (model?.provider === 'gemini') geminiApiKeyInput.focus();
                else if (model?.provider === 'openrouter') openRouterApiKeyInput.focus();
            }
        });
        console.log('Click listener added to save API key button.');
    } else {
         console.warn('Save API key button or related elements not found.');
    }


    // 初回訪問時やAPIキーが設定されていない場合に自動表示
    function promptForAPIKey() {
        // APIキーが両方ともない場合のみ表示
        if (!localStorage.getItem('gemini_api_key') && !localStorage.getItem('openrouter_api_key')) {
            console.log('No API keys found, prompting user.');
            if (apiKeyModal) {
                setTimeout(() => {
                    apiKeyModal.classList.add('visible');
                }, 1000); // 少し遅延させて表示
            }
        } else {
             console.log('API key(s) found, skipping prompt.');
        }
    }

    // モデル選択UIを更新する関数
    function updateModelSelection(models, currentModelId) {
        if (!modelSelector) {
            console.error('Model selector element not found.');
            return;
        }
        console.log('Updating model selection UI...');

        modelSelector.innerHTML = ''; // リストをクリア

        // プロバイダーでグループ化
        const providers = {
            'gemini': { name: 'Google Gemini', models: [] },
            'openrouter': { name: 'OpenRouter', models: [] }
        };

        models.forEach(model => {
            if (providers[model.provider]) {
                providers[model.provider].models.push(model);
            }
        });

        // プロバイダー毎にオプショングループを作成
        Object.keys(providers).forEach(providerKey => {
            const provider = providers[providerKey];
            if (provider.models.length > 0) {
                const group = document.createElement('optgroup');
                group.label = provider.name;

                provider.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = `${model.name} (${model.description})`; // 説明を括弧内に
                    if (model.id === currentModelId) {
                        option.selected = true;
                    }
                    group.appendChild(option);
                });
                modelSelector.appendChild(group);
            }
        });

        // モデル選択時のハイライト処理
        const updateHighlight = () => {
            const selectedModel = models.find(m => m.id === modelSelector.value);
            if (geminiApiKeyInput && openRouterApiKeyInput) {
                geminiApiKeyInput.classList.remove('highlight');
                openRouterApiKeyInput.classList.remove('highlight');
                if (selectedModel?.provider === 'gemini') {
                    geminiApiKeyInput.classList.add('highlight');
                } else if (selectedModel?.provider === 'openrouter') {
                    openRouterApiKeyInput.classList.add('highlight');
                }
            }
        };

        // 既存のリスナーを削除してから追加（複数回呼び出される可能性があるため）
        modelSelector.removeEventListener('change', updateHighlight);
        modelSelector.addEventListener('change', updateHighlight);

        // 初期表示時のハイライト設定
        updateHighlight();
        console.log('Model selection UI updated.');
    }

    // モデル切り替えボタンの設定
    if (modelSwitchButton && apiKeyModal) {
        modelSwitchButton.addEventListener('click', () => {
            console.log('Model switch button clicked.');
            updateModelSelection(getAvailableModels(), localStorage.getItem('selected_model_id')); // 表示時に最新状態に更新
            apiKeyModal.classList.add('visible');
        });
        console.log('Click listener added to model switch button.');
    } else {
        console.warn('Model switch button or API key modal not found.');
    }


    // --- 会話履歴管理関連 ---
    let activeConversationId = null; // 現在操作中の会話ID

    // 会話リストを描画する関数
    function renderConversationList() {
        console.log('Rendering conversation list...');
        if (!chatManager || !conversationListEl) { // 要素名を修正
            console.warn('Cannot render conversation list: ChatManager or list element not ready.');
            return;
        }

        conversationListEl.innerHTML = ''; // リストをクリア
        const conversations = chatManager.getConversationsList();

        if (conversations.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-conversation-state';
            emptyState.textContent = '会話履歴はありません';
            conversationListEl.appendChild(emptyState);
            console.log('Rendered empty conversation list state.');
        } else {
            conversations.forEach(conversation => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.id = conversation.id;
                if (conversation.id === chatManager.conversationId) {
                    item.classList.add('active');
                }

                const icon = document.createElement('div');
                icon.className = 'conversation-icon';
                icon.innerHTML = '<span class="material-icons">chat</span>';

                const title = document.createElement('div');
                title.className = 'conversation-title';
                title.textContent = conversation.title;
                title.title = conversation.title; // ツールチップ追加

                const menu = document.createElement('div');
                menu.className = 'conversation-menu';
                menu.innerHTML = '<span class="material-icons">more_vert</span>';
                menu.setAttribute('tabindex', '0');
                menu.setAttribute('role', 'button');
                menu.setAttribute('aria-label', `${conversation.title}のオプション`);
                menu.addEventListener('click', (e) => handleConversationMenuClick(e, conversation.id));
                // Enterキーでもメニューを開けるように
                menu.addEventListener('keydown', (e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         handleConversationMenuClick(e, conversation.id);
                     }
                 });


                item.appendChild(icon);
                item.appendChild(title);
                item.appendChild(menu);
                item.addEventListener('click', () => handleConversationItemClick(conversation.id));
                // Enterキーでも会話を選択できるように
                 item.setAttribute('tabindex', '0'); // フォーカス可能にする
                 item.addEventListener('keydown', (e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         handleConversationItemClick(conversation.id);
                     }
                 });

                conversationListEl.appendChild(item);
            });
            console.log(`Rendered ${conversations.length} conversations.`);
        }
    }

    // 会話アイテムがクリックされたときの処理
    function handleConversationItemClick(conversationId) {
        console.log(`Conversation item clicked: ${conversationId}`);
        if (chatManager && chatManager.isInitialized) {
            chatManager.loadConversation(conversationId);
            renderConversationList(); // アクティブ表示を更新
            // スクロールは loadConversation 内で行うか、イベント購読で行う方が良いかも
            // setTimeout(() => chatContainer?.scrollTo(0, chatContainer.scrollHeight), 100);
        } else {
            console.warn('Chat Manager not initialized. Cannot load conversation.');
            alert('チャット機能が初期化されていません。API設定を確認してください。');
        }
    }

    // 会話メニューアイコンがクリックされたときの処理
    let lastClickedMenuButton = null;
    function handleConversationMenuClick(event, conversationId) {
        event.stopPropagation(); // 親要素へのクリックイベント伝播を停止

        // 同じメニューボタンをクリックした場合は閉じる
        if (lastClickedMenuButton === event.currentTarget) {
            closeContextMenu();
            lastClickedMenuButton = null;
            return;
        }

        activeConversationId = conversationId;
        lastClickedMenuButton = event.currentTarget;
        console.log(`Conversation menu clicked for: ${conversationId}`);

        if (conversationContextMenu) {
            // 既存のメニューが表示されている場合は一旦閉じる
            closeContextMenu();

            const rect = event.currentTarget.getBoundingClientRect();
            // メニューが画面外に出ないように調整
            const menuHeight = conversationContextMenu.offsetHeight || 100;
            const menuWidth = conversationContextMenu.offsetWidth || 180;
            let top = rect.bottom + window.scrollY;
            let left = rect.left + window.scrollX;

            if (top + menuHeight > window.innerHeight + window.scrollY) {
                top = rect.top + window.scrollY - menuHeight;
            }
            if (left + menuWidth > window.innerWidth + window.scrollX) {
                left = rect.right + window.scrollX - menuWidth;
            }

            conversationContextMenu.style.top = `${top}px`;
            conversationContextMenu.style.left = `${left}px`;
            conversationContextMenu.classList.add('visible');
        } else {
            console.error('Conversation context menu element not found.');
        }
    }

    // コンテキストメニューを閉じる関数
    function closeContextMenu() {
        if (conversationContextMenu) {
            conversationContextMenu.classList.remove('visible');
            console.log('Context menu closed.');
        }
        lastClickedMenuButton = null;
    }

    // 会話関連のカスタムイベントリスナー
    document.addEventListener('conversation-started', (e) => {
        console.log('Event received: conversation-started', e.detail);
        renderConversationList();
        updateCurrentModelDisplay(); // 新規会話時もモデル表示を更新
    });
    document.addEventListener('conversation-loaded', (e) => {
        console.log('Event received: conversation-loaded', e.detail);
        renderConversationList();
        updateCurrentModelDisplay(); // 会話ロード時もモデル表示を更新
    });
    document.addEventListener('conversation-deleted', (e) => {
        console.log('Event received: conversation-deleted', e.detail);
        renderConversationList();
    });
    console.log('Custom conversation event listeners added.');


    // 現在使用中のモデル名を表示する関数
    function updateCurrentModelDisplay() {
        const currentModelDisplay = document.getElementById('current-model-display');
        if (currentModelDisplay) {
            try {
                const currentModel = getCurrentModel(); // model-managerから取得
                if (currentModel) {
                    currentModelDisplay.textContent = currentModel.name;
                    console.log('Updated current model display:', currentModel.name);
                } else {
                    currentModelDisplay.textContent = 'モデル未選択';
                    console.warn('Could not get current model name.');
                }
            } catch (error) {
                 console.error('Error updating current model display:', error);
                 currentModelDisplay.textContent = '取得エラー';
            }
        } else {
            console.warn('Current model display element not found.');
        }
    }

    // 初期表示時にモデル名を設定（initializeAI内でも呼ばれるが、念のためここでも呼ぶ）
    updateCurrentModelDisplay();

    console.log('Initial script execution finished.');
}); // DOMContentLoaded end