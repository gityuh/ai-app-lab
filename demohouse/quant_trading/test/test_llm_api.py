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
import pdb
import json
import time
import requests


ip = "192.168.35.51"
port = 8080
stream = True

url = f"http://{ip}:{port}/api/v1/bots/chat/completions"
data= {
    "model": "doubao-1-5-pro-32k-250115",
    "messages": [
        {
            "role": "user",
            "content": "介绍你自己啊"
        }
    ],
    "stream": stream
}
headers = {'Content-Type': 'application/json'}

start_time = time.time()
response = requests.post(url, headers=headers, json=data)
print('cost time: {:.2f}'.format(time.time() - start_time))
print(response.status_code)

# pdb.set_trace()
if stream:
    # print(response.text)
    buffer = ''
    for chunk in response.iter_content(chunk_size=512):
        if chunk:
            buffer += chunk.decode('utf-8')
            print(chunk)
            while '\n' in buffer:
                line, buffer = buffer.split('\n', 1)
                try:
                    json_data = json.loads(line)
                    content = json_data.get('content', '')
                    for char in content:
                        print(char, end='', flush=True)
                        time.sleep(0.1)
                except json.JSONDecodeError:
                    pass
else:
    print(response.json())

