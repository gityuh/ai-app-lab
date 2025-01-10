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

from dotenv import load_dotenv
from volcenginesdkarkruntime import Ark

load_dotenv()

DEFAULT_AK = os.getenv("VOLC_ACCESS_KEY")
DEFAULT_SK = os.getenv("VOLC_SECRET_KEY")
TEST_BOT_ID = "bot-xxxxxxxxxxx-xxxxx"

DEFAULT_BASE_URL = "http://0.0.0.0:8888/api/v3"

client = Ark(ak=DEFAULT_AK, sk=DEFAULT_SK, base_url=DEFAULT_BASE_URL)


def bot_chat_completion(messages):
    completion = client.bot_chat.completions.create(
        model=TEST_BOT_ID,
        messages=messages,
        stream=True,
    )
    return completion
