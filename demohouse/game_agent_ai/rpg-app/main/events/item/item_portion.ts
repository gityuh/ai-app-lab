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

import { RpgEvent, EventData, RpgPlayer } from '@rpgjs/server'

@EventData({
    name: 'portion_event'
})
export default class FoodEvent extends RpgEvent {
    onInit() {
        this.setGraphic('portion') // 使用对应的图像资源
        this.setHitbox(16, 16) // 设置碰撞框
    }

    async onPlayerTouch(player: RpgPlayer) {
        // 显示提示信息
        await player.showText('成功获取了药水！')
        // 从地图上消失
        this.remove()
    }
}