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

import React from 'react';

import { Tel } from '@/components/Tel';
import { ChatMessageList } from '@/components/ChatMessageList';
import { Panel } from '@/components/Panel';
import { AudioChatProvider } from '@/components/AudioChatProvider';
import { AudioChatServiceProvider } from '@/components/AudioChatServiceProvider';

const Index = () => {
  return (
    <AudioChatProvider>
      <AudioChatServiceProvider>
        <div
          className={
            'h-screen w-screen flex gap-12 items-center justify-center'
          }
        >
          <Tel />
          <ChatMessageList />
          <Panel />
        </div>
      </AudioChatServiceProvider>
      s
    </AudioChatProvider>
  );
};

export default Index;
