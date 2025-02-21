/* eslint-disable */
/* tslint:disable */
// @ts-nocheck

import * as openapi_common from './openapi_common';
import * as openapi_tag from './openapi_tag';

export type Int64 = string | number;

export enum Phase {
  PhaseCompleted = 'succeeded',
  PhaseFailed = 'failed',
  PhaseQueuing = 'queued',
  PhaseRunning = 'running',
  PhaseCancelled = 'cancelled',
}

export enum TaskType {
  TaskTypeBasicMode = 'BasicMode',
}

export interface CreateVideoGenTaskRequest {
  Name: string;
  Prompt?: string;
  TaskType: TaskType;
  FirstFrameImageTosLocation?: openapi_common.TosLocation;
  /** 6: optional openapi_common.TosLocation  LastFrameImageTosLocation */
  OutputTosConfig: openapi_common.TosConfig;
  /** 8: optional string                      PreviousTaskId */
  ModelName: string;
  ModelVersion: string;
  ProjectName?: string;
  Tags?: Array<openapi_tag.Tag>;
  /** 13: optional i32                         RandomSeed */
  Ratio?: string;
  /** 14: optional string                      LastFrameAdherence
15: optional string                      MotionIntensity */
  FrameCount?: number;
  FramesPerSecond?: number;
  Resolution?: string;
  /** 19: optional i32                         CameraStrength
20: optional string                      CameraControl */
  CameraFixed?: boolean;
}

export interface GetVideoGenTaskRequest {
  Id: string;
}

export interface GetVideoGenTaskResponse {
  id: string;
  model: string;
  status: Phase;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  content?: { video_url: string }
  usage?: { completion_tokens: number }
}

export interface ListVideoGenTasksFilter {
  Ids?: Array<string>;
  Phases?: Array<Phase>;
  ModelName?: string;
  Name?: string;
  StartTime?: string;
  EndTime?: string;
}

export interface ListVideoGenTasksRequest {
  NextToken?: string;
  MaxResults?: number;
  ProjectName?: string;
  TagFilters?: Array<openapi_tag.TagFilter>;
  Filter?: ListVideoGenTasksFilter;
}

export interface ListVideoGenTasksResponse {
  NextToken: string;
  Items: Array<GetVideoGenTaskResponse>;
}
/* eslint-enable */
