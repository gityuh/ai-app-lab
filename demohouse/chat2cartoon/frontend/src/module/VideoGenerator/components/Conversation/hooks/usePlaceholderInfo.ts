import { useMemo } from 'react';

import interactiveVideoAvatar from '@/images/assets/interative_video.jpeg';
import { Assistant } from '@/types/assistant';

interface Props {
  placeholderInfo?:
    | {
        name?: string;
        avatar?: any;
        openingRemark?: string;
        preQuestions?: string[];
      }
    | {
        name?: string;
        avatar?: string;
        openingRemark?: string;
        // preQuestions?: string[];
      }[];

  assistant?: Assistant;
  templateType?: any;
}

interface PlaceholderInfo {
  name: string;
  avatar: string;
  openingRemark: string;
  preQuestions?: any[];
}

export const usePlaceholderInfo = ({ assistant }: Props): PlaceholderInfo | PlaceholderInfo[] =>
  useMemo(
    () => ({
      name: assistant?.Name ?? '',
      avatar: interactiveVideoAvatar,
      openingRemark: assistant?.OpeningRemarks?.OpeningRemark ?? '',
      preQuestions: assistant?.OpeningRemarks?.OpeningQuestions ?? [],
    }),
    [assistant],
  );
