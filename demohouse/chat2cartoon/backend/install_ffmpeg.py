"""
自动下载并配置FFMPEG
"""
import os
import sys
import shutil
import zipfile
import tempfile
from pathlib import Path
import subprocess
import urllib.request
import ctypes
from ctypes.wintypes import BOOL, HWND, LPCWSTR
import winreg

def is_admin():
    """检查当前用户是否有管理员权限"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def download_file(url, dest_path):
    """下载文件到指定路径"""
    print(f"正在从 {url} 下载 FFMPEG...")
    try:
        urllib.request.urlretrieve(url, dest_path)
        print(f"下载完成: {dest_path}")
        return True
    except Exception as e:
        print(f"下载失败: {e}")
        return False

def extract_zip(zip_path, extract_to):
    """解压ZIP文件"""
    print(f"解压 {zip_path} 到 {extract_to}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print("解压完成")
        return True
    except Exception as e:
        print(f"解压失败: {e}")
        return False

def find_bin_directory(extract_path):
    """在解压目录中查找bin目录"""
    for root, dirs, files in os.walk(extract_path):
        if "bin" in dirs:
            bin_path = os.path.join(root, "bin")
            if os.path.exists(os.path.join(bin_path, "ffmpeg.exe")):
                return bin_path
    
    # 如果没有找到bin目录，查找ffmpeg.exe
    for root, dirs, files in os.walk(extract_path):
        if "ffmpeg.exe" in files:
            return root
    
    return None

def add_to_path(path, env_type="user"):
    """将路径添加到环境变量PATH中"""
    key_path = r'Environment' if env_type == "user" else r'SYSTEM\CurrentControlSet\Control\Session Manager\Environment'
    reg_key = winreg.HKEY_CURRENT_USER if env_type == "user" else winreg.HKEY_LOCAL_MACHINE
    
    try:
        with winreg.OpenKey(reg_key, key_path, 0, winreg.KEY_READ | winreg.KEY_WRITE) as key:
            current_path, _ = winreg.QueryValueEx(key, "PATH")
            paths = current_path.split(';')
            
            if path not in paths:
                new_path = current_path + ";" + path
                winreg.SetValueEx(key, "PATH", 0, winreg.REG_EXPAND_SZ, new_path)
                print(f"FFMPEG 已添加到 {env_type} 环境变量 PATH")
                return True
            else:
                print(f"FFMPEG 已存在于 {env_type} 环境变量 PATH 中")
                return True
    except Exception as e:
        print(f"添加到环境变量失败: {e}")
        return False

def set_pythonpath_for_moviepy():
    """设置PYTHONPATH环境变量，以便MoviePy找到FFMPEG"""
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        os.environ["PYTHONPATH"] = os.path.dirname(os.path.dirname(ffmpeg_path))
        print(f"已设置 PYTHONPATH 为 {os.environ['PYTHONPATH']}")
        return True
    return False

def main():
    """主函数"""
    # FFMPEG下载链接
    ffmpeg_url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    
    # 创建临时目录
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, "ffmpeg.zip")
    extract_path = os.path.join(temp_dir, "ffmpeg")
    
    try:
        # 下载FFMPEG
        if not download_file(ffmpeg_url, zip_path):
            return False
        
        # 解压缩
        if not extract_zip(zip_path, extract_path):
            return False
        
        # 查找bin目录
        bin_path = find_bin_directory(extract_path)
        if not bin_path:
            print("无法找到FFMPEG可执行文件")
            return False
        
        # 创建安装目录
        install_dir = os.path.join(os.environ['LOCALAPPDATA'], 'ffmpeg')
        if not os.path.exists(install_dir):
            os.makedirs(install_dir)
        
        # 复制文件
        for file in os.listdir(bin_path):
            shutil.copy2(os.path.join(bin_path, file), os.path.join(install_dir, file))
        
        print(f"FFMPEG 已安装到 {install_dir}")
        
        # 添加到PATH
        if is_admin():
            add_to_path(install_dir, "system")
        else:
            add_to_path(install_dir, "user")
        
        # 设置当前进程的环境变量
        os.environ["PATH"] = os.environ["PATH"] + ";" + install_dir
        
        # 检查安装是否成功
        try:
            result = subprocess.run([os.path.join(install_dir, "ffmpeg"), "-version"], 
                                   capture_output=True, text=True)
            print("FFMPEG安装成功:")
            print(result.stdout.split('\n')[0])
            return True
        except Exception as e:
            print(f"FFMPEG安装后检查失败: {e}")
            return False
            
    finally:
        # 清理临时文件
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

if __name__ == "__main__":
    result = main()
    print("\n" + "="*50)
    if result:
        print("FFMPEG安装成功！请重启应用程序。")
    else:
        print("FFMPEG安装失败。请手动安装：")
        print("1. 访问 https://ffmpeg.org/download.html 下载FFMPEG")
        print("2. 解压并添加bin目录到系统PATH环境变量")
        print("3. 重启命令提示符和应用程序")
    input("按回车键继续...")
    sys.exit(0 if result else 1) 