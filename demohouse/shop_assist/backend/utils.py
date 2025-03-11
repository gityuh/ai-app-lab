import inspect
from typing import AsyncIterable, Callable, List

from config import use_server_auth
from fastapi import HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from volcenginesdkarkruntime._exceptions import ArkAPIError

from arkitect.core.client.http import load_request
from arkitect.core.component.llm.model import ArkMessage
from arkitect.core.errors import APIException, ArkError, InternalServiceError
from arkitect.core.runtime import RequestType, ResponseType
from arkitect.launcher.runner import get_request_cls, get_runner
from arkitect.utils.context import get_headers


def get_auth_header() -> dict:
    headers = get_headers()
    if use_server_auth:
        return {}
    return {"Authorization": headers.get("Authorization", "-")}


def get_handler(
    runnable_func: Callable[[RequestType], AsyncIterable[ResponseType]],
):
    async def handler(
        http_request: Request,
    ) -> Response:
        try:
            request: RequestType = await load_request(
                http_request=http_request,
                req_cls=get_request_cls(inspect.signature(runnable_func)),
            )
            runner = get_runner(runnable_func)
            if request.stream:
                generator = runner.astream(request)
                return StreamingResponse(generator, media_type="text/event-stream")
            else:
                return await runner.arun(request)

        except APIException as e:
            raise HTTPException(
                status_code=e.http_code,
                detail=e.to_error().model_dump(exclude_unset=True, exclude_none=True),
            )
        except ArkAPIError as e:
            raise HTTPException(
                status_code=e.status_code if hasattr(e, "status_code") else 500,
                detail=ArkError(
                    code=str(e.code), message=e.message, param=e.param, type=e.type
                ).model_dump(exclude_unset=True, exclude_none=True),
            )
        except Exception as e:
            err = InternalServiceError(str(e))
            raise HTTPException(
                status_code=err.http_code,
                detail=err.to_error().model_dump(exclude_none=True, exclude_unset=True),
            )

    return handler


def merge_msgs(msgs: List[ArkMessage]) -> ArkMessage:
    res_msg = ArkMessage(
        role="user",
        content="",
    )
    for msg in msgs:
        res_msg.content += f"{msg.role}： {msg.content}\n"
    return res_msg
