/**
 * HTTP Client to push token statistics payload to a remote backend server
 */

/**
 * Pushes the exported token data payload to the remote server.
 * @param {string} endpoint Full URL e.g. "http://localhost:9527/token-stats/sync"
 * @param {string} secretKey Sync secret key
 * @param {object} payload JSON payload prepared by exportDataForSync
 * @param {number} [timeoutMs=10000] Timeout in milliseconds
 * @returns {Promise<{ success: boolean, message?: string, error?: string, status?: number, data?: any }>}
 */
async function pushTokenStatsToRemote(endpoint, secretKey, payload, timeoutMs = 10000) {
  if (!endpoint || !endpoint.trim()) {
    return { success: false, error: '未配置同步接口地址 (Endpoint is empty)' };
  }

  const cleanUrl = endpoint.trim();
  const cleanKey = (secretKey || '').trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Antigravity-Quota-Token-Monitor',
    };
    if (cleanKey) {
      headers['x-sync-secret'] = cleanKey;
      headers['Authorization'] = `Bearer ${cleanKey}`;
    }

    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let responseData = null;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        message: '同步成功',
        data: responseData,
      };
    } else {
      let errMsg = `HTTP ${response.status} ${response.statusText}`;
      if (responseData && typeof responseData === 'object') {
        errMsg = responseData.message || responseData.error || errMsg;
      } else if (typeof responseData === 'string' && responseData.length < 200) {
        errMsg = responseData;
      }
      return {
        success: false,
        status: response.status,
        error: errMsg,
        data: responseData,
      };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: `请求超时 (Timeout after ${timeoutMs / 1000}s)` };
    }
    return { success: false, error: err.message || '网络连接失败' };
  }
}

module.exports = {
  pushTokenStatsToRemote,
};
