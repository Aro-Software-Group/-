/**
 * Aro Learn - チャット管理モジュール
 * 会話履歴の管理とチャットインターフェースの制御を行います
 */

import { generateContent, generateContentWithImage } from './model-manager.js';

class ChatManager {
    constructor() {
        this.conversationHistory = [];
        this.isProcessing = false;
        this.isInitialized = false;
        this.chatContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.voiceButton = null;
        this.conversationId = null;
        this.conversationsStore = {}; // 複数の会話を保存するストア
    }

    /**
     * チャットマネージャーを初期化します
     * @param {HTMLElement} chatContainer - チャットメッセージを表示するコンテナ
     * @param {HTMLElement} messageInput - メッセージ入力フィールド
     * @param {HTMLElement} sendButton - 送信ボタン（オプション）
     * @param {HTMLElement} voiceButton - 音声入力ボタン（オプション）
     */
    init(chatContainer, messageInput, sendButton = null, voiceButton = null) {
        this.chatContainer = chatContainer;
        this.messageInput = messageInput;
        this.sendButton = sendButton;
        this.voiceButton = voiceButton;

        // 初期チャットコンテナの設定
        if (!this.chatContainer.classList.contains('chat-messages')) {
            this.chatContainer.classList.add('chat-messages');
        }

        // 送信ボタンのイベントリスナー設定
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        // メッセージ入力フィールドのEnterキーイベント
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // 会話履歴をローカルストレージから読み込む
        this.loadConversationsFromStorage();

        // 新しい会話を開始（会話IDがなければ）
        if (!this.conversationId) {
            this.startNewConversation();
        }
        
        // 初期化が完了したことを記録
        this.isInitialized = true;

        console.log('チャットマネージャーが初期化されました');
    }

    /**
     * メッセージを送信します
     */
    async sendMessage() {
        if (this.isProcessing) return; // 処理中は新しいメッセージを受け付けない

        const message = this.messageInput.value.trim();
        if (!message) return;

        this.isProcessing = true;

        // ユーザーメッセージの表示
        this.addMessageToUI('user', message);
        this.messageInput.value = '';

        // 「入力中...」状態の表示
        const typingIndicatorId = this.addTypingIndicator();

        try {
            // モデルマネージャー経由でAPIリクエスト
            const response = await generateContent(message, this.getAPIFormatHistory());
            
            // 会話履歴に追加
            this.addMessageToHistory('user', message);
            this.addMessageToHistory('model', response.text);
            
            // 「入力中...」の削除
            this.removeTypingIndicator(typingIndicatorId);
            
            // AIの応答をUIに表示
            this.addMessageToUI('model', response.text);
        } catch (error) {
            console.error('メッセージ処理エラー:', error);
            
            // 「入力中...」の削除
            this.removeTypingIndicator(typingIndicatorId);
            
            // エラーメッセージの表示
            this.addMessageToUI('error', '申し訳ありません。メッセージの処理中にエラーが発生しました。');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 画像付きメッセージを送信します
     * @param {string} message - テキストメッセージ
     * @param {string} imageData - Base64エンコードされた画像データ
     */
    async sendMessageWithImage(message, imageData) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // ユーザーメッセージの表示（画像を含む）
        this.addMessageWithImageToUI('user', message, imageData);
        this.messageInput.value = '';

        // 「入力中...」状態の表示
        const typingIndicatorId = this.addTypingIndicator();

        try {
            // モデルマネージャー経由でAPIリクエスト
            const response = await generateContentWithImage(message, imageData);
            
            // 会話履歴に追加（画像参照情報も含める）
            this.addMessageToHistory('user', `${message} [画像が添付されています]`);
            this.addMessageToHistory('model', response.text);
            
            // 「入力中...」の削除
            this.removeTypingIndicator(typingIndicatorId);
            
            // AIの応答をUIに表示
            this.addMessageToUI('model', response.text);
        } catch (error) {
            console.error('画像付きメッセージ処理エラー:', error);
            
            // 「入力中...」の削除
            this.removeTypingIndicator(typingIndicatorId);
            
            // エラーメッセージの表示
            this.addMessageToUI('error', '申し訳ありません。画像の処理中にエラーが発生しました。');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * メッセージをUIに追加します
     * @param {string} role - 'user'または'model'または'error'
     * @param {string} content - メッセージの内容
     */
    addMessageToUI(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${role}-message`);
        
        // メッセージアイコン
        const iconElement = document.createElement('div');
        iconElement.classList.add('message-icon');
        
        if (role === 'user') {
            iconElement.innerHTML = '<span class="material-icons">person</span>';
        } else if (role === 'model') {
            iconElement.innerHTML = '<img src="images/aro-learn-logo.svg" alt="Aro Learn" width="20" height="20">';
        } else if (role === 'error') {
            iconElement.innerHTML = '<span class="material-icons">error</span>';
        }
        
        // メッセージコンテンツ
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        // テキストをMarkdownとして解析して表示
        contentElement.innerHTML = this.formatMessageContent(content);
        
        messageElement.appendChild(iconElement);
        messageElement.appendChild(contentElement);
        
        this.chatContainer.appendChild(messageElement);
        
        // スクロールを最下部に
        this.scrollToBottom();
    }

    /**
     * 画像付きメッセージをUIに追加します
     * @param {string} role - 'user'または'model'
     * @param {string} content - メッセージの内容
     * @param {string} imageData - Base64エンコードされた画像データ
     */
    addMessageWithImageToUI(role, content, imageData) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${role}-message`);
        
        // メッセージアイコン
        const iconElement = document.createElement('div');
        iconElement.classList.add('message-icon');
        
        if (role === 'user') {
            iconElement.innerHTML = '<span class="material-icons">person</span>';
        } else {
            iconElement.innerHTML = '<img src="images/aro-learn-logo.svg" alt="Aro Learn" width="20" height="20">';
        }
        
        // メッセージコンテンツ
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        // テキストコンテンツ
        if (content) {
            const textElement = document.createElement('p');
            textElement.textContent = content;
            contentElement.appendChild(textElement);
        }
        
        // 画像コンテンツ
        const imageElement = document.createElement('img');
        imageElement.src = `data:image/jpeg;base64,${imageData}`;
        imageElement.classList.add('message-image');
        imageElement.alt = '添付画像';
        contentElement.appendChild(imageElement);
        
        messageElement.appendChild(iconElement);
        messageElement.appendChild(contentElement);
        
        this.chatContainer.appendChild(messageElement);
        
        // スクロールを最下部に
        this.scrollToBottom();
    }

    /**
     * 「入力中...」インジケーターを追加します
     * @returns {string} インジケーターのID
     */
    addTypingIndicator() {
        const indicatorId = `typing-${Date.now()}`;
        const indicatorElement = document.createElement('div');
        indicatorElement.id = indicatorId;
        indicatorElement.classList.add('chat-message', 'model-message', 'typing-indicator');
        
        // アイコン
        const iconElement = document.createElement('div');
        iconElement.classList.add('message-icon');
        iconElement.innerHTML = '<img src="images/aro-learn-logo.svg" alt="Aro Learn" width="20" height="20">';
        
        // インジケーター
        const indicatorContent = document.createElement('div');
        indicatorContent.classList.add('typing-dots');
        indicatorContent.innerHTML = '<span></span><span></span><span></span>';
        
        indicatorElement.appendChild(iconElement);
        indicatorElement.appendChild(indicatorContent);
        
        this.chatContainer.appendChild(indicatorElement);
        
        // スクロールを最下部に
        this.scrollToBottom();
        
        return indicatorId;
    }

    /**
     * 「入力中...」インジケーターを削除します
     * @param {string} indicatorId - 削除するインジケーターのID
     */
    removeTypingIndicator(indicatorId) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * メッセージを会話履歴に追加します
     * @param {string} role - 'user'または'model'
     * @param {string} content - メッセージの内容
     */
    addMessageToHistory(role, content) {
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.conversationHistory.push(message);
        
        // 現在の会話を保存
        this.saveCurrentConversation();
    }

    /**
     * API用の会話履歴形式に変換します
     * @returns {Array} API用の会話履歴
     */
    getAPIFormatHistory() {
        return this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    /**
     * チャットコンテナを最下部にスクロールします
     */
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * メッセージコンテンツを整形します（Markdown対応など）
     * @param {string} content - 生のメッセージコンテンツ
     * @returns {string} HTML形式に変換されたコンテンツ
     */
    formatMessageContent(content) {
        // 簡易的なMarkdown変換（実際にはより高度な処理が必要）
        // コードブロックの処理
        let formatted = content.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');
        
        // インライン`コード`の処理
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 太字の処理
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // 斜体の処理
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // 改行の処理
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    /**
     * 新しい会話を開始します
     * @param {string} title - 会話のタイトル（オプション）
     * @returns {string} 新しい会話のID
     */
    startNewConversation(title = null) {
        // 現在の会話を保存
        if (this.conversationId && this.conversationHistory.length > 0) {
            this.saveCurrentConversation();
        }
        
        // 新しい会話IDを生成
        this.conversationId = `conversation-${Date.now()}`;
        
        // 会話を初期化
        this.conversationHistory = [];
        
        // タイトルがなければデフォルトを設定
        const conversationTitle = title || `会話 ${new Date().toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        })}`;
        
        // 会話メタデータを保存
        this.conversationsStore[this.conversationId] = {
            title: conversationTitle,
            lastUpdated: new Date().toISOString(),
            messages: []
        };
        
        // ローカルストレージに会話リストを更新
        this.saveConversationsMetadata();
        
        // UIをクリア
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }
        
        // 会話開始イベントを発行
        const event = new CustomEvent('conversation-started', {
            detail: {
                id: this.conversationId,
                title: conversationTitle
            }
        });
        document.dispatchEvent(event);
        
        return this.conversationId;
    }

    /**
     * 特定の会話を読み込みます
     * @param {string} conversationId - 読み込む会話のID
     * @returns {boolean} 読み込み成功の可否
     */
    loadConversation(conversationId) {
        if (!this.conversationsStore[conversationId]) {
            console.error(`会話ID ${conversationId} が見つかりません`);
            return false;
        }
        
        // 現在の会話を保存（メッセージがある場合）
        if (this.conversationHistory.length > 0) {
            this.saveCurrentConversation();
        }
        
        // 会話IDを更新
        this.conversationId = conversationId;
        
        // 会話履歴を読み込み
        this.conversationHistory = [...this.conversationsStore[conversationId].messages];
        
        // 最終更新日時を更新
        this.conversationsStore[conversationId].lastUpdated = new Date().toISOString();
        this.saveConversationsMetadata();
        
        // UIをクリア
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
            
            // メッセージをUIに表示
            this.conversationHistory.forEach(msg => {
                if (msg.hasImage) {
                    // 画像付きメッセージの場合（実際の画像データはここでは復元しない）
                    this.addMessageToUI(msg.role, msg.content);
                } else {
                    this.addMessageToUI(msg.role, msg.content);
                }
            });
        }
        
        // 会話読み込みイベントを発行
        const event = new CustomEvent('conversation-loaded', {
            detail: {
                id: conversationId,
                title: this.conversationsStore[conversationId].title
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }

    /**
     * 会話を削除します
     * @param {string} conversationId - 削除する会話のID
     * @returns {boolean} 削除成功の可否
     */
    deleteConversation(conversationId) {
        if (!this.conversationsStore[conversationId]) {
            console.error(`会話ID ${conversationId} が見つかりません`);
            return false;
        }
        
        // 会話ストアから削除
        delete this.conversationsStore[conversationId];
        
        // ローカルストレージを更新
        this.saveConversationsMetadata();
        
        // 削除した会話が現在の会話だった場合、新しい会話を開始
        if (this.conversationId === conversationId) {
            this.startNewConversation();
        }
        
        // 会話削除イベントを発行
        const event = new CustomEvent('conversation-deleted', {
            detail: {
                id: conversationId
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }

    /**
     * 現在の会話をローカルストレージに保存します
     */
    saveCurrentConversation() {
        if (!this.conversationId) return;
        
        this.conversationsStore[this.conversationId] = {
            title: this.conversationsStore[this.conversationId]?.title || `会話 ${new Date().toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            })}`,
            lastUpdated: new Date().toISOString(),
            messages: [...this.conversationHistory]
        };
        
        // 会話データをローカルストレージに保存
        try {
            localStorage.setItem(
                `aro_learn_conversation_${this.conversationId}`,
                JSON.stringify(this.conversationsStore[this.conversationId])
            );
            this.saveConversationsMetadata();
        } catch (e) {
            console.error('会話の保存中にエラーが発生しました:', e);
        }
    }

    /**
     * 会話メタデータをローカルストレージに保存します
     */
    saveConversationsMetadata() {
        const metadata = {};
        
        // 各会話のメタデータのみを保存（メッセージ内容は含めない）
        Object.keys(this.conversationsStore).forEach(id => {
            metadata[id] = {
                title: this.conversationsStore[id].title,
                lastUpdated: this.conversationsStore[id].lastUpdated
            };
        });
        
        try {
            localStorage.setItem('aro_learn_conversations', JSON.stringify(metadata));
        } catch (e) {
            console.error('会話メタデータの保存中にエラーが発生しました:', e);
        }
    }

    /**
     * 会話をローカルストレージから読み込みます
     */
    loadConversationsFromStorage() {
        // メタデータを読み込み
        const metadataStr = localStorage.getItem('aro_learn_conversations');
        if (!metadataStr) return;
        
        try {
            const metadata = JSON.parse(metadataStr);
            
            // 各会話の詳細データを読み込み
            Object.keys(metadata).forEach(id => {
                const conversationData = localStorage.getItem(`aro_learn_conversation_${id}`);
                if (conversationData) {
                    this.conversationsStore[id] = JSON.parse(conversationData);
                } else {
                    // メタデータだけあって詳細がない場合
                    this.conversationsStore[id] = {
                        title: metadata[id].title,
                        lastUpdated: metadata[id].lastUpdated,
                        messages: []
                    };
                }
            });
            
            // 最新の会話があれば読み込む
            const sortedIds = Object.keys(metadata).sort((a, b) => {
                return new Date(metadata[b].lastUpdated) - new Date(metadata[a].lastUpdated);
            });
            
            if (sortedIds.length > 0) {
                this.conversationId = sortedIds[0];
                this.conversationHistory = [...this.conversationsStore[this.conversationId].messages];
            }
        } catch (e) {
            console.error('会話の読み込み中にエラーが発生しました:', e);
            // エラーが発生した場合は初期化
            this.conversationsStore = {};
            this.conversationHistory = [];
        }
    }

    /**
     * 会話の履歴一覧を取得します
     * @returns {Array} 会話履歴の配列
     */
    getConversationsList() {
        const list = [];
        
        Object.keys(this.conversationsStore).forEach(id => {
            list.push({
                id: id,
                title: this.conversationsStore[id].title,
                lastUpdated: this.conversationsStore[id].lastUpdated,
                messageCount: this.conversationsStore[id].messages.length
            });
        });
        
        // 最終更新日時でソート（新しい順）
        return list.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    }

    /**
     * 会話のタイトルを更新します
     * @param {string} conversationId - 会話ID
     * @param {string} newTitle - 新しいタイトル
     * @returns {boolean} 更新成功の可否
     */
    updateConversationTitle(conversationId, newTitle) {
        if (!this.conversationsStore[conversationId]) {
            console.error(`会話ID ${conversationId} が見つかりません`);
            return false;
        }
        
        this.conversationsStore[conversationId].title = newTitle;
        this.saveConversationsMetadata();
        
        // 会話のストレージデータも更新
        try {
            const conversationData = localStorage.getItem(`aro_learn_conversation_${conversationId}`);
            if (conversationData) {
                const data = JSON.parse(conversationData);
                data.title = newTitle;
                localStorage.setItem(`aro_learn_conversation_${conversationId}`, JSON.stringify(data));
            }
        } catch (e) {
            console.error('会話タイトルの更新中にエラーが発生しました:', e);
        }
        
        return true;
    }

    /**
     * 現在の会話をクリアします
     */
    clearCurrentConversation() {
        this.conversationHistory = [];
        
        // UIもクリア
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }
        
        // ストアとストレージから現在の会話を削除
        this.deleteConversation(this.conversationId);
        
        // 新しい会話を開始
        this.startNewConversation();
    }

    /**
     * すべての会話を削除します
     */
    clearAllConversations() {
        // ストアをクリア
        this.conversationsStore = {};
        
        // ローカルストレージから会話関連のデータを削除
        try {
            localStorage.removeItem('aro_learn_conversations');
            
            // aro_learn_conversation_で始まるキーをすべて削除
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('aro_learn_conversation_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            console.error('会話の削除中にエラーが発生しました:', e);
        }
        
        // UIをクリア
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }
        
        // 新しい会話を開始
        this.startNewConversation();
    }

    /**
     * ユーザーメッセージを送信します（main.jsから呼ばれる新しいメソッド）
     * @param {string} message - ユーザーが入力したメッセージ
     * @returns {Promise} - 処理の結果を返すPromise
     */
    async sendUserMessage(message) {
        if (this.isProcessing) {
            return Promise.reject(new Error('Message is already being processed'));
        }

        if (!message || !message.trim()) {
            return Promise.reject(new Error('Message is empty'));
        }

        this.isProcessing = true;

        // ユーザーメッセージの表示
        this.addMessageToUI('user', message);

        // 「入力中...」状態の表示
        const typingIndicatorId = this.addTypingIndicator();

        try {
            // モデルマネージャー経由でAPIリクエスト
            const response = await generateContent(message, this.getAPIFormatHistory());
            
            // 会話履歴に追加
            this.addMessageToHistory('user', message);
            this.addMessageToHistory('model', response.text);
            
            // 「入力中...」の削除
            this.removeTypingIndicator(typingIndicatorId);
            
            // AIの応答をUIに表示
            this.addMessageToUI('model', response.text);
            
            // 会話を保存
            this.saveCurrentConversation();
            
            return Promise.resolve();
        } catch (error) {
            console.error('メッセージ処理エラー:', error);
            
            // 「入力中...」の削除
            this.removeTypingIndicator(typingIndicatorId);
            
            // エラーメッセージの表示
            this.displayErrorMessage('申し訳ありません。メッセージの処理中にエラーが発生しました。');
            
            return Promise.reject(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * エラーメッセージを表示します
     * @param {string} message - エラーメッセージ
     */
    displayErrorMessage(message) {
        this.addMessageToUI('error', message);
    }
}

// シングルトンインスタンスを作成して公開
const chatManager = new ChatManager();
export default chatManager;