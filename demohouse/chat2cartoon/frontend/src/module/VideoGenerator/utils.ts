// starling-disable-file
import { compact } from 'lodash';

import { DescriptionType, VideoGeneratorTaskPhase } from './types';

export const matchRoleDescription = (description: string) => {
  const regExp = /(角色[\d]+)：\n角色：(.*)\n(.*)/g;
  // 先分句
  const splitContent = description.match(regExp);
  if (!splitContent) {
    return undefined;
  }
  // 再把角色和内容分开
  const parsedData = compact(
    splitContent.map(item => {
      const matchArray = item.match(/(角色[\d]+)：\n角色：(.*)\n(.*)/);
      if (!matchArray) {
        return undefined;
      }
      return {
        uniqueKey: matchArray[1],
        storyRole: matchArray[2],
        content: matchArray[3],
      };
    }),
  );
  return parsedData;
};

/**
 * 组合角色描述
 * @returns string
 */
export const combinationRoleDescription = (data: DescriptionType) =>
  `${data.uniqueKey}：\n角色：${data.storyRole}\n${data.content}`;

export const matchFirstFrameDescription = (description: string) => {
  const regExp = /(分镜[\d]+)：\n(角色：)(.*)\n首帧描述：(.*)/g;
  // 先分句
  const splitContent = description.match(regExp);
  if (!splitContent) {
    return undefined;
  }
  // 再把角色和内容分开
  const parsedData = compact(
    splitContent.map(item => {
      const matchArray = item.match(/(分镜[\d]+)：\n角色：(.*)\n首帧描述：(.*)/);
      if (!matchArray) {
        return undefined;
      }
      return {
        uniqueKey: matchArray[1],
        storyRole: matchArray[2],
        content: matchArray[3],
      };
    }),
  );
  return parsedData;
};

/**
 * 组合分镜描述
 * @returns string
 */
export const combinationFirstFrameDescription = (data: DescriptionType) =>
  `${data.uniqueKey}：\n角色：${data.storyRole}\n首帧描述：${data.content}`;

export const matchVideoDescription = (description: string) => {
  const regExp = /(视频[\d]+)：\n角色：(.*)\n描述：(.*)/g;
  // 先分句
  const splitContent = description.match(regExp);
  if (!splitContent) {
    return undefined;
  }
  // 再把角色和内容分开
  const parsedData = compact(
    splitContent.map(item => {
      const matchArray = item.match(/(视频[\d]+)：\n角色：(.*)\n描述：(.*)/);
      if (!matchArray) {
        return undefined;
      }
      return {
        uniqueKey: matchArray[1],
        storyRole: matchArray[2],
        content: matchArray[3],
      };
    }),
  );
  return parsedData;
};

/**
 * 组合视频描述
 * @returns string
 */
export const combinationVideoDescription = (data: DescriptionType) =>
  `${data.uniqueKey}：\n角色：${data.storyRole}\n描述：${data.content}`;

const processByPhase = (phase: string, data: DescriptionType) => {
  switch (phase) {
    case VideoGeneratorTaskPhase.PhaseRoleDescription:
      return combinationRoleDescription(data);
    case VideoGeneratorTaskPhase.PhaseFirstFrameDescription:
      return combinationFirstFrameDescription(data);
    case VideoGeneratorTaskPhase.PhaseVideoDescription:
      return combinationVideoDescription(data);
    default:
      return '';
  }
};

export const mergedOriginDescriptionsByPhase = (params: {
  phase: string;
  replaceDesc: string;
  mergeList: DescriptionType[];
  uniqueKey: string;
}) => {
  const { phase, replaceDesc, mergeList, uniqueKey } = params;
  const mergedDescriptionList = mergeList.map(item => {
    if (item.uniqueKey === uniqueKey) {
      return { ...item, content: replaceDesc };
    }
    return item;
  });
  const mergedDescriptionStr = mergedDescriptionList.map(item => processByPhase(phase, item)).join('\n');
  return mergedDescriptionStr;
};
