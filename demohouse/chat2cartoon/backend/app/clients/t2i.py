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

import os
import json
import requests
from typing import List, Optional

from pydantic import BaseModel
from volcenginesdkarkruntime import Ark

from app.constants import ARK_API_KEY
from arkitect.telemetry.logger import ERROR, INFO

# 新的文本生成图像模型名称
TEXT_TO_IMAGE_MODEL = "doubao-seedream-3-0-t2i-250415"
# 默认方舟服务的接入点
ARK_BASE_URL = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")

# 图片分辨率设置 - 使用更标准的16:9比例
DEFAULT_WIDTH = 1280  # 更常见的分辨率，更可能被模型支持
DEFAULT_HEIGHT = 720  # 确保16:9比例 (1024/576=1.78)

class T2IException(Exception):
    def __init__(self, code, message):
        super().__init__(message)  # Pass the message to the base class
        self.code = code  # Additional attribute for error code
        self.message = message

    def __str__(self):
        return f"{self.args[0]} (Error Code: {self.code})"


class T2IClient:
    """
    Text-To-Image client used in the RoleImage phase in the chat2cartoon demo
    使用火山引擎方舟服务的API生成图像
    """

    _ark_client = None
    _headers = None

    def __init__(self) -> None:
        if not ARK_API_KEY:
            raise ValueError("ARK_API_KEY environment variable not set.")
        
        # 初始化方舟客户端 - 注意：这里仅初始化客户端，但不直接使用其images属性
        self._ark_client = Ark(
            base_url=ARK_BASE_URL,
            api_key=ARK_API_KEY
        )
        
        # 设置请求头
        self._headers = {
            "Authorization": f"Bearer {ARK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        INFO(f"T2IClient initialized with base_url: {ARK_BASE_URL}")

    def image_generation(self, prompt: str, width: int = DEFAULT_WIDTH, height: int = DEFAULT_HEIGHT) -> List[str]:
        """
        使用方舟图像生成API生成图像
        
        Args:
            prompt (str): 图像生成提示词
            width (int, optional): 图像宽度，默认1024
            height (int, optional): 图像高度，默认576（16:9比例）
            
        Returns:
            List[str]: 生成图像的URL列表
        """
        INFO(f"image_generation prompt: {prompt}, width: {width}, height: {height}")
        
        # 确保宽高比接近16:9
        aspect_ratio = width / height
        if abs(aspect_ratio - 16/9) > 0.1:  # 如果宽高比偏离16:9超过0.1
            INFO(f"Warning: Aspect ratio {aspect_ratio:.2f} is not 16:9. Adjusting to default 16:9 resolution.")
            width = DEFAULT_WIDTH
            height = DEFAULT_HEIGHT
        
        try:
            # 构建API请求URL
            api_url = f"{ARK_BASE_URL.rstrip('/')}/images/generations"
            
            # 构建请求数据
            payload = {
                "model": TEXT_TO_IMAGE_MODEL,
                "prompt": prompt,
                "size": f"{width}x{height}",
                "watermark": False, #是否在生成的图片中添加水印
                "n": 1,  # 生成1张图片
                "quality": "hd"  # 尝试请求高质量图像
            }
            
            INFO(f"Sending request to {api_url} with dimensions {width}x{height}")
            
            # 发送HTTP请求
            response = requests.post(
                api_url,
                headers=self._headers,
                json=payload
            )
            
            # 解析响应
            if response.status_code != 200:
                error_message = f"API request failed with status code {response.status_code}"
                try:
                    error_data = response.json()
                    if "error" in error_data:
                        error_message = f"{error_message}: {error_data['error'].get('message', 'Unknown error')}"
                except:
                    pass
                raise T2IException(response.status_code, error_message)
            
            # 解析成功响应
            response_data = response.json()
            INFO(f"Response received: {json.dumps(response_data)[:200]}...")
            
            # 获取生成的图像URL
            if "data" in response_data and len(response_data["data"]) > 0:
                image_urls = [item.get("url") for item in response_data["data"] if "url" in item]
                INFO(f"Generated image urls: {image_urls}")
                return image_urls
            else:
                raise T2IException(500, "No image data returned from API")
            
        except requests.RequestException as e:
            ERROR(f"Request failed: {str(e)}")
            raise T2IException(500, f"Failed to generate image: {str(e)}")
        except Exception as e:
            ERROR(f"Failed to generate image: {str(e)}")
            if isinstance(e, T2IException):
                raise e
            else:
                raise T2IException(500, f"Failed to generate image: {str(e)}")


# 为了保持兼容性，保留原有的请求和响应类
class LogoInfo(BaseModel):
    add_logo: Optional[bool] = None
    position: Optional[int] = None
    language: Optional[int] = None
    opacity: Optional[float] = None


class T2ICreateTextToImageRequest(BaseModel):
    req_key: str
    prompt: str
    model_version: str
    seed: Optional[int] = None
    scale: Optional[float] = None
    ddim_steps: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    use_rephraser: Optional[bool] = None
    use_sr: Optional[bool] = None
    sr_seed: Optional[int] = None
    double_sr_strength: Optional[bool] = None
    double_sr_scale: Optional[float] = None
    i32_sr_steps: Optional[int] = None
    is_only_sr: Optional[bool] = None
    return_url: Optional[bool] = None
    logo_info: Optional[LogoInfo] = None


class T2ICreateTextToImageResponse(BaseModel):
    binary_data_base64: Optional[List[str]]
    image_urls: Optional[List[str]]
