import re
import sys
import os

DEFAULT_FILE = "pyproject.toml"  # 自定义默认文件路径

def update_version(file_path, new_version):
    try:
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"file not exist: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 匹配 version="xxx" 格式（支持单双引号）
        pattern = re.compile(r'(version\s*=\s*["\'])[^"\']+(["\'])')
        
        # 查找是否存在匹配项
        match = pattern.search(content)
        if not match:
            raise ValueError(f"cannot find version: {file_path}")

        # 替换第一个匹配项
        new_content, count = pattern.subn(
            repl=fr'\g<1>{new_version}\g<2>', 
            string=content, 
            count=1
        )
        
        if count == 0:
            raise ValueError("replace failed, cannot find match line")

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print(f"replace {os.path.basename(file_path)} version: {new_version} success")

    except Exception as e:
        print(f"error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # 参数处理逻辑
    if len(sys.argv) not in (2, 3):
        print("Usage:")
        print(f"  select file: python {sys.argv[0]} <path> <version>")
        print(f"  default file: python {sys.argv[0]} <version> (default file: {DEFAULT_FILE})")
        sys.exit(1)

    # 根据参数数量分配文件路径和版本号
    if len(sys.argv) == 2:
        file_path = DEFAULT_FILE
        new_version = sys.argv[1]
    else:
        file_path = sys.argv[1]
        new_version = sys.argv[2]
    
    if new_version.startswith(('v', 'V')):
        new_version = new_version[1:]

    update_version(file_path, new_version)