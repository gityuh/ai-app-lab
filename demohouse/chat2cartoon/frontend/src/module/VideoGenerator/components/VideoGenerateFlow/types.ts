export interface FlowData {
  description: string;
  mediaUrls?: string[];
  mediaIds?: string[];
  role?: string;
  tone?: string;
  modelDisplayInfo: { displayName: string; modelName: string; modelVersion?: string; imgSrc: string };
}
