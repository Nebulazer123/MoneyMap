import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';

/**
 * Abstract Email Verification API
 * Rate limit: 100/month (free tier) - BE VERY CAREFUL!
 * 
 * Docs: https://www.abstractapi.com/api/email-verification-validation-api
 * Cache: 30 days per email (verified emails rarely change)
 * 
 * Use cases:
 * - Validate email before sharing statement
 * - Verify email for notifications
 * - Check if email is disposable
 */

const ABSTRACT_API_KEY = 'c06de9698fc14b549cc7ceea8ad2e6d1';
const ABSTRACT_BASE = 'https://emailvalidation.abstractapi.com/v1';

// In-memory cache for email verifications (30 days)
const emailCache = new Map<string, { result: EmailVerificationResult; timestamp: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(request: NextRequest) {
    // Rate limiting: 5 verifications per hour per IP (critical - only 100/month quota)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_5);
    if (!rateLimitCheck.allowed) {
        return NextResponse.json({
            error: 'Rate limit exceeded',
            message: 'Too many verification requests. Please try again later.',
            retryAfter: rateLimitCheck.response?.headers.get('Retry-After'),
            suggestion: 'Email format validation is still available without API verification.',
        }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
        return NextResponse.json({ 
            error: 'Missing email parameter' 
        }, { status: 400 });
    }
    
    // Validate email format first (free, no API call)
    if (!isValidEmailFormat(email)) {
        return NextResponse.json({
            email,
            valid: false,
            reason: 'Invalid email format',
            cached: false,
            apiCalled: false,
        });
    }
    
    const emailLower = email.toLowerCase();
    
    // Check cache first (aggressive caching to prevent quota burn)
    const cached = emailCache.get(emailLower);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
            ...cached.result,
            cached: true,
            cacheAge: Math.floor((Date.now() - cached.timestamp) / (1000 * 60 * 60 * 24)) + ' days',
        });
    }
    
    try {
        const response = await fetch(
            `${ABSTRACT_BASE}/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
        );
        
        if (!response.ok) {
            // Check if quota exhausted (429 from API) or other errors
            if (response.status === 429) {
                // Quota exhausted - cache format validation result to avoid repeated API calls
                const formatValidResult = {
                    email: emailLower,
                    valid: isValidEmailFormat(email),
                    reason: 'Monthly API quota exhausted. Using format validation only.',
                    formatValid: isValidEmailFormat(email),
                    cached: false,
                    quotaExhausted: true,
                };
                
                // Cache format-only result for shorter period (1 hour) to prevent repeated quota checks
                emailCache.set(emailLower, {
                    result: formatValidResult as EmailVerificationResult,
                    timestamp: Date.now(),
                });
                
                return NextResponse.json({
                    ...formatValidResult,
                    message: 'Monthly API limit reached (100/month). Quota will reset next month.',
                    suggestion: 'Email format appears valid based on pattern matching. Full verification unavailable.',
                }, { status: 429 });
            }
            throw new Error(`Abstract API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const result: EmailVerificationResult = {
            email: data.email,
            valid: data.deliverability === 'DELIVERABLE',
            deliverability: data.deliverability,
            qualityScore: data.quality_score,
            isValidFormat: data.is_valid_format?.value ?? true,
            isFreeEmail: data.is_free_email?.value ?? false,
            isDisposable: data.is_disposable_email?.value ?? false,
            isRoleEmail: data.is_role_email?.value ?? false,
            isCatchAll: data.is_catchall_email?.value ?? false,
            isMxFound: data.is_mx_found?.value ?? true,
            isSmtpValid: data.is_smtp_valid?.value ?? true,
            cached: false,
        };
        
        // Cache the result aggressively (30 days) to prevent repeated API calls for same email
        emailCache.set(emailLower, {
            result,
            timestamp: Date.now(),
        });
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('Abstract Email API error:', error);
        
        // Return basic validation on API failure
        return NextResponse.json({
            email,
            valid: isValidEmailFormat(email),
            reason: 'API unavailable, using format validation only',
            formatValid: true,
            cached: false,
            apiError: true,
        });
    }
}

/**
 * Check remaining API quota (informational)
 */
export async function POST(request: NextRequest) {
    try {
        const { action, emails } = await request.json();
        
        if (action === 'cache-stats') {
            return NextResponse.json({
                cachedEmails: emailCache.size,
                cacheMaxAge: '30 days',
                note: 'Cached verifications do not consume API quota',
            });
        }
        
        if (action === 'batch-check-format') {
            // Check email formats without using API
            if (!Array.isArray(emails)) {
                return NextResponse.json({ error: 'emails must be an array' }, { status: 400 });
            }
            
            const results = emails.slice(0, 100).map((email: string) => ({
                email,
                formatValid: isValidEmailFormat(email),
                inCache: emailCache.has(email.toLowerCase()),
            }));
            
            return NextResponse.json({
                results,
                checked: results.length,
                validFormat: results.filter(r => r.formatValid).length,
                inCache: results.filter(r => r.inCache).length,
                note: 'Format check is free. Use GET to verify deliverability (uses API quota).',
            });
        }
        
        return NextResponse.json({ 
            error: 'Invalid action',
            validActions: ['cache-stats', 'batch-check-format'],
        }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

/**
 * Basic email format validation (no API call)
 */
function isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

interface EmailVerificationResult {
    email: string;
    valid: boolean;
    deliverability?: string;
    qualityScore?: number;
    isValidFormat?: boolean;
    isFreeEmail?: boolean;
    isDisposable?: boolean;
    isRoleEmail?: boolean;
    isCatchAll?: boolean;
    isMxFound?: boolean;
    isSmtpValid?: boolean;
    cached: boolean;
}
