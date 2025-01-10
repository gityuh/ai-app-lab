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

from app.models.first_frame_description import FirstFrameDescription
from app.models.role_description import RoleDescription
from app.models.story_board import StoryBoard
from app.models.video_description import VideoDescription
from app.output_parsers import (
    parse_first_frame_description,
    parse_role_description,
    parse_storyboards,
    parse_video_description,
)


def test_parse_storyboard():
    storyboard_completion = """phase=StoryBoard
分镜1：
角色：小熊
画面：森林里，一只毛茸茸、耳朵小小的、眼睛黑亮黑亮的小熊戴着蓝色小帽子，穿着带有黄色星星图案的棕色背心，欢快地走向一棵大树。
中文台词：“我要去找蜂蜜吃啦。”
英文台词："I'm going to find the honey."

分镜2：
角色：小狐狸，小猪
画面：森林里，尖耳朵、眼睛透着狡黠的小狐狸穿着红色披风（上面绣着金色花纹），看到小熊后露出坏笑。
中文台词：“嘿嘿，我来捉弄一下这只小熊。”
英文台词："Hey, I'm going to trick this little bear."

分镜3：
角色：小鸟
画面：大树枝上，一只五彩斑斓羽毛、尖嘴巴、圆眼睛且身穿白色小肚兜的小鸟看到小狐狸的表情。
中文台词：“小狐狸又想做坏事，我要帮帮小熊。”
英文台词："I'm going to help this little bear."
    """

    storyboards = parse_storyboards(storyboard_completion)

    assert storyboards == [
        StoryBoard(
            characters=["小熊"],
            scene="森林里，一只毛茸茸、耳朵小小的、眼睛黑亮黑亮的小熊戴着蓝色小帽子，穿着带有黄色星星图案的棕色背心，欢快地走向一棵大树。",
            lines="“我要去找蜂蜜吃啦。”",
            lines_en='"I\'m going to find the honey."',
        ),
        StoryBoard(
            characters=["小狐狸", "小猪"],
            scene="森林里，尖耳朵、眼睛透着狡黠的小狐狸穿着红色披风（上面绣着金色花纹），看到小熊后露出坏笑。",
            lines="“嘿嘿，我来捉弄一下这只小熊。”",
            lines_en='"Hey, I\'m going to trick this little bear."',
        ),
        StoryBoard(
            characters=["小鸟"],
            scene="大树枝上，一只五彩斑斓羽毛、尖嘴巴、圆眼睛且身穿白色小肚兜的小鸟看到小狐狸的表情。",
            lines="“小狐狸又想做坏事，我要帮帮小熊。”",
            lines_en='"I\'m going to help this little bear."',
        ),
    ]


def test_parse_role_description():
    role_description_completion = """phase=RoleDescription 
角色1：
角色描述：小熊，圆头圆脑，小黑鼻。服饰：蓝色小帽与黄色星图棕背心（森林）
角色2：
角色描述:小狐狸，尖脸尖耳，细长眼。服饰：绣金纹红披风（森林）
角色3：
角色描述：小鸟，小巧玲珑，圆眼珠。服饰：白色小肚兜（树枝上）
    """
    role_descriptions = parse_role_description(role_description_completion)
    assert role_descriptions == [
        RoleDescription(
            description="小熊，圆头圆脑，小黑鼻。服饰：蓝色小帽与黄色星图棕背心（森林）"
        ),
        RoleDescription(
            description="小狐狸，尖脸尖耳，细长眼。服饰：绣金纹红披风（森林）"
        ),
        RoleDescription(
            description="小鸟，小巧玲珑，圆眼珠。服饰：白色小肚兜（树枝上）"
        ),
    ]


def test_parse_first_frame_description():
    first_frame_description_completions = """分镜1
角色：小熊
首帧描述：卡通风格插图，3D渲染的森林场景中，一只毛茸茸、小耳朵黑眼睛且有着小黑鼻的小熊戴着蓝色小帽，穿着带黄色星星图案的棕色背心，欢快地朝着大树的方向走去，满满的幼儿可爱风格。

分镜2
角色：小狐狸
首帧描述:卡通风格插图，3D渲染的森林画面里，尖脸尖耳、细长眼的小狐狸穿着绣着金纹的红色披风，看到小熊后嘴角泛起狡黠的坏笑，呈现幼儿可爱风格。

分镜3
角色：小鸟
首帧描述：卡通风格插图，3D渲染下，在大树枝上，小巧玲珑、圆眼珠的小鸟站着，身穿白色小肚兜，正看向下方，幼儿可爱风格。

分镜4
角色：小熊，小狐狸
首帧描述：卡通风格插图，3D渲染的大树下场景，毛茸茸的小熊站在树前看着蜂窝，尖脸尖耳的小狐狸悄悄绕到小熊身后，幼儿可爱风格。

分镜5
角色：小鸟，小熊，小狐狸
首帧描述：卡通风格插图，3D渲染画面里，小熊站在树下，小狐狸正要伸手推小熊，这时从大树枝上飞下身穿白色小肚兜的小鸟去啄小狐狸耳朵，幼儿可爱风格。

分镜6
角色：小熊，小鸟
首帧描述:卡通风格插图，3D渲染画面中，小熊感激地看向站在自己肩膀上身穿白色小肚兜的小鸟，周围是森林环境，幼儿可爱风格。
"""
    first_frame_descriptions = parse_first_frame_description(
        first_frame_description_completions
    )
    assert first_frame_descriptions == [
        FirstFrameDescription(
            characters=["小熊"],
            description="卡通风格插图，3D渲染的森林场景中，一只毛茸茸、小耳朵黑眼睛且有着小黑鼻的小熊戴着蓝色小帽，穿着带黄色星星图案的棕色背心，欢快地朝着大树的方向走去，满满的幼儿可爱风格。",
        ),
        FirstFrameDescription(
            characters=["小狐狸"],
            description="卡通风格插图，3D渲染的森林画面里，尖脸尖耳、细长眼的小狐狸穿着绣着金纹的红色披风，看到小熊后嘴角泛起狡黠的坏笑，呈现幼儿可爱风格。",
        ),
        FirstFrameDescription(
            characters=["小鸟"],
            description="卡通风格插图，3D渲染下，在大树枝上，小巧玲珑、圆眼珠的小鸟站着，身穿白色小肚兜，正看向下方，幼儿可爱风格。",
        ),
        FirstFrameDescription(
            characters=["小熊", "小狐狸"],
            description="卡通风格插图，3D渲染的大树下场景，毛茸茸的小熊站在树前看着蜂窝，尖脸尖耳的小狐狸悄悄绕到小熊身后，幼儿可爱风格。",
        ),
        FirstFrameDescription(
            characters=["小鸟", "小熊", "小狐狸"],
            description="卡通风格插图，3D渲染画面里，小熊站在树下，小狐狸正要伸手推小熊，这时从大树枝上飞下身穿白色小肚兜的小鸟去啄小狐狸耳朵，幼儿可爱风格。",
        ),
        FirstFrameDescription(
            characters=["小熊", "小鸟"],
            description="卡通风格插图，3D渲染画面中，小熊感激地看向站在自己肩膀上身穿白色小肚兜的小鸟，周围是森林环境，幼儿可爱风格。",
        ),
    ]


def test_parse_video_description():
    video_description_completions = """Phase=VideoDescription 
视频1：
角色：小熊
描述：中景，小熊，戴着蓝色小帽，穿着带黄色星图的棕色背心，欢快地朝着大树的方向走去，圆头圆脑，小黑鼻，耳朵小小的。
视频2：
角色：小狐狸
描述：中景，小狐狸，尖脸尖耳，眼睛细长，穿着绣着金纹的红色披风，站在森林里，看着小熊露出狡黠的坏笑。
视频3：
角色：小鸟
描述：远景，小鸟，小巧玲珑，圆眼珠，身穿白色小肚兜，站在大树枝上，注视着下方。
视频4：
角色：小熊，小狐狸
描述：近景，小熊戴着蓝色小帽、穿着棕背心站在大树下望着蜂窝，小狐狸尖脸尖耳，悄悄绕到小熊身后。
视频5：
角色:小熊，小狐狸，小鸟
描述:近景，小狐狸正要伸手推站在蜂窝下的小熊，小鸟快速飞来，小鸟身穿白色小肚兜，啄小狐狸的耳朵，小熊一脸惊讶。
视频6：
角色：小熊，小鸟
描述：中景，小熊感激地看向站在自己肩膀上身穿白色小肚兜的小鸟。
    """
    video_descriptions = parse_video_description(video_description_completions)
    assert video_descriptions == [
        VideoDescription(
            index=1,
            characters=["小熊"],
            description="中景，小熊，戴着蓝色小帽，穿着带黄色星图的棕色背心，欢快地朝着大树的方向走去，圆头圆脑，小黑鼻，耳朵小小的。",
        ),
        VideoDescription(
            index=2,
            characters=["小狐狸"],
            description="中景，小狐狸，尖脸尖耳，眼睛细长，穿着绣着金纹的红色披风，站在森林里，看着小熊露出狡黠的坏笑。",
        ),
        VideoDescription(
            index=3,
            characters=["小鸟"],
            description="远景，小鸟，小巧玲珑，圆眼珠，身穿白色小肚兜，站在大树枝上，注视着下方。",
        ),
        VideoDescription(
            index=4,
            characters=["小熊", "小狐狸"],
            description="近景，小熊戴着蓝色小帽、穿着棕背心站在大树下望着蜂窝，小狐狸尖脸尖耳，悄悄绕到小熊身后。",
        ),
        VideoDescription(
            index=5,
            characters=["小熊", "小狐狸", "小鸟"],
            description="近景，小狐狸正要伸手推站在蜂窝下的小熊，小鸟快速飞来，小鸟身穿白色小肚兜，啄小狐狸的耳朵，小熊一脸惊讶。",
        ),
        VideoDescription(
            index=6,
            characters=["小熊", "小鸟"],
            description="中景，小熊感激地看向站在自己肩膀上身穿白色小肚兜的小鸟。",
        ),
    ]
