import { CLOUD_PLATFORM_SPECS } from '../data/cloudInfraData';
import type {
  CloudPlatformId,
  CloudPlatformRecommendation,
  CloudProjectProfileId,
} from '../types/learning';

interface FitRule {
  tier: 'primary' | 'secondary' | 'limited';
  tierLabel: string;
  fitReason: string;
}

const PROFILE_RULES: Record<CloudProjectProfileId, Record<CloudPlatformId, FitRule>> = {
  'modern-frontend': {
    vercel: {
      tier: 'primary',
      tierLabel: '推荐首选',
      fitReason: '对 React / Vite / Next.js 识别度最高，关联 GitHub 30 秒发布且自带每次改动的独立预览链接。',
    },
    'cloudflare-pages': {
      tier: 'secondary',
      tierLabel: '同样适用',
      fitReason: '同样支持一键部署现代前端并享有无限免费流量，非常适合追求零流量费用焦虑的项目。',
    },
    render: {
      tier: 'secondary',
      tierLabel: '同样适用',
      fitReason: 'Render Static Site 也可免费托管前端，如果未来准备扩充后端接口可以统一放一起。',
    },
    'github-pages': {
      tier: 'limited',
      tierLabel: '功能受限',
      fitReason: '仅能放纯静态产物，无法直接跑无服务器 API 接口，SPA 路由刷新也需额外处理 404 回退。',
    },
  },
  'fullstack-backend': {
    render: {
      tier: 'primary',
      tierLabel: '推荐首选',
      fitReason: '原生支持常驻 Node/Express、Python 后端、Docker 镜像与私密环境变量，本项目这类全栈站可直接上线。',
    },
    vercel: {
      tier: 'limited',
      tierLabel: '不适合常驻后端',
      fitReason: 'Vercel 面向无服务器短连接函数，不支持直接运行常驻 Express 服务器或开源 Docker 容器。',
    },
    'cloudflare-pages': {
      tier: 'limited',
      tierLabel: '需改写边缘函数',
      fitReason: '仅支持轻量 Workers 边缘运行时，无法直接启动标准 Node/Python 常驻进程或传统 Docker 镜像。',
    },
    'github-pages': {
      tier: 'limited',
      tierLabel: '不支持后端',
      fitReason: '纯静态托管没有服务端运行环境，不能运行 /api/* 接口，也不能安全保存 GEMINI_API_KEY。',
    },
  },
  'high-traffic-public': {
    'cloudflare-pages': {
      tier: 'primary',
      tierLabel: '推荐首选',
      fitReason: '免费档直接提供无限流量带宽、全球 300+ 边缘节点加速和免费 DDoS 防护，不怕突然爆火产生超额费用。',
    },
    vercel: {
      tier: 'secondary',
      tierLabel: '注意流量上限',
      fitReason: '访问体验极佳，但免费 Hobby 档每月上限 100 GB 流量且限非商用，高爆发流量需留意配额。',
    },
    render: {
      tier: 'secondary',
      tierLabel: '注意流量上限',
      fitReason: '静态站点免费档 100 GB/月流量，中小流量足够；超大公开流量优先选 Cloudflare Pages。',
    },
    'github-pages': {
      tier: 'limited',
      tierLabel: '存在软限流',
      fitReason: '每月 100 GB 软限制且不支持高频大规模商业分发，不适合承载突发高流量公开活动页。',
    },
  },
  'static-portfolio': {
    'cloudflare-pages': {
      tier: 'primary',
      tierLabel: '推荐首选',
      fitReason: '支持直接拖拽打包文件夹上传，零命令行即可获得全球加速与无限流量 HTTPS 网址。',
    },
    'github-pages': {
      tier: 'primary',
      tierLabel: '推荐首选',
      fitReason: '无需新注册云平台账号，直接在 GitHub 仓库 Settings 里勾选分支即可免费发布个人主页。',
    },
    vercel: {
      tier: 'secondary',
      tierLabel: '同样适用',
      fitReason: '同样支持零配置自动上线纯静态站点，全球加载速度出色。',
    },
    render: {
      tier: 'secondary',
      tierLabel: '同样适用',
      fitReason: '选择 Render Static Site 可免费托管，但纯静态站点相比前两者无明显额外优势。',
    },
  },
};

const TIER_ORDER: Record<FitRule['tier'], number> = {
  primary: 0,
  secondary: 1,
  limited: 2,
};

/**
 * Evaluates and ranks cloud hosting platforms for a selected project profile.
 */
export function evaluateCloudPlatforms(
  profileId: CloudProjectProfileId
): CloudPlatformRecommendation[] {
  const rules = PROFILE_RULES[profileId];

  const results: CloudPlatformRecommendation[] = CLOUD_PLATFORM_SPECS.map((spec) => {
    const rule = rules[spec.id];
    return {
      spec,
      tier: rule.tier,
      tierLabel: rule.tierLabel,
      fitReason: rule.fitReason,
    };
  });

  return results.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}
