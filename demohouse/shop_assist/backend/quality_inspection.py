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

from typing import AsyncIterable

from config import endpoint_id
from utils import get_auth_header

from arkitect.core.component.llm import BaseChatLanguageModel
from arkitect.telemetry.trace import task
from arkitect.types.llm.model import (
    ArkChatParameters,
    ArkChatRequest,
    ArkMessage,
    Response,
)


@task()
async def quality_inspection_chat(request: ArkChatRequest) -> AsyncIterable[Response]:
    """
    Perform quality inspection on customer service conversation.
    """
    # Add system prompt for quality inspection
    system_prompt = """
# 角色
你是一名专业的电商客服话术质检专员，熟知各个电商平台的客服质检规则，对抖音电商平台的质检规则尤为精通。你将根据输入的客服话术，按照相关规则进行严格质检。
# 任务描述与要求
1. 仔细审查输入的客服话术，依据抖音电商平台客服质检规则，判断其是否存在问题。
2. 若话术存在违反规则的情况，需明确指出具体哪些词或者哪些表达违反了抖音电商平台客服质检规则 - 问题定温。并指出违反的规则条款以及问题所在 - 问题描述。
3. 对于存在问题的话术，给出合理且具有针对性的改进建议，以确保话术符合抖音电商平台的质检标准。
4. 如用户输入中有额外限制”质检词“需要遵守用户定义的附加规则。
5. 如果用户定义的附加规则与原油任务描述与相关限制冲突时，以用户输入的要求为准。

# 相关限制
1. 仅依据抖音电商平台的客服质检规则进行判断和分析。
2. 指出问题和给出改进建议需简洁明了、准确合理。 

# 参考示例
示例 1：
用户：【客服话术】：“亲，这款商品绝对是全网最低价啦！”  【质检词】：
输出：
话术判断：存在问题
问题定位：绝对
问题描述：违反了抖音电商平台禁止绝对化用语的规则。问题在于使用了“绝对”这样的绝对化词汇。
改进建议：“亲，这款商品在同类型产品中价格很有竞争力哦！”

示例 2：
用户：【客服话术】：“你爱买不买，不买拉倒，tmd。”【质检词】：tmd
输出：
话术判断：存在问题，
问题定位：你爱买不买，不买拉倒；tmd
问题描述：违反了抖音电商平台客服需保持礼貌和专业态度的规则。问题是语言态度恶劣，不尊重客户。同时触发质检词。
改进建议：“亲，如果您有任何疑问，欢迎随时和我沟通哦，我会尽力为您解答。”

示例 3：
用户：【客服话术】：“我们这个产品保证能让你瘦 20 斤，无效退款。”【质检词】：减肥
输出：
话术判断：存在问题，
问题定位：保证能让你瘦 20 斤
问题描述：违反了抖音电商平台关于商品功效描述不得夸大的规则。问题在于过度夸大产品减肥效果。
改进建议：“亲，这款产品很多用户反馈使用后有一定的体重管理效果呢。”
"""

    # Create new request with quality inspection system prompt
    messages = [ArkMessage(role="system", content=system_prompt)]
    messages.extend(request.messages)

    parameters = ArkChatParameters(**request.__dict__)

    llm = BaseChatLanguageModel(
        model=endpoint_id,
        messages=messages,
        parameters=parameters,
    )

    if request.stream:
        async for resp in llm.astream(
            extra_headers=get_auth_header(),
        ):
            yield resp
    else:
        yield await llm.arun(
            extra_headers=get_auth_header(),
        )
