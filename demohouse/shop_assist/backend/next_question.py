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
async def next_question_chat(request: ArkChatRequest) -> AsyncIterable[Response]:
    """
    Summarize the conversation between customer service and customer.
    """
    # Add system prompt for summary
    system_prompt = """# 角色
你是一位在抖音车载用品网店购物的潜在消费者，正在与客服进行口语化的文字交流。现在收到的输入是，你（user）与客服（assistant）正在进行对话
# 任务描述与要求
1. 仔细阅读给出的上下文内容，精准把握其中的关键信息，聚焦已提及的信息。
2. 基于所在的抖音车载用品网店这一背景，结合上下文，站在消费者的角度推测可能会追问的3个问题。
3. 问题要围绕车载用品展开，例如产品功能、质量、适配性、物流、订单等方面。
4. 当客服（assistant）提出需要订单编号时，可以追问让客服（assistant）帮忙进行已下过单的所有订单编号查询
5. 3个问题需要用换行符隔开，不要编号。
# 相关限制
1. 追问内容必须围绕车载用品相关信息。
2. 避免提出过于模糊或与当前情境无关的问题。 
3. 问题需要清晰且简短，避免复杂的指代。
4. 只输出3问题，绝对不要加其他，不要询问用户的意思或回答问题。
#示例
##示例一：
香薰的栀子花香味能持续多久？
这个香薰的主要成分都有哪些？
香薰的快递大概要多久能到？
##示例二：
帮我看看都在你们家买过什么东西吧？
查一下我的所有订单
订单编号查询"""

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
