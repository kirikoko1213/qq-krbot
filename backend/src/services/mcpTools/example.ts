/**
 * MCP 工具使用示例
 */
import { toolRegistry } from './toolRegistry.js';
import { Logger } from '../../utils/logger.js';

/**
 * 测试天气工具
 */
async function testWeatherTool() {
  console.log('=== 测试天气工具 ===');

  try {
    const result = await toolRegistry.callTool('weather', { city: '北京' });
    console.log('天气查询结果:', result);
  } catch (error) {
    console.error('天气工具测试失败:', error);
  }
}

/**
 * 测试 DNF 金币价格工具
 */
async function testDNFGoldTool() {
  console.log('\n=== 测试 DNF 金币价格工具 ===');

  try {
    const result = await toolRegistry.callTool('dnf_gold', {});
    console.log('DNF 金币价格查询结果:', result);
  } catch (error) {
    console.error('DNF 金币价格工具测试失败:', error);
  }
}

/**
 * 测试 QQ 群排行榜工具
 */
async function testQQGroupRankTool() {
  console.log('\n=== 测试 QQ 群排行榜工具 ===');

  try {
    const result = await toolRegistry.callTool('qq_group_message_rank', {
      groupId: '123456789',
    });
    console.log('QQ 群排行榜查询结果:', result);
  } catch (error) {
    console.error('QQ 群排行榜工具测试失败:', error);
  }
}

/**
 * 测试工具注册和管理
 */
async function testToolRegistry() {
  console.log('\n=== 测试工具注册中心 ===');

  // 获取所有工具
  const tools = toolRegistry.getAllToolDefinitions();
  console.log('已注册的工具数量:', tools.length);
  console.log(
    '工具列表:',
    tools.map(t => t.name)
  );

  // 获取统计信息
  const stats = toolRegistry.getStats();
  console.log('工具统计信息:', stats);

  // 检查工具是否存在
  console.log('天气工具是否存在:', toolRegistry.hasTool('weather'));
  console.log('不存在的工具:', toolRegistry.hasTool('non_existent_tool'));
}

/**
 * 批量测试所有工具
 */
async function testAllTools() {
  console.log('🚀 开始测试所有 MCP 工具...\n');

  // 测试工具注册中心
  await testToolRegistry();

  // 测试天气工具（需要 API key）
  if (process.env.JUHE_KEY_SIMPLE_WEATHER) {
    await testWeatherTool();
  } else {
    console.log(
      '\n⚠️  跳过天气工具测试（缺少 JUHE_KEY_SIMPLE_WEATHER 环境变量）'
    );
  }

  // 测试 DNF 金币价格工具
  await testDNFGoldTool();

  // 测试 QQ 群排行榜工具
  await testQQGroupRankTool();

  console.log('\n✅ 所有工具测试完成！');
}

/**
 * 模拟 AI 助手调用工具的场景
 */
async function simulateAIAssistant() {
  console.log('\n=== 模拟 AI 助手调用工具 ===');

  const queries = [
    {
      question: '用户问：今天北京天气怎么样？',
      toolCall: { name: 'weather', args: { city: '北京' } },
    },
    {
      question: '用户问：我们群今天谁发言最多？',
      toolCall: {
        name: 'qq_group_message_rank',
        args: { groupId: '123456789' },
      },
    },
    {
      question: '用户问：DNF 金币现在什么价格？',
      toolCall: { name: 'dnf_gold', args: {} },
    },
  ];

  for (const query of queries) {
    console.log(`\n📝 ${query.question}`);
    console.log(`🔧 AI 决定调用工具: ${query.toolCall.name}`);

    try {
      const result = await toolRegistry.callTool(
        query.toolCall.name,
        query.toolCall.args
      );

      if (result.success) {
        console.log(`✅ 工具调用成功:`);
        console.log(result.content);
      } else {
        console.log(`❌ 工具调用失败: ${result.error}`);
      }
    } catch (error) {
      console.error(`💥 工具调用异常:`, error);
    }
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAllTools()
    .then(() => simulateAIAssistant())
    .catch(error => {
      Logger.error('MCP 工具测试失败', error);
      process.exit(1);
    });
}

export {
  testWeatherTool,
  testDNFGoldTool,
  testQQGroupRankTool,
  testToolRegistry,
  testAllTools,
  simulateAIAssistant,
};
