/**
 * Aro Learn - モデル管理モジュール
 * このファイルは、各種AIモデルへのアクセスを統合して管理します
 */

import { initGeminiAPI, setModel as setGeminiModel, generateContent as geminiGenerateContent, generateContentWithImage as geminiGenerateContentWithImage, GEMINI_MODELS } from './gemini-api.js';
import { initOpenRouterAPI, generateContent as openRouterGenerateContent, generateContentWithImage as openRouterGenerateContentWithImage, SUPPORTED_MODELS as OPENROUTER_MODELS } from './openrouter-api.js';

// 現在のAPIプロバイダーと選択中のモデル
let currentProvider = 'gemini';
let currentModelId = 'gemini-2.0-flash';
let isInitialized = false;

// API キー
let geminiApiKey = '';
let openRouterApiKey = '';

// 全モデルリストの構築
const SUPPORTED_MODELS = [
    // Geminiモデル
    ...Object.keys(GEMINI_MODELS).map(modelId => ({
        id: modelId,
        name: GEMINI_MODELS[modelId].name,
        description: 'Googleの高性能AIモデル',
        provider: 'gemini',
        multimodal: GEMINI_MODELS[modelId].multimodal
    })),
    // OpenRouterモデル
    ...OPENROUTER_MODELS.filter(model => model.provider === 'openrouter')
];

/**
 * 利用可能なモデル一覧を取得
 */
function getAvailableModels() {
    return SUPPORTED_MODELS;
}

/**
 * 現在選択中のモデルを取得
 */
function getCurrentModel() {
    return SUPPORTED_MODELS.find(model => model.id === currentModelId) || SUPPORTED_MODELS[0];
}

/**
 * モデルを変更する
 * @param {string} modelId - 変更先のモデルID
 * @returns {boolean} 変更が成功したかどうか
 */
function changeModel(modelId) {
    const model = SUPPORTED_MODELS.find(m => m.id === modelId);
    if (!model) {
        console.error(`モデル ${modelId} は存在しません`);
        return false;
    }

    currentModelId = modelId;
    currentProvider = model.provider;
    console.log(`モデルを ${model.name} (${model.provider}) に変更しました`);

    // プロバイダーが切り替わった場合、適切なAPIの初期化状態を確認
    if (currentProvider === 'gemini' && geminiApiKey) {
        initGeminiAPI(geminiApiKey);
        setGeminiModel(modelId); // Geminiモデルの場合は個別にモデルも設定
    } else if (currentProvider === 'openrouter' && openRouterApiKey) {
        initOpenRouterAPI(openRouterApiKey);
    } else {
        console.warn(`警告: ${currentProvider} プロバイダーのAPIキーが設定されていません`);
        return false;
    }

    // 設定をローカルストレージに保存
    try {
        localStorage.setItem('selected_model_id', modelId);
        console.log(`モデル設定 ${modelId} をローカルストレージに保存しました`);
    } catch (e) {
        console.error('モデル設定の保存に失敗しました:', e);
    }

    return true;
}

/**
 * APIを初期化
 * @param {string} apiKey - APIキー
 * @param {string} provider - プロバイダ ('gemini' または 'openrouter')
 * @returns {boolean} 初期化が成功したかどうか
 */
function initAPI(apiKey, provider = currentProvider) {
    if (!apiKey) {
        console.error('APIキーが指定されていません');
        return false;
    }

    let result = false;

    if (provider === 'gemini') {
        geminiApiKey = apiKey;
        result = initGeminiAPI(apiKey);
        if (result && currentProvider === 'gemini') {
            // 現在のモデルがGeminiプロバイダーの場合のみ設定
            if (GEMINI_MODELS[currentModelId]) {
                setGeminiModel(currentModelId);
            } else {
                // Geminiモデルが見つからない場合はデフォルトモデルを設定
                setGeminiModel('gemini-2.0-flash');
                currentModelId = 'gemini-2.0-flash';
            }
        }
    } else if (provider === 'openrouter') {
        openRouterApiKey = apiKey;
        result = initOpenRouterAPI(apiKey);
    } else {
        console.error(`未対応のプロバイダー: ${provider}`);
        return false;
    }

    isInitialized = result;
    return result;
}

/**
 * 現在のAPIプロバイダーとモデルでコンテンツを生成
 * @param {string} prompt - ユーザーからの入力テキスト 
 * @param {Array} context - 会話の文脈
 * @param {Object} options - 生成オプション
 * @returns {Promise} 生成結果
 */
async function generateContent(prompt, context = [], options = {}) {
    const currentModel = getCurrentModel();
    if (!currentModel) {
        console.error('現在のモデルが見つかりません。デフォルトモデルを使用します。');
        currentModelId = 'gemini-2.0-flash';
        currentProvider = 'gemini';
    }
    
    console.log(`コンテンツ生成開始: ${currentModel.name} (${currentProvider})`);
    
    if (currentProvider === 'gemini') {
        if (!geminiApiKey) {
            throw new Error('Gemini APIキーが設定されていません');
        }
        try {
            const result = await geminiGenerateContent(prompt, context, options);
            return result;
        } catch (error) {
            console.error(`Gemini モデル ${currentModelId} での生成に失敗:`, error);
            
            // 詳細なエラーメッセージを作成して再スロー
            const enhancedError = new Error(
                `Gemini API エラー (${currentModel.name}): ${error.message}\n` +
                'モデルが利用できないか、APIキーが無効である可能性があります。'
            );
            enhancedError.originalError = error;
            throw enhancedError;
        }
    } else if (currentProvider === 'openrouter') {
        if (!openRouterApiKey) {
            throw new Error('OpenRouter APIキーが設定されていません');
        }
        try {
            return await openRouterGenerateContent(prompt, context, currentModelId, options);
        } catch (error) {
            console.error(`OpenRouter モデル ${currentModelId} での生成に失敗:`, error);
            
            // エラーメッセージをより詳細にして再スロー
            const enhancedError = new Error(
                `OpenRouter API エラー (${currentModel.name}): ${error.message}\n` +
                'モデルが利用できないか、APIキーが無効である可能性があります。'
            );
            enhancedError.originalError = error;
            throw enhancedError;
        }
    } else {
        throw new Error(`未対応のプロバイダー: ${currentProvider}`);
    }
}

/**
 * 画像を含むコンテンツ生成
 * @param {string} prompt - テキストプロンプト
 * @param {string} imageData - 画像データまたはURL
 * @param {Object} options - 生成オプション
 * @returns {Promise} 生成結果
 */
async function generateContentWithImage(prompt, imageData, options = {}) {
    const currentModel = getCurrentModel();
    if (!currentModel) {
        console.error('現在のモデルが見つかりません。デフォルトモデルを使用します。');
        currentModelId = 'gemini-2.0-flash';
        currentProvider = 'gemini';
    }
    
    console.log(`画像付きコンテンツ生成開始: ${currentModel.name} (${currentProvider})`);
    
    // 選択されたモデルがマルチモーダルをサポートしているか確認
    if (!currentModel.multimodal) {
        const errorMsg = `選択されたモデル (${currentModel.name}) は画像処理をサポートしていません。別のモデルを選択してお試しください。`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    if (currentProvider === 'gemini') {
        if (!geminiApiKey) {
            throw new Error('Gemini APIキーが設定されていません');
        }
        try {
            const result = await geminiGenerateContentWithImage(prompt, imageData, options);
            return result;
        } catch (error) {
            console.error(`Gemini モデル ${currentModelId} での画像付き生成に失敗:`, error);
            
            const enhancedError = new Error(
                `Gemini API マルチモーダルエラー (${currentModel.name}): ${error.message}\n` +
                'モデルが画像をサポートしていないか、APIキーが無効である可能性があります。'
            );
            enhancedError.originalError = error;
            throw enhancedError;
        }
    } else if (currentProvider === 'openrouter') {
        if (!openRouterApiKey) {
            throw new Error('OpenRouter APIキーが設定されていません');
        }
        try {
            return await openRouterGenerateContentWithImage(prompt, imageData, currentModelId, options);
        } catch (error) {
            console.error(`OpenRouter モデル ${currentModelId} での画像付き生成に失敗:`, error);
            
            // 選択したモデルが画像をサポートしていない可能性がある場合の特別なメッセージ
            if (error.message.includes('format') || error.message.includes('multimodal') || 
                error.message.includes('image') || error.message.includes('vision')) {
                const enhancedError = new Error(
                    `選択されたモデル (${currentModel.name}) は画像処理をサポートしていない可能性があります。\n` +
                    '別のモデルを選択してお試しください。'
                );
                enhancedError.originalError = error;
                throw enhancedError;
            }
            
            // 一般的なエラーの場合
            const enhancedError = new Error(
                `OpenRouter API マルチモーダルエラー (${currentModel.name}): ${error.message}\n` +
                'モデルが利用できないか、APIキーが無効である可能性があります。'
            );
            enhancedError.originalError = error;
            throw enhancedError;
        }
    } else {
        throw new Error(`未対応のプロバイダー: ${currentProvider}`);
    }
}

export {
    initAPI,
    generateContent,
    generateContentWithImage,
    getAvailableModels,
    getCurrentModel,
    changeModel
};