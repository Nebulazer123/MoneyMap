import { NextRequest, NextResponse } from 'next/server';

/**
 * Random User Generator API - Generate realistic user profiles
 * FREE, no auth required!
 * 
 * Docs: https://randomuser.me/documentation
 * Rate limit: Unlimited (be polite, 1 req/sec max)
 * Cache: 7 days for user profiles
 * 
 * Use cases:
 * - Generate demo household members
 * - Create profile pictures for account owners
 * - Generate realistic contact info
 */

const RANDOMUSER_BASE = 'https://randomuser.me/api';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const count = Math.min(parseInt(searchParams.get('count') || '5'), 20);
    const gender = searchParams.get('gender'); // male, female, or omit for both
    const nationality = searchParams.get('nat') || 'us'; // Country code
    
    try {
        const params = new URLSearchParams({
            results: count.toString(),
            nat: nationality,
            inc: 'name,email,picture,location,phone,dob,login',
        });
        
        if (gender) {
            params.set('gender', gender);
        }
        
        const response = await fetch(`${RANDOMUSER_BASE}/?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`Random User API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform to our format
        const users = data.results.map((user: RandomUserResult) => ({
            id: user.login.uuid,
            name: {
                first: user.name.first,
                last: user.name.last,
                full: `${user.name.first} ${user.name.last}`,
            },
            email: user.email,
            phone: user.phone,
            age: user.dob.age,
            picture: {
                thumbnail: user.picture.thumbnail,
                medium: user.picture.medium,
                large: user.picture.large,
            },
            location: {
                city: user.location.city,
                state: user.location.state,
                country: user.location.country,
            },
        }));
        
        return NextResponse.json({
            users,
            count: users.length,
            nationality,
        });
    } catch (error) {
        console.error('Random User API error:', error);
        
        // Return fallback placeholder users
        const fallbackUsers = Array.from({ length: count }, (_, i) => ({
            id: crypto.randomUUID(),
            name: {
                first: `User`,
                last: `${i + 1}`,
                full: `User ${i + 1}`,
            },
            email: `user${i + 1}@example.com`,
            phone: '555-0100',
            age: 30,
            picture: {
                thumbnail: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
                medium: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
                large: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            },
            location: {
                city: 'Unknown',
                state: 'Unknown',
                country: 'US',
            },
            fallback: true,
        }));
        
        return NextResponse.json({
            users: fallbackUsers,
            count: fallbackUsers.length,
            fallback: true,
        });
    }
}

/**
 * Generate household members for demo
 */
export async function POST(request: NextRequest) {
    try {
        const { 
            householdSize = 4,
            includeChildren = true,
        } = await request.json();
        
        const safeSize = Math.min(householdSize, 10);
        
        // Fetch adults
        const adultsResponse = await fetch(
            `${RANDOMUSER_BASE}/?results=2&nat=us&inc=name,email,picture,dob,login`
        );
        
        if (!adultsResponse.ok) {
            throw new Error('Failed to fetch adults');
        }
        
        const adultsData = await adultsResponse.json();
        const adults = adultsData.results.map((user: RandomUserResult, index: number) => ({
            id: user.login.uuid,
            name: `${user.name.first} ${user.name.last}`,
            email: user.email,
            picture: user.picture.medium,
            role: index === 0 ? 'Primary' : 'Spouse',
            age: user.dob.age,
            isAdult: true,
        }));
        
        const household = [...adults];
        
        // Add children if requested
        if (includeChildren && safeSize > 2) {
            const childCount = safeSize - 2;
            const childNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery'];
            
            for (let i = 0; i < childCount; i++) {
                household.push({
                    id: crypto.randomUUID(),
                    name: childNames[i % childNames.length] + ' ' + adults[0].name.split(' ')[1],
                    email: null,
                    picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=child${i}`,
                    role: 'Child',
                    age: 8 + Math.floor(Math.random() * 10),
                    isAdult: false,
                });
            }
        }
        
        return NextResponse.json({
            household,
            adults: adults.length,
            children: household.length - adults.length,
            total: household.length,
        });
    } catch {
        return NextResponse.json({ 
            error: 'Failed to generate household' 
        }, { status: 500 });
    }
}

interface RandomUserResult {
    login: { uuid: string };
    name: { first: string; last: string };
    email: string;
    phone: string;
    dob: { age: number };
    picture: { thumbnail: string; medium: string; large: string };
    location: { city: string; state: string; country: string };
}
