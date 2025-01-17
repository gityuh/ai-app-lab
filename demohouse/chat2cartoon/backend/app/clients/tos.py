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

from typing import Any

import tos
from tos import TosClientV2
from tos.models2 import GetObjectOutput, PreSignedURLOutput, PutObjectOutput

from app.constants import ARK_ACCESS_KEY, ARK_SECRET_KEY, ONE_DAY_IN_SECONDS, REGION


class TOSClient:
    """
    TosClient that implements API functions required for the chat2cartoon demo.
    chat2cartoon uploads media files (audio) to TOS to prevent occupying too much memory.
    Some AI model APIs (Text-to-Image & Content Generation Tasks) also uploads media files directly to TOS.
    """

    _client: TosClientV2

    def __init__(self):
        region = REGION
        access_key = ARK_ACCESS_KEY
        secret_key = ARK_SECRET_KEY
        endpoint = f"tos-{region}.volces.com"
        self._client = TosClientV2(access_key, secret_key, endpoint, region)

    def put_object(self, bucket: str, object_key: str, content: Any) -> PutObjectOutput:
        """Upload an object to the specified bucket in TOS."""
        return self._client.put_object(bucket=bucket, key=object_key, content=content)

    def put_object_from_file(
        self, bucket: str, object_key: str, file_path: str
    ) -> PutObjectOutput:
        """Upload an object to the specified bucket in TOS using a local file."""
        return self._client.put_object_from_file(
            bucket=bucket, key=object_key, file_path=file_path
        )

    def get_object(self, bucket: str, object_key: str) -> GetObjectOutput:
        """Retrieve an object from the specified bucket in TOS."""
        return self._client.get_object(bucket=bucket, key=object_key)

    def pre_signed_url(self, bucket: str, object_key: str) -> PreSignedURLOutput:
        """Generate a pre-signed URL for accessing an object in TOS."""
        return self._client.pre_signed_url(
            tos.HttpMethodType.Http_Method_Get,
            bucket=bucket,
            key=object_key,
            expires=ONE_DAY_IN_SECONDS,
        )
