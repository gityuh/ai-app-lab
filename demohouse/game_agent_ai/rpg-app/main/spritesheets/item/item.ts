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

import { Spritesheet, Animation } from '@rpgjs/client'

const to = () => {
    const array: any = [];
    let k = 0;
    const durationFrame = 2;
    for (let j = 0; j < 1; j++) {
        array.push({ time: k * durationFrame, frameX: j, frameY: 0 });
        k++;
    }
    array.push({ time: k * durationFrame });
    return array;
}
@Spritesheet({
    framesWidth: 1,
    framesHeight: 1,
    width: 135,
    height: 16,
    opacity: 1,
    anchor: [0.5],
    textures: {
        [Animation.Stand]: {
            animations: () => [to()]
        },
    }
})
export default class ItemAnimations { }