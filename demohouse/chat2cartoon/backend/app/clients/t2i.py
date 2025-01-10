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
from json import JSONDecodeError
from typing import List, Optional

from pydantic import BaseModel
from volcengine.visual.VisualService import VisualService

from app.constants import ARK_ACCESS_KEY, ARK_SECRET_KEY
from arkitect.telemetry.logger import ERROR, INFO

_DEFAULT_REQ_KEY = "high_aes_general_v20_L"
_DEFAULT_MODEL_VERSION = "general_v2.0_L"

POST_IMG_RISK_NOT_PASS_ERROR_CODE = 50511
POST_IMG_RISK_NOT_PASS_MESSAGE = "Post Img Risk Not Pass"
TEXT_RISK_NOT_PASS_ERROR_CODE = 50412
TEXT_RISK_NOT_PASS_MESSAGE = "Text Risk Not Pass"


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
    API Docs: https://www.volcengine.com/docs/6791/1339374
    """

    _visual_service: VisualService

    def __init__(self) -> None:
        visual_service = VisualService()
        visual_service.set_ak(ARK_ACCESS_KEY)
        visual_service.set_sk(ARK_SECRET_KEY)
        self._visual_service = visual_service

    def image_generation(self, prompt: str) -> List[str]:
        req = T2ICreateTextToImageRequest(
            req_key=_DEFAULT_REQ_KEY,
            model_version=_DEFAULT_MODEL_VERSION,
            prompt=prompt,
            return_url=True,
        )
        INFO(f"image_generation raw_req: {req.model_dump_json()}")

        try:
            raw_resp = self._visual_service.cv_process(req.model_dump())
        except Exception as e:
            try:
                # when error occurs, the response is a text containing a json string with other strange characters
                # before and after the json text. So we need to explicitly look for curly braces
                # to correctly parse the json text.
                error_resp = str(e.args[0])
                start_index = error_resp.find("{")
                end_index = len(error_resp) - "".join(reversed(error_resp)).find("}")
                if start_index == -1 or end_index == -1:
                    raise ValueError("no json object found in the string")
                raw_resp_text = error_resp[start_index:end_index]
                raw_resp = json.loads(raw_resp_text)
            except JSONDecodeError or ValueError as e:
                ERROR(f"failed to load raw resp from exception args, e.args: {e.args}")
                raise e

        INFO(f"image_generation raw_resp: {raw_resp}")

        if raw_resp.get("code") != 10000:
            raise T2IException(raw_resp.get("code"), raw_resp.get("message"))

        resp = T2ICreateTextToImageResponse.model_validate(raw_resp.get("data"))

        return [image_url for image_url in resp.image_urls]


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
