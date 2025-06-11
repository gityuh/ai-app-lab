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

// import { RpgEvent, EventData, RpgPlayer } from '@rpgjs/server'

// @EventData({
//     name: 'EV-1', 
//     hitbox: {
//         width: 32,
//         height: 16
//     }
// })
// export default class VillagerEvent extends RpgEvent {
//     onInit() {
//         this.setGraphic('female')
//     }
//     async onAction(player: RpgPlayer) {
//         await player.showText('I give you 10 gold.', {
//             talkWith: this
//         })
//         player.gold += 10
//     }
// } 

import { RpgEvent, EventData, RpgPlayer, Move } from '@rpgjs/server'

@EventData({
    name: 'villager_1'
})
export default class CharaEvent1 extends RpgEvent {
    onInit() {
        this.setGraphic('Female 10-1')
        this.setHitbox(16, 16)
        this.speed = 5 // 设置移动速度，数值越小速度越快，RPGJS默认速度可能是3或4，1会比较快
        this.frequency = 50 // 设置移动频率，单位是毫秒，400ms移动一次
        this.infiniteMoveRoute([ Move.tileRandom() ])
    }
    async onAction(player: RpgPlayer) {
        await player.showText('you are my hero!')
    }
}