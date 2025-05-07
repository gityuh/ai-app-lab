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

from typing import Callable

from data import orders
from pydantic import Field


def get_order_check_fn(account_id: str) -> Callable:
    async def order_check(
        order_id: str = Field(description="订单编号", default=""),
        product: str = Field(description="商品名称", default=""),
    ):
        """
        需要查询订单的时候使用本函数，返回订单的详细信息，如果订单号和商品名称都为空，返回所有订单信息
        """
        if product:
            result = await orders.get_orders_by_product(account_id, product)

        if order_id:
            result = await orders.get_order(account_id, order_id)
        result = await orders.get_all_orders(account_id)
        return result

    return order_check
