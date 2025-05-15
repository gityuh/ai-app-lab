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

import asyncio
import json
import time
from typing import AsyncIterable, List, Tuple

from volcenginesdkarkruntime import Ark
from volcenginesdkarkruntime.types.chat.chat_completion_chunk import (
    Choice,
    ChoiceDelta,
)

from app.constants import (
    CGT_ENDPOINT_ID,
    MAX_STORY_BOARD_NUMBER,
)
from app.generators.base import Generator
from app.generators.phase import Phase
from app.message_utils import extract_and_parse_dict_from_message
from app.mode import Mode
from app.models.first_frame_image import FirstFrameImage
from app.models.video import Video
from app.models.video_description import VideoDescription
from app.output_parsers import OutputParser
from arkitect.types.llm.model import (
    ArkChatCompletionChunk,
    ArkChatRequest,
    ArkChatResponse,
)
from arkitect.core.errors import InvalidParameter
from arkitect.telemetry.logger import ERROR, INFO, WARN
from arkitect.utils.context import get_reqid, get_resource_id


def zip_video_descriptions_and_first_frame_images(
    video_descriptions: List[VideoDescription],
    first_frame_images: List[FirstFrameImage],
) -> List[Tuple[int, VideoDescription, FirstFrameImage]]:
    # 如果数量不匹配，记录警告并尝试处理
    if len(video_descriptions) != len(first_frame_images):
        WARN(
            f"数量不匹配：first_frame_images={len(first_frame_images)}, video_descriptions={len(video_descriptions)}"
        )
        # 以较小的数量为准
        min_length = min(len(video_descriptions), len(first_frame_images))
        if min_length == 0:
            ERROR("没有足够的数据来生成视频")
            raise InvalidParameter(
                "messages", "没有足够的数据来生成视频"
            )
        
        # 截断较长的列表
        if len(video_descriptions) > min_length:
            WARN(f"截断video_descriptions从{len(video_descriptions)}到{min_length}")
            video_descriptions = video_descriptions[:min_length]
        elif len(first_frame_images) > min_length:
            WARN(f"截断first_frame_images从{len(first_frame_images)}到{min_length}")
            first_frame_images = first_frame_images[:min_length]
    
    video_descriptions_by_index = {i: s for i, s in enumerate(video_descriptions)}
    first_frame_images_by_index = {ffi.index: ffi for ffi in first_frame_images}

    # 重新调整first_frame_images的索引以匹配video_descriptions
    adjusted_first_frame_images = []
    for i, desc in enumerate(video_descriptions):
        # 优先使用索引匹配的图像
        if i in first_frame_images_by_index:
            ffi = first_frame_images_by_index[i]
        # 如果索引不匹配，尝试按顺序选择图像
        else:
            available_images = [img for img in first_frame_images if img.index not in [a.index for a in adjusted_first_frame_images]]
            if available_images:
                ffi = available_images[0]
                WARN(f"对视频{i}使用不匹配的图像，原索引:{ffi.index}")
                # 调整索引以匹配
                ffi.index = i
            else:
                ERROR(f"无法为视频{i}找到对应的图像")
                raise InvalidParameter("messages", f"缺少索引为{i}的首帧图像")
        
        adjusted_first_frame_images.append(ffi)
    
    # 创建调整后的元组列表
    zipped = []
    for i, desc in enumerate(video_descriptions):
        matching_image = next((img for img in adjusted_first_frame_images if img.index == i), None)
        if matching_image:
            zipped.append((i, desc, matching_image))
        else:
            ERROR(f"无法为视频{i}找到对应的图像")
            raise InvalidParameter("messages", f"缺少索引为{i}的首帧图像")
    
    return zipped


class VideoGenerator(Generator):
    ark_runtime_client: Ark
    output_parser: OutputParser
    request: ArkChatRequest
    mode: Mode

    def __init__(self, request: ArkChatRequest, mode: Mode = Mode.CONFIRMATION):
        super().__init__(request, mode)
        self.ark_runtime_client = Ark()
        self.output_parser = OutputParser(request)
        self.request = request
        self.mode = mode

    async def generate(self) -> AsyncIterable[ArkChatResponse]:
        # extract first frame images and video descriptions to generate videos
        first_frame_images = self.output_parser.get_first_frame_images()
        video_descriptions = self.output_parser.get_video_descriptions()

        if not first_frame_images:
            ERROR("first frame images not found")
            raise InvalidParameter("messages", "first frame images not found")

        if not video_descriptions:
            ERROR("video descriptions not found")
            raise InvalidParameter("messages", "video descriptions not found")
            
        # 检查数量并尝试修复
        if len(first_frame_images) != len(video_descriptions):
            WARN(
                f"first frame images 和 video descriptions 数量不匹配：len(first_frame_images)={len(first_frame_images)}, len(video_descriptions)={len(video_descriptions)}"
            )
            
            # 如果first_frame_images数量更多，根据索引修复
            if len(first_frame_images) > len(video_descriptions):
                WARN("尝试根据索引调整first_frame_images")
                # 按索引排序
                sorted_images = sorted(first_frame_images, key=lambda ffi: ffi.index)
                # 保留与video_descriptions数量相同的图像
                first_frame_images = sorted_images[:len(video_descriptions)]
                WARN(f"调整后的first_frame_images数量: {len(first_frame_images)}")
            
            # 如果video_descriptions数量更多，截断到与first_frame_images相同
            elif len(video_descriptions) > len(first_frame_images):
                WARN("video_descriptions数量多于first_frame_images，将截断多余的描述")
                video_descriptions = video_descriptions[:len(first_frame_images)]
                WARN(f"调整后的video_descriptions数量: {len(video_descriptions)}")
        
        # 最终检查
        if len(first_frame_images) != len(video_descriptions):
            ERROR(
                f"调整后仍然不匹配: len(first_frame_images)={len(first_frame_images)}, len(video_descriptions)={len(video_descriptions)}"
            )
            raise InvalidParameter(
                "messages",
                "first frame images or video description counts are incorrect",
            )

        if len(first_frame_images) > MAX_STORY_BOARD_NUMBER:
            ERROR("first frame image count exceed limit")
            raise InvalidParameter("messages", "first frame image count exceed limit")

        # user request can include videos field containing a list of Videos they don't want regenerated
        # handle case when some assets are already provided, only partial set of assets needs to be generated
        generated_videos: List[Video] = []
        if self.mode == Mode.REGENERATION:
            dict_content = extract_and_parse_dict_from_message(
                self.request.messages[-1].content
            )
            videos_json = dict_content.get("videos", [])
            for v in videos_json:
                video = Video.model_validate(v)
                if video.content_generation_task_id:
                    generated_videos.append(video)

        INFO(f"generated_videos: {generated_videos}")

        # send first stream
        yield ArkChatCompletionChunk(
            id=get_reqid(),
            choices=[
                Choice(
                    index=0,
                    delta=ChoiceDelta(
                        content=f"phase={Phase.VIDEO.value}\n\n",
                    ),
                ),
            ],
            created=int(time.time()),
            model=get_resource_id(),
            object="chat.completion.chunk",
        )

        content_generation_info = zip_video_descriptions_and_first_frame_images(
            video_descriptions, first_frame_images
        )

        # create a list of content generation tasks, skips videos in generated_video_indexes
        tasks = []
        generated_video_indexes = set([v.index for v in generated_videos])
        for index, video_descriptions, first_frame_image in content_generation_info:
            if index not in generated_video_indexes:
                tasks.append(
                    asyncio.create_task(
                        self._create_content_generation_task(
                            index,
                            video_descriptions.description,
                            first_frame_image.images[0],
                        )
                    )
                )

        pending_tasks = set(tasks)
        content = {
            "videos": [role_image.model_dump() for role_image in generated_videos],
        }

        # accumulates the task results
        while pending_tasks:
            done, pending_tasks = await asyncio.wait(
                pending_tasks, return_when=asyncio.FIRST_COMPLETED
            )

            for task in done:
                video_index, content_generation_task_id = task.result()
                content["videos"].append(
                    Video(
                        index=video_index,
                        content_generation_task_id=content_generation_task_id,
                    ).model_dump()
                )

        yield ArkChatCompletionChunk(
            id=get_reqid(),
            choices=[
                Choice(
                    index=0,
                    delta=ChoiceDelta(content=f"{json.dumps(content)}\n\n"),
                )
            ],
            created=int(time.time()),
            model=get_resource_id(),
            object="chat.completion.chunk",
        )

        yield ArkChatCompletionChunk(
            id=get_reqid(),
            choices=[
                Choice(
                    index=0,
                    finish_reason="stop",
                    delta=ChoiceDelta(content=""),
                )
            ],
            created=int(time.time()),
            model=get_resource_id(),
            object="chat.completion.chunk",
        )

    async def _create_content_generation_task(
        self, index: int, prompt: str, image_url: str
    ) -> Tuple[int, str]:
        try:
            # Create Content Generation Task
            resp = self.ark_runtime_client.content_generation.tasks.create(
                model=CGT_ENDPOINT_ID,
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url},
                    },
                ],
            )

            content_generation_task_id = resp.id
        except Exception as e:
            ERROR(f"fail to generate video, err: {e}")
            return index, "failed to generate video"

        return index, content_generation_task_id
