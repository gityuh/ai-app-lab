import { useEffect, useRef, useState } from 'react';

import { FlowStatus, RunningPhaseStatus, VideoGeneratorBotMessage, VideoGeneratorTaskPhase } from '../types';
import { PHASE_MAP } from '../constants';

const useGenerateStatus = () => {
  const runningPhaseStatusRef = useRef<RunningPhaseStatus>(RunningPhaseStatus.Ready);
  const phasesContentErrorRef = useRef<Record<string, boolean>>({});

  const [runningPhaseStatus, setRunningPhaseStatus] = useState<RunningPhaseStatus>(RunningPhaseStatus.Ready);
  const [flowStatus, setFlowStatus] = useState<FlowStatus>(FlowStatus.Ready);

  const updateRunningPhaseStatus = (status: RunningPhaseStatus) => {
    runningPhaseStatusRef.current = status;
    setRunningPhaseStatus(status);
  };

  const checkFinishMessage = (newMessage: VideoGeneratorBotMessage, phase: string) => {
    const phaseStruct = PHASE_MAP[phase as VideoGeneratorTaskPhase];
    if (!phaseStruct) {
      return;
    }
    const { containsErrorMessage } = phaseStruct;
    if (!containsErrorMessage) {
      // 不需要检查
      return RunningPhaseStatus.Success;
    }
    // 检查是否包含错误信息
    const errorMessage = newMessage.versions[newMessage.currentVersion]?.find(item =>
      item?.content?.includes(containsErrorMessage),
    );
    if (errorMessage) {
      phasesContentErrorRef.current[phase] = true;
      return RunningPhaseStatus.ContentError;
    }
    phasesContentErrorRef.current[phase] = false;
    return RunningPhaseStatus.Success;
  };

  useEffect(() => {
    // 判断整个流能否继续运行
    let canWork = true;
    Object.keys(phasesContentErrorRef.current).forEach(key => {
      if (phasesContentErrorRef.current[key]) {
        canWork = false;
      }
    });
    setFlowStatus(canWork ? FlowStatus.Ready : FlowStatus.NotWork);
  }, [runningPhaseStatus]);

  return {
    flowStatus,
    runningPhaseStatusRef,
    runningPhaseStatus,
    updateRunningPhaseStatus,
    checkFinishMessage,
  };
};

export default useGenerateStatus;
