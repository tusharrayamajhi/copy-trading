/**
 * Solana RPC Rate Limiter & Cache
 * Implements limits based on Public Devnet RPC constraints:
 * - Total Requests: 100 per 10 seconds
 * - Per-Method Requests: 40 per 10 seconds
 * - Concurrent Connections: 40
 * - Data Volume: 100 MB per 30 seconds
 * 
 * Additionally implements:
 * - Simple request caching (1s TTL) to reduce redundant calls
 * - Exponential backoff for 429 errors
 */

export const RPC_LIMITS = {
    TOTAL_REQUESTS: 100,
    TOTAL_WINDOW_MS: 10000,
    METHOD_REQUESTS: 40,
    METHOD_WINDOW_MS: 10000,
    CONCURRENT_REQUESTS: 40,
    DATA_VOLUME_MB: 100,
    DATA_WINDOW_MS: 30000,
    CACHE_TTL_MS: 1000, // 1 second cache for identical requests
    MAX_RETRIES: 5,
};

class RpcLimiter {
    private requests: number[] = [];
    private methodRequests: Map<string, number[]> = new Map();
    private activeRequests = 0;
    private dataUsage: { time: number; size: number }[] = [];
    private cache = new Map<string, { data: any; timestamp: number; headers: any; status: number; statusText: string }>();

    private async waitOnCondition(condition: () => boolean, interval = 50) {
        while (condition()) {
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    async throttle(method?: string) {
        // 1. Manage Concurrency
        await this.waitOnCondition(() => this.activeRequests >= RPC_LIMITS.CONCURRENT_REQUESTS);

        // 2. Manage Total Volume (Sliding Window)
        this.requests = this.requests.filter(t => Date.now() - t < RPC_LIMITS.TOTAL_WINDOW_MS);
        await this.waitOnCondition(() => {
            this.requests = this.requests.filter(t => Date.now() - t < RPC_LIMITS.TOTAL_WINDOW_MS);
            return this.requests.length >= RPC_LIMITS.TOTAL_REQUESTS;
        });

        // 3. Manage Per-Method Volume
        if (method) {
            let methodTimes = this.methodRequests.get(method) || [];
            methodTimes = methodTimes.filter(t => Date.now() - t < RPC_LIMITS.METHOD_WINDOW_MS);
            await this.waitOnCondition(() => {
                let currentTimes = this.methodRequests.get(method) || [];
                currentTimes = currentTimes.filter(t => Date.now() - t < RPC_LIMITS.METHOD_WINDOW_MS);
                this.methodRequests.set(method, currentTimes);
                return currentTimes.length >= RPC_LIMITS.METHOD_REQUESTS;
            });
        }

        // 4. Manage Data Volume
        this.dataUsage = this.dataUsage.filter(d => Date.now() - d.time < RPC_LIMITS.DATA_WINDOW_MS);
        await this.waitOnCondition(() => {
            this.dataUsage = this.dataUsage.filter(d => Date.now() - d.time < RPC_LIMITS.DATA_WINDOW_MS);
            const currentMB = this.dataUsage.reduce((acc, d) => acc + d.size, 0) / (1024 * 1024);
            return currentMB >= RPC_LIMITS.DATA_VOLUME_MB;
        }, 200);

        // Increment trackers
        this.activeRequests++;
        const timestamp = Date.now();
        this.requests.push(timestamp);
        if (method) {
            const times = this.methodRequests.get(method) || [];
            times.push(timestamp);
            this.methodRequests.set(method, times);
        }
    }

    recordResponse(sizeBytes: number) {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.dataUsage.push({ time: Date.now(), size: sizeBytes });
    }

    getCache(key: string) {
        const entry = this.cache.get(key);
        if (entry && Date.now() - entry.timestamp < RPC_LIMITS.CACHE_TTL_MS) {
            return entry;
        }
        return null;
    }

    setCache(key: string, response: { data: any; headers: any; status: number; statusText: string }) {
        this.cache.set(key, { ...response, timestamp: Date.now() });
    }
}

export const rpcLimiter = new RpcLimiter();

/**
 * Enhanced Fetch Middleware for @solana/web3.js Connection
 */
export const rpcThrottleMiddleware = async (
    info: RequestInfo | URL,
    options: RequestInit | undefined,
    fetch: (info: RequestInfo | URL, options?: RequestInit) => Promise<Response>
) => {
    let method = "unknown";
    let cacheKey = "";
    const url = info instanceof Request ? info.url : info.toString();

    try {
        if (options?.body) {
            const body = JSON.parse(options.body as string);
            method = body.method || "unknown";
            // Create a cache key from the request body (excluding ID which changes)
            const { id, ...rest } = body;
            cacheKey = `${url}:${JSON.stringify(rest)}`;
        }
    } catch (e) {}

    // 1. Check Cache (Only for read-only methods)
    const isReadOnly = method.startsWith("get") || method.startsWith("is") || method.startsWith("minimum");
    if (isReadOnly && cacheKey) {
        const cached = rpcLimiter.getCache(cacheKey);
        if (cached) {
            return new Response(cached.data, {
                status: cached.status,
                statusText: cached.statusText,
                headers: cached.headers
            });
        }
    }

    let retries = 0;
    let lastError: any;

    while (retries <= RPC_LIMITS.MAX_RETRIES) {
        await rpcLimiter.throttle(method);

        try {
            const response = await fetch(info, options);
            
            if (response.status === 429) {
                rpcLimiter.recordResponse(0);
                const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 500;
                console.warn(`RPC Rate Limit hit. Retrying in ${waitTime.toFixed(0)}ms...`);
                await new Promise(r => setTimeout(r, waitTime));
                retries++;
                continue;
            }

            // Clone and record size
            const contentLength = response.headers.get("content-length");
            const size = contentLength ? parseInt(contentLength) : 2048;
            rpcLimiter.recordResponse(size);

            // Cache successful read-only responses
            if (response.ok && isReadOnly && cacheKey) {
                const text = await response.text();
                rpcLimiter.setCache(cacheKey, {
                    data: text,
                    headers: Object.fromEntries(response.headers.entries()),
                    status: response.status,
                    statusText: response.statusText
                });
                
                // Return a proper Response object since we consumed the body
                return new Response(text, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            }

            return response;
        } catch (error) {
            rpcLimiter.recordResponse(0);
            lastError = error;
            const waitTime = Math.pow(2, retries) * 1000;
            await new Promise(r => setTimeout(r, waitTime));
            retries++;
        }
    }

    throw lastError || new Error("Max retries exceeded for RPC request");
};
