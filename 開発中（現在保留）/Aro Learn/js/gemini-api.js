/**
 * Aro Learn - Gemini API 連携モジュール
 * このファイルは、Google Gemini APIとの連携を管理します
 */

// 設定
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
let API_KEY = ''; // 本番環境では環境変数または安全な方法で管理
let CURRENT_MODEL = 'gemini-2.0-flash'; // デフォルトモデル

// 利用可能なGeminiモデル
const GEMINI_MODELS = {
    'gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        endpoint: 'gemini-2.0-flash',
        multimodal: true
    },
    'gemini-2.5-pro-preview-03-25': {
        name: 'Gemini 2.5 Pro Preview',
        endpoint: 'gemini-2.5-pro-preview-03-25',
        multimodal: true
    },
    'gemini-2.0-flash-exp': {
        name: 'Gemini 2.0 Flash Exp',
        endpoint: 'gemini-2.0-flash-exp',
        multimodal: true
    },
    'gemini-2.0-flash-thinking-exp-01-21': {
        name: 'Gemini 2.0 Flash Thinking',
        endpoint: 'gemini-2.0-flash-thinking-exp-01-21',
        multimodal: true
    },
    'gemini-2.0-flash-lite': {
        name: 'Gemini 2.0 Flash Lite',
        endpoint: 'gemini-2.0-flash-lite',
        multimodal: true
    },
    'learnlm-1.5-pro-experimental': {
        name: 'LearnLM 1.5 Pro',
        endpoint: 'learnlm-1.5-pro-experimental',
        multimodal: true
    }
};

/**
 * Gemini APIの初期化を行います
 * @param {string} apiKey - Gemini API Key
 * @returns {boolean} 初期化成功の可否
 */
function initGeminiAPI(apiKey) {
    if (!apiKey) {
        console.error('API Keyが設定されていません');
        return false;
    }
    API_KEY = apiKey;
    console.log('Gemini API 初期化完了');
    return true;
}

/**
 * 使用するモデルを設定します
 * @param {string} modelId - 使用するモデルID
 * @returns {boolean} 設定成功の可否
 */
function setModel(modelId) {
    if (GEMINI_MODELS[modelId]) {
        CURRENT_MODEL = modelId;
        console.log(`Gemini model set to: ${GEMINI_MODELS[modelId].name}`);
        return true;
    }
    console.error(`未対応のGeminiモデル: ${modelId}`);
    return false;
}

/**
 * Gemini モデルを使用してテキスト生成を行います
 * @param {string} prompt - ユーザーからの入力テキスト
 * @param {Array} context - 会話の文脈（過去のメッセージなど）
 * @param {Object} options - 生成オプション
 * @returns {Promise} レスポンスを含むPromiseオブジェクト
 */
async function generateContent(prompt, context = [], options = {}) {
    if (!API_KEY) {
        throw new Error('API Keyが設定されていません。initGeminiAPI()を先に呼び出してください');
    }

    // 入力が空か確認
    if (!prompt || prompt.trim() === '') {
        throw new Error('テキストプロンプトが空です。テキストを入力してください。');
    }

    const model = GEMINI_MODELS[CURRENT_MODEL];
    if (!model) {
        throw new Error(`未対応のモデル: ${CURRENT_MODEL}`);
    }

    // エラーログを追加
    console.log(`Using Gemini model: ${CURRENT_MODEL} (${model.name})`);

    const defaultOptions = {
        temperature: 0.7,
        maxOutputTokens: 8192, // デフォルト値 - モデルによって変わる
        topK: 40,
        topP: 0.95,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    // モデルごとの最大出力トークン数を設定
    if (CURRENT_MODEL === 'gemini-2.5-pro-preview-03-25') {
        mergedOptions.maxOutputTokens = 65536; // Gemini 2.5 Pro Preview
    } else if (CURRENT_MODEL === 'gemini-2.0-flash-thinking-exp-01-21') {
        mergedOptions.maxOutputTokens = 65536; // Gemini 2.0 Flash Thinking
    } else {
        mergedOptions.maxOutputTokens = 8192; // その他のモデルは8192をデフォルトとする
    }
    
    // 会話履歴を含めたリクエストボディの構築
    const contents = buildConversationContents(prompt, context);
    
    // 空のテキスト部分がないか確認
    for (const content of contents) {
        for (const part of content.parts) {
            if (part.text !== undefined && (part.text === null || part.text === '')) {
                console.error('空のテキスト部分があります:', content);
                part.text = ' '; // 空のテキストには最低限スペースを入れる
            }
        }
    }
    
    const requestBody = {
        contents: contents,
        generationConfig: {
            temperature: mergedOptions.temperature,
            maxOutputTokens: mergedOptions.maxOutputTokens,
            topK: mergedOptions.topK,
            topP: mergedOptions.topP,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };

    try {
        // デバッグログ
        console.log('送信するリクエスト内容:', JSON.stringify(requestBody, null, 2));
        
        // APIエンドポイントURLの構築と詳細ログ
        const apiUrl = `${GEMINI_API_BASE_URL}/${model.endpoint}:generateContent?key=${API_KEY}`;
        console.log(`Sending request to: ${apiUrl.replace(API_KEY, 'API_KEY_HIDDEN')}`);
        
        const response = await fetch(
            apiUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error Response:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini API レスポンス:', data);
        
        // レスポンスの検証
        if (!data.candidates || data.candidates.length === 0) {
            console.error('Gemini API: Empty response candidates', data);
            throw new Error('APIから有効なレスポンスが返されませんでした');
        }
        
        return {
            text: data.candidates[0]?.content?.parts[0]?.text || '',
            data: data
        };
    } catch (error) {
        console.error('Gemini API呼び出しエラー:', error);
        throw error;
    }
}

/**
 * 会話履歴を含めたリクエストコンテンツの構築
 * @param {string} currentPrompt - 現在のユーザー入力
 * @param {Array} contextMessages - 過去のメッセージ配列
 * @returns {Array} APIリクエスト用のcontentsオブジェクト
 */
function buildConversationContents(currentPrompt, contextMessages) {
    const contents = [];

    // システムメッセージの追加（オプション）
    contents.push({
        role: 'user',
        parts: [{ text: 'あなたは教育支援AIアシスタントの「Aro Learn」です。学習者に対して親切で分かりやすい回答を提供してください。' }]
    });
    
    if (contextMessages && contextMessages.length > 0) {
        // 過去のメッセージを追加
        contextMessages.forEach(msg => {
            // roleを確認して調整
            const role = msg.role === 'model' ? 'model' : 'user';
            
            // テキストが空でないことを確認
            const text = msg.content || ' ';
            
            contents.push({
                role: role,
                parts: [{ text: text }]
            });
        });
    }

    // 現在のプロンプトが空ではないことを確認
    const sanitizedPrompt = currentPrompt.trim() || '何か教えてください';
    
    // 現在のプロンプトを追加
    contents.push({
        role: 'user',
        parts: [{ text: sanitizedPrompt }]
    });

    return contents;
}

/**
 * マルチモーダル入力（テキスト+画像）での生成を行います
 * @param {string} prompt - テキストプロンプト
 * @param {string} imageData - Base64エンコードされた画像データ
 * @param {Object} options - 生成オプション
 * @returns {Promise} レスポンスを含むPromiseオブジェクト
 */
async function generateContentWithImage(prompt, imageData, options = {}) {
    if (!API_KEY) {
        throw new Error('API Keyが設定されていません');
    }

    // 入力が空か確認
    if (!prompt || prompt.trim() === '') {
        prompt = 'この画像について説明してください';
    }

    const model = GEMINI_MODELS[CURRENT_MODEL];
    if (!model) {
        throw new Error(`未対応のモデル: ${CURRENT_MODEL}`);
    }

    if (!model.multimodal) {
        throw new Error(`選択されたモデル (${model.name}) はマルチモーダル入力をサポートしていません`);
    }

    // エラーログを追加
    console.log(`Using Gemini model for multimodal: ${CURRENT_MODEL} (${model.name})`);

    const defaultOptions = {
        temperature: 0.7,
        maxOutputTokens: 8192, // デフォルト値
        topK: 40,
        topP: 0.95,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    // モデルごとの最大出力トークン数を設定
    if (CURRENT_MODEL === 'gemini-2.5-pro-preview-03-25') {
        mergedOptions.maxOutputTokens = 65536; // Gemini 2.5 Pro Preview
    } else if (CURRENT_MODEL === 'gemini-2.0-flash-thinking-exp-01-21') {
        mergedOptions.maxOutputTokens = 65536; // Gemini 2.0 Flash Thinking
    } else {
        mergedOptions.maxOutputTokens = 8192; // その他のモデルは8192をデフォルトとする
    }
    
    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg', // 適切なMIMEタイプに変更
                            data: imageData // Base64エンコードされたデータ
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: mergedOptions.temperature,
            maxOutputTokens: mergedOptions.maxOutputTokens,
            topK: mergedOptions.topK,
            topP: mergedOptions.topP,
        }
    };

    try {
        // デバッグログ（画像データを除く）
        const logBody = { ...requestBody };
        logBody.contents[0].parts = logBody.contents[0].parts.map(part => 
            part.inline_data ? { ...part, inline_data: { mime_type: part.inline_data.mime_type, data: '[画像データ]' } : part
        );
        console.log('送信するマルチモーダルリクエスト内容:', JSON.stringify(logBody, null, 2));
        
        // APIエンドポイントURLの構築と詳細ログ
        const apiUrl = `${GEMINI_API_BASE_URL}/${model.endpoint}:generateContent?key=${API_KEY}`;
        console.log(`Sending multimodal request to: ${apiUrl.replace(API_KEY, 'API_KEY_HIDDEN')}`);
        
        const response = await fetch(
            apiUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Multimodal Error Response:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini API マルチモーダルレスポンス:', data);
        
        // レスポンスの検証
        if (!data.candidates || data.candidates.length === 0) {
            console.error('Gemini API: Empty multimodal response candidates', data);
            throw new Error('APIから有効なレスポンスが返されませんでした');
        }
        
        return {
            text: data.candidates[0]?.content?.parts[0]?.text || '',
            data: data
        };
    } catch (error) {
        console.error('Gemini API マルチモーダル呼び出しエラー:', error);
        throw error;
    }
}

// API公開
export {
    initGeminiAPI,
    setModel,
    generateContent,
    generateContentWithImage,
    GEMINI_MODELS
};