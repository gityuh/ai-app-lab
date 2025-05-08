#!/usr/bin/env python
"""
设置环境变量并启动应用程序
"""
import os
import sys
import shutil
import subprocess

def set_ffmpeg_env():
    """设置FFMPEG相关环境变量"""
    # 检查FFMPEG是否已在PATH中
    ffmpeg_path = shutil.which("ffmpeg")
    
    if not ffmpeg_path:
        # 尝试在常见安装位置查找
        potential_paths = [
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ffmpeg', 'ffmpeg.exe'),
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe"
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                ffmpeg_path = path
                ffmpeg_dir = os.path.dirname(path)
                # 添加到当前进程的PATH
                os.environ["PATH"] = os.environ["PATH"] + ";" + ffmpeg_dir
                print(f"找到FFMPEG: {ffmpeg_path}")
                break
                
    if ffmpeg_path:
        # 设置MoviePy使用的环境变量
        os.environ["FFMPEG_BINARY"] = ffmpeg_path
        os.environ["IMAGEMAGICK_BINARY"] = shutil.which("convert") or ""
        print(f"已设置FFMPEG环境变量: {ffmpeg_path}")
        return True
    else:
        print("未找到FFMPEG。可能会导致视频处理失败。")
        print("请运行 install_ffmpeg.py 安装FFMPEG。")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print(" 启动 chat2cartoon 应用 ".center(60, "="))
    print("=" * 60)
    
    # 设置环境变量
    set_ffmpeg_env()
    
    # 禁用MoviePy的冗长输出
    os.environ["MOVIEPY_VERBOSE"] = "0"
    
    # 导入和配置日志级别
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s][%(levelname)s] %(message)s"
    )
    
    # 启动应用
    print("\n正在启动应用...")
    
    # 导入应用并运行
    import index
    
    print("应用已启动！")

if __name__ == "__main__":
    main() 