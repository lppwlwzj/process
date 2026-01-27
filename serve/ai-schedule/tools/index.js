const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function retryWithBackoff(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
}

function wrapToolWithRetry(tool) {
  const originalFunc = tool.func;
  
  tool.func = async (...args) => {
    return retryWithBackoff(async () => {
      try {
        return await originalFunc(...args);
      } catch (error) {
        throw new Error(`工具调用失败: ${tool.name} - ${error.message}`);
      }
    });
  };
  
  return tool;
}

function handleToolError(error, toolName) {
  console.error(`工具错误 [${toolName}]:`, error);
  
  return {
    success: false,
    error: error.message || '未知错误',
    tool: toolName
  };
}

module.exports = {
  retryWithBackoff,
  wrapToolWithRetry,
  handleToolError
};
