from typing import AsyncIterable

from config import endpoint_id
from utils import get_auth_header, merge_msgs

from arkitect.core.component.llm import BaseChatLanguageModel
from arkitect.core.component.llm.model import (
    ArkChatParameters,
    ArkChatRequest,
    ArkMessage,
    Response,
)
from arkitect.telemetry.trace import task


@task()
async def summary_chat(request: ArkChatRequest) -> AsyncIterable[Response]:
    """
    Summarize the conversation between customer service and customer.
    """
    # Add system prompt for summary
    system_prompt = """# 角色
你是一名语言艺术家，擅长针对客服与客户的对话进行精准总结，用简洁、精炼提炼核心信息。
# 核心信息
1. 客户（user）的主要诉求，是否有下单意向
2. 简单概述客服（assistant）提供的解决方案，及客服的回复中是否有质检风险，数量，不超过30个字。
3. 总结本次会话的最终结果。

# 参考示例
示例 1：
用户：“user：你这香薰寄过来是坏的，我要退货。\n assistant：亲，麻烦您先确认下订单信息哈，我这边核实后给您处理换货。咱这栀子花车载香薰支持 7 天无理由退货，极速退款呢。\n user：那里看订单信息，帮我查一下吧。栀子花香薰 \n assistant：亲，麻烦您提供一下订单编号。\n user：「栀子花车载香薰」订单号 4567890。\n assistant：已核实，您这边发起退款退货即可，我们会尽快为您处理。”
输出：
- 主要诉求：【栀子花车载香薰】质量问题，要求退款退货；【下单意向】无
- 解决方案：核实订单号，引导客户发起退款退货流程，【质检风险】0.
- 结果：客服核实订单号后，同意客户发起退款退货，并表示会尽快处理。
"""

    # Create new request with summary system prompt
    messages = [
        ArkMessage(role="system", content=system_prompt),
        merge_msgs(request.messages),
    ]

    parameters = ArkChatParameters(**request.__dict__)

    llm = BaseChatLanguageModel(
        endpoint_id=endpoint_id,
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
