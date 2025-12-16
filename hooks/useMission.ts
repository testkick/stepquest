import { useState, useCallback } from 'react';
import { Mission, ActiveMission, MissionState } from '@/types/mission';
import { generateMissions } from '@/services/missionGenerator';
import { generateRewardText } from '@/services/rewardGenerator';
import {
  saveCompletedMission,
  updateStatsAfterMission,
  CompletedMission,
} from '@/services/storage';

interface UseMissionResult {
  state: MissionState;
  missions: Mission[];
  activeMission: ActiveMission | null;
  error: string | null;
  scanForMissions: () => Promise<void>;
  selectMission: (mission: Mission, currentSteps: number) => void;
  updateMissionProgress: (currentSteps: number) => void;
  completeMission: () => void;
  cancelMission: () => void;
  dismissMissions: () => void;
}

export const useMission = (): UseMissionResult => {
  const [state, setState] = useState<MissionState>('idle');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scan for new missions using AI
  const scanForMissions = useCallback(async () => {
    if (state === 'scanning' || state === 'active') {
      return;
    }

    try {
      setState('scanning');
      setError(null);

      const generatedMissions = await generateMissions();
      setMissions(generatedMissions);
      setState('selecting');
    } catch (err) {
      console.error('Error scanning for missions:', err);
      setError('Failed to generate missions. Please try again.');
      setState('idle');
    }
  }, [state]);

  // Select a mission and start tracking
  const selectMission = useCallback((mission: Mission, currentSteps: number) => {
    const active: ActiveMission = {
      ...mission,
      startedAt: new Date(),
      stepsAtStart: currentSteps,
      currentSteps: currentSteps,
      isCompleted: false,
      rewardText: undefined,
      isGeneratingReward: false,
    };

    setActiveMission(active);
    setMissions([]);
    setState('active');
  }, []);

  // Update mission progress with current step count
  const updateMissionProgress = useCallback((currentSteps: number) => {
    setActiveMission((prev) => {
      if (!prev) return null;

      const stepsInMission = currentSteps - prev.stepsAtStart;
      const isCompleted = stepsInMission >= prev.stepTarget;

      return {
        ...prev,
        currentSteps,
        isCompleted,
      };
    });
  }, []);

  // Complete the current mission with AI reward generation
  const completeMission = useCallback(async () => {
    if (!activeMission) return;

    const stepsCompleted = activeMission.currentSteps - activeMission.stepsAtStart;

    // Set generating state
    setActiveMission({
      ...activeMission,
      isCompleted: true,
      isGeneratingReward: true,
    });
    setState('completed');

    try {
      // Generate reward text using AI
      const rewardText = await generateRewardText(
        activeMission.title,
        activeMission.vibe,
        stepsCompleted
      );

      // Calculate duration
      const startTime = new Date(activeMission.startedAt).getTime();
      const endTime = Date.now();
      const durationMinutes = Math.round((endTime - startTime) / 60000);

      // Save to storage
      const completedMission: CompletedMission = {
        id: activeMission.id,
        title: activeMission.title,
        description: activeMission.description,
        vibe: activeMission.vibe,
        stepTarget: activeMission.stepTarget,
        stepsCompleted,
        rewardText,
        completedAt: new Date().toISOString(),
        durationMinutes,
      };

      await Promise.all([
        saveCompletedMission(completedMission),
        updateStatsAfterMission(stepsCompleted),
      ]);

      // Update active mission with reward
      setActiveMission((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rewardText,
          isGeneratingReward: false,
        };
      });
    } catch (err) {
      console.error('Error completing mission:', err);
      // Still show completion but with default reward
      setActiveMission((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rewardText: 'Your adventure was a success! Every step brought you closer to mastery.',
          isGeneratingReward: false,
        };
      });
    }
  }, [activeMission]);

  // Cancel the current mission
  const cancelMission = useCallback(() => {
    setActiveMission(null);
    setState('idle');
  }, []);

  // Dismiss mission selection without choosing
  const dismissMissions = useCallback(() => {
    setMissions([]);
    setState('idle');
  }, []);

  return {
    state,
    missions,
    activeMission,
    error,
    scanForMissions,
    selectMission,
    updateMissionProgress,
    completeMission,
    cancelMission,
    dismissMissions,
  };
};

export default useMission;
