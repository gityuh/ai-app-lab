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

import { RpgEvent, EventData, RpgPlayer, Move, Components, Speed, ShapePositioning } from '@rpgjs/server'

@EventData({
    name: 'hero_1'
})
export default class HeroEvent_1 extends RpgEvent {
    // 声明类属性
    private attackPower: number = 5;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 500; // 1秒攻击冷却

    onInit() {
        this.setGraphic('hero_1_walk')
        this.setHitbox(16, 16)
        this.name = '易斩羽'
        this.setComponentsTop(Components.text('{name}', {
            fill: '#000000',
            fontSize: 20,
    }))
        this.speed = Speed.Slow // 设置移动速度，数值越小速度越快，RPGJS默认速度可能是3或4，1会比较快
        this.frequency = 10 //    设置移动频率，单位是毫秒，400ms移动一次
        // this.infiniteMoveRoute([ Move.tileRandom() ])
        // 设置敌人属性
        this.hp = 50; // 敌人的生命值
        setTimeout(() => {
            this.showAnimation('hero_1_attack', 'attack', true);
        }, 300);

        this.attachShape({
            height: 500,
            width: 500,
            positioning: ShapePositioning.Center
        })
    }

     // 当玩家接触到此事件时调用
    async onPlayerTouch(player: RpgPlayer) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) {
            return; // 如果攻击仍在冷却中，则不执行任何操作
        }
        this.lastAttackTime = now; // 更新上次攻击时间
        console.log('hero_1_attack')
        setTimeout(() => {
            this.showAnimation('hero_1_attack', 'attack', true);
        }, 300); // 攻击动画持续时间（毫秒），例如300ms，请根据你的动画调整

        const damage = this.attackPower;
        if (player.name != '用户') {
            player.hp -= damage; // 修改此行：直接扣除玩家HP
        }
        
        // 检查玩家是否被击败
        if (player.hp <= 0) {
            await player.showText('你被击败了!', { talkWith: this });
            // 此处可以添加更多玩家被击败后的逻辑，例如游戏结束、角色重生等
            // player.respawn(); // 示例：重生玩家
        }
    }

    onDetectInShape(player: RpgPlayer) {
        console.log('in', player.id);
        if (player.name === '用户') {
            console.log('move to player')
            this.moveTo(player).subscribe()
        }
    }

    async onAction(player: RpgPlayer) {
        await player.showText('易斩羽：同我前去迎战东方御尊！')
    }
}