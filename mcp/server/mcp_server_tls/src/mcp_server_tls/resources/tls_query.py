import logging
from typing import Dict, List

from volcengine.tls.tls_requests import SearchLogsRequest

from mcp_server_tls.resources.tls import TlsResource

logger = logging.getLogger(__name__)


class TlsQueryResource(TlsResource):
    """
    火山引擎日志搜索类
    """

    def search_logs(
            self,
            topic_id: str,
            query: str,
            limit: int,
            start_time: int,
            end_time: int,
    ) -> List[Dict]:
        """
        创建app实例
        """
        search_logs_request = SearchLogsRequest(
            topic_id,
            query=query,
            limit=limit,
            start_time=start_time,
            end_time=end_time,
        )
        response = self.client.search_logs_v2(search_logs_request)

        return response.search_result.logs


# 实例化资源
tls_query_resource = TlsQueryResource()
