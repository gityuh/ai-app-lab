#!/bin/bash
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


set -euo pipefail

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "> Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo "✓ uv installation completed"
    # Add uv to PATH
    export PATH="$HOME/.local/bin:$PATH"
fi

# Install Python
uv python install 3.11
uv python pin 3.11

# Initialize virtual environment
echo "> Creating virtual environment..."
uv venv --prompt game_demo || {
    echo "✗ Failed to create virtual environment"
    exit 1
}

# Activate environment
source .venv/bin/activate

# Update project environment，会根据uv.lock去查找依赖
# 可以替换成其他源，清华源：https://pypi.tuna.tsinghua.edu.cn/simple
uv sync --index-url https://bytedpypi.byted.org/simple/

echo "✓ Environment setup completed"
echo "Run 'source .venv/bin/activate' to activate the environment"