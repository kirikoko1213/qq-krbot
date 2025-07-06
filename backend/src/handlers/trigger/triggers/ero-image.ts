import path from 'path';
import fs from 'fs';
import { TriggerModel, TriggerParameter } from '../types.js';
import conf from '@/handlers/config/config.js';

interface EroImageResponse {
  data: string[];
  message: string;
  status: string;
}

export const fetchEroImage = async (): Promise<string[]> => {
  // 设置本地保存目录
  const attachmentDir = path.join(process.cwd(), 'attachments');

  // 检查目录是否存在，如果不存在就创建
  if (!fs.existsSync(attachmentDir)) {
    fs.mkdirSync(attachmentDir, { recursive: true });
  }

  // 获取配置参数
  const apiURL = await conf.get('ero_image.api.url');
  const tags = await conf.get('ero_image.api.tags');
  const count = await conf.get('ero_image.api.count');
  const directory = await conf.get('ero_image.api.directory');

  try {
    // 发送请求获取图片 URL 列表
    const response = await fetch(
      `${apiURL}?tags=${tags}&count=${count}&directory=${directory}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as EroImageResponse;

    // 检查响应状态
    if (data.status !== 'success') {
      throw new Error(`API error: ${data.message}`);
    }

    // 下载图片并保存到本地
    const localPaths: string[] = [];

    for (const imageUrl of data.data) {
      try {
        // 从 URL 中提取文件名
        const fileName = extractFileNameFromUrl(imageUrl);
        const localPath = path.join(attachmentDir, fileName);

        // 下载图片
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to download image from ${imageUrl}`);
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // 保存图片到本地
        fs.writeFileSync(localPath, Buffer.from(imageBuffer));

        // 转换为 Unix 风格的路径
        const unixPath = localPath.replace(/\\/g, '/');
        localPaths.push(unixPath);

        console.log(`Downloaded image: ${fileName}`);
      } catch (error) {
        console.error(`Error downloading image from ${imageUrl}:`, error);
      }
    }

    return localPaths;
  } catch (error) {
    console.error('Error fetching ero images:', error);
    return [];
  }
};

// 从 URL 中提取文件名的辅助函数
function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = path.basename(pathname);
    return fileName;
  } catch (error) {
    // 如果 URL 解析失败，使用时间戳作为文件名
    return `image_${Date.now()}.jpg`;
  }
}

export const EroImageTrigger: TriggerModel = {
  desc: '涩图',
  condition: (parameter: TriggerParameter) => {
    return (
      parameter.message.textMessage.includes('来点涩图') ||
      parameter.message.textMessage.includes('来点色图')
    );
  },
  callback: async (parameter: TriggerParameter) => {
    const image = await fetchEroImage();
    return {
      data: image,
      type: 'image',
    };
  },
};
