import { VideoAnnotationResult, ValidationError } from '../types';
import { parseTimestampToSeconds } from './timeUtils';

export function validateAnnotationResult(result: VideoAnnotationResult): ValidationError[] {
  const errors: ValidationError[] = [];

  // Suitability check
  if (!result.suitability) {
    errors.push({
      type: 'error',
      field: 'suitability',
      message: 'Suitability object is missing.'
    });
  }

  // Validate Scenes
  if (result.suitability?.status === 'suitable') {
    if (!result.scenes || result.scenes.length === 0) {
      errors.push({
        type: 'warning',
        field: 'scenes',
        message: 'Suitable video has no scene annotations defined.'
      });
    }

    (result.scenes || []).forEach((scene, index) => {
      // ID Sequential Check
      if (scene.scene_id !== index + 1) {
        errors.push({
          type: 'warning',
          field: `scenes[${index}].scene_id`,
          message: `Scene ID is ${scene.scene_id}, expected sequential ID ${index + 1}.`
        });
      }

      // Check narrative description
      if (!scene.narrative_description || scene.narrative_description.trim().length < 10) {
        errors.push({
          type: 'warning',
          field: `scenes[${index}].narrative_description`,
          message: `Scene ${scene.scene_id} narrative description is short or missing.`
        });
      }
      const description = scene.narrative_description || '';
      if (/\b(this image|the snapshot|the camera shows|not provided|not specified)\b/i.test(description)) {
        errors.push({ type: 'warning', field: `scenes[${index}].narrative_description`,
          message: 'Use direct video-event wording and remove empty filler.' });
      }
      if (description.trim() && result.scenes.slice(0, index).some(previous =>
        previous.narrative_description?.trim().toLowerCase() === description.trim().toLowerCase())) {
        errors.push({ type: 'warning', field: `scenes[${index}].narrative_description`,
          message: 'Repeated description: verify that this scene has its own observations.' });
      }
    });
  }

  (result.subtitles || []).forEach((sub, index) => {
    const pattern = /^\d{2,}:[0-5]\d:[0-5]\d\.\d{3}$/;
    if (!sub.text?.trim() || !pattern.test(sub.start_time) || !pattern.test(sub.end_time) ||
        parseTimestampToSeconds(sub.end_time) <= parseTimestampToSeconds(sub.start_time)) {
      errors.push({ type: 'error', field: `subtitles[${index}]`,
        message: 'Subtitle needs text and a valid start/end range in HH:MM:SS.mmm.' });
    }
    if ((sub.text || '').split('\n').length > 3) {
      errors.push({ type: 'warning', field: `subtitles[${index}].text`,
        message: 'Split long speech into subtitles of about two to three lines.' });
    }
  });

  return errors;
}
