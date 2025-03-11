from typing import Any, Dict, Optional

from data import orders, tracking
from data.orders import OrderStatus

from arkitect.core.component.tool import (
    ArkToolResponse,
    ParameterTypeEnum,
    ToolManifest,
    ToolParameter,
)
from arkitect.telemetry.trace import task


class PackTrack(ToolManifest):
    account_id: str

    def __init__(
        self,
        account_id: str,
    ) -> None:
        super().__init__(
            action_name="",
            tool_name="pack_track",
            description="需要查询物流快递信息的时候使用本函数，返回物流信息, 订单号和物流单号二选一",
            parameters=[
                ToolParameter(
                    name="order_id",
                    description="订单号, 需要用户提供",
                    param_type=ParameterTypeEnum.STRING,
                    required=False,
                ),
                ToolParameter(
                    name="tracking_number",
                    description="物流单号, 需要用户提供",
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
        tracking_number = parameters.get("tracking_number", "")

        if order_id:
            order = await orders.get_order(self.account_id, order_id)
            if not order:
                return ArkToolResponse(data="未查询到订单信息")
            if order["status"] == OrderStatus.REFUNDED.value:
                return ArkToolResponse(data="订单已退款，无快递信息")
            if order["status"] == OrderStatus.PENDING.value:
                return ArkToolResponse(data="订单未发货，暂无物流信息")
            tracking_number = order.get("tracking_number")

        if not tracking_number:
            return ArkToolResponse(data="订单无物流单号")

        tracking_info = tracking.get_tracking_info(tracking_number)

        return ArkToolResponse(data=tracking_info)
