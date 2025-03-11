from typing import Any, Dict, Optional

from data import orders
from data.orders import OrderStatus

from arkitect.core.component.tool import (
    ArkToolResponse,
    ParameterTypeEnum,
    ToolManifest,
    ToolParameter,
)
from arkitect.telemetry.trace import task


class OrderRefund(ToolManifest):
    account_id: str

    def __init__(
        self,
        account_id: str,
    ) -> None:
        super().__init__(
            action_name="",
            tool_name="order_refund",
            description="需要退款的时候使用本函数，需要用户提供订单号",
            parameters=[
                ToolParameter(
                    name="order_id",
                    description="订单号，需要用户提供",
                    param_type=ParameterTypeEnum.STRING,
                    required=True,
                ),
                ToolParameter(
                    name="reason",
                    description="退款原因，由上下文总结",
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
        reason = parameters.get("reason", "")

        order = await orders.get_order(self.account_id, order_id)
        if not order:
            return ArkToolResponse(data="订单不存在")

        if order["status"] == OrderStatus.REFUNDED.value:
            return ArkToolResponse(data="订单已退款，不可重复退款")

        success = await orders.update_order_status(
            self.account_id, order_id, OrderStatus.REFUNDED, reason
        )
        if not success:
            return ArkToolResponse(data="退款失败")
        return ArkToolResponse(data="退款成功")
