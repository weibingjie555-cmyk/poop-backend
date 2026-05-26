# 拉屎日记 - 后端服务

Vercel Edge Function，转发 AI 请求，隐藏 API Key。

## 部署步骤

1. 把这个文件夹上传到 GitHub 仓库
2. 在 Vercel 导入该仓库
3. 在 Vercel 项目设置里添加环境变量：
   - 变量名：`DEEPSEEK_API_KEY`
   - 变量值：你的 DeepSeek API Key（sk-xxx）
4. 部署完成后，接口地址为：`https://你的域名.vercel.app/api/ai`

## 接口说明

POST /api/ai

请求体：
```json
{
  "messages": [
    { "role": "system", "content": "系统提示词" },
    { "role": "user", "content": "用户消息" }
  ],
  "max_tokens": 800
}
```

返回：DeepSeek 原始响应
