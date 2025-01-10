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

import json
import re
import time

from app.message_utils import extract_and_parse_dict_from_message
from dotenv import load_dotenv
from tests.e2e_tests.common import bot_chat_completion
from volcenginesdkarkruntime import Ark

load_dotenv()


def trim_phase_prefix(input_string):
    pattern = r"^phase=\w+\s"
    return re.sub(pattern, "", input_string)


def chat_completion(messages) -> str:
    stream = bot_chat_completion(messages)
    completion = ""
    for chunk in stream:
        if not chunk.choices:
            continue
        completion += chunk.choices[0].delta.content
    return completion


def test_full_process():
    # Prompt Script Phase
    print("Script Phase")
    messages = [{"role": "user", "content": "写个小熊和螃蟹的故事"}]

    completion = chat_completion(messages)
    assert completion.startswith("phase=Script")

    messages.append({"role": "assistant", "content": completion})

    scripts = {"script": trim_phase_prefix(completion)}

    # Prompt StoryBoard Phase
    print("StoryBoard Phase")
    messages.append({"role": "user", "content": "生成分镜脚本"})

    completion = chat_completion(messages)
    assert completion.startswith("phase=StoryBoard")

    messages.append({"role": "assistant", "content": completion})

    storyboards = {"storyboards": trim_phase_prefix(completion)}

    # Prompt RoleDescription Phase
    print("RoleDescription Phase")
    messages.append({"role": "user", "content": "开始生成视频"})

    completion = chat_completion(messages)
    assert completion.startswith("phase=RoleDescription")

    messages.append({"role": "assistant", "content": completion})

    role_descriptions = {"role_descriptions": trim_phase_prefix(completion)}

    # Prompt RoleImage Phase
    print("RoleImage Phase")
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(role_descriptions, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=RoleImage")

    messages.append({"role": "assistant", "content": completion})
    role_images = extract_and_parse_dict_from_message(trim_phase_prefix(completion))

    # Prompt FirstFrameDescription Phase
    print("FirstFrameDescription Phase")
    ctx = dict()
    ctx.update(scripts)
    ctx.update(storyboards)
    ctx.update(role_descriptions)
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(ctx, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=FirstFrameDescription")

    messages.append({"role": "assistant", "content": completion})
    first_frame_descriptions = {
        "first_frame_descriptions": trim_phase_prefix(completion)
    }

    # Prompt FirstFrameImage Phase
    print("FirstFrameImage Phase")
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(first_frame_descriptions, ensure_ascii=False)}",
        }
    )

    while True:
        completion = chat_completion(messages)
        assert completion.startswith("phase=FirstFrameImage")

        messages.append({"role": "assistant", "content": completion})
        first_frame_images = extract_and_parse_dict_from_message(
            trim_phase_prefix(completion)
        )

        success = []
        for img in first_frame_images["first_frame_images"]:
            if (
                "Post Img Risk Not Pass" not in img["images"][0]
                and "failed" not in img["images"][0]
            ):
                success.append(img["index"])

        if len(success) < len(first_frame_images["first_frame_images"]):
            first_frame_images["first_frame_images"] = list(filter(
                lambda x: x["index"] in success,
                first_frame_images["first_frame_images"],
            ))

            ctx = dict()
            ctx.update(first_frame_descriptions)
            ctx.update(first_frame_images)
            messages.append(
                {
                    "role": "user",
                    "content": f"REGENERATION {json.dumps(ctx, ensure_ascii=False)}",
                }
            )

            print("Retrying FirstFrameImage Phase")
            continue

        break

    # Prompt VideoDescription Phase
    print("VideoDescription Phase")
    ctx = dict()
    ctx.update(scripts)
    ctx.update(storyboards)
    ctx.update(role_descriptions)
    ctx.update(first_frame_descriptions)
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(ctx, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=VideoDescription")

    messages.append({"role": "assistant", "content": completion})
    video_descriptions = {"video_descriptions": trim_phase_prefix(completion)}

    # Prompt Video Phase
    print("Video Phase")
    ctx = dict()
    ctx.update(video_descriptions)
    ctx.update(first_frame_images)
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(ctx, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=Video")

    messages.append({"role": "assistant", "content": completion})
    videos = extract_and_parse_dict_from_message(trim_phase_prefix(completion))

    # Prompt Tone Phase
    print("Tone Phase")
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(storyboards, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=Tone")

    messages.append({"role": "assistant", "content": completion})
    tones = extract_and_parse_dict_from_message(trim_phase_prefix(completion))

    # Prompt Audio Phase
    print("Audio Phase")
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(tones, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=Audio")

    messages.append({"role": "assistant", "content": completion})
    audios = extract_and_parse_dict_from_message(trim_phase_prefix(completion))

    print(messages)

    # Prompt Film Phase
    print("Film Phase")
    ark_runtime_client = Ark()
    while any(
        ark_runtime_client.content_generation.tasks.get(
            task_id=vid["content_generation_task_id"]
        ).status
        != "succeeded"
        for vid in videos["videos"]
    ):
        time.sleep(10)
        print("waiting for content generation tasks to complete")

    ctx = dict()
    ctx.update(tones)
    ctx.update(videos)
    ctx.update(audios)
    messages.append(
        {
            "role": "user",
            "content": f"CONFIRMATION {json.dumps(ctx, ensure_ascii=False)}",
        }
    )

    completion = chat_completion(messages)
    assert completion.startswith("phase=Film")

    messages.append({"role": "assistant", "content": completion})

    print("Film:", completion)
