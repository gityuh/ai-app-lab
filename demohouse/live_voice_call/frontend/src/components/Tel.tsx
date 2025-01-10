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

import { Spin } from '@arco-design/web-react';
import React from 'react';
import { useAudioChatState } from '@/components/AudioChatProvider/hooks/useAudioChatState';

export const Tel = () => {
  const { wsConnected, botSpeaking, userSpeaking, botAudioPlaying } =
    useAudioChatState();
  return (
    <div className={'chat'}>
      <div
        className={
          'relative h-[700px] w-[500px] max-w-[720px] overflow-hidden rounded-[20px] bg-[#f2f3f5]'
        }
      >
        <div className={'flex flex-col items-center justify-center gap-12'}>
          <div
            className={'h-12 text-xl font-bold text-[#507ef7] text-center py-3'}
          >
            语音 demo
          </div>
          <div className={'flex flex-col justify-center items-center'}>
            <img
              src={
                'https://lf3-static.bytednsdoc.com/obj/eden-cn/LM-STH-hahK/ljhwZthlaukjlkulzlp/ark/bot/audio_bot_demo/WrAtF2jBdl.png'
              }
              className={
                'mt-16 w-[100px] h-[100px] rounded-full select-none  object-cover box-content'
              }
            />
          </div>
          <div
            className={
              'flex flex-col items-center text-[#507ef7] text-center text-lg'
            }
          >
            {botSpeaking && <Spin dot size={6} className={'pb-2'} />}
            <div className={'wave w-[165px] h-[45px]'} />
            {(botSpeaking || botAudioPlaying) && (
              <div className={'bot-wave w-[165px] h-[45px]'} />
            )}
            {!wsConnected && '请先连接...'}
            {userSpeaking && '用户说话中...'}
            {botSpeaking && '模型回复中...'}
            {botAudioPlaying && '模型说话中...'}
          </div>
        </div>
      </div>
    </div>
  );
};
