"""
修复MoviePy临时文件问题
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path
import importlib.util
import tempfile

def find_moviepy_installation():
    """查找MoviePy安装路径"""
    try:
        spec = importlib.util.find_spec('moviepy')
        if spec is None:
            return None
        
        # MoviePy安装目录
        moviepy_dir = os.path.dirname(spec.origin)
        print(f"找到MoviePy安装目录: {moviepy_dir}")
        return moviepy_dir
    except Exception as e:
        print(f"查找MoviePy安装路径失败: {e}")
        return None

def patch_ffmpeg_reader(moviepy_dir):
    """修补ffmpeg_reader.py文件以解决临时文件问题"""
    try:
        # 定位ffmpeg_reader.py文件
        ffmpeg_reader_path = os.path.join(moviepy_dir, 'video', 'io', 'ffmpeg_reader.py')
        if not os.path.exists(ffmpeg_reader_path):
            print(f"无法找到文件: {ffmpeg_reader_path}")
            return False
        
        # 备份原文件
        backup_path = ffmpeg_reader_path + '.bak'
        shutil.copy2(ffmpeg_reader_path, backup_path)
        print(f"已创建备份文件: {backup_path}")
        
        # 读取文件内容
        with open(ffmpeg_reader_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修改几个关键点
        # 1. 修改临时文件处理逻辑，确保文件被保留足够长的时间
        if 'with tempfile.NamedTemporaryFile' in content:
            content = content.replace(
                'with tempfile.NamedTemporaryFile', 
                'tmp = tempfile.NamedTemporaryFile(delete=False)\nwith tmp'
            )
            
        # 2. 增加错误恢复的延迟重试机制
        if 'raise IOError' in content and 'failed to read the first frame' in content:
            # 添加重试逻辑
            retry_code = '''
                # 添加重试逻辑 - 修复补丁
                print("尝试重新打开视频文件...")
                import time
                time.sleep(0.5)  # 等待文件系统稳定
                try:
                    # 再次尝试打开
                    self.proc = ffmpeg_read(
                        self.filename, self.infos, self.pix_fmt, self.check_duration,
                        target_resolution=self.target_resolution)
                    self.pos = 0
                    self.lastread = self.read_frame()
                    self.fps = self.infos['video_fps']
                    return
                except:
                    pass
            '''
            
            content = content.replace(
                'raise IOError(("MoviePy error: failed to read the first frame of "+\n'
                '                  "video file %s. That might mean that the file is "+\n'
                '                  "corrupted. That may also mean that you are using "+\n'
                '                  "a deprecated version of FFMPEG. On Ubuntu/Debian "+\n'
                '                  "for instance the version in the repos is deprecated. "+\n'
                '                  "Please update to a recent version from the website.") %\n'
                '                  (self.filename))',
                retry_code + '\n            raise IOError(("MoviePy error: failed to read the first frame of "+\n'
                '                  "video file %s. That might mean that the file is "+\n'
                '                  "corrupted. That may also mean that you are using "+\n'
                '                  "a deprecated version of FFMPEG. On Ubuntu/Debian "+\n'
                '                  "for instance the version in the repos is deprecated. "+\n'
                '                  "Please update to a recent version from the website.") %\n'
                '                  (self.filename))'
            )
        
        # 写回修改后的文件
        with open(ffmpeg_reader_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("MoviePy ffmpeg_reader.py 文件已修补")
        return True
    
    except Exception as e:
        print(f"修补ffmpeg_reader.py失败: {e}")
        return False

def patch_config_defaults(moviepy_dir):
    """修补config_defaults.py文件以确保正确设置FFMPEG路径"""
    try:
        # 定位config_defaults.py文件
        config_path = os.path.join(moviepy_dir, 'config_defaults.py')
        if not os.path.exists(config_path):
            print(f"无法找到文件: {config_path}")
            return False
        
        # 备份原文件
        backup_path = config_path + '.bak'
        shutil.copy2(config_path, backup_path)
        print(f"已创建备份文件: {backup_path}")
        
        # 获取FFMPEG路径
        ffmpeg_path = shutil.which("ffmpeg")
        if not ffmpeg_path:
            print("未找到FFMPEG可执行文件，请先安装FFMPEG")
            return False
        
        ffmpeg_dir = os.path.dirname(ffmpeg_path)
        
        # 读取文件内容
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修改FFMPEG_BINARY设置
        if "FFMPEG_BINARY" in content:
            # 使用正则表达式替换FFMPEG_BINARY行
            import re
            content = re.sub(
                r'FFMPEG_BINARY\s*=\s*.*',
                f'FFMPEG_BINARY = r"{ffmpeg_path}"',
                content
            )
        else:
            # 如果没有找到，添加到文件末尾
            content += f'\n\nFFMPEG_BINARY = r"{ffmpeg_path}"\n'
        
        # 写回修改后的文件
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"已设置FFMPEG_BINARY路径为: {ffmpeg_path}")
        return True
    
    except Exception as e:
        print(f"修补config_defaults.py失败: {e}")
        return False

def set_environment_variables():
    """设置必要的环境变量"""
    try:
        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path:
            os.environ["FFMPEG_BINARY"] = ffmpeg_path
            print(f"已设置环境变量 FFMPEG_BINARY={ffmpeg_path}")
            
            # 为当前进程设置IMAGEMAGICK_BINARY（如果存在）
            imagemagick_path = shutil.which("convert")
            if imagemagick_path:
                os.environ["IMAGEMAGICK_BINARY"] = imagemagick_path
                print(f"已设置环境变量 IMAGEMAGICK_BINARY={imagemagick_path}")
            
            return True
        else:
            print("未找到FFMPEG，请先安装FFMPEG")
            return False
    except Exception as e:
        print(f"设置环境变量失败: {e}")
        return False

def main():
    """主函数"""
    print("开始修复MoviePy...")
    
    # 检查FFMPEG是否已安装，如果没找到，查找特定位置
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        # 尝试在常见安装目录查找
        potential_paths = [
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ffmpeg', 'ffmpeg.exe'),
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe"
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                ffmpeg_path = path
                # 将路径添加到当前进程的PATH
                os.environ["PATH"] = os.environ["PATH"] + ";" + os.path.dirname(path)
                print(f"找到FFMPEG: {ffmpeg_path}")
                break
        
        if not ffmpeg_path:
            print("未检测到FFMPEG，请先运行install_ffmpeg.py安装FFMPEG")
            return False
    else:
        print(f"找到FFMPEG: {ffmpeg_path}")
    
    # 设置环境变量
    set_environment_variables()
    
    # 查找MoviePy安装路径
    moviepy_dir = find_moviepy_installation()
    if not moviepy_dir:
        print("未找到MoviePy安装，请确保已安装MoviePy")
        return False
    
    # 修补文件
    if not patch_ffmpeg_reader(moviepy_dir):
        print("修补ffmpeg_reader.py失败")
        return False
    
    if not patch_config_defaults(moviepy_dir):
        print("修补config_defaults.py失败")
        return False
    
    print("\nMoviePy修复完成！请重启应用程序。")
    return True

if __name__ == "__main__":
    result = main()
    print("\n" + "="*50)
    if result:
        print("MoviePy修复成功！请重启应用程序。")
    else:
        print("MoviePy修复失败。")
    input("按回车键继续...") 