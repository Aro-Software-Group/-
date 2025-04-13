/**
 * Aro Learn - Gemini Live API 連携モジュール
 * リアルタイム音声対話の処理を担当します
 */

import { initGeminiAPI } from './gemini-api.js';

class GeminiLiveManager {
    constructor() {
        this.isInitialized = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.audioContext = null;
        this.recognitionInstance = null;
        this.synthesisInstance = null;
        this.onMessageCallback = null;
        this.onStateChangeCallback = null;
    }

    /**
     * Gemini Live APIを初期化します
     * @param {string} apiKey - Gemini API Key
     * @param {Object} options - 初期化オプション
     * @returns {boolean} 初期化成功の可否
     */
    async init(apiKey, options = {}) {
        // Gemini APIの初期化
        if (!initGeminiAPI(apiKey)) {
            return false;
        }

        // Web Speech APIの確認
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.error('このブラウザは音声認識をサポートしていません');
            return false;
        }

        // Web Audio APIの確認
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio APIの初期化に失敗しました:', e);
            return false;
        }

        // 音声認識インスタンスの初期化
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognitionInstance = new SpeechRecognition();
        this.recognitionInstance.continuous = true;
        this.recognitionInstance.interimResults = true;
        this.recognitionInstance.lang = options.language || 'ja-JP';

        // 音声合成の初期化
        if ('speechSynthesis' in window) {
            this.synthesisInstance = window.speechSynthesis;
        } else {
            console.warn('このブラウザは音声合成をサポートしていません');
        }

        // イベントリスナーのセットアップ
        this._setupEventListeners();

        this.isInitialized = true;
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback({ initialized: true });
        }

        return true;
    }

    /**
     * イベントリスナーをセットアップします
     * @private
     */
    _setupEventListeners() {
        // 音声認識結果のハンドリング
        this.recognitionInstance.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            if (event.results[0].isFinal && this.onMessageCallback) {
                this.onMessageCallback({
                    type: 'transcript',
                    text: transcript,
                    isFinal: true
                });
            } else if (this.onMessageCallback) {
                this.onMessageCallback({
                    type: 'transcript',
                    text: transcript,
                    isFinal: false
                });
            }
        };

        // 音声認識終了時の処理
        this.recognitionInstance.onend = () => {
            this.isListening = false;
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback({ listening: false });
            }
        };

        // 音声認識エラーの処理
        this.recognitionInstance.onerror = (event) => {
            console.error('音声認識エラー:', event.error);
            this.isListening = false;
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback({ 
                    listening: false,
                    error: {
                        type: 'recognition',
                        message: event.error
                    }
                });
            }
        };
    }

    /**
     * 音声認識を開始します
     * @returns {boolean} 開始成功の可否
     */
    startListening() {
        if (!this.isInitialized) {
            console.error('Gemini Live APIが初期化されていません');
            return false;
        }

        if (this.isListening) {
            return true; // すでに認識中
        }

        try {
            this.recognitionInstance.start();
            this.isListening = true;
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback({ listening: true });
            }
            return true;
        } catch (error) {
            console.error('音声認識の開始に失敗しました:', error);
            return false;
        }
    }

    /**
     * 音声認識を停止します
     */
    stopListening() {
        if (!this.isListening) return;

        try {
            this.recognitionInstance.stop();
            this.isListening = false;
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback({ listening: false });
            }
        } catch (error) {
            console.error('音声認識の停止に失敗しました:', error);
        }
    }

    /**
     * テキストを音声合成で再生します
     * @param {string} text - 読み上げるテキスト
     * @param {Object} options - 音声合成オプション
     * @returns {Promise} 再生完了時に解決するPromise
     */
    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.synthesisInstance) {
                reject(new Error('音声合成がサポートされていません'));
                return;
            }

            // 現在再生中の音声をキャンセル
            if (this.isSpeaking) {
                this.synthesisInstance.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = options.language || 'ja-JP';
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            // 音声の選択（可能であれば）
            if (options.voiceName) {
                const voices = this.synthesisInstance.getVoices();
                const selectedVoice = voices.find(voice => voice.name === options.voiceName);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            // イベントハンドラー
            utterance.onstart = () => {
                this.isSpeaking = true;
                if (this.onStateChangeCallback) {
                    this.onStateChangeCallback({ speaking: true });
                }
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                if (this.onStateChangeCallback) {
                    this.onStateChangeCallback({ speaking: false });
                }
                resolve();
            };

            utterance.onerror = (error) => {
                this.isSpeaking = false;
                if (this.onStateChangeCallback) {
                    this.onStateChangeCallback({ 
                        speaking: false,
                        error: {
                            type: 'synthesis',
                            message: error.message
                        }
                    });
                }
                reject(error);
            };

            this.synthesisInstance.speak(utterance);
        });
    }

    /**
     * 音声の再生を停止します
     */
    stopSpeaking() {
        if (this.synthesisInstance && this.isSpeaking) {
            this.synthesisInstance.cancel();
            this.isSpeaking = false;
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback({ speaking: false });
            }
        }
    }

    /**
     * メッセージ受信コールバックを設定します
     * @param {Function} callback - コールバック関数
     */
    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    /**
     * 状態変更コールバックを設定します
     * @param {Function} callback - コールバック関数
     */
    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }

    /**
     * Gemini Live APIと全双方向会話を開始します
     * 現在は実装の基本構造のみ（Gemini Live APIが利用可能になったら拡張）
     * @param {Object} options - 会話オプション
     * @returns {Object} 会話セッションオブジェクト
     */
    startConversation(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Gemini Live APIが初期化されていません');
        }

        // TODO: Gemini Live API実装後、実際のAPIと連携する
        console.log('Gemini Live 会話を開始しました（シミュレーション）');

        // 会話の状態を管理するシンプルなオブジェクト
        const conversationSession = {
            isActive: true,
            stopConversation: () => {
                this.stopListening();
                this.stopSpeaking();
                conversationSession.isActive = false;
                console.log('Gemini Live 会話を終了しました');
            }
        };

        // 音声認識開始
        this.startListening();

        return conversationSession;
    }

    /**
     * 利用可能な音声のリストを取得します
     * @returns {Array} 利用可能な音声の配列
     */
    getAvailableVoices() {
        if (!this.synthesisInstance) {
            return [];
        }
        return this.synthesisInstance.getVoices();
    }
}

// シングルトンインスタンスを作成して公開
const geminiLiveManager = new GeminiLiveManager();
export default geminiLiveManager;