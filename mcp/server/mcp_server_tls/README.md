# TLS MCP Server

An MCP server for the Volcengine TLS search_logs API. This server allows you to search logs from a specified topic using the TLS API.

## Features

- Search logs using full text, key-value, or SQL analysis queries
- Get recent logs without a specific query
- Get information about the configured TLS topic

## Configuration

The server requires the following environment variables to be set:

- `VOLCENGINE_ENDPOINT`: Optional, The TLS service endpoint
- `VOLCENGINE_REGION`: Optional, The region for the TLS service
- `VOLC_ACCESSKEY`: Access key ID for authentication
- `VOLC_SECRETKEY`: Access key secret for authentication
- `ACCOUNT_ID`: This will be used to create tls instance
- `TLS_TOPIC_ID`: Optional, The ID of the topic to search logs from, if not provided, the server will use the topic_id in request.

You can set these environment variables in your shell or use a `.env` file.

### MCP Settings Configuration

```json
{
    "mcpServers": {
        "tls": {
            "command": "uvx",
            "args": [
            "--from",
            "git+https://github.com/volcengine/ai-app-lab#subdirectory=mcp/server/mcp_server_tls",
            "mcp-server-tls",
          ],
            "env": {
                "VOLC_ACCESSKEY": "your-access-key-id",
                "VOLC_SECRETKEY": "your-access-key-secret",
                "TLS_TOPIC_ID": "your-topic-id"
            }
        }
    }
}
```

## Usage

### Running the Server

```bash
# Run the server with stdio transport (default)
mcp-server-tls

# Run the server with SSE transport
mcp-server-tls --transport sse
```

### MCP Tools

The server provides the following MCP tools:

#### text_to_sql

Convert a text query to a SQL query.

Parameters:

- `question` (string): The natural language query to convert 
- `topic_id` (string, optional): Topic ID, if not provided, the server will use global topic ID
- `session_id` (string, optional): Session ID, if not provided, the server will generate a new session ID

Example:

```json
{
  "question": "查询延迟过高的请求",
  "topic_id": "abcd",
}
```

The response of the tool may be a clarification question. You may call this tool again with the same session ID to get the final SQL query.

#### search_logs

Search logs using the provided query.

Parameters:

- `topic_id` (string, optional): Topic ID (default: env configured topic ID)
- `query` (string): Search query (full text, key-value, or SQL analysis)
- `limit` (integer, optional): Maximum number of logs to return (default: 100)
- `start_time` (integer, optional): Start time in milliseconds since epoch (default: 15 minutes ago)
- `end_time` (integer, optional): End time in milliseconds since epoch (default: current time)

Example:

```json
{
  "query": "error",
  "limit": 10,
  "start_time": 1630454400000,
  "end_time": 1630540800000
}
```

#### get_recent_logs

Get recent logs without a specific query.

Parameters:

- `topic_id` (string, optional): Topic ID (default: env configured topic ID)
- `limit` (integer, optional): Maximum number of logs to return (default: 100)
- `time_range_minutes` (integer, optional): Time range in minutes to search back from now (default: 15)

Example:

```json
{
  "limit": 10,
  "time_range_minutes": 30
}
```

## Query Examples

### Full Text Search

```sql
error
```

### Key-Value Search

```sql
key1:error
```

### SQL Analysis

```sql
* | select key1, key2
```

## Debugging

Since MCP servers run over stdio, debugging can be challenging. For the best debugging experience, we strongly recommend using the MCP Inspector.

You can launch the MCP Inspector via npm with this command:

```shell
npx @modelcontextprotocol/inspector uv --directory {{your source code local directory}}/mcp-server-tls run mcp-server-tls
```

Upon launching, the Inspector will display a URL that you can access in your browser to begin debugging.

## License

This project is licensed under the MIT License.
