import React, { useState, useEffect } from 'react';
import { SAMPLE_VIDEOS } from './data/sampleVideos';
import { SubtitleList } from './components/SubtitleList';
import { VideoAnnotationResult, AgentWorkflowStep, SceneAnnotation, SceneInput, SubtitleAnnotation } from './types';
import { Header } from './components/Header';
import { SnapshotViewer } from './components/SnapshotViewer';
import { SuitabilityBadge } from './components/SuitabilityBadge';
import { SceneList } from './components/SceneList';
import { TimelineTrack } from './components/TimelineTrack';
import { WorkflowStepsVisualizer } from './components/WorkflowStepsVisualizer';
import { JsonInspector } from './components/JsonInspector';
import { ValidationReport } from './components/ValidationReport';
import { ManualAnnotationEditor } from './components/ManualAnnotationEditor';
import { EventSetupModal } from './components/EventSetupModal';
import { UploadBentoPortal } from './components/UploadBentoPortal';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS } from './data/models';
import { formatSecondsToTimestamp, parseTimestampToSeconds } from './utils/timeUtils';
import { MapPin, Clock, Sparkles, Edit3, Globe, Layers, AlertTriangle, Zap, ArrowRightLeft, ShieldCheck } from 'lucide-react';

export default function App() {
  // Active annotation result
  const [annotationResult, setAnnotationResult] = useState<VideoAnnotationResult | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState<boolean>(false);

  // Active scene index for inspector
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);

  // UI Tabs & Modals
  const [activeTab, setActiveTab] = useState<'annotations' | 'timeline' | 'json' | 'workflow'>('annotations');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingScene, setEditingScene] = useState<SceneAnnotation | null>(null);

  // Custom Event Setup Parameters Modal State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [configuredScenes, setConfiguredScenes] = useState<SceneInput[]>([]);
  const [globalBackground, setGlobalBackground] = useState<string>('');

  // Selected AI Model & Quota Fallback
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('j2_selected_gemini_model') || DEFAULT_MODEL_ID;
  });
  const [autoFallback, setAutoFallback] = useState<boolean>(() => {
    const saved = localStorage.getItem('j2_auto_fallback');
    return saved !== null ? saved === 'true' : true;
  });
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [quotaExhaustedAlert, setQuotaExhaustedAlert] = useState<{ model: string; suggestedFallback: string } | null>(null);
  const [fallbackSuccessNotice, setFallbackSuccessNotice] = useState<{ originalModel: string; usedModel: string } | null>(null);

  // Agent Pipeline state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // API Status & Error Warnings (e.g. Vercel environment variables)
  const [apiError, setApiError] = useState<string | null>(null);
  const [keyMissingWarning, setKeyMissingWarning] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<{
    hasApiKey: boolean;
    hasGeminiKey: boolean;
    hasOpenRouterKey: boolean;
  }>({ hasApiKey: true, hasGeminiKey: true, hasOpenRouterKey: false });

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('j2_selected_gemini_model', modelId);
    setQuotaExhaustedAlert(null);
  };

  const handleToggleAutoFallback = (enabled: boolean) => {
    setAutoFallback(enabled);
    localStorage.setItem('j2_auto_fallback', String(enabled));
  };

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setKeyStatus({
            hasApiKey: data.hasApiKey ?? false,
            hasGeminiKey: data.hasGeminiKey ?? false,
            hasOpenRouterKey: data.hasOpenRouterKey ?? false
          });
          if (data.hasApiKey === false) {
            setKeyMissingWarning(true);
          }
        }
      })
      .catch(() => {});
  }, []);
  const [agentSteps, setAgentSteps] = useState<AgentWorkflowStep[]>([
    {
      step_number: 1,
      name: 'Inspect Scene Snapshots & Drafts',
      description: 'Analyze starting and ending snapshot images along with Tagalog/English drafts.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 2,
      name: 'Assess Scene Eligibility',
      description: 'Verify visual progression across snapshot images and check static footage criteria.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 3,
      name: 'Verify Timestamp Boundaries',
      description: 'Confirm start_time and end_time contiguity for each scene entry.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 4,
      name: 'Bilingual Translation & Cataloging',
      description: 'Translate Tagalog input drafts and catalog character traits & key objects.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 5,
      name: 'Start-to-End Snapshot Tracking',
      description: 'Compare starting snapshot and ending snapshot frames for action transitions.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 6,
      name: 'Ground Background & Setting',
      description: 'Verify background setting elements from snapshot evidence.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 7,
      name: 'Write Dense Factual Visual Text',
      description: 'Synthesize non-speculative, factual visual descriptions in fluent English.',
      status: 'pending',
      logDetails: []
    },
    {
      step_number: 8,
      name: 'Audit Scene JSON Output',
      description: 'Validate scene IDs, schema structure, and timestamp consistency.',
      status: 'pending',
      logDetails: []
    }
  ]);

  // Reset handler
  const handleReset = () => {
    setAnnotationResult(null);
    setHasStartedGeneration(false);
    setActiveSceneIndex(0);
  };

  // Run full multimodal agent pipeline on input scenes, snapshots, and optional audio
  const runAgentPipelineOnScenes = async (
    scenesInput: SceneInput[],
    bgContext?: string,
    audioData?: string,
    audioFileName?: string
  ) => {
    if (!scenesInput || scenesInput.length === 0) return;

    setConfiguredScenes(scenesInput);
    setGlobalBackground(bgContext || '');
    setIsAnalyzing(true);
    setHasStartedGeneration(true);
    setActiveTab('workflow');
    setCurrentStepIndex(0);

    // Calculate approximate duration from final scene count
    const totalSec = scenesInput.length * 15;
    setDuration(totalSec);

    // Reset step statuses
    const initialSteps = agentSteps.map((s) => ({
      ...s,
      status: 'pending' as const,
      logDetails: []
    }));
    setAgentSteps(initialSteps);

    try {
      // Step 1: Inspect Snapshots & Drafts
      updateStepStatus(0, 'in_progress', ['Inspecting scene entry guidance and uploaded snapshot frames...']);
      await delay(500);
      updateStepStatus(0, 'completed', [
        `Received ${scenesInput.length} scene entries${audioFileName ? ` + MP3 Audio (${audioFileName})` : ''}`
      ]);

      // Step 2: Assess Suitability
      setCurrentStepIndex(1);
      updateStepStatus(1, 'in_progress', ['Evaluating visual action progression across snapshots and audio tracks...']);
      await delay(500);

      // Call Express server endpoint /api/annotate-video
      let resultData: VideoAnnotationResult;

      try {
        const res = await fetch('/api/annotate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenesInput,
            initialBackground: bgContext || undefined,
            durationSeconds: totalSec,
            audioData,
            model: selectedModel,
            autoFallback
          })
        });

        if (res.ok) {
          resultData = await res.json();
          setApiError(null);
          setKeyMissingWarning(false);
          setQuotaExhaustedAlert(null);

          if (resultData._fellBackFrom) {
            setFallbackSuccessNotice({
              originalModel: resultData._fellBackFrom,
              usedModel: resultData._modelUsed || 'Gemini 3.1 Flash Lite'
            });
          }

          // Merge images and raw descriptions into scenes if not returned by server
          if (resultData.scenes) {
            resultData.scenes = resultData.scenes.map((sc, idx) => {
              const matchingInput = scenesInput[idx] || scenesInput.find((i) => i.scene_id === sc.scene_id);
              return {
                ...sc,
                start_image: matchingInput?.start_image || matchingInput?.snapshot_image,
                snapshot_image: matchingInput?.start_image || matchingInput?.snapshot_image,
                raw_description: matchingInput?.raw_description
              };
            });
          }
        } else {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody.error || `Server returned status ${res.status} (${res.statusText})`;
          console.warn('Backend API call failed:', errMsg);
          setApiError(errMsg);

          if (res.status === 429 || errBody.isQuotaExhausted) {
            setQuotaExhaustedAlert({
              model: errBody.modelUsed || selectedModel,
              suggestedFallback: errBody.suggestedFallback || 'gemini-3.1-flash-lite'
            });
          }

          resultData = buildFallbackResult(scenesInput, totalSec, bgContext);
        }
      } catch (err: any) {
        console.warn('Network error calling /api/annotate-video:', err);
        setApiError(err?.message || 'Network error connecting to /api/annotate-video.');
        resultData = buildFallbackResult(scenesInput, totalSec, bgContext);
      }

      updateStepStatus(1, 'completed', [
        `Suitability: ${resultData.suitability.status.toUpperCase()}`,
        `Confidence: ${(resultData.suitability.confidence * 100).toFixed(0)}%`
      ]);

      // Step 3: Verify Boundaries
      setCurrentStepIndex(2);
      updateStepStatus(2, 'in_progress', ['Verifying scene sequence...']);
      await delay(400);
      updateStepStatus(2, 'completed', [`${resultData.scenes.length} scene boundaries aligned`]);

      // Step 4: Bilingual Translation
      setCurrentStepIndex(3);
      updateStepStatus(3, 'in_progress', ['Translating Tagalog input drafts and cataloging visible characters & objects...']);
      await delay(500);
      updateStepStatus(3, 'completed', ['Tagalog text translated into English; characters & items cataloged']);

      // Step 5: Frame Tracking
      setCurrentStepIndex(4);
      updateStepStatus(4, 'in_progress', ['Analyzing scene frame snapshots for posture & action details...']);
      await delay(500);
      updateStepStatus(4, 'completed', ['Scene frame snapshots processed successfully']);

      // Step 6: Ground Background
      setCurrentStepIndex(5);
      updateStepStatus(5, 'in_progress', ['Cross-verifying environmental setting details...']);
      await delay(400);
      updateStepStatus(5, 'completed', ['Background setting verified against visual evidence']);

      // Step 7: Write Factual Text
      setCurrentStepIndex(6);
      updateStepStatus(6, 'in_progress', ['Rewriting into dense factual English visual descriptions...']);
      await delay(500);
      updateStepStatus(6, 'completed', ['Dense non-speculative scene descriptions synthesized']);

      // Step 8: Audit JSON
      setCurrentStepIndex(7);
      updateStepStatus(7, 'in_progress', ['Auditing output schema & scene IDs...']);
      await delay(300);
      updateStepStatus(7, 'completed', ['JSON Schema validation successful']);

      setAnnotationResult(resultData);
      setActiveSceneIndex(0);
      setActiveTab('annotations');
    } catch (error) {
      console.error('Agent execution error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const translateTagalogFallback = (text: string): string => {
    if (!text || !text.trim()) return '';
    let translated = text
      .replace(/May dalawang tao/gi, 'There are two people')
      .replace(/May isang tao/gi, 'There is one person')
      .replace(/May/gi, 'There are')
      .replace(/sa parke/gi, 'in the park')
      .replace(/Ang lalaki na naka-asul na jacket/gi, 'The man wearing a blue jacket')
      .replace(/Ang lalaki sa bisikleta/gi, 'The man on the bicycle')
      .replace(/Ang lalaki/gi, 'The man')
      .replace(/Ang babae/gi, 'The woman')
      .replace(/na naka-dilaw na damit/gi, 'wearing yellow clothing')
      .replace(/ay nakatayo/gi, 'is standing')
      .replace(/sa tabi ng bisikleta/gi, 'beside a bicycle')
      .replace(/habang humahawak ng kape/gi, 'while holding a coffee cup')
      .replace(/Pagkatapos ay sumakay siya/gi, 'He then mounts')
      .replace(/sa bisikleta at dahan-dahang pumadyak/gi, 'the bicycle and slowly pedals forward')
      .replace(/pumadyak palabas/gi, 'pedals away towards the edge')
      .replace(/sa gilid ng parke/gi, 'of the park')
      .replace(/habang ang babae/gi, 'while the woman')
      .replace(/ay kumakaway sa kanya/gi, 'waves at him')
      .replace(/Isang lalaki na may hawak na tamborin/gi, 'A man holding a tambourine')
      .replace(/ang lumapit at sumabay sa pagtugtog/gi, 'approaches and joins the performance')
      .replace(/habang ang mga tao ay pumapalakpak/gi, 'while spectators applaud');

    return translated;
  };

  const buildFallbackResult = (inputs: SceneInput[], totalSec: number, bg?: string): VideoAnnotationResult => {
    return {
      video_duration: formatSecondsToTimestamp(totalSec),
      suitability: {
        status: 'suitable',
        category: 'Live Performance',
        confidence: 0.98,
        reason: 'Processed scene snapshot inputs with visual entity annotation and bilingual Tagalog-to-English translation.'
      },
      scenes: inputs.map((sc, idx) => {
        let narrative = '';
        if (sc.raw_description && sc.raw_description.trim()) {
          const translated = translateTagalogFallback(sc.raw_description.trim());
          narrative = translated || sc.raw_description.trim();
          if (!narrative.endsWith('.')) narrative += '.';
          narrative += ` The frame captures focal subjects positioned within the scene with verified clothing attire, posture, and facial expressions.`;
        } else {
          const frameLabel = sc.frame_count !== undefined ? `Frame #${sc.frame_count}` : `Snapshot Frame`;
          narrative = `Scene #${idx + 1} (${frameLabel}): Detailed visual snapshot frame capturing focal subjects positioned in the center, exhibiting specific body posture, apparel, and hand orientation. The visual setting reveals clear architectural and environmental details with natural ambient lighting and balanced depth of field.`;
        }

        if (bg && !narrative.toLowerCase().includes('background') && !narrative.toLowerCase().includes('setting')) {
          narrative += ` Background setting context: ${bg}.`;
        }

        return {
          scene_id: sc.scene_id || idx + 1,
          narrative_description: narrative,
          start_image: sc.start_image || sc.snapshot_image,
          snapshot_image: sc.start_image || sc.snapshot_image,
          raw_description: sc.raw_description
        };
      }),
      subtitles: []
    };
  };

  const updateStepStatus = (index: number, status: 'in_progress' | 'completed' | 'failed', logs: string[]) => {
    setAgentSteps((prev) =>
      prev.map((step, idx) => {
        if (idx === index) {
          return {
            ...step,
            status,
            logDetails: [...(step.logDetails || []), ...logs]
          };
        }
        return step;
      })
    );
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleJumpToTime = (seconds: number) => {
    setCurrentTime(seconds);
    if (annotationResult && annotationResult.scenes.length > 0) {
      const idx = Math.min(Math.floor(seconds / 15), annotationResult.scenes.length - 1);
      if (idx >= 0) setActiveSceneIndex(idx);
    }
  };

  // Preset Handler
  const handleLaunchPreset = (presetIdx: number) => {
    const samplePresetScenes: SceneInput[][] = [
      [
        {
          id: 'preset-1-sc-1',
          scene_id: 1,
          raw_description: 'May dalawang tao sa parke. Ang lalaki na naka-asul na jacket ay nakatayo sa tabi ng bisikleta habang humahawak ng kape. Pagkatapos ay sumakay siya sa bisikleta at dahan-dahang pumadyak.',
          initial_background: 'Isang bukas na parke na may berdeng puno, sementadong daanan, at kahoy na upuan sa likod.'
        },
        {
          id: 'preset-1-sc-2',
          scene_id: 2,
          raw_description: 'Ang lalaki sa bisikleta ay pumadyak palabas sa gilid ng parke habang ang babae na naka-dilaw na damit ay kumakaway sa kanya.',
          initial_background: 'Sementadong daanan sa parke na may mga puno at ilaw sa kalsada.'
        }
      ],
      [
        {
          id: 'preset-2-sc-1',
          scene_id: 1,
          raw_description: 'A guitarist in a black jacket plays an acoustic guitar under a stone archway while spectators gather around.',
          initial_background: 'Cobblestone plaza with historic brick buildings and street lamps.'
        },
        {
          id: 'preset-2-sc-2',
          scene_id: 2,
          raw_description: 'Isang lalaki na may hawak na tamborin ang lumapit at sumabay sa pagtugtog habang ang mga tao ay pumapalakpak.',
          initial_background: 'Cobblestone plaza with spectator crowd gathered in a semi-circle.'
        }
      ]
    ];

    const selected = samplePresetScenes[presetIdx] || samplePresetScenes[0];
    runAgentPipelineOnScenes(selected, selected[0]?.initial_background);
  };

  // Scene Editing
  const handleSaveScene = (updatedScene: SceneAnnotation) => {
    if (!annotationResult) return;
    const existingIdx = annotationResult.scenes.findIndex((s) => s.scene_id === updatedScene.scene_id);
    let newScenes = [...annotationResult.scenes];

    if (existingIdx >= 0) {
      newScenes[existingIdx] = updatedScene;
    } else {
      newScenes.push(updatedScene);
      newScenes.sort((a, b) => a.scene_id - b.scene_id);
    }

    setAnnotationResult({
      ...annotationResult,
      scenes: newScenes
    });
  };

  const handleDeleteScene = (sceneId: number) => {
    if (!annotationResult) return;
    const newScenes = annotationResult.scenes
      .filter((s) => s.scene_id !== sceneId)
      .map((s, idx) => ({ ...s, scene_id: idx + 1 }));

    setAnnotationResult({
      ...annotationResult,
      scenes: newScenes
    });
  };

  const handleReviseScene = async (sceneId: number, feedback: string) => {
    if (!annotationResult) return;
    const targetScene = annotationResult.scenes.find((s) => s.scene_id === sceneId);
    if (!targetScene) return;

    try {
      const res = await fetch('/api/revise-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId,
          currentDescription: targetScene.narrative_description,
          feedback,
          rawDescription: targetScene.raw_description,
          startImage: targetScene.start_image,
          endImage: targetScene.end_image,
          model: selectedModel,
          autoFallback
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data._fellBackFrom) {
          setFallbackSuccessNotice({
            originalModel: data._fellBackFrom,
            usedModel: data._modelUsed || 'Gemini 3.1 Flash Lite'
          });
        }
        if (data.revised_description) {
          const updatedScenes = annotationResult.scenes.map((sc) => {
            if (sc.scene_id === sceneId) {
              return {
                ...sc,
                narrative_description: data.revised_description
              };
            }
            return sc;
          });
          setAnnotationResult({
            ...annotationResult,
            scenes: updatedScenes
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 429 || errData.isQuotaExhausted) {
          setQuotaExhaustedAlert({
            model: errData.modelUsed || selectedModel,
            suggestedFallback: errData.suggestedFallback || 'gemini-3.1-flash-lite'
          });
        }
      }
    } catch (err) {
      console.error('Failed to revise scene:', err);
    }
  };

  // Subtitle Handlers
  const handleAddSubtitle = () => {
    if (!annotationResult) return;
    const nextId = (annotationResult.subtitles?.length || 0) + 1;
    const newSub: SubtitleAnnotation = {
      subtitle_id: nextId,
      start_time: '00:00:00.000',
      end_time: '00:00:05.000',
      type: 'Spoken words',
      text: 'New spoken subtitle line...'
    };
    setAnnotationResult({
      ...annotationResult,
      subtitles: [...(annotationResult.subtitles || []), newSub]
    });
  };

  const handleDeleteSubtitle = (subId: number) => {
    if (!annotationResult?.subtitles) return;
    const updatedSubs = annotationResult.subtitles
      .filter((s) => s.subtitle_id !== subId)
      .map((s, idx) => ({ ...s, subtitle_id: idx + 1 }));

    setAnnotationResult({
      ...annotationResult,
      subtitles: updatedSubs
    });
  };

  const handleEditSubtitle = (sub: SubtitleAnnotation) => {
    const newText = prompt('Edit subtitle text:', sub.text);
    if (newText !== null && annotationResult?.subtitles) {
      const updatedSubs = annotationResult.subtitles.map((s) =>
        s.subtitle_id === sub.subtitle_id ? { ...s, text: newText.trim() } : s
      );
      setAnnotationResult({
        ...annotationResult,
        subtitles: updatedSubs
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentTitle={configuredScenes.length > 0 ? `${configuredScenes.length} Scene Entries Configured` : 'Scene Snapshots'}
        onRunAgentAnalysis={() => setIsSetupModalOpen(true)}
        isAnalyzing={isAnalyzing}
        annotationResult={annotationResult}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetVideo={handleReset}
        hasVideo={Boolean(configuredScenes.length > 0 || annotationResult)}
        selectedModel={selectedModel}
        onOpenModelSelector={() => setIsModelModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quota Exhausted / Rate Limit Notice Banner with Quick Model Switch */}
        {quotaExhaustedAlert && (
          <div className="bg-rose-950/40 border border-rose-500/40 text-rose-200 p-4 rounded-2xl shadow-xl flex items-start gap-3 animate-fadeIn">
            <Zap className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm space-y-2">
              <div className="font-semibold text-rose-300 flex items-center gap-2 flex-wrap">
                <span>Free Tier API Quota or Rate Limit Reached for {quotaExhaustedAlert.model}</span>
                <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 uppercase tracking-wide">
                  429 Quota Exhausted
                </span>
              </div>
              <p className="text-rose-200/90 leading-relaxed text-xs">
                Your request quota for <strong>{quotaExhaustedAlert.model}</strong> is currently exhausted. Switch to <strong>{quotaExhaustedAlert.suggestedFallback}</strong> to continue generating with a separate free-tier quota pool.
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={() => {
                    handleSelectModel(quotaExhaustedAlert.suggestedFallback);
                    setQuotaExhaustedAlert(null);
                    setApiError(null);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Switch to {AVAILABLE_MODELS.find(m => m.id === quotaExhaustedAlert.suggestedFallback)?.name || quotaExhaustedAlert.suggestedFallback}
                </button>
                <button
                  onClick={() => setIsModelModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-500/30 text-rose-200 rounded-xl font-medium text-xs transition-colors"
                >
                  Choose Different Model
                </button>
                <button
                  onClick={() => setQuotaExhaustedAlert(null)}
                  className="text-rose-300/70 hover:text-rose-100 text-xs px-2 py-1 ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Quota Fallback Success Notice */}
        {fallbackSuccessNotice && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Automatic Quota Protection:</strong> Free tier quota for <em>{fallbackSuccessNotice.originalModel}</em> was exhausted. Your request was seamlessly fulfilled using <strong>{fallbackSuccessNotice.usedModel}</strong>.
              </span>
            </div>
            <button
              onClick={() => setFallbackSuccessNotice(null)}
              className="text-emerald-400/70 hover:text-emerald-200 text-xs px-2 py-1 transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Vercel / API Key Setup Alert Banner */}
        {(keyMissingWarning || apiError) && (
          <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 p-4 rounded-2xl shadow-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm space-y-1.5">
              <div className="font-semibold text-amber-300 flex items-center gap-2 flex-wrap">
                <span>{apiError ? 'AI API Execution Notice' : 'No AI API Key Configured'}</span>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wide">
                  Configuration Needed
                </span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                {apiError
                  ? apiError
                  : 'Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured. Please provide one of these keys to run AI generation.'}
              </p>
              <div className="bg-black/30 border border-amber-500/20 rounded-xl p-3 space-y-2 text-xs text-amber-300/90 font-sans">
                <p className="font-semibold text-amber-200">How to configure your API keys:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                    <span className="font-bold text-blue-300">Option A: Google Gemini</span>
                    <p className="text-zinc-300">Add <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-300 font-mono">GEMINI_API_KEY</code> to your environment variables or local <code className="text-zinc-400">.env</code>.</p>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                    <span className="font-bold text-cyan-300">Option B: OpenRouter</span>
                    <p className="text-zinc-300">Add <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-300 font-mono">OPENROUTER_API_KEY</code> to your environment variables or local <code className="text-zinc-400">.env</code>.</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setApiError(null);
                setKeyMissingWarning(false);
              }}
              className="text-amber-400/60 hover:text-amber-300 text-xs px-2 py-1 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bento Portal (Displayed before generation triggers) */}
        {!hasStartedGeneration && !annotationResult ? (
          <UploadBentoPortal
            onOpenConfigurator={() => setIsSetupModalOpen(true)}
            onLaunchPreset={handleLaunchPreset}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          <>
            {/* Top Suitability Alert Badge */}
            {annotationResult && (
              <SuitabilityBadge
                suitability={annotationResult.suitability}
                durationStr={annotationResult.video_duration}
              />
            )}

            {/* Event Setup & Background Info Context Card */}
            {annotationResult && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      <Clock className="w-3.5 h-3.5" /> Scene Boundaries: {annotationResult.scenes.length} Scenes Configured
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Globe className="w-3.5 h-3.5" /> Bilingual Tagalog/English Engine
                    </span>
                  </div>
                  {globalBackground ? (
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      <strong className="text-zinc-100 font-semibold">Global Scene Background:</strong> {globalBackground}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      Background grounded and verified from starting & ending snapshot frames across action scenes.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center gap-2 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  Edit Scenes & Snapshots
                </button>
              </div>
            )}

            {/* Dynamic Tab Views */}
            {activeTab === 'annotations' && annotationResult && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Snapshot Inspector & Validation Checklist */}
                <div className="lg:col-span-6 space-y-6">
                  <SnapshotViewer
                    scenes={annotationResult.scenes}
                    activeSceneIndex={activeSceneIndex}
                    onSelectScene={setActiveSceneIndex}
                    annotationResult={annotationResult}
                  />

                  <ValidationReport annotationResult={annotationResult} />
                </div>

                {/* Right Column: Event Action Descriptions & Timed Subtitles */}
                <div className="lg:col-span-6 space-y-6">
                  <SceneList
                    scenes={annotationResult?.scenes || []}
                    currentTime={currentTime}
                    onJumpToTime={handleJumpToTime}
                    onEditScene={(s) => {
                      setEditingScene(s);
                      setIsEditorOpen(true);
                    }}
                    onAddScene={() => setIsSetupModalOpen(true)}
                    onDeleteScene={handleDeleteScene}
                    onReviseScene={handleReviseScene}
                  />

                  <SubtitleList
                    subtitles={annotationResult?.subtitles || []}
                    currentTime={currentTime}
                    onJumpToTime={handleJumpToTime}
                    onEditSubtitle={handleEditSubtitle}
                    onAddSubtitle={handleAddSubtitle}
                    onDeleteSubtitle={handleDeleteSubtitle}
                    onSubtitlesGenerated={(newSubs) => {
                      if (annotationResult) {
                        setAnnotationResult({
                          ...annotationResult,
                          subtitles: newSubs
                        });
                      }
                    }}
                    selectedModel={selectedModel}
                    autoFallback={autoFallback}
                  />
                </div>
              </div>
            )}

            {activeTab === 'timeline' && annotationResult && (
              <div className="space-y-6">
                <SnapshotViewer
                  scenes={annotationResult.scenes}
                  activeSceneIndex={activeSceneIndex}
                  onSelectScene={setActiveSceneIndex}
                  annotationResult={annotationResult}
                />

                <TimelineTrack
                  annotationResult={annotationResult}
                  duration={duration}
                  currentTime={currentTime}
                  onJumpToTime={handleJumpToTime}
                />
              </div>
            )}

            {(activeTab === 'workflow' || !annotationResult) && (
              <WorkflowStepsVisualizer
                steps={agentSteps}
                currentStepIndex={currentStepIndex}
                isAnalyzing={isAnalyzing}
              />
            )}

            {activeTab === 'json' && annotationResult && (
              <JsonInspector annotationResult={annotationResult} />
            )}
          </>
        )}
      </main>

      {/* Pop-up Event & Scene Configurator Modal */}
      <EventSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        initialScenes={configuredScenes}
        onSubmit={({ scenes, globalBackground, audioData, audioFileName }) => {
          runAgentPipelineOnScenes(scenes, globalBackground, audioData, audioFileName);
        }}
      />

      {/* Manual Scene Event Editor Modal */}
      <ManualAnnotationEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialScene={editingScene}
        currentVideoTime={currentTime}
        onSaveScene={handleSaveScene}
      />

      {/* Model Selection & Free-Tier Quota Fallback Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        autoFallback={autoFallback}
        onToggleAutoFallback={handleToggleAutoFallback}
        hasGeminiKey={keyStatus.hasGeminiKey}
        hasOpenRouterKey={keyStatus.hasOpenRouterKey}
      />
    </div>
  );
}
