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

import { useContext, useEffect, useState } from 'react';

import { getViewContext } from '@ai-app/framework';
import { close } from '@ai-app/bridge-api/procode';

import { CAMER_MODE } from '@/types';
import { getQuestionSegmentList } from '@/api/bridge';
import { RouterContext } from '../../context/routerContext/context';
import { getCameraImageBase64 } from '../../utils';
import RecognitionGuide from '../../components/RecognitionGuide';
import SAM from './components/sam';
import styles from './index.module.less';

const Recognition = () => {
  const { navigate } = useContext(RouterContext);
  const [imageBase64, setImageBase64] = useState('');
  const [notPassed, setNotPassed] = useState(false);

  const recognizeQuestion = async (imageId: string) => {
    try {
      const res: any = await getQuestionSegmentList({
        imageId
      });
      const { pass, midBoxIndex, detectedQuestions } = res || {};
      if (pass) {
        const currentViewContext: any = getViewContext();
        // 作业批改场景
        if ((currentViewContext.camera_mode as CAMER_MODE) === CAMER_MODE.HOMEWORK_CORRECTION) {
          navigate('recognition-result', {
            detectedQuestions,
            originData: res
          });
          return;
        }
        // 其他场景，到确认页
        navigate('confirm', {
          position: {
            x: detectedQuestions[midBoxIndex].boundingBox.left,
            y: detectedQuestions[midBoxIndex].boundingBox.top
          },
          size: {
            width: detectedQuestions[midBoxIndex].boundingBox.width,
            height: detectedQuestions[midBoxIndex].boundingBox.height
          },
          originData: res
        });
      } else {
        setNotPassed(true);
      }
    } catch (error) {
      setNotPassed(true);
      console.error('error', error);
    }
  };

  const onCancel = () => {
    close();
  };

  useEffect(() => {
    (async () => {
      const currentViewContext: any = getViewContext();
      if (currentViewContext) {
        const base64 = await getCameraImageBase64(currentViewContext.image_id);
        setImageBase64(base64);
        recognizeQuestion(currentViewContext.image_id);
      }
    })();
  }, []);

  return (
    <div className={styles.recognitionContainer}>
      <div className={styles.content}>
        <SAM imageBase64={imageBase64} notPassed={notPassed} />
      </div>
      <div className={styles.btnContainer}>
        {!notPassed && imageBase64 && (
          <div className={styles.cancelBtn} onClick={onCancel}>
            取消
          </div>
        )}
      </div>
      {notPassed && <RecognitionGuide />}
    </div>
  );
};

export default Recognition;
