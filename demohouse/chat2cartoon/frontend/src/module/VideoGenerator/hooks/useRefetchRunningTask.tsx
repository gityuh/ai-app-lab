import { useCallback, useContext, useRef } from 'react';

import { useUnmount } from 'ahooks';


import { sleep } from '@/utils/utils';
import { GetVideoGenTaskResponse, Phase } from '@/types/video_gen_task';

import { InjectContext } from '../store/Inject/context';

const LOOP_INETRVAL = 3000;

export interface ResultType extends Partial<GetVideoGenTaskResponse> {
  Error?: string;
}

const INITIAL_RESULT: ResultType = {
  model: '',
  id: '',
};

export const useRefetchRunningTask = (updateVideo: (value: ResultType) => void) => {
  const { api } = useContext(InjectContext);
  const lock = useRef(true);

  useUnmount(() => {
    lock.current = false;
  });

  const run = useCallback(async (Id: string): Promise<ResultType> => {
    if (!api.GetVideoGenTask) {
      return INITIAL_RESULT;
    }
    try {
      while (lock.current) {
        await sleep(LOOP_INETRVAL);
        const task = await api.GetVideoGenTask({ Id }, { showError: false });
        const currentPhase = task.status as Phase;
        updateVideo(task as ResultType);
        if ([Phase.PhaseFailed, Phase.PhaseCompleted].includes(currentPhase)) {
          return task as ResultType;
        }
      }
      return INITIAL_RESULT;
    } catch (e: any) {
      return {
        ...INITIAL_RESULT,
        Error: `${
          e?.data?.ResponseMetadata?.Error?.Message ??
          '预期之外的错误，请联系管理员'
        }`,
      };
    }
  }, [api]);

  return { run };
};
