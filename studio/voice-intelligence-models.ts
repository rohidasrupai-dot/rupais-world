export type VoiceMode = 'browser' | 'provider' | 'text_only';
export type VoiceLanguage = 'english' | 'hindi' | 'hinglish' | 'english_hinglish';
export type VoicePersonality = 'friendly_curio' | 'teacher_curio' | 'story_curio';
export type VoiceSessionStatus = 'active' | 'paused' | 'stopped' | 'ended';
export type VoiceInputState = 'idle' | 'requesting_permission' | 'listening' | 'speech_detected' | 'processing_transcript' | 'transcript_ready' | 'stopped' | 'cancelled' | 'permission_denied' | 'no_speech_detected' | 'unsupported_browser' | 'provider_unavailable' | 'network_unavailable' | 'failed';
export type VoicePlaybackState = 'idle' | 'preparing' | 'ready' | 'speaking' | 'paused' | 'resumed' | 'completed' | 'stopped' | 'cancelled' | 'provider_unavailable' | 'unsupported' | 'failed';
export type AudioRetentionState = 'not_stored' | 'temporary_processing' | 'cached_locally' | 'stored_with_consent' | 'scheduled_for_deletion' | 'deleted' | 'cannot_confirm_provider_retention';

export interface VoiceUserPreference {
  id: string; userId: string; deviceId: string; inputEnabled: boolean; spokenAnswersEnabled: boolean;
  inputLanguage: VoiceLanguage; outputLanguage: VoiceLanguage; inputLocale: string; outputLocale: string;
  voiceId: string | null; personality: VoicePersonality; speakingRate: number; pitch: number; volume: number; autoRead: boolean; autoSend: boolean;
  readSummaryOnly: boolean; reduceSpokenDetail: boolean; stopSpeechWhenTyping: boolean;
  transcriptAlwaysVisible: boolean; updatedAt: string;
}
export interface SpeechTranscript {
  id: string; voiceSessionId: string; conversationId: string; userId: string; text: string;
  state: 'partial' | 'final' | 'confirmed' | 'deleted'; language: VoiceLanguage; locale: string;
  detectedLanguage: string | null; confidence: number | null; edited: boolean; canonicalMessageId: string | null;
  createdAt: string; confirmedAt: string | null;
}
export interface VoiceProviderRoutingDecision {
  id: string; operation: 'speech_to_text' | 'text_to_speech'; mode: VoiceMode; providerId: string | null;
  modelId: string | null; reason: string; fallbacks: VoiceMode[]; createdAt: string;
}
export interface VoiceSessionEvent {
  id: string; voiceSessionId: string; userId: string; event: 'started' | 'paused' | 'resumed' | 'stopped' | 'ended'; createdAt: string;
}
export interface VoiceCommandResult {
  recognized: boolean; command: 'next_lesson' | 'previous_lesson' | 'repeat' | 'explain_again' | 'give_example' | 'show_image' | 'open_map' | 'start_quiz' | 'stop_quiz' | 'read_page' | 'slower' | 'faster' | 'stop_speaking' | 'continue' | 'open_revision' | 'open_notes' | null;
  original: string; normalized: string; requiresConfirmation: false; providerUsed: false; localRuleBased: true;
}
