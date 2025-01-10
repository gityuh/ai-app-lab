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

import { useMessageList } from '@/components/AudioChatProvider/hooks/useMessageList';

export const ChatMessageList = () => {
  const { chatMessages } = useMessageList();
  return (
    <div
      className={
        'w-[500px] h-[700px] flex-shrink-0 pt-12 px-4 pb-4 rounded-[20px] bg-[#f2f3f5]  px-5 py-5 flex flex-col overflow-y-scroll gap-4'
      }
    >
      {!chatMessages.length && <div>对话后展示消息记录...</div>}
      {chatMessages.map(msg =>
        msg.role === 'bot' ? (
          <div>
            <div className={'select-none flex'}>
              <img
                className={'w-14 h-14 rounded-full mr-4'}
                src={
                  'https://lf3-static.bytednsdoc.com/obj/eden-cn/LM-STH-hahK/ljhwZthlaukjlkulzlp/ark/bot/audio_bot_demo/WrAtF2jBdl.png'
                }
                alt={''}
              />
              <div
                className={
                  'flex items-end max-w-[400px] p-5 rounded-b transition duration-500 rounded-tr mr-4 bg-gray-50 '
                }
              >
                {msg.content}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className={'select-none flex justify-end scrollbar-hidden '}>
              <div
                className={
                  'flex items-end max-w-[400px] p-5 rounded-b transition duration-500 rounded-tr mr-4 bg-gray-50 '
                }
              >
                {msg.content}
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
};
