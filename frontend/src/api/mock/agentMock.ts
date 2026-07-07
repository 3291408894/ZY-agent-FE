// ================================================================
// 智翼 (ZhiYi) — AI Agent Mock 数据
// 后端未就绪时的前端演示数据
// 设置 VITE_USE_MOCK=true 或 localStorage.setItem('zhiyi-use-mock','1')
// ================================================================

import type {
  ISessionGroup,
  ISessionDetail,
  IChatMessage,
  IThoughtStep,
} from '@/types'

// ── 模拟延迟 ──
export function delay(ms: number = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ================================================================
// Mock 会话列表（按日期分组）
// ================================================================
const now = new Date()
const today = now.toISOString()
const yesterday = new Date(now.getTime() - 86400000).toISOString()
const thisWeek = new Date(now.getTime() - 3 * 86400000).toISOString()
const older = new Date(now.getTime() - 10 * 86400000).toISOString()

export const mockSessions: ISessionGroup[] = [
  {
    label: '今天',
    sessions: [
      {
        id: 'mock-session-1',
        user_id: 'mock-user',
        title: '帮我总结《桃花源记》的主要内容',
        created_at: today,
        updated_at: today,
      },
      {
        id: 'mock-session-2',
        user_id: 'mock-user',
        title: '二次函数顶点坐标怎么求',
        created_at: today,
        updated_at: today,
      },
    ],
  },
  {
    label: '昨天',
    sessions: [
      {
        id: 'mock-session-3',
        user_id: 'mock-user',
        title: '《出师表》的创作背景和原文翻译',
        created_at: yesterday,
        updated_at: yesterday,
      },
      {
        id: 'mock-session-4',
        user_id: 'mock-user',
        title: '一元一次方程应用题练习',
        created_at: yesterday,
        updated_at: yesterday,
      },
    ],
  },
  {
    label: '本周',
    sessions: [
      {
        id: 'mock-session-5',
        user_id: 'mock-user',
        title: '英语完形填空解题技巧',
        created_at: thisWeek,
        updated_at: thisWeek,
      },
    ],
  },
  {
    label: '更早',
    sessions: [
      {
        id: 'mock-session-6',
        user_id: 'mock-user',
        title: '物理力学基础知识梳理',
        created_at: older,
        updated_at: older,
      },
      {
        id: 'mock-session-7',
        user_id: 'mock-user',
        title: '化学元素周期表记忆方法',
        created_at: older,
        updated_at: older,
      },
    ],
  },
]

// ================================================================
// Mock 消息数据
// ================================================================
export const mockMessages: Record<string, IChatMessage[]> = {
  'mock-session-1': [
    {
      id: 1,
      session_id: 'mock-session-1',
      role: 'user',
      content: '帮我总结《桃花源记》的主要内容',
      thought_chain: null,
      tool_calls: null,
      created_at: today,
    },
    {
      id: 2,
      session_id: 'mock-session-1',
      role: 'assistant',
      content:
        '《桃花源记》是东晋诗人陶渊明的代表作之一，描绘了一个与世隔绝、安宁祥和的理想社会。\n\n## 主要内容\n\n1. **发现桃源**：武陵渔人沿溪而行，忽逢桃花林，穿过山洞发现了一个与世隔绝的村落。\n\n2. **桃源生活**：村民们为了躲避秦朝战乱来到此地，从此与外界断绝联系。这里土地平旷、屋舍俨然，人们过着安居乐业的生活。\n\n3. **离开与迷失**：渔人离开后，尽管做了标记，但再也找不到通往桃源的路。\n\n## 中心思想\n\n- 表达了作者对**理想社会**的向往\n- 反映了对**现实社会**的不满与批判\n- "世外桃源" 成为理想境界的代名词',
      thought_chain: [
        { step: 1, title: '需求分析', content: '识别到课文总结需求，目标课文：《桃花源记》' },
        { step: 2, title: '课文总结', content: '提取主要内容、结构分析和中心思想' },
        { step: 3, title: '知识点关联', content: '关联文言文知识点：通假字、古今异义、一词多义' },
      ],
      tool_calls: null,
      created_at: today,
    },
  ],
  'mock-session-2': [
    {
      id: 3,
      session_id: 'mock-session-2',
      role: 'user',
      content: '二次函数 y=ax²+bx+c 的顶点坐标怎么求？',
      thought_chain: null,
      tool_calls: null,
      created_at: today,
    },
    {
      id: 4,
      session_id: 'mock-session-2',
      role: 'assistant',
      content:
        '二次函数顶点坐标的求法有**两种常用方法**：\n\n## 方法一：公式法（最快）\n\n顶点横坐标：**x = -b / (2a)**\n\n顶点纵坐标：**y = (4ac - b²) / (4a)**\n\n## 方法二：配方法\n\n将 y = ax² + bx + c 化为 y = a(x - h)² + k，顶点为 **(h, k)**\n\n## 举例\n\n求 y = 2x² - 8x + 3 的顶点：\n- a=2, b=-8, c=3\n- x = -(-8)/(2×2) = 8/4 = **2**\n- y = (4×2×3 - 64)/(4×2) = (24-64)/8 = **-5**\n- 顶点坐标：**(2, -5)**',
      thought_chain: [
        { step: 1, title: '数学分析', content: '识别为二次函数顶点坐标求解问题' },
        { step: 2, title: '调用知识库', content: '检索二次函数标准形式和顶点公式' },
      ],
      tool_calls: null,
      created_at: today,
    },
  ],
  'mock-session-3': [
    {
      id: 5,
      session_id: 'mock-session-3',
      role: 'user',
      content: '诸葛亮《出师表》的创作背景是什么？帮我翻译一下全文',
      thought_chain: null,
      tool_calls: null,
      created_at: yesterday,
    },
    {
      id: 6,
      session_id: 'mock-session-3',
      role: 'assistant',
      content:
        '## 创作背景\n\n《出师表》写于蜀汉建兴五年（公元227年），诸葛亮准备北伐曹魏之前，向后主刘禅上呈的表文。\n\n当时情况：\n- 蜀汉国力渐弱，内有政治隐患\n- 诸葛亮决心北伐中原、兴复汉室\n- 临行前向后主刘禅交代朝政大事\n\n## 核心名句翻译\n\n| 原文 | 译文 |\n|------|------|\n| 先帝创业未半而中道崩殂 | 先帝开创大业不到一半就中途去世了 |\n| 今天下三分，益州疲弊 | 如今天下分为三国，蜀汉国力困乏 |\n| 此诚危急存亡之秋也 | 这实在是危急存亡的关键时刻 |\n| 亲贤臣，远小人 | 亲近贤臣，疏远小人 |\n| 苟全性命于乱世，不求闻达于诸侯 | 只想在乱世中保全性命，不求在诸侯中显达 |',
      thought_chain: [
        { step: 1, title: '历史背景', content: '查找《出师表》创作的历史背景' },
        { step: 2, title: '文本分析', content: '分析原文结构和关键段落' },
        { step: 3, title: '翻译生成', content: '生成全文翻译' },
      ],
      tool_calls: null,
      created_at: yesterday,
    },
  ],
}

// ================================================================
// Mock SSE 模拟 — 生成 AI 回复（打字机效果）
// ================================================================

/** 根据用户输入生成模拟的 AI 回复 */
function generateResponse(message: string): {
  thoughts: IThoughtStep[]
  content: string
} {
  // 根据关键词判断回复类型
  if (message.includes('总结') || message.includes('课文') || message.includes('桃花源记')) {
    return {
      thoughts: [
        { step: 1, title: '需求分析', content: '识别到课文总结需求，开始分析文本结构' },
        { step: 2, title: '课文总结', content: '提取主要内容、段落结构和中心思想' },
        { step: 3, title: '知识点提取', content: '关联文言文考点：通假字、古今异义、虚词用法' },
      ],
      content: `好的，我来帮你总结这篇课文。

## 📖 主要内容

这篇课文主要讲述了作者通过对自然景物/历史事件的描写，表达了深刻的思想感情。

## 📝 结构分析

1. **开头**（第1段）：交代背景，引出主题
2. **主体**（第2-3段）：详细叙述事件经过
3. **结尾**（第4段）：总结全文，点明主旨

## 🎯 中心思想

- 表达了作者对理想的追求
- 反映了深刻的社会思考
- 展现了独特的文学价值

## 📚 重点知识点

- **文言实词**：需重点掌握的实词有5个
- **文言虚词**："之""而""以"的用法
- **特殊句式**：判断句、倒装句

需要我出几道练习题来巩固这些知识点吗？`,
    }
  }

  if (message.includes('数学') || message.includes('函数') || message.includes('方程') || message.includes('几何')) {
    return {
      thoughts: [
        { step: 1, title: '数学分析', content: `识别数学问题类型，分析已知条件` },
        { step: 2, title: '解题步骤', content: '确定解题方法和关键公式' },
      ],
      content: `好的，我来帮你解答这道数学题。

## 🔢 解题思路

**第一步：分析条件**
先理清题目给出的已知条件和要求解的未知量。

**第二步：选择方法**
根据题目类型选择最合适的解题方法。

**第三步：逐步求解**

按照公式/定理逐步推导，注意每一步的计算准确性。

**第四步：验证答案**
将结果代入原题验证。

## 💡 常见易错点

1. 注意符号的正负
2. 注意单位统一
3. 注意定义域/值域的限制

需要我再出几道同类练习题吗？`,
    }
  }

  // 默认回复
  return {
    thoughts: [
      { step: 1, title: '理解问题', content: '分析用户输入，确定任务类型' },
      { step: 2, title: '知识检索', content: '从知识库中检索相关内容' },
      { step: 3, title: '生成回答', content: '综合信息，生成结构化回答' },
    ],
    content: `好的，这是一个很好的问题！让我来帮你分析。

## 📝 核心要点

针对你的问题，我从以下几个方面来解答：

1. **概念理解**：首先要明确相关的核心概念和定义
2. **关键方法**：掌握高效的学习方法
3. **实践应用**：通过练习巩固所学知识

## 🎯 学习建议

- 建立知识框架，形成系统化的理解
- 多做变式练习，举一反三
- 定期复习整理，查漏补缺

## 📚 拓展阅读

如果你对这个话题还想深入了解，建议查阅相关的教材和参考书，建立更完整的知识体系。

还有什么具体问题我可以帮你解答吗？`,
  }
}

/** 模拟 SSE 流式回调 */
export interface MockSSECallbacks {
  onThought: (step: IThoughtStep) => void
  onContent: (chunk: string) => void
  onDone: (sessionId: string) => void
}

/**
 * 模拟 SSE 流式响应
 * 逐步推送 thought → content → done 事件
 */
export async function simulateSSE(
  message: string,
  callbacks: MockSSECallbacks,
  signal?: AbortSignal
): Promise<string> {
  const sessionId = `mock-session-${Date.now()}`
  const response = generateResponse(message)

  // Phase 1: 逐步推送思考步骤（每个步骤间隔 400-600ms）
  for (const thought of response.thoughts) {
    if (signal?.aborted) return sessionId
    await delay(400 + Math.random() * 300)
    callbacks.onThought(thought)
  }

  // Phase 2: 逐字符推送内容（打字机效果，每 30-60ms 推送一个片段）
  const chars = response.content.split('')
  let buffer = ''
  const CHUNK_SIZE = 3 // 每次推送的字符数

  for (let i = 0; i < chars.length; i += CHUNK_SIZE) {
    if (signal?.aborted) return sessionId
    const chunk = chars.slice(i, i + CHUNK_SIZE).join('')
    buffer += chunk
    callbacks.onContent(chunk)
    await delay(25 + Math.random() * 35)
  }

  // Phase 3: 完成
  await delay(200)
  callbacks.onDone(sessionId)

  // 把 mock 消息存起来，方便后续加载
  const userMsg: IChatMessage = {
    id: Date.now(),
    session_id: sessionId,
    role: 'user',
    content: message,
    thought_chain: null,
    tool_calls: null,
    created_at: new Date().toISOString(),
  }
  const aiMsg: IChatMessage = {
    id: Date.now() + 1,
    session_id: sessionId,
    role: 'assistant',
    content: buffer,
    thought_chain: response.thoughts,
    tool_calls: null,
    created_at: new Date().toISOString(),
  }
  mockMessages[sessionId] = [userMsg, aiMsg]

  // 把新会话加入列表
  mockSessions[0].sessions.unshift({
    id: sessionId,
    user_id: 'mock-user',
    title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return sessionId
}

/** 检查是否启用 Mock（环境变量 或 localStorage） */
export function isMockEnabled(): boolean {
  return (
    import.meta.env.VITE_USE_MOCK === 'true' ||
    localStorage.getItem('zhiyi-use-mock') === '1'
  )
}
