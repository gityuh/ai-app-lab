// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// Licensed under the 【火山方舟】原型应用软件自用许可协议
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at 
//     https://www.volcengine.com/docs/82379/1433703
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Message, Tabs, Card } from '@arco-design/web-react';
import styles from './index.module.less';

interface StoryScene {
  id: number;
  characters: string;
  scene: string;
  dialogue: string;
}

interface EditStoryboardProps {
  visible: boolean;
  content: string;
  onOk: (content: string) => void;
  onCancel: () => void;
}

const EditStoryboard = (props: EditStoryboardProps) => {
  const { visible, content, onOk, onCancel } = props;
  const [editedContent, setEditedContent] = useState('');
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [activeTab, setActiveTab] = useState('full');

  // 解析分镜脚本到场景数组
  const parseContent = (content: string) => {
    const sceneBlocks = content.split(/分镜\d+：/).filter(block => block.trim().length > 0);
    return sceneBlocks.map((block, index) => {
      const charactersMatch = block.match(/角色[：:](.*?)(?:\n|$)/);
      const sceneMatch = block.match(/画面[：:](.*?)(?:\n|$)/);
      const dialogueMatch = block.match(/台词[：:](.*?)(?:\n|$)/) || block.match(/中文台词[：:](.*?)(?:\n|$)/);

      return {
        id: index + 1,
        characters: charactersMatch ? charactersMatch[1].trim() : '',
        scene: sceneMatch ? sceneMatch[1].trim() : '',
        dialogue: dialogueMatch ? dialogueMatch[1].trim() : '',
      };
    });
  };

  // 将场景数组转换回完整的分镜脚本
  const buildContent = (scenes: StoryScene[]) => {
    // 确保所有场景ID都是连续的，从1开始
    const sortedScenes = [...scenes].sort((a, b) => a.id - b.id);
    const renumberedScenes = sortedScenes.map((scene, index) => ({
      ...scene,
      id: index + 1,
    }));
    
    return renumberedScenes.map((scene, index) => {
      return `分镜${index + 1}：\n角色：${scene.characters}\n画面：${scene.scene}\n台词：${scene.dialogue}`;
    }).join('\n\n');
  };

  useEffect(() => {
    if (visible && content) {
      setEditedContent(content);
      const parsedScenes = parseContent(content);
      // 确保场景ID是连续的
      const renumberedScenes = parsedScenes.map((scene, index) => ({
        ...scene,
        id: index + 1,
      }));
      setScenes(renumberedScenes);
    }
  }, [visible, content]);

  const handleOk = () => {
    let finalContent = '';
    
    if (activeTab === 'full') {
      if (!editedContent.trim()) {
        Message.error('分镜脚本内容不能为空');
        return;
      }
      
      // 检查分镜数量是否正确
      const sceneMatches = editedContent.match(/分镜\d+：/g);
      if (!sceneMatches) {
        Message.error('分镜脚本格式不正确，请检查');
        return;
      }
      
      // 确保分镜编号连续且从1开始
      const sceneNumbers = sceneMatches.map(match => {
        const num = parseInt(match.match(/\d+/)?.[0] || '0', 10);
        return num;
      }).sort((a, b) => a - b);
      
      // 检查是否有重复或缺失的分镜编号
      for (let i = 0; i < sceneNumbers.length; i++) {
        if (sceneNumbers[i] !== i + 1) {
          // 尝试自动修复
          try {
            const fixedContent = editedContent.replace(/分镜\d+：/g, (match, offset) => {
              const index = editedContent.substring(0, offset).match(/分镜\d+：/g)?.length || 0;
              return `分镜${index + 1}：`;
            });
            setEditedContent(fixedContent);
            Message.warning('已自动修复分镜编号，请检查内容是否正确');
            return;
          } catch (e) {
            Message.error('分镜编号不连续，请按顺序编号从1开始');
            return;
          }
        }
      }
      
      finalContent = editedContent;
    } else {
      if (scenes.length === 0) {
        Message.error('至少需要一个分镜场景');
        return;
      }
      
      for (const scene of scenes) {
        if (!scene.characters.trim() || !scene.scene.trim() || !scene.dialogue.trim()) {
          Message.error(`分镜${scene.id}的角色、画面和台词不能为空`);
          return;
        }
      }
      
      finalContent = buildContent(scenes);
    }
    
    onOk(finalContent);
  };

  const handleSceneChange = (id: number, field: keyof StoryScene, value: string) => {
    setScenes(prevScenes => 
      prevScenes.map(scene => 
        scene.id === id ? { ...scene, [field]: value } : scene
      )
    );
  };

  const handleAddScene = () => {
    const newId = scenes.length > 0 ? Math.max(...scenes.map(s => s.id)) + 1 : 1;
    setScenes([...scenes, {
      id: newId,
      characters: '',
      scene: '',
      dialogue: ''
    }]);
  };

  const handleRemoveScene = (id: number) => {
    if (scenes.length <= 1) {
      Message.warning('至少需要保留一个分镜场景');
      return;
    }
    setScenes(scenes.filter(scene => scene.id !== id));
  };

  const handleFullContentChange = (value: string) => {
    setEditedContent(value);
    // 当用户在完整编辑模式下修改内容时，尝试解析更新场景列表
    try {
      const newScenes = parseContent(value);
      if (newScenes.length > 0) {
        setScenes(newScenes);
      }
    } catch (e) {
      // 解析失败不更新场景列表
    }
  };

  return (
    <Modal
      title="编辑分镜脚本"
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      autoFocus={false}
      focusLock={true}
      maskClosable={false}
      className={styles.editStoryboardModal}
      footer={
        <>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleOk}>
            确定
          </Button>
        </>
      }
      style={{ width: '800px', maxWidth: '90vw' }}
    >
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane key="full" title="完整编辑">
          <div className={styles.contentWrapper}>
            <p className={styles.hint}>
              请编辑分镜脚本，修改后将用于后续视频生成。请保持每个分镜的格式一致，包含角色、画面和台词。
            </p>
            <Input.TextArea
              value={editedContent}
              onChange={handleFullContentChange}
              placeholder="请编辑分镜脚本内容..."
              autoSize={{ minRows: 15, maxRows: 20 }}
              className={styles.editArea}
            />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane key="scenes" title="分镜编辑">
          <div className={styles.contentWrapper}>
            <p className={styles.hint}>
              分别编辑每个分镜的角色、画面和台词内容。修改后将用于后续视频生成。
            </p>
            <div className={styles.scenesContainer}>
              {scenes.map(scene => (
                <Card
                  key={scene.id}
                  title={`分镜 ${scene.id}`}
                  className={styles.sceneCard}
                  extra={
                    <Button
                      type="text"
                      status="danger"
                      onClick={() => handleRemoveScene(scene.id)}
                    >
                      删除
                    </Button>
                  }
                >
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>角色：</div>
                    <Input
                      value={scene.characters}
                      onChange={(value) => handleSceneChange(scene.id, 'characters', value)}
                      placeholder="请输入角色"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>画面：</div>
                    <Input.TextArea
                      value={scene.scene}
                      onChange={(value) => handleSceneChange(scene.id, 'scene', value)}
                      placeholder="请描述画面"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>台词：</div>
                    <Input
                      value={scene.dialogue}
                      onChange={(value) => handleSceneChange(scene.id, 'dialogue', value)}
                      placeholder="请输入台词"
                    />
                  </div>
                </Card>
              ))}
              <Button
                type="dashed"
                long
                className={styles.addSceneBtn}
                onClick={handleAddScene}
              >
                添加分镜
              </Button>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default EditStoryboard; 