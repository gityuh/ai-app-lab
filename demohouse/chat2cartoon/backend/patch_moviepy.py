#!/usr/bin/env python
"""
修补MoviePy的ffmpeg_reader.py文件
"""
import os
import sys
import importlib.util
import shutil
import tempfile

def find_moviepy():
    """找到MoviePy安装路径"""
    try:
        spec = importlib.util.find_spec('moviepy')
        if spec:
            return os.path.dirname(spec.origin)
    except:
        pass
    return None

def patch_file():
    """修补ffmpeg_reader.py文件"""
    moviepy_dir = find_moviepy()
    if not moviepy_dir:
        print("找不到MoviePy安装路径！")
        return False
        
    ffmpeg_reader_path = os.path.join(moviepy_dir, 'video', 'io', 'ffmpeg_reader.py')
    if not os.path.exists(ffmpeg_reader_path):
        print(f"找不到文件: {ffmpeg_reader_path}")
        return False
        
    # 创建备份
    backup_path = ffmpeg_reader_path + '.bak'
    if not os.path.exists(backup_path):
        shutil.copy2(ffmpeg_reader_path, backup_path)
        print(f"已创建备份: {backup_path}")
    
    # 读取文件内容
    with open(ffmpeg_reader_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 添加补丁
    patch = """
    def __del__(self):
        self.close()

    def close(self):
        if hasattr(self, 'proc') and self.proc:
            try:
                self.proc.terminate()
                self.proc.stdout.close()
                self.proc.stderr.close()
                self.proc.wait()
                self.proc = None
            except:
                pass
"""
    
    # 检查是否已应用补丁
    if "__del__" in content and "self.close()" in content:
        print("补丁已应用，无需再次修改")
        return True
    
    # 查找类定义结束的位置
    class_end = content.find("class FFMPEG_VideoReader:")
    if class_end >= 0:
        next_class = content.find("class", class_end + 20)
        if next_class < 0:
            next_class = len(content)
        
        # 在类定义末尾添加补丁
        new_content = content[:next_class] + patch + content[next_class:]
        
        # 修改错误处理逻辑
        error_pattern = 'raise IOError(("MoviePy error: failed to read the first frame of "'
        retry_code = """
            # 尝试重试
            print("尝试重新读取视频文件...")
            import time
            time.sleep(0.5)
            try:
                if hasattr(self, 'proc') and self.proc:
                    self.proc.terminate()
                    self.proc.stdout.close()
                    self.proc.stderr.close()
                    self.proc.wait()
                
                self.proc = ffmpeg_read(
                    self.filename, self.infos, self.pix_fmt, self.check_duration,
                    target_resolution=self.target_resolution)
                self.pos = 0
                self.lastread = self.read_frame()
                if self.lastread is not None:
                    self.fps = self.infos['video_fps']
                    print("重试成功！")
                    return
            except Exception as e:
                print(f"重试失败: {e}")
                
        """
        
        if error_pattern in new_content and retry_code not in new_content:
            new_content = new_content.replace(
                error_pattern, 
                retry_code + error_pattern
            )
        
        # 写回文件
        with open(ffmpeg_reader_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print("已成功应用补丁！")
        return True
    else:
        print("无法找到适合应用补丁的位置")
        return False

if __name__ == "__main__":
    print("开始修补MoviePy...")
    if patch_file():
        print("修补完成！")
    else:
        print("修补失败！") 