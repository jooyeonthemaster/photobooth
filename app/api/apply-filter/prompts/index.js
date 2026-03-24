import { BEAUTY_PROMPTS } from './beauty';
import { ART_PROMPTS } from './art';
import { FANTASY_PROMPTS } from './fantasy';
import { HORROR_PROMPTS } from './horror';

export const FILTER_PROMPTS = {
  ...BEAUTY_PROMPTS,
  ...ART_PROMPTS,
  ...FANTASY_PROMPTS,
  ...HORROR_PROMPTS,
};
