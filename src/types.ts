export type SuitabilityStatus = 'suitable' | 'discarded';

export type VideoCategory =
  | 'Live Performance'
  | 'Documentary'
  | 'Movie'
  | 'Advertisement'
  | null;

export type SubtitleType =
  | 'Spoken words'
  | 'Music'
  | 'Sound effect'
  | 'Ambient sound'
  | 'Vocal sound'
  | 'Other';

export interface SuitabilityResult {
  status: SuitabilityStatus;
  category: VideoCategory;
  confidence: number;
  reason: string;
}

export interface SceneAnnotation {
  scene_id: number;
  start_time?: string;
  end_time?: string;
  narrative_description: string;
  core_questions?: SegmentQuestions;
  start_image?: string; // Base64 snapshot image URL
  snapshot_image?: string; // Base64 snapshot image URL
  raw_description?: string; // Tagalog or English initial draft/guidance
  initial_background?: string;
  revision_history?: string[];
}

export interface SceneInput {
  id: string;
  scene_id: number;
  start_image?: string; // Base64 snapshot image URL
  snapshot_image?: string; // Base64 snapshot image URL
  raw_description: string; // Tagalog or English guidance / action draft
  core_questions?: SegmentQuestions;
  initial_background?: string;
  frame_count?: number; // Optional frame count/number for sorting
}

export interface SegmentQuestions {
  setting?: string;
  perspective?: string;
  subject?: string;
  action?: string;
  environment?: string;
  change?: string;
}

export const SEGMENT_QUESTIONS: { key: keyof SegmentQuestions; label: string; hint: string }[] = [
  { key: 'setting', label: 'Where am I? (Setting)', hint: 'Place or scene context' },
  { key: 'perspective', label: 'How am I seeing it? (Perspective)', hint: 'Camera angle, framing, or point of view' },
  { key: 'subject', label: 'Who or what do I notice? (Subject)', hint: 'Visible people, objects, or focal subjects' },
  { key: 'action', label: 'What is happening? (Action)', hint: 'Visible action or supplied event guidance' },
  { key: 'environment', label: 'What else is happening? (Environment)', hint: 'Background activity, lighting, or surroundings' },
  { key: 'change', label: 'What changed? (Change)', hint: 'Difference from the previous segment, if observable' }
];

export interface SubtitleAnnotation {
  subtitle_id: number;
  start_time: string; // HH:MM:SS.mmm
  end_time: string;   // HH:MM:SS.mmm
  type: SubtitleType;
  text: string;
}

export interface VideoAnnotationResult {
  video_duration: string; // HH:MM:SS.mmm
  suitability: SuitabilityResult;
  scenes: SceneAnnotation[];
  subtitles: SubtitleAnnotation[];
  _modelUsed?: string;
  _fellBackFrom?: string;
}

export interface AgentWorkflowStep {
  step_number: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  logDetails?: string[];
  durationMs?: number;
}

export interface SampleVideo {
  id: string;
  title: string;
  categoryName: string;
  durationStr: string;
  videoUrl: string;
  description: string;
  thumbnailUrl?: string;
  isSuitable: boolean;
  precomputedResult: VideoAnnotationResult;
}

export interface ValidationError {
  type: 'error' | 'warning';
  field: string;
  message: string;
}
