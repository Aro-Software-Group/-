/**
 * Aro Learn - OpenRouter API 連携モジュール
 * このファイルは、OpenRouter APIとの連携を管理します
 */

// 設定
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
let API_KEY = ''; // 本番環境では環境変数または安全な方法で管理

// サポートするモデルのリスト
const SUPPORTED_MODELS = [
    {
        id: 'google/learnlm-1.5-pro-experimental:free',
        name: 'Google LearnLM 1.5 Pro',
        description: '教育特化型の高性能モデル',
        provider: 'openrouter',
        multimodal: true
    },
    {
        id: 'openrouter/optimus-alpha',
        name: 'Optimus Alpha',
        description: '高性能な汎用モデル',
        provider: 'openrouter',
        multimodal: false
    },
    {
        id: 'deepseek/deepseek-chat-v3-0324:free',
        name: 'DeepSeek Chat v3',
        description: 'DeepSeekの高性能チャットモデル',
        provider: 'openrouter',
        multimodal: false
    },
    {
        id: 'qwen/qwq-32b:free',
        name: 'Qwen QWQ 32B',
        description: 'Qwenの大規模言語モデル',
        provider: 'openrouter',
        multimodal: false
    },
    {
        id: 'deepseek/deepseek-r1:free',
        name: 'DeepSeek R1',
        description: '推論に特化したDeepSeekモデル',
        provider: 'openrouter',
        multimodal: false
    },
    {
        id: 'nvidia/llama-3.1-nemotron-ultra-253b:free',
        name: 'NVIDIA Nemotron Ultra',
        description: 'NVIDIAの超大規模言語モデル',
        provider: 'openrouter',
        multimodal: false
    },
    {
        id: 'meta-llama/llama-4-maverick:free',
        name: 'Llama 4 Maverick',
        description: 'Metaの最新Llamaモデル',
        provider: 'openrouter',
        multimodal: false
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Googleの高速レスポンスモデル',
        provider: 'gemini'
    }
];

/**
 * OpenRouter APIの初期化を行います
 * @param {string} apiKey - OpenRouter API Key
 */
function initOpenRouterAPI(apiKey) {
    if (!apiKey) {
        console.error('API Keyが設定されていません');
        return false;
    }
    API_KEY = apiKey;
    console.log('OpenRouter API 初期化完了');
    return true;
}

/**
 * OpenRouter APIを使用してテキスト生成を行います
 * @param {string} prompt - ユーザーからの入力テキスト
 * @param {Array} context - 会話の文脈（過去のメッセージなど）
 * @param {string} model - 使用するモデルID
 * @param {Object} options - 生成オプション
 * @returns {Promise} レスポンスを含むPromiseオブジェクト
 */
async function generateContent(prompt, context = [], model = 'google/learnlm-1.5-pro-experimental:free', options = {}) {
    if (!API_KEY) {
        throw new Error('API Keyが設定されていません。initOpenRouterAPI()を先に呼び出してください');
    }

    const defaultOptions = {
        temperature: 0.7,
        max_tokens: 32768, // 最大値に設定
        top_p: 0.95,
    };

    // モデルごとの最大出力トークン数を設定
    let modelMaxTokens = 32768; // デフォルト値
    if (model === 'deepseek/deepseek-r1:free') {
        modelMaxTokens = 32768; // DeepSeek R1
    } else if (model.includes('gemini-2.0-flash')) {
        modelMaxTokens = 8192; // Gemini 2.0 Flash
    } else if (model.includes('optimus-alpha') || model.includes('llama-4-maverick')) {
        modelMaxTokens = 65536; // Optimus Alpha, Llama 4 Maverick など
    }

    // ユーザー指定のオプションと合体（ユーザー指定が優先）
    const mergedOptions = { 
        ...defaultOptions, 
        max_tokens: modelMaxTokens, 
        ...options 
    };
    
    // 会話履歴を含めたメッセージの構築
    const messages = buildConversationMessages(prompt, context);
    
    const requestBody = {
        model: model,
        messages: messages,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.max_tokens,
        top_p: mergedOptions.top_p,
        stream: false
    };

    try {
        console.log(`OpenRouter API リクエスト: モデル=${model}`, { 
            messageCount: messages.length,
            firstFewWords: prompt.substring(0, 30) + '...'
        });
        
        console.log(`送信リクエスト内容:`, JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Aro Learn'
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorMessage = `HTTP Error: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('OpenRouter API エラーレスポンス:', errorData);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                // JSONパースエラーは無視
                console.error('OpenRouter API エラーレスポンスのパースに失敗:', e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('OpenRouter API 応答成功:', {
            modelUsed: data.model,
            promptTokens: data.usage?.prompt_tokens,
            completionTokens: data.usage?.completion_tokens,
            firstFewWords: data.choices?.[0]?.message?.content?.substring(0, 30) + '...' || 'No content'
        });
        
        // レスポンスの検証
        if (!data.choices || data.choices.length === 0 || !data.choices[0]?.message?.content) {
            console.error('OpenRouter API: 空のレスポンス', data);
            throw new Error('APIから有効なレスポンスが返されませんでした');
        }
        
        return {
            text: data.choices[0]?.message?.content || '',
            data: data
        };
    } catch (error) {
        console.error('OpenRouter API呼び出しエラー:', error);
        throw error;
    }
}

/**
 * 会話履歴を含めたメッセージの構築
 * @param {string} currentPrompt - 現在のユーザー入力
 * @param {Array} contextMessages - 過去のメッセージ配列
 * @returns {Array} APIリクエスト用のmessagesオブジェクト
 */
function buildConversationMessages(currentPrompt, contextMessages) {
    const messages = [];
    
    // システムメッセージを追加
    messages.push({
        role: 'system',
        content: 'あなたは教育支援AIアシスタントの「Aro Learn」です。学習者に対して親切で分かりやすい回答を提供してください。'
    });
    
    // 過去のメッセージを追加
    contextMessages.forEach(msg => {
        // 重要: OpenRouterでは 'model' -> 'assistant' に変換する必要がある
        const role = msg.role === 'model' ? 'assistant' : msg.role;
        messages.push({
            role: role,
            content: msg.content
        });
    });
    
    // 現在のプロンプトを追加
    messages.push({
        role: 'user',
        content: currentPrompt
    });
    
    return messages;
}

/**
 * マルチモーダル入力（テキスト+画像）での生成を行います
 * @param {string} prompt - テキストプロンプト
 * @param {string} imageData - Base64エンコードされた画像データ
 * @param {string} model - 使用するモデルID
 * @param {Object} options - 生成オプション
 * @returns {Promise} レスポンスを含むPromiseオブジェクト
 */
async function generateContentWithImage(prompt, imageData, model = 'google/learnlm-1.5-pro-experimental:free', options = {}) {
    if (!API_KEY) {
        throw new Error('API Keyが設定されていません');
    }

    // 選択したモデルがマルチモーダルをサポートしているか確認
    const selectedModel = SUPPORTED_MODELS.find(m => m.id === model);
    if (!selectedModel || !selectedModel.multimodal) {
        throw new Error(`選択されたモデル(${model})はマルチモーダル入力をサポートしていません`);
    }

    const defaultOptions = {
        temperature: 0.7,
        max_tokens: 32768, // デフォルト値を高く設定
        top_p: 0.95,
    };

    // モデルごとの最大出力トークン数を設定
    let modelMaxTokens = 32768; // デフォルト値
    if (model.includes('gemini-2.0-flash')) {
        modelMaxTokens = 8192; // Gemini 2.0 Flash
    } else if (model.includes('learnlm-1.5-pro-experimental')) {
        modelMaxTokens = 32768; // LearnLM
    }

    const mergedOptions = { 
        ...defaultOptions, 
        max_tokens: modelMaxTokens, 
        ...options 
    };
    
    // Base64データをマルチモーダル形式に変換
    const imageUrl = `data:image/jpeg;base64,${imageData}`;
    
    const requestBody = {
        model: model,
        messages: [
            {
                role: 'system',
                content: 'あなたは教育支援AIアシスタントの「Aro Learn」です。学習者に対して親切で分かりやすい回答を提供してください。'
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            }
        ],
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.max_tokens,
        top_p: mergedOptions.top_p,
        stream: false
    };

    try {
        console.log(`OpenRouter API 画像付きリクエスト: モデル=${model}`);
        console.log(`送信リクエスト内容(画像データは省略):`, JSON.stringify({
            ...requestBody,
            messages: requestBody.messages.map(msg => 
                typeof msg.content === 'string' 
                    ? msg 
                    : { ...msg, content: msg.content.map(c => 
                        c.type === 'image_url' 
                            ? { ...c, image_url: { url: '[画像データ]' } } 
                            : c
                    )}
            )
        }, null, 2));
        
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Aro Learn'
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorMessage = `HTTP Error: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('OpenRouter API エラーレスポンス:', errorData);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                // JSONパースエラーは無視
                console.error('OpenRouter API エラーレスポンスのパースに失敗:', e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('OpenRouter API 画像付き応答成功:', data);
        
        // レスポンスの検証
        if (!data.choices || data.choices.length === 0 || !data.choices[0]?.message?.content) {
            console.error('OpenRouter API: 画像付きレスポンスが空', data);
            throw new Error('APIから有効なレスポンスが返されませんでした');
        }
        
        return {
            text: data.choices[0]?.message?.content || '',
            data: data
        };
    } catch (error) {
        console.error('OpenRouter API マルチモーダル呼び出しエラー:', error);
        throw error;
    }
}

// API公開
export {
    initOpenRouterAPI,
    generateContent,
    generateContentWithImage,
    SUPPORTED_MODELS
};