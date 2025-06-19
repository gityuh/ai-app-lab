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

import xml.etree.ElementTree as ET
from typing import Dict, Any
import base64

def parse_tmx_to_dict(tmx_file_path: str) -> Dict[str, Any]:
    """
    解析TMX地图文件为字典格式
    :param tmx_file_path: TMX文件路径
    :return: 包含地图数据的字典
    """
    tree = ET.parse(tmx_file_path)
    root = tree.getroot()
    
    result = {
        'map': root.attrib,
        'tilesets': [],
        'layers': [],
        'objectgroups': []
    }
    
    # 解析图块集
    for tileset in root.findall('tileset'):
        result['tilesets'].append(tileset.attrib)
    
    # 解析图层
    for layer in root.findall('layer'):
        layer_data = layer.attrib.copy()
        data_element = layer.find('data')
        if data_element is not None:
            layer_data['data'] = data_element.text.strip()
        result['layers'].append(layer_data)
    
    # 解析对象层
    for objectgroup in root.findall('objectgroup'):
        group_data = objectgroup.attrib.copy()
        objects = []
        for obj in objectgroup.findall('object'):
            obj_data = obj.attrib.copy()
            for child in obj:
                if child.tag == 'point':
                    obj_data['type'] = 'point'
            objects.append(obj_data)
        group_data['objects'] = objects
        result['objectgroups'].append(group_data)
    
    return result

def dict_to_tmx(data: Dict[str, Any], output_path: str):
    """
    将字典数据还原为TMX文件
    :param data: 包含地图数据的字典
    :param output_path: 输出文件路径
    """
    # 创建根元素
    root = ET.Element('map')
    for attr, value in data['map'].items():
        root.set(attr, value)
    
    # 添加图块集
    for tileset in data['tilesets']:
        ET.SubElement(root, 'tileset', attrib=tileset)
    
    # 添加图层
    for layer in data['layers']:
        layer_elem = ET.SubElement(root, 'layer', attrib={k: v for k, v in layer.items() if k != 'data'})
        if 'data' in layer:
            # 之前是base64编码，现在改为CSV
            # data_elem = ET.SubElement(layer_elem, 'data', encoding='base64')
            data_elem = ET.SubElement(layer_elem, 'data', encoding='csv')
            data_elem.text = layer['data']
    
    # 添加对象层
    for objectgroup in data['objectgroups']:
        group_elem = ET.SubElement(root, 'objectgroup', attrib={k: v for k, v in objectgroup.items() if k != 'objects'})
        for obj in objectgroup['objects']:
            obj_elem = ET.SubElement(group_elem, 'object', attrib={k: v for k, v in obj.items() if k != 'type'})
            if obj.get('type') == 'point':
                ET.SubElement(obj_elem, 'point')
    
    # 美化XML输出
    ET.indent(root, space=" ", level=0)
    
    # 写入文件
    tree = ET.ElementTree(root)
    tree.write(output_path, encoding='utf-8', xml_declaration=True)

# map_data = parse_tmx_to_dict('/Users/bytedance/Desktop/project/game_agent/volc_llm_game_demo/rpg-app/main/worlds/maps/simplemap.tmx')
# print(map_data)

# dict_to_tmx(map_data, 'temp.tmx')