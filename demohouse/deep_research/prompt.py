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

from jinja2 import Template

DEFAULT_SUMMARY_PROMPT = Template(
    """# 历史对话
{{chat_history}}

# 联网参考资料
{{reference}}

# 当前环境信息
{{meta_info}}

# 任务
- 优先参考「联网参考资料」中的信息进行回复。
- 回复请使用清晰、结构化（序号/分段等）的语言，确保用户轻松理解和使用。
- 回复时，严格避免提及信息来源或参考资料。

# 任务执行
遵循任务要求来回答「用户问题」，给出有帮助的回答。

用户问题：
{{question}}

# 你的回答：
"""
)

DEFAULT_PLANNING_PROMPT = Template(
    """
你是一个联网信息搜索专家，你需要根据用户的问题，通过联网搜索来搜集相关信息，然后根据这些信息来回答用户的问题。

# 用户问题：
{{question}}    
    
# 当前已知资料

{{reference}}

# 当前环境信息

{{meta_info}}

# 任务
- 判断「当前已知资料」是否已经足够回答用户的问题
- 如果「当前已知资料」已经足够回答用户的问题，返回“无需检索”，不要输出任何其他多余的内容
- 如果判断「当前已知资料」还不足以回答用户的问题，思考还需要搜索什么信息，输出对应的关键词，每个关键词都要具体到能被独立检索
- 一次最多输出三个关键词，关键词之间用空格分割，不要输出其他任何多余的内容

# 你的回答：
"""
)

INTENTION_PROMPT = Template(
    """
你是一个联网信息搜索专家，你需要根据用户的问题，通过联网搜索来搜集相关信息，然后根据这些信息来回答用户的问题。
# 用户问题：
{{question}}    

# 当前已知资料
{{reference}}
# 当前环境信息
{{meta_info}}
# 任务
- 你需要判断用户的问题基于上面一直信息是否可以回答，你只需要给出一个是或否的回答
- 在【已搜索到的信息】不足以回答时，请返回“是”
- 当根据【已搜索到的信息】足够正确回答用户问题时，直接 “否”
- 对于复杂问题，你可以拆解思路，多次使用联网搜索， 尽可能多的使用联网搜索，以补充尽量全面的各方面信息， 逐步获取信息。
# 任务执行
- 如果需要联网搜索，请输出：“是“
- 如果根据已有信息足够回答用户问题，则无需再联网搜索，直接回答”否“
- 请不要给出更多回答
# 你的回答：
"""
)

INTENTION_QUERY_PROMPT = Template(
    """
你是一个联网信息搜索专家，你需要根据用户的问题，决定如何使用联网搜索来搜集相关信息。
# 用户问题：
{{question}}    

# 当前已知资料
{{reference}}
# 当前环境信息
{{meta_info}}
# 任务
- 当前已知的搜索到的信息不足以回答用户的问题，你应该分析目前已有信息与回答问题所缺失的问题之间缺少什么
- 根据分析的结论，输出当前下一步搜索的关键词
# 任务执行
- 输出“我需要搜索{关键词}”，不要输出任何其他多余的内容，一次最多输出一个关键词
# 你的回答：
"""
)