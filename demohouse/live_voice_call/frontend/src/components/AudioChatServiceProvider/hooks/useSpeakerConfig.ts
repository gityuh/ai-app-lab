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

import { useContext } from 'react';
import { AudioChatServiceContext } from '@/components/AudioChatServiceProvider/context';

const speakerOptions = [
  { label: '爽快思思', value: 'zh_female_shuangkuaisisi_moon_bigtts' },
  { label: '温暖阿虎', value: 'zh_male_wennuanahu_moon_bigtts' },
];

export const useSpeakerConfig = () => {
  const { configNeedUpdateRef, serviceRef, currentSpeaker, setCurrentSpeaker } =
    useContext(AudioChatServiceContext);

  return {
    currentSpeaker,
    updateCurrentSpeaker: (v: string) => {
      setCurrentSpeaker(v);
      configNeedUpdateRef.current = true;
    },
    speakerOptions,
  };
};
