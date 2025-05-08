"""
一键修复 MoviePy 和 FFMPEG 问题
"""
import os
import sys
import subprocess
import time

def update_path_with_ffmpeg():
    """更新环境变量PATH，添加新安装的FFMPEG"""
    ffmpeg_path = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ffmpeg')
    if os.path.exists(ffmpeg_path):
        print(f"发现FFMPEG安装目录: {ffmpeg_path}")
        # 将路径添加到当前进程的PATH
        os.environ["PATH"] = os.environ["PATH"] + ";" + ffmpeg_path
        os.environ["FFMPEG_BINARY"] = os.path.join(ffmpeg_path, "ffmpeg.exe")
        print(f"已添加FFMPEG到当前进程的PATH")
        return True
    return False

def run_script(script_name):
    """运行指定的脚本"""
    print(f"\n正在运行 {script_name}...")
    try:
        result = subprocess.run([sys.executable, script_name], check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError:
        return False

def main():
    """主函数"""
    print("="*60)
    print(" 一键修复 chat2cartoon 应用 ".center(60, "="))
    print("="*60)
    
    # 步骤1: 安装FFMPEG
    if not run_script("install_ffmpeg.py"):
        print("FFMPEG安装失败，无法继续")
        return False
    
    # 更新环境变量
    update_path_with_ffmpeg()
    
    # 步骤2: 修复MoviePy
    if not run_script("fix_moviepy.py"):
        print("MoviePy修复失败，无法继续")
        return False
    
    print("\n"+"="*60)
    print(" 所有修复已完成 ".center(60, "="))
    print("="*60)
    print("\n现在可以重新启动应用程序了。")
    
    # 询问是否立即启动应用
    answer = input("\n是否立即重启应用程序? (y/n): ")
    if answer.lower() in ['y', 'yes', '是']:
        print("\n正在启动应用程序...")
        time.sleep(1)
        # 使用更新后的环境变量启动应用
        env = os.environ.copy()
        subprocess.Popen([sys.executable, "index.py"], env=env)
    
    return True

if __name__ == "__main__":
    main() 