/**
 * Storage Service for Stepquest
 * Manages persistent data using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MissionVibe } from '@/types/mission';

// Storage Keys
const STORAGE_KEYS = {
  USER_STATS: '@stepquest/user_stats',
  MISSION_HISTORY: '@stepquest/mission_history',
} as const;

// Types
export interface UserStats {
  totalSteps: number;
  totalMissions: number;
  totalDistanceKm: number;
  lastUpdated: string;
}

export interface CompletedMission {
  id: string;
  title: string;
  description: string;
  vibe: MissionVibe;
  stepTarget: number;
  stepsCompleted: number;
  rewardText: string;
  completedAt: string;
  durationMinutes: number;
}

// Default values
const DEFAULT_STATS: UserStats = {
  totalSteps: 0,
  totalMissions: 0,
  totalDistanceKm: 0,
  lastUpdated: new Date().toISOString(),
};

// Average step length in km
const STEP_LENGTH_KM = 0.000762;

/**
 * Get user stats from storage
 */
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
    if (data) {
      return JSON.parse(data) as UserStats;
    }
    return DEFAULT_STATS;
  } catch (error) {
    console.error('Error loading user stats:', error);
    return DEFAULT_STATS;
  }
};

/**
 * Save user stats to storage
 */
export const saveUserStats = async (stats: UserStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

/**
 * Update user stats after completing a mission
 */
export const updateStatsAfterMission = async (
  stepsCompleted: number
): Promise<UserStats> => {
  try {
    const currentStats = await getUserStats();
    const distanceKm = stepsCompleted * STEP_LENGTH_KM;

    const updatedStats: UserStats = {
      totalSteps: currentStats.totalSteps + stepsCompleted,
      totalMissions: currentStats.totalMissions + 1,
      totalDistanceKm: currentStats.totalDistanceKm + distanceKm,
      lastUpdated: new Date().toISOString(),
    };

    await saveUserStats(updatedStats);
    return updatedStats;
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
};

/**
 * Get mission history from storage
 */
export const getMissionHistory = async (): Promise<CompletedMission[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MISSION_HISTORY);
    if (data) {
      return JSON.parse(data) as CompletedMission[];
    }
    return [];
  } catch (error) {
    console.error('Error loading mission history:', error);
    return [];
  }
};

/**
 * Save a completed mission to history
 */
export const saveCompletedMission = async (
  mission: CompletedMission
): Promise<void> => {
  try {
    const history = await getMissionHistory();
    // Add new mission at the beginning (most recent first)
    const updatedHistory = [mission, ...history];
    await AsyncStorage.setItem(
      STORAGE_KEYS.MISSION_HISTORY,
      JSON.stringify(updatedHistory)
    );
  } catch (error) {
    console.error('Error saving completed mission:', error);
    throw error;
  }
};

/**
 * Clear all data (for testing/reset)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_STATS,
      STORAGE_KEYS.MISSION_HISTORY,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

/**
 * Get combined data for the journal
 */
export const getJournalData = async (): Promise<{
  stats: UserStats;
  history: CompletedMission[];
}> => {
  const [stats, history] = await Promise.all([
    getUserStats(),
    getMissionHistory(),
  ]);
  return { stats, history };
};
