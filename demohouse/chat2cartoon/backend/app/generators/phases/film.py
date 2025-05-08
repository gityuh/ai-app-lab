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
import os
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor
from typing import AsyncIterable, List, Optional

from moviepy import AudioFileClip, CompositeVideoClip, TextClip, VideoFileClip
from moviepy.video.fx import CrossFadeIn, CrossFadeOut
from moviepy.video.tools.subtitles import SubtitlesClip
from volcenginesdkarkruntime import Ark
from volcenginesdkarkruntime.types.chat.chat_completion_chunk import (
    Choice,
    ChoiceDelta,
)

from app.clients.downloader import DownloaderClient
from app.clients.tos import TOSClient
from app.constants import ARTIFACT_TOS_BUCKET, MAX_STORY_BOARD_NUMBER
from app.generators.base import Generator
from app.generators.phase import Phase
from app.mode import Mode
from app.models.audio import Audio
from app.models.film import Film
from app.models.tone import Tone
from app.models.video import Video
from app.output_parsers import OutputParser
from arkitect.types.llm.model import (
    ArkChatCompletionChunk,
    ArkChatRequest,
    ArkChatResponse,
)
from arkitect.core.errors import InternalServiceError, InvalidParameter
from arkitect.telemetry.logger import ERROR, INFO
from arkitect.utils.context import get_reqid, get_resource_id

_current_dir = os.path.dirname(os.path.abspath(__file__))
_font = os.path.join(_current_dir, "../../../media/DouyinSansBold.otf")

_FADE_IN_DURATION_IN_SECONDS = 0.5
_FADE_OUT_DURATION_IN_SECONDS = 0.5


def _split_subtitle_en(input_string: str, max_length: int = 40):
    words = input_string.split()
    result = []
    current_part = []

    for word in words:
        if len(" ".join(current_part + [word])) <= max_length:
            current_part.append(word)
        else:
            result.append(" ".join(current_part))
            current_part = [word]

    if current_part:
        result.append(" ".join(current_part))

    return result


def _split_subtitle_cn(input_string: str, max_length: int = 40):
    result = []
    current_part = []

    for char in input_string:
        current_part.append(char)
        if len(current_part) == max_length:
            result.append("".join(current_part))
            current_part = []

    if current_part:
        result.append("".join(current_part))

    return result


def _split_subtitle(line: str, start_time: int, end_time: int, split_fn) -> List:
    total_length = len(line)
    lines = split_fn(line, 40)
    total_duration = end_time - start_time
    start = start_time
    subtitles = []
    for l in lines:
        end = start + total_duration * len(l) / total_length
        subtitles.append(((start, end), l))
        start = end
    return subtitles


def _generate_film(
    req_id: str, tones: List[Tone], videos: List[Video], audios: List[Audio]
):
    videos.sort(key=lambda video: video.index)
    audios.sort(key=lambda audio: audio.index)

    video_clips = []
    cn_subtitles = []
    en_subtitles = []

    clip_start_time = 0.0
    start = []
    elements = list(zip(tones, videos, audios))
    
    # 创建临时目录用于存储视频和音频文件
    with tempfile.TemporaryDirectory() as temp_dir:
        # 先将所有视频和音频文件写入临时目录
        video_files = []
        audio_files = []
        
        for i, (t, v, a) in enumerate(elements):
            # 保存视频到临时文件
            video_path = os.path.join(temp_dir, f"video_{i}.mp4")
            with open(video_path, "wb") as f:
                f.write(v.video_data)
            video_files.append(video_path)
            
            # 保存音频到临时文件
            audio_path = os.path.join(temp_dir, f"audio_{i}.mp3")
            with open(audio_path, "wb") as f:
                f.write(a.audio_data)
            audio_files.append(audio_path)
        
        # 处理每个视频和音频对
        for i, (t, video_path, audio_path) in enumerate(zip(tones, video_files, audio_files)):
            start.append(clip_start_time)
            
            # 加载视频和音频
            try:
                video_clip = VideoFileClip(video_path)
                audio_clip = AudioFileClip(audio_path)
                
                if audio_clip.duration > video_clip.duration:
                    audio_clip = audio_clip.subclipped(0, video_clip.duration)
                
                video_clip = video_clip.with_audio(audio_clip)
                
                # 添加字幕
                clip_end_time = clip_start_time + video_clip.duration
                # 如果文本不能适合一行则分割字幕
                if t.line:
                    cn_subtitles.extend(
                        _split_subtitle(
                            t.line, clip_start_time, clip_end_time, _split_subtitle_cn
                        )
                    )
                if t.line_en:
                    en_subtitles.extend(
                        _split_subtitle(
                            t.line_en, clip_start_time, clip_end_time, _split_subtitle_en
                        )
                    )
                
                # 为每个片段添加淡入淡出效果
                if i != 0:
                    video_clip = CrossFadeIn(duration=_FADE_IN_DURATION_IN_SECONDS).apply(
                        video_clip
                    )
                if i != len(elements) - 1:
                    video_clip = CrossFadeOut(duration=_FADE_OUT_DURATION_IN_SECONDS).apply(
                        video_clip
                    )
                    # 为了重叠两个片段，结束时间必须减去淡出持续时间
                    clip_end_time = clip_end_time - _FADE_OUT_DURATION_IN_SECONDS
                
                video_clips.append(video_clip)
                clip_start_time = clip_end_time
                
            except Exception as e:
                ERROR(f"Error processing video {i}: {e}")
                # 如果处理单个视频失败，继续处理其他视频
                continue

        # 拼接所有片段
        if not video_clips:
            ERROR("No valid video clips to process")
            raise InternalServiceError("failed to generate film: no valid video clips")
            
        clips = []
        for index, (video_clip, start_time) in enumerate(zip(video_clips, start)):
            video_clip = video_clip.with_start(start_time).with_position("center")
            clips.append(video_clip)

        # 生成中文字幕
        cn_generator = lambda text: TextClip(
            font=_font,
            text=text,
            font_size=24,
            color="white",
            stroke_color="#021526",
            horizontal_align="center",
            vertical_align="bottom",
            size=clips[0].size,
            margin=(None, -60, None, None),
        )
        cn_subtitle_clip = SubtitlesClip(cn_subtitles, make_textclip=cn_generator)

        # 生成英文字幕
        en_generator = lambda text: TextClip(
            font=_font,
            text=text,
            font_size=24,
            color="white",
            stroke_color="#021526",
            horizontal_align="center",
            vertical_align="bottom",
            size=clips[0].size,
            margin=(None, -30, None, None),
        )
        en_subtitle_clip = SubtitlesClip(en_subtitles, make_textclip=en_generator)
        
        # 创建最终视频
        final_video = CompositeVideoClip(clips + [cn_subtitle_clip, en_subtitle_clip])

        # 上传到TOS
        tos_client = TOSClient()
        try:
            tmp_film_file_path = os.path.join(temp_dir, f"{req_id}.mp4")
            
            # 写入最终视频文件
            final_video.write_videofile(
                tmp_film_file_path,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile_path=temp_dir,
                logger=None,    # 禁用默认日志
            )
            INFO("generated final video")

            # 上传到TOS
            tos_bucket_name = ARTIFACT_TOS_BUCKET
            tos_object_key = f"{req_id}/{Phase.FILM.value}.mp4"
            tos_client.put_object_from_file(
                tos_bucket_name, tos_object_key, tmp_film_file_path
            )
            INFO("put final video to TOS")
            
            # 获取签名URL
            output = tos_client.pre_signed_url(tos_bucket_name, tos_object_key)
            film_pre_signed_url = output.signed_url
            
            # 关闭所有视频和音频剪辑以释放资源
            for clip in video_clips:
                clip.close()
            
            # 关闭最终视频
            final_video.close()
            
            return film_pre_signed_url

        except Exception as e:
            # 关闭所有视频和音频剪辑以释放资源
            for clip in video_clips:
                try:
                    clip.close()
                except:
                    pass
                    
            # 尝试关闭最终视频
            try:
                final_video.close()
            except:
                pass
                
            ERROR(f"failed to generate film, error: {e}")
            raise InternalServiceError(f"failed to generate film: {str(e)}")


class FilmGenerator(Generator):
    """Edits the video and audio files together for the complete cartoon film with subtitles."""

    output_parser: OutputParser
    request: ArkChatRequest
    ark_runtime_client: Ark
    downloader_client: DownloaderClient
    mode: Mode

    def __init__(self, request: ArkChatRequest, mode: Mode = Mode.CONFIRMATION):
        super().__init__(request, mode)
        self.ark_runtime_client = Ark()
        self.downloader_client = DownloaderClient()
        self.output_parser = OutputParser(request)
        self.request = request
        self.mode = mode

    async def generate(self) -> AsyncIterable[ArkChatResponse]:
        tones = self.output_parser.get_tones()
        videos = self.output_parser.get_videos()
        audios = self.output_parser.get_audios()

        if not tones:
            ERROR("tones not found")
            raise InvalidParameter("messages", "tones not found")

        if not videos:
            ERROR("videos not found")
            raise InvalidParameter("messages", "videos not found")

        if not audios:
            ERROR("audios not found")
            raise InvalidParameter("messages", "audios not found")

        if len(tones) != len(videos) or len(tones) != len(audios):
            ERROR("number of tones videos and audios do not match")
            raise InvalidParameter(
                "messages", "number of tones videos and audios do not match"
            )

        if len(tones) > MAX_STORY_BOARD_NUMBER:
            ERROR("tones count exceed limit")
            raise InvalidParameter("messages", "tones count exceed limit")

        INFO(
            f"len(tones) = {len(tones)}, len(videos) = {len(videos)}, len(audios) = {len(audios)}"
        )

        # 预检查视频生成状态
        await self._pre_check_videos(videos)

        # 发送第一帧
        yield ArkChatCompletionChunk(
            id=get_reqid(),
            choices=[
                Choice(
                    index=0,
                    delta=ChoiceDelta(
                        content=f"phase={Phase.FILM.value}\n\n",
                    ),
                ),
            ],
            created=int(time.time()),
            model=get_resource_id(),
            object="chat.completion.chunk",
        )

        video_download_tasks = [
            asyncio.create_task(self._download_video(v)) for v in videos
        ]
        audio_download_tasks = [
            asyncio.create_task(self._download_audio(a)) for a in audios
        ]
        tasks = video_download_tasks + audio_download_tasks
        await asyncio.gather(*tasks)

        # generates film using moviepy. since moviepy has potential memory leak problem, a new process is created to run
        # so that memory is automatically released after the process is completed and terminated
        loop = asyncio.get_event_loop()
        film_pre_signed_url = await loop.run_in_executor(
            ProcessPoolExecutor(), _generate_film, get_reqid(), tones, videos, audios
        )

        content = {"film": Film(url=film_pre_signed_url).model_dump()}
        yield ArkChatCompletionChunk(
            id=get_reqid(),
            choices=[
                Choice(
                    index=0,
                    delta=ChoiceDelta(
                        role="tool",
                        content=f"{json.dumps(content)}\n\n",
                    ),
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
                    index=1,
                    finish_reason="stop",
                    delta=ChoiceDelta(
                        role="tool",
                        content="",
                    ),
                )
            ],
            created=int(time.time()),
            model=get_resource_id(),
            object="chat.completion.chunk",
        )

    async def _pre_check_videos(self, videos: List[Video]):
        """预检查所有视频生成任务的状态"""
        INFO("开始预检查视频状态...")
        max_wait_time = 15  # 最大等待时间（秒）
        poll_interval = 3   # 轮询间隔（秒）
        start_time = time.time()
        pending_videos = []
        
        # 第一次检查所有视频的状态
        for v in videos:
            try:
                task = self.ark_runtime_client.content_generation.tasks.get(
                    task_id=v.content_generation_task_id
                )
                if task.status != "succeeded":
                    pending_videos.append(v)
                    INFO(f"视频 {v.index} 状态: {task.status}，加入等待队列")
                else:
                    INFO(f"视频 {v.index} 已准备就绪")
            except Exception as e:
                ERROR(f"检查视频 {v.index} 状态时出错: {e}，加入等待队列")
                pending_videos.append(v)
        
        # 如果所有视频都已准备好，直接返回
        if not pending_videos:
            INFO("所有视频都已准备就绪")
            return
            
        # 等待未就绪的视频
        INFO(f"等待 {len(pending_videos)} 个视频准备就绪...")
        
        while time.time() - start_time < max_wait_time and pending_videos:
            await asyncio.sleep(poll_interval)
            
            # 更新待处理视频列表
            still_pending = []
            for v in pending_videos:
                try:
                    task = self.ark_runtime_client.content_generation.tasks.get(
                        task_id=v.content_generation_task_id
                    )
                    if task.status != "succeeded":
                        still_pending.append(v)
                        INFO(f"视频 {v.index} 状态: {task.status}，继续等待")
                    else:
                        INFO(f"视频 {v.index} 已准备就绪")
                except Exception as e:
                    ERROR(f"检查视频 {v.index} 状态时出错: {e}，继续等待")
                    still_pending.append(v)
            
            # 更新待处理列表
            pending_videos = still_pending
            
            # 如果所有视频都已准备好，退出循环
            if not pending_videos:
                INFO("所有视频都已准备就绪")
                return
        
        # 如果已达到最大等待时间但仍有未准备好的视频，记录日志但不抛出异常
        # 后续的 _download_video 方法中会再次尝试
        if pending_videos:
            INFO(f"预检查结束，还有 {len(pending_videos)} 个视频未准备就绪，将在下载阶段重试")

    async def _download_video(self, v: Video):
        max_retries = 3
        retry_count = 0
        retry_interval = 3  # 初始重试间隔（秒）
        
        while retry_count < max_retries:
            try:
                content_generation_task = self.ark_runtime_client.content_generation.tasks.get(
                    task_id=v.content_generation_task_id
                )
                
                if content_generation_task.status == "succeeded":
                    # 下载视频
                    image_binary, _ = self.downloader_client.download_to_memory(
                        content_generation_task.content.video_url
                    )
                    v.video_data = image_binary.read()
                    INFO(f"downloaded video, index: {v.index}")
                    return
                elif content_generation_task.status == "failed":
                    ERROR(f"video generation failed, index: {v.index}, task: {v.content_generation_task_id}")
                    break
                else:
                    # 任务仍在进行中，等待后重试
                    INFO(f"video not ready yet, status: {content_generation_task.status}, index: {v.index}, retrying after {retry_interval}s...")
                    await asyncio.sleep(retry_interval)
                    retry_count += 1
                    retry_interval *= 2  # 指数退避策略
                    continue
            except Exception as e:
                ERROR(f"Error while checking video status: {e}, index: {v.index}, retrying...")
                await asyncio.sleep(retry_interval)
                retry_count += 1
                retry_interval *= 2  # 指数退避策略
                continue
        
        # 如果所有重试都失败了
        ERROR(f"video is not ready after {max_retries} retries, index: {v.index}")
        raise InvalidParameter("messages", f"video is not ready after {max_retries} retries, index: {v.index}")

    async def _download_audio(self, a: Audio):
        max_retries = 3
        retry_count = 0
        retry_interval = 2  # 初始重试间隔（秒）
        
        while retry_count < max_retries:
            try:
                if not a.url.startswith("http"):
                    raise InvalidParameter("message", "invalid audio url")
                    
                audio_data, _ = self.downloader_client.download_to_memory(a.url)
                a.audio_data = audio_data.read()
                INFO(f"downloaded audio, index: {a.index}")
                return
            except Exception as e:
                ERROR(f"Error downloading audio: {e}, index: {a.index}, retrying...")
                await asyncio.sleep(retry_interval)
                retry_count += 1
                retry_interval *= 2  # 指数退避策略
                continue
        
        # 如果所有重试都失败了
        ERROR(f"failed to download audio after {max_retries} retries, index: {a.index}")
        raise InvalidParameter("message", f"failed to download audio after {max_retries} retries, index: {a.index}")
