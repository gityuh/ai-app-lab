// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// Licensed under the 【火山方舟】原型应用软件自用许可协议
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at 
//     https://www.volcengine.com/docs/82379/1433703
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

import { Button } from '@arco-design/web-react';
import { IconRight } from '@arco-design/web-react/icon';
import styles from './index.module.less';
import { VideoGeneratorTaskPhase } from '../../types';

interface ContinueButtonProps {
  phase: string; // 当前阶段
  onClick: () => void; // 继续下一步的回调
  loading?: boolean; // 是否正在加载
}

// 各阶段显示的文案
const phaseLabels: Record<string, string> = {
  [VideoGeneratorTaskPhase.PhaseScript]: '生成故事脚本',
  [VideoGeneratorTaskPhase.PhaseStoryBoard]: '生成分镜脚本',
  [VideoGeneratorTaskPhase.PhaseRoleDescription]: '生成角色描述',
  [VideoGeneratorTaskPhase.PhaseRoleImage]: '生成角色形象',
  [VideoGeneratorTaskPhase.PhaseFirstFrameDescription]: '生成首帧描述',
  [VideoGeneratorTaskPhase.PhaseFirstFrameImage]: '生成首帧图像',
  [VideoGeneratorTaskPhase.PhaseVideoDescription]: '生成视频描述',
  [VideoGeneratorTaskPhase.PhaseVideo]: '生成视频片段',
  [VideoGeneratorTaskPhase.PhaseTone]: '生成配音音色',
  [VideoGeneratorTaskPhase.PhaseAudio]: '生成配音',
  [VideoGeneratorTaskPhase.PhaseFilm]: '最终合成视频',
};

// 获取下一个阶段的名称
const getNextPhase = (currentPhase: string): string => {
  const phases = Object.values(VideoGeneratorTaskPhase);
  const currentIndex = phases.indexOf(currentPhase as VideoGeneratorTaskPhase);
  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return '完成';
  }
  return phaseLabels[phases[currentIndex + 1]] || '下一步';
};

const ContinueButton = ({ phase, onClick, loading = false }: ContinueButtonProps) => {
  const nextPhaseLabel = getNextPhase(phase);
  
  return (
    <div className={styles.continueButtonWrapper}>
      <div className={styles.currentPhase}>
        已完成: {phaseLabels[phase] || phase}
      </div>
      <Button
        type="primary"
        className={styles.continueButton}
        onClick={onClick}
        loading={loading}
        icon={<IconRight />}
      >
        继续{nextPhaseLabel}
      </Button>
    </div>
  );
};

export default ContinueButton; 