#!/usr/bin/env python
"""
一键修复和启动应用
"""
import os
import sys
import subprocess
import time

def run_script(script_name):
    """运行脚本并等待完成"""
    print(f"\n运行 {script_name}...")
    try:
        result = subprocess.run([sys.executable, script_name], check=True)
        return result.returncode == 0
    except:
        return False

def main():
    """主函数"""
    print("=" * 60)
    print(" chat2cartoon 一键修复和启动 ".center(60, "="))
    print("=" * 60)
    
    scripts = [
        ("install_ffmpeg.py", "安装FFMPEG"),
        ("patch_moviepy.py", "修补MoviePy")
    ]
    
    # 检查脚本是否存在
    for script, _ in scripts:
        if not os.path.exists(script):
            print(f"错误：找不到文件 {script}")
            print("请确保你在正确的目录中运行此脚本")
            return False
    
    # 运行每个修复脚本
    for script, description in scripts:
        print(f"\n正在{description}...")
        if not run_script(script):
            print(f"{description}失败！")
            print("修复过程中断，但仍尝试启动应用")
    
    print("\n所有修复脚本已执行完毕，正在启动应用...")
    
    # 启动应用
    try:
        import start
        return True
    except Exception as e:
        print(f"启动应用时出错: {e}")
        print("\n尝试直接启动...")
        try:
            import index
            return True
        except Exception as e2:
            print(f"直接启动也失败: {e2}")
            return False

if __name__ == "__main__":
    if main():
        print("\n应用已启动！")
    else:
        print("\n启动失败，请查看上面的错误信息。") 