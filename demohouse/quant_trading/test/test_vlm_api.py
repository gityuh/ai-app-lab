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
import time

import base64
import requests


ip = "192.168.35.51"
port = 8080
stream = True

with open("tgb-homepage.png", "rb") as image_file:
    image_data = image_file.read()
    base64_image = base64.b64encode(image_data).decode("utf-8")


url = f"http://{ip}:{port}/api/v1/bots/chat/completions"
data= {
    "model": "doubao-1-5-pro-32k-250115",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": '描述一下这张图片',
                },
                {
                    "type": 'image_url',
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}",
                    },
                },
            ]
        }
    ],
    "stream": stream
}
headers = {'Content-Type': 'application/json'}

start_time = time.time()
response = requests.post(url, headers=headers, json=data)
print('cost time: {:.2f}'.format(time.time() - start_time))
print(response.status_code)

if stream:
    print(response.text)
else:
    print(response.json())
