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

from typing import Any, Dict, Optional

from data import orders

from arkitect.core.component.tool import (
    ArkToolResponse,
    ParameterTypeEnum,
    ToolManifest,
    ToolParameter,
)
from arkitect.telemetry.trace import task


class OrderCheck(ToolManifest):
    account_id: str

    def __init__(
        self,
        account_id: str,
    ) -> None:
        super().__init__(
            action_name="",
            tool_name="order_check",
            description="需要查询订单的时候使用本函数，返回订单的详细信息，如果订单号和商品名称都为空，返回所有订单信息",
            parameters=[
                ToolParameter(
                    name="order_id",
                    description="订单编号",
                    param_type=ParameterTypeEnum.STRING,
                    required=False,
                ),
                ToolParameter(
                    name="product",
                    description="商品名称",
                    param_type=ParameterTypeEnum.STRING,
                    required=False,
                ),
            ],
            account_id=account_id,
        )
        self.account_id = account_id

    @task()
    async def executor(
        self, parameters: Optional[Dict[str, Any]] = None, **kwargs: Any
    ) -> ArkToolResponse:
        order_id = parameters.get("order_id", "")
        product = parameters.get("product", "")

        if product:
            result = await orders.get_orders_by_product(self.account_id, product)
            return ArkToolResponse(data=result)

        if order_id:
            result = await orders.get_order(self.account_id, order_id)
            return ArkToolResponse(data=result or {})

        result = await orders.get_all_orders(self.account_id)
        return ArkToolResponse(data=result)
