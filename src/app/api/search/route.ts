import { NextRequest, NextResponse } from "next/server";
import { AxiosError } from "axios";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  answer: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { query, max_results = 3, include_domains = [] } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!TAVILY_API_KEY) {
      return NextResponse.json({ error: "Tavily API key missing" }, { status: 500 });
    }

    const domainInfo = include_domains.length > 0 ? include_domains.join(", ") : "all domains";
    console.log(`🔍 Tavily search: "${query}" (max: ${max_results}, domains: ${domainInfo})`);

    // Match Tavily's actual API format
    const tavilyRequest: {
      api_key: string;
      query: string;
      max_results: number;
      include_answer: boolean;
      include_raw_content: boolean;
      include_domains?: string[];
    } = {
      api_key: TAVILY_API_KEY,
      query,
      max_results,
      include_answer: true,
      include_raw_content: false
    };

    // Only add include_domains if array has values
    if (include_domains && include_domains.length > 0) {
      tavilyRequest.include_domains = include_domains;
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tavilyRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Tavily API error:", errorText);
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data: TavilyResponse = await response.json();
    
    console.log(`✅ Tavily returned ${data.results?.length || 0} results`);
    
    // 🚀 ADD EDGE CACHING FOR SEARCH RESULTS
    const successResponse = NextResponse.json({ 
      results: data.results || [],
      answer: data.answer || null
    });
    
    // Cache search results for 10 minutes (EY.com content doesn't change frequently)
    // Different queries get cached separately due to automatic cache key generation
    successResponse.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    
    return successResponse;

  } catch (err) {
    const error = err as AxiosError<{ error?: { message?: string } }>;
    
    // Don't cache error responses
    const errorResponse = NextResponse.json(
      { error: error.response?.data?.error?.message || error.message || "Search failed" },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-cache');
    return errorResponse;
  }
}