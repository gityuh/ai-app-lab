#!/usr/bin/env python
"""
修复导入路径脚本
将所有文件中的 arkitect.core.component.llm.model 导入修改为 arkitect.types.llm.model
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """修复文件中的导入语句"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式替换导入语句
    pattern = r'from arkitect\.core\.component\.llm\.model import'
    replacement = 'from arkitect.types.llm.model import'
    
    new_content = re.sub(pattern, replacement, content)
    
    # 如果有修改，则写回文件
    if new_content != content:
        print(f"修复文件: {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def find_and_fix_python_files(root_dir):
    """查找并修复所有 Python 文件"""
    fixed_count = 0
    
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                if fix_imports_in_file(file_path):
                    fixed_count += 1
    
    return fixed_count

if __name__ == "__main__":
    # 修复当前目录及其子目录中的所有 Python 文件
    root_dir = Path(".")
    fixed_count = find_and_fix_python_files(root_dir)
    print(f"总共修复了 {fixed_count} 个文件") 