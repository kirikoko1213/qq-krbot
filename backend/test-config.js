// 简单测试环境变量读取
const dotenv = require('dotenv');
const path = require('path');

// 加载 .env 文件
const envPath = path.resolve(__dirname, '.env');
console.log('🔍 测试环境变量读取...');
console.log('📂 .env 文件路径:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ .env 文件加载失败:', result.error.message);
} else {
  console.log('✅ .env 文件加载成功');
}

// 测试读取环境变量
const testVars = ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL', 'PORT', 'NODE_ENV'];

console.log('\n📋 环境变量测试结果:');
testVars.forEach(key => {
  const value = process.env[key];
  const isSecret = key.includes('API_KEY') || key.includes('PASSWORD');
  console.log(`  ${key}: ${value ? (isSecret ? '***已设置***' : value) : '❌未设置'}`);
});

console.log('\n🎯 测试完成！'); 