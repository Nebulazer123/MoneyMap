/**
 * Retry utility with exponential backoff
 * 
 * @param fn - Function to retry (should return a Promise)
 * @param options - Retry configuration
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        shouldRetry?: (error: unknown) => boolean;
    } = {}
): Promise<T> {
    const {
        maxRetries = 2,
        initialDelay = 1000, // 1 second
        maxDelay = 4000,
        shouldRetry = (error: unknown) => {
            // Default: retry on network errors and 5xx status codes
            if (error instanceof Error) {
                // Network errors (fetch failures)
                if (error.message.includes('fetch') || error.message.includes('network')) {
                    return true;
                }
            }
            // Check if error has status property (HTTP errors)
            if (typeof error === 'object' && error !== null && 'status' in error) {
                const status = (error as { status: number }).status;
                // Retry on 5xx errors (server errors)
                return status >= 500 && status < 600;
            }
            return false;
        },
    } = options;

    let lastError: unknown;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry if we've exhausted retries
            if (attempt >= maxRetries) {
                break;
            }

            // Don't retry if shouldRetry returns false
            if (!shouldRetry(error)) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, maxDelay); // Exponential backoff, capped at maxDelay
        }
    }

    // All retries exhausted
    throw lastError;
}
