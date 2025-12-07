"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Newspaper, RefreshCw, Loader2, ExternalLink, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    image: string | null;
    source: string;
    publishedAt: string;
    author: string | null;
}

// Valid NewsAPI categories for /top-headlines endpoint
type NewsCategory = 'business' | 'technology' | 'general' | 'science';

export function NewsFeed() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [category, setCategory] = useState<NewsCategory>('business');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input (400ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Trigger search when debounced value changes
    useEffect(() => {
        if (debouncedSearch.trim()) {
            fetchNews(debouncedSearch);
        }
    }, [debouncedSearch]);

    const fetchNews = async (query?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = query
                ? `/api/news?q=${encodeURIComponent(query)}`
                : `/api/news?category=${category}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch news');
            }

            if (data.articles) {
                // Phase 1: Basic relevance sorting
                const sortedArticles = sortArticlesByRelevance(data.articles, query);
                setArticles(sortedArticles);
                setActiveSearch(query || '');
            } else {
                setArticles([]);
            }
        } catch (err) {
            console.error('Failed to fetch news:', err);
            setError('Unable to load news right now');
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Phase 1: Basic relevance sorting function
    // Phase 2 will refine with deeper algorithms
    const sortArticlesByRelevance = (articles: NewsArticle[], query?: string) => {
        if (!query) {
            // No search query: sort by recency only
            return articles.sort((a, b) =>
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );
        }

        const lowerQuery = query.toLowerCase();

        return articles.sort((a, b) => {
            // Calculate relevance scores
            let scoreA = 0;
            let scoreB = 0;

            // Priority 1: Title match (highest priority)
            if (a.title.toLowerCase().includes(lowerQuery)) scoreA += 100;
            if (b.title.toLowerCase().includes(lowerQuery)) scoreB += 100;

            // Priority 2: Description match
            if (a.description?.toLowerCase().includes(lowerQuery)) scoreA += 50;
            if (b.description?.toLowerCase().includes(lowerQuery)) scoreB += 50;

            // Priority 3: Source match
            if (a.source.toLowerCase().includes(lowerQuery)) scoreA += 25;
            if (b.source.toLowerCase().includes(lowerQuery)) scoreB += 25;

            // Priority 4: Recency (newer = higher score, max 10 points)
            const daysDiffA = (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
            const daysDiffB = (Date.now() - new Date(b.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
            scoreA += Math.max(0, 10 - daysDiffA);
            scoreB += Math.max(0, 10 - daysDiffB);

            return scoreB - scoreA;
        });
    };

    useEffect(() => {
        fetchNews();
    }, [category]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            fetchNews(searchQuery);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setActiveSearch('');
        fetchNews();
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Recent News</h3>
                </div>
                <button
                    onClick={() => fetchNews(activeSearch || undefined)}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4 text-zinc-400", isLoading && "animate-spin")} />
                </button>
            </div>

            {/* Search & Category Selector */}
            <div className="mb-6 space-y-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search news... (e.g., 'bitcoin', 'tesla')"
                            className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded transition-colors"
                            >
                                <X className="h-3.5 w-3.5 text-zinc-500" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors border border-blue-500/30 font-medium"
                    >
                        Search
                    </button>
                </form>

                {!activeSearch && (
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setCategory('business')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                category === 'business'
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/70"
                            )}
                        >
                            Business
                        </button>
                        <button
                            onClick={() => setCategory('technology')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                category === 'technology'
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/70"
                            )}
                        >
                            Technology
                        </button>
                        <button
                            onClick={() => setCategory('general')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                category === 'general'
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/70"
                            )}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setCategory('science')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                category === 'science'
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/70"
                            )}
                        >
                            Science
                        </button>
                    </div>
                )}

                {activeSearch && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-400">Showing results for:</span>
                        <span className="text-white font-medium">&quot;{activeSearch}&quot;</span>
                        <button
                            onClick={clearSearch}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Articles */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <span className="ml-2 text-zinc-400">Loading news...</span>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-amber-400/80">{error}</p>
                    <button
                        onClick={() => fetchNews()}
                        className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                    >
                        Try again
                    </button>
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-zinc-500">No articles found</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {articles.map((article, index) => (
                        <a
                            key={index}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/70 hover:bg-zinc-900/60 transition-all group"
                        >
                            <div className="flex gap-4">
                                {article.image && (
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">
                                            {article.title}
                                        </h4>
                                        <ExternalLink className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    {article.description && (
                                        <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                                            {article.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                                        <span className="font-medium">{article.source}</span>
                                        <span>•</span>
                                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-500 text-center">
                    Powered by News API • {articles.length} articles
                </p>
            </div>
        </GlassCard>
    );
}
