import axios from 'axios';

/**
 * Creates a configured axios client.
 */
export const createApiClient = (baseURL = '') => {
  return axios.create({
    baseURL: baseURL || '',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 90000,
  });
};

/**
 * Helper to determine default URLs based on environment and sandbox ID
 */
export const getDefaultEndpoints = (sandboxId = '') => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // If we have a sandbox ID, the ingress or router resolves:
  // Agent: http://<sandboxid>.agent.localhost or port 3000
  // Preview: http://<sandboxid>.preview.localhost
  const defaultAgent = sandboxId
    ? (isLocalhost ? `http://${sandboxId}.agent.localhost` : `https://${sandboxId}.agent.localhost`)
    : '';

  const defaultPreview = sandboxId
    ? (isLocalhost ? `http://${sandboxId}.preview.localhost` : `https://${sandboxId}.preview.localhost`)
    : 'http://localhost:80';

  return {
    sandboxBaseUrl: '', // Relative by default, uses /api/sandbox/...
    agentBaseUrl: defaultAgent,
    aiBaseUrl: 'http://localhost:3002', // AI service runs on port 3002 (Ai/server.js)
    previewUrl: defaultPreview,
  };
};

/**
 * API call to create a new sandbox
 * Endpoint: POST /api/sandbox/create
 */
export const createSandboxApi = async (sandboxBaseUrl = '') => {
  const client = createApiClient(sandboxBaseUrl);
  try {
    const response = await client.post('/api/sandbox/create');
    return response.data;
  } catch (err) {
    // If relative proxy returned 503 or failed, fallback directly to Ingress (port 80)
    if (!sandboxBaseUrl || sandboxBaseUrl === '') {
      try {
        const ingressClient = createApiClient('http://localhost:80');
        const ingressResponse = await ingressClient.post('/api/sandbox/create');
        return ingressResponse.data;
      } catch (ingressErr) {
        // If port 80 failed, try Skaffold port-forward (port 8080)
        try {
          const skaffoldClient = createApiClient('http://localhost:8080');
          const skaffoldResponse = await skaffoldClient.post('/api/sandbox/create');
          return skaffoldResponse.data;
        } catch {
          // If all fallbacks fail, rethrow original error
          throw err;
        }
      }
    }
    throw err;
  }
};

/**
 * API call to list all files and directories in the workspace
 * Endpoint: GET /list-files
 */
export const listFilesApi = async (agentBaseUrl = '') => {
  const client = createApiClient(agentBaseUrl);
  const response = await client.get('/list-files');
  return response.data;
};

/**
 * API call to read a file from the workspace
 * Endpoint: GET /read-file?filepath=...
 */
export const readFileApi = async (filepath, agentBaseUrl = '') => {
  const client = createApiClient(agentBaseUrl);
  const response = await client.get('/read-file', {
    params: { filepath },
  });
  return response.data;
};

/**
 * API call to update files in the workspace
 * Endpoint: POST /update-files (with PATCH fallback)
 * Body: { files: [{ filepath, content }] }
 */
export const updateFilesApi = async (files, agentBaseUrl = '') => {
  const client = createApiClient(agentBaseUrl);
  // Prefer POST first: universally supported across all proxies and avoids preflight PATCH restrictions
  try {
    const response = await client.post('/update-files', { files });
    return response.data;
  } catch (postErr) {
    try {
      const patchResponse = await client.patch('/update-files', { files });
      return patchResponse.data;
    } catch {
      const postCreate = await client.post('/create-file', { files });
      return postCreate.data;
    }
  }
};

/**
 * API call to create a new file in the workspace
 * Endpoint: POST /create-file
 * Body: { files: [{ filepath, content }] }
 */
export const createFileApi = async (files, agentBaseUrl = '') => {
  const client = createApiClient(agentBaseUrl);
  const response = await client.post('/create-file', { files });
  return response.data;
};

/**
 * API call to generate code using AI
 * Endpoint: POST /ai/generate
 * Body: { code: string }
 * Supports streaming SSE response with live agent progress status
 */
export const generateAiCodeApi = async (code, aiBaseUrl = '', onChunk = null, onStatus = null) => {
  // Auto-resolve to port 3002 if localStorage has old port 3000/3001 or is empty
  let baseUrl = aiBaseUrl;
  if (!baseUrl || baseUrl.includes(':3000') || baseUrl.includes(':3001')) {
    baseUrl = 'http://localhost:3002';
  }
  const url = `${baseUrl.replace(/\/$/, '')}/ai/generate`;

  // If streaming callback is provided, use fetch ReadableStream to handle SSE chunks in real-time
  if (typeof window !== 'undefined' && window.fetch) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        let errMessage = `AI generation failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errMessage = errJson.error;
        } catch {
          // ignore parsing error
        }
        throw new Error(errMessage);
      }

      // Check if response is event stream
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            buffer += chunk;

            // Check if there are status events in the incoming chunk
            const lines = buffer.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const payload = line.slice('data:'.length).trim();
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed && (parsed.type === 'status' || parsed.step)) {
                    if (onStatus) onStatus(parsed);
                  }
                } catch {
                  // Regular code, ignore
                }
              }
            }
          }
        }

        // Process the full buffered SSE response after the stream ends.
        // The server sends each line of code as its own "data: <line>" entry,
        // so we reconstruct them back into a full code string, ignoring status JSON lines.
        const lines = buffer.split('\n');
        for (const line of lines) {
          // Skip SSE comments (": provider=...") and blank separator lines
          if (line.startsWith(':') || line === '' || line.startsWith('event:')) continue;

          if (line.startsWith('data:')) {
            const rawContent = line.slice('data:'.length);
            const content = rawContent.startsWith(' ') ? rawContent.slice(1) : rawContent;

            // Check if this data line is a status JSON payload
            try {
              const parsed = JSON.parse(content.trim());
              if (parsed && (parsed.type === 'status' || parsed.step)) {
                if (onStatus) onStatus(parsed);
                continue; // Do not include status event in source code
              }
            } catch {
              // Plain code line
            }

            accumulatedText += content + '\n';
          }
        }

        // Trim trailing newline added by the loop
        accumulatedText = accumulatedText.replace(/\n$/, '');
        if (onChunk) {
          onChunk(accumulatedText, accumulatedText);
        }
        return { generatedCode: accumulatedText, raw: accumulatedText };
      }

      // If not SSE, parse as JSON
      const data = await response.json();
      return data;
    } catch (fetchErr) {
      console.warn('Fetch stream error, falling back to axios:', fetchErr);
    }
  }

  // Axios fallback
  const client = createApiClient(aiBaseUrl);
  const response = await client.post('/ai/generate', { code });
  return response.data;
};

