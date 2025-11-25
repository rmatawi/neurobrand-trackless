// src/utils/ffmpegSingleton.js
import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance;

export const getFFmpegInstance = () => {
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg();
  return ffmpegInstance;
};

export const loadFFmpeg = async () => {
  const ffmpeg = getFFmpegInstance();
  if (!ffmpeg.loaded) await ffmpeg.load();
  return ffmpeg;
};

export const terminateFFmpeg = () => {
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
  }
};
