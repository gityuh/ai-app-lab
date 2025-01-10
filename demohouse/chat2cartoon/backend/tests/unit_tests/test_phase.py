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
import os

from app.generators.phase import Phase, PhaseFinder

from arkitect.core.component.llm.model import ArkChatRequest

current_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(current_dir, "../assets/full_messages.json")) as f:
    full_messages = json.loads(f.read())

with open(os.path.join(current_dir, "../assets/half_messages.json")) as f:
    half_messages = json.loads(f.read())

with open(os.path.join(current_dir, "../assets/duplicate_messages.json")) as f:
    duplicate_messages = json.loads(f.read())


def test_get_next_phase_with_full_messages():
    req = ArkChatRequest(
        model="fake-model",
        messages=full_messages,
    )
    pf = PhaseFinder(req)

    next_phase = pf.get_next_phase()
    assert next_phase is Phase.FILM_INTERACTION


def test_get_next_phase_with_half_messages():
    req = ArkChatRequest(
        model="fake-model",
        messages=half_messages,
    )
    pf = PhaseFinder(req)

    next_phase = pf.get_next_phase()
    assert next_phase == Phase.FIRST_FRAME_DESCRIPTION


def test_get_next_phase_with_initial_message():
    req = ArkChatRequest(
        model="fake-model",
        messages=[],
    )
    pf = PhaseFinder(req)

    next_phase = pf.get_next_phase()
    assert next_phase == Phase.SCRIPT
