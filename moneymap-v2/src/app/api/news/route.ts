import { NextRequest, NextResponse } from 'next/server';

type NewsApiArticle = {
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    source: { name: string };
    publishedAt: string;
    author?: string | null;
};

type NewsApiResponse = {
    status: string;
    articles: NewsApiArticle[];
    message?: string;
};

// News API
const NEWS_API_KEY = 'b04754f709c4439ea8e1a4a280c737cc';
const NEWS_BASE = 'https://newsapi.org/v2';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    // Search news by query
    const query = searchParams.get('q');
    if (query) {
        try {
            const response = await fetch(
                `${NEWS_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}&pageSize=20`
            );
            const data: NewsApiResponse = await response.json();
            
            if (data.status === 'ok') {
                return NextResponse.json({
                    articles: data.articles.map((article) => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        image: article.urlToImage,
                        source: article.source.name,
                        publishedAt: article.publishedAt,
                        author: article.author
                    }))
                });
            }
            
            return NextResponse.json({ error: data.message || 'Failed to fetch news' }, { status: 400 });
        } catch {
            return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
        }
    }

    // Get top business headlines (default)
    try {
        const category = searchParams.get('category') || 'business';
        const country = searchParams.get('country') || 'us';
        
        const response = await fetch(
            `${NEWS_BASE}/top-headlines?category=${category}&country=${country}&apiKey=${NEWS_API_KEY}&pageSize=20`
        );
        const data: NewsApiResponse = await response.json();
        
        if (data.status === 'ok') {
            return NextResponse.json({
                articles: data.articles.map((article) => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    image: article.urlToImage,
                    source: article.source.name,
                    publishedAt: article.publishedAt,
                    author: article.author
                }))
            });
        }
        
        return NextResponse.json({ error: data.message || 'Failed to fetch news' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
