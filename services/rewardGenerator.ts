/**
 * Reward Generator Service using Newell AI
 * Generates creative reward text when missions are completed
 */

import { generateText } from '@fastshot/ai';
import { MissionVibe } from '@/types/mission';

// Vibe-specific reward themes
const REWARD_THEMES: Record<MissionVibe, string[]> = {
  chill: [
    'peaceful discoveries',
    'moments of tranquility',
    'serene observations',
    'gentle encounters',
    'quiet wonders',
  ],
  discovery: [
    'hidden treasures',
    'unexpected findings',
    'urban secrets',
    'mysterious landmarks',
    'forgotten pathways',
  ],
  workout: [
    'feats of endurance',
    'personal victories',
    'strength milestones',
    'athletic achievements',
    'triumphant moments',
  ],
};

// Default rewards as fallback
const DEFAULT_REWARDS: Record<MissionVibe, string[]> = {
  chill: [
    'You discovered a perfect spot to watch the clouds drift by. Sometimes the best journeys are the slowest ones.',
    'A gentle breeze carried the scent of blooming flowers. Your peaceful walk has recharged your spirit.',
    'You found a moment of perfect stillness in the bustling world. The journey inward is just as important.',
  ],
  discovery: [
    'You stumbled upon a hidden mural that tells stories of the neighborhood\'s past. Every street has secrets waiting to be found.',
    'A winding path led you to an unexpected garden oasis. The city reveals its treasures to those who wander.',
    'You discovered a vintage bookshop tucked between modern buildings. Some gems hide in plain sight.',
  ],
  workout: [
    'Your determination blazed a trail that others will follow. Champions are made one step at a time.',
    'You conquered the distance with unwavering resolve. Your strength grows with every challenge accepted.',
    'The path tested you, but you emerged victorious. True power comes from pushing beyond your limits.',
  ],
};

/**
 * Generate a creative reward text using AI
 */
export const generateRewardText = async (
  title: string,
  vibe: MissionVibe,
  stepsCompleted: number
): Promise<string> => {
  const themes = REWARD_THEMES[vibe];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  const prompt = `You are a creative writer for an urban exploration walking app. The user just completed a walking quest called "${title}" (${vibe} vibe, ${stepsCompleted} steps).

Generate a SHORT, evocative reward message (2 sentences max, under 150 characters total) that:
- Describes a fictional discovery or moment they experienced during their walk
- Matches the ${vibe} vibe with themes of ${randomTheme}
- Uses second person ("You discovered...", "You found...")
- Feels magical and rewarding, like finding treasure in an RPG

Respond with ONLY the reward text, no quotes or extra formatting.`;

  try {
    const response = await generateText({ prompt });

    if (response && response.trim().length > 0) {
      // Clean up the response
      let cleanedResponse = response.trim();
      // Remove quotes if present
      cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '');
      // Ensure it's not too long
      if (cleanedResponse.length > 200) {
        cleanedResponse = cleanedResponse.substring(0, 197) + '...';
      }
      return cleanedResponse;
    }

    // Fallback to default
    return getDefaultReward(vibe);
  } catch (error) {
    console.error('Error generating reward:', error);
    return getDefaultReward(vibe);
  }
};

/**
 * Get a random default reward for a vibe
 */
const getDefaultReward = (vibe: MissionVibe): string => {
  const rewards = DEFAULT_REWARDS[vibe];
  return rewards[Math.floor(Math.random() * rewards.length)];
};
