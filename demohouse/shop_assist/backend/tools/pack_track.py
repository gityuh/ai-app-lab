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

from data import orders, tracking
from data.orders import OrderStatus
from pydantic import Field


def get_pack_track_fn(account_id: str) -> Callable:
    async def pack_track(
        order_id: str = Field(description="订单号, 需要用户提供", default=""),
        tracking_number: str = Field(description="物流单号, 需要用户提供", default=""),
    ):
        """
        需要查询物流快递信息的时候使用本函数，返回物流信息, 订单号和物流单号二选一
        """
        if order_id:
            order = await orders.get_order(account_id, order_id)
            if not order:
                return "未查询到订单信息"
            if order["status"] == OrderStatus.REFUNDED.value:
                return "订单已退款，无快递信息"
            if order["status"] == OrderStatus.PENDING.value:
                return "订单未发货，暂无物流信息"
            tracking_number = order.get("tracking_number")

        if not tracking_number:
            return "订单无物流单号"

        tracking_info = tracking.get_tracking_info(tracking_number)

        return tracking_info

    return pack_track
