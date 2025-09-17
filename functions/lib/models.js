// Centralized LLM model selection for Cloud Functions (OpenRouter)
// We keep separate constants for different use-cases so we can tune later.
// For now, all three use the same model.
export const MODEL_JSON_STRUCTURED = 'nvidia/nemotron-nano-9b-v2:free';
export const MODEL_TRANSLATION = 'nvidia/nemotron-nano-9b-v2:free';
export const MODEL_STORYTELLING = 'nvidia/nemotron-nano-9b-v2:free';
export const MODELS = {
    json: MODEL_JSON_STRUCTURED,
    translation: MODEL_TRANSLATION,
    story: MODEL_STORYTELLING,
};
