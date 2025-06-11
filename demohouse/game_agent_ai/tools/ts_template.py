# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# Licensed under the 【火山方舟】原型应用软件自用许可协议
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at 
#     https://www.volcengine.com/docs/82379/1433703
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from jinja2 import Template

villager_template = Template("""
import { RpgEvent, EventData, RpgPlayer, Move } from '@rpgjs/server'

@EventData({
    name: '{{event_name}}'
})
export class Event_{{event_name}} extends RpgEvent {
    onInit() {
        this.setGraphic('{{villager_img}}')
        this.setHitbox(16, 16)
        this.speed = 5 // 设置移动速度，数值越小速度越快，RPGJS默认速度可能是3或4，1会比较快
        this.frequency = 50 // 设置移动频率，单位是毫秒，400ms移动一次
        this.infiniteMoveRoute([ Move.tileRandom() ])
    }
    async onAction(player: RpgPlayer) {
        await player.showText('{{character_speak}}')
    }
}

""")

hero_attack_template = Template("""
import { RpgEvent, EventData, RpgPlayer, Move, Components, Speed, ShapePositioning } from '@rpgjs/server'

@EventData({
    name: '{{event_name}}'
})
export default class Event_{{event_name}} extends RpgEvent {
    // 声明类属性
    private attackPower: number = 5;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 500;

    onInit() {
        this.setGraphic('{{hero_walk_img}}')
        this.setHitbox(16, 16)
        this.name = '{{character_name}}'
        this.setComponentsTop(Components.text('{name}', {
            fill: '#000000',
            fontSize: 20,
    }))
        this.speed = Speed.Slow
        this.frequency = 10
        // this.infiniteMoveRoute([ Move.tileRandom() ])
        this.hp = 50; // 敌人的生命值
        setTimeout(() => {
            this.showAnimation('{{hero_attack_img}}', 'attack', true);
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
            return;
        }
        this.lastAttackTime = now;
        setTimeout(() => {
            this.showAnimation('{{hero_attack_img}}', 'attack', true);
        }, 300); // 攻击动画持续时间（毫秒），例如300ms，

        const damage = this.attackPower;
        if (player.name != '用户') {
            player.hp -= damage;
        }
        
        // 检查玩家是否被击败
        if (player.hp <= 0) {
            await player.showText('你被击败了!', { talkWith: this });
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
        await player.showText('{{character_speak}}')
    }
}
""")

hero_no_move_template = Template("""
import { RpgEvent, EventData, RpgPlayer, Move, Components, Speed, ShapePositioning } from '@rpgjs/server'

@EventData({
    name: '{{event_name}}'
})
export default class Event_{{event_name}} extends RpgEvent {
    onInit() {
        this.setGraphic('{{hero_walk_img}}')
        this.setHitbox(16, 16)
        this.name = '{{character_name}}'
        this.setComponentsTop(Components.text('{name}', {
            fill: '#000000',
            fontSize: 20,
        }))
    }

    async onAction(player: RpgPlayer) {
        await player.showText('{{character_speak}}')
    }
}

""")