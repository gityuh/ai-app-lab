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

import { Animation, Spritesheet } from '@rpgjs/client'
import { Direction } from '@rpgjs/common'

const LPCSpritesheetPreset = () => {
    const frameY = (direction: Direction) => {
        return {
            [Direction.Down]: 2,
            [Direction.Left]: 1,
            [Direction.Right]: 3,
            [Direction.Up]: 0
        }[direction]
    }

    const stand = (direction: Direction) => [{ time: 0, frameX: 1, frameY: frameY(direction) }]
    const anim = (direction: Direction, framesWidth: number, speed: number = 5) => {
        const array: any = []
        for (let i = 0; i < framesWidth; i++) {
            array.push({ time: i * speed, frameX: i, frameY: frameY(direction) })
        }
        return array
    }

    return {
        rectWidth: 64,
        rectHeight: 64,
        spriteRealSize: {
            width: 40,
            height: 40,
        },
        framesWidth: 6,
        framesHeight: 4,
        textures: {
            [Animation.Stand]: {
                offset: {
                    x: 0,
                    y: 0,
                },
                animations: (direction: Direction) => [stand(direction)]
            },
            [Animation.Walk]: {
                offset: {
                    x: 0,
                    y: 0,
                },
                framesWidth: 9,
                framesHeight: 4,
                animations: (direction: Direction) => [anim(direction, 9)]
            },
            [Animation.Attack]: {
                offset: {
                    x: 0,
                    y: 0,
                },
                framesWidth: 6,
                framesHeight: 4,
                animations: (direction: Direction) => [anim(direction, 6, 3)]
            }
        },
    }
}

@Spritesheet({
    ...LPCSpritesheetPreset(),
})
export default class LPCSpritesheet {
}
