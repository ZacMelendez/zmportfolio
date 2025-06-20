"use server";

import https from "https";
import http from "http";
import { parseString } from "xml2js";
import { NextRequest } from "next/server";

/**
 * Next.js Server Action to get page count from website sitemap
 * @param {string} url - The website URL (e.g., 'https://example.com')
 * @returns {Promise<number|null>} Number of pages found, or null if failed
 */
async function getSitemapPageCount(url: string): Promise<number | null> {
    try {
        // Normalize URL
        const urlObj = new URL(url);

        // Try multiple common sitemap locations
        const sitemapUrls = [
            `${urlObj.protocol}//${urlObj.host}/sitemap.xml`,
            `${urlObj.protocol}//${urlObj.host}/sitemap_index.xml`,
            `${urlObj.protocol}//${urlObj.host}/sitemaps.xml`,
            `${urlObj.protocol}//${urlObj.host}/sitemap/sitemap.xml`,
            `${urlObj.protocol}//${urlObj.host}/wp-sitemap.xml`,
            `${urlObj.protocol}//${urlObj.host}/sitemap-index.xml`,
        ];

        let sitemapContent;
        let actualSitemapUrl;

        // Try each sitemap URL until one works
        for (const sitemapUrl of sitemapUrls) {
            try {
                const result = await fetchUrlWithRedirects(sitemapUrl);
                sitemapContent = result.content;
                actualSitemapUrl = result.finalUrl;
                break;
            } catch (error) {
                continue; // Try next URL
            }
        }

        if (!sitemapContent) {
            return null;
        }

        const parsedSitemap = await parseXml(sitemapContent);

        // Handle sitemap index (contains multiple sitemaps)
        if (parsedSitemap.sitemapindex) {
            return await processSitemapIndex(parsedSitemap.sitemapindex);
        }
        // Handle regular sitemap
        else if (parsedSitemap.urlset) {
            const urls = parsedSitemap.urlset.url || [];
            return urls.length;
        }

        return null;
    } catch (error) {
        console.error("Sitemap parsing error:", error);
        return null;
    }
}

/**
 * Fetches URL content with redirect following
 */
async function fetchUrlWithRedirects(
    url: string,
    maxRedirects = 5
): Promise<{ content: string; finalUrl: string }> {
    return new Promise((resolve, reject) => {
        let redirectCount = 0;

        function makeRequest(currentUrl: string) {
            const client = currentUrl.startsWith("https:") ? https : http;

            const req = client.get(
                currentUrl,
                {
                    timeout: 10000,
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; NextJS-SitemapCrawler/1.0)",
                    },
                },
                (res) => {
                    // Handle redirects
                    if (
                        res.statusCode &&
                        res.statusCode >= 300 &&
                        res.statusCode < 400 &&
                        res.headers.location
                    ) {
                        if (redirectCount >= maxRedirects) {
                            reject(new Error("Too many redirects"));
                            return;
                        }

                        redirectCount++;
                        const redirectUrl = new URL(
                            res.headers.location,
                            currentUrl
                        ).href;
                        makeRequest(redirectUrl);
                        return;
                    }

                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}`));
                        return;
                    }

                    // Check content type
                    const contentType = res.headers["content-type"] || "";
                    if (
                        !contentType.includes("xml") &&
                        !contentType.includes("text")
                    ) {
                        reject(new Error("Invalid content type"));
                        return;
                    }

                    let data = "";
                    res.on("data", (chunk) => (data += chunk));
                    res.on("end", () => {
                        resolve({
                            content: data,
                            finalUrl: currentUrl,
                        });
                    });
                }
            );

            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Request timeout"));
            });
        }

        makeRequest(url);
    });
}

/**
 * Parses XML string to object
 */
async function parseXml(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
        parseString(xml, { trim: true }, (err: any, result: any) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

/**
 * Processes sitemap index and counts all pages
 */
async function processSitemapIndex(sitemapIndex: any): Promise<number> {
    const sitemaps = sitemapIndex.sitemap || [];
    let totalPages = 0;

    // Process each sitemap in the index
    for (const sitemap of sitemaps) {
        try {
            const sitemapUrl = sitemap.loc[0];
            const result = await fetchUrlWithRedirects(sitemapUrl);
            const parsedSitemap = await parseXml(result.content);

            if (parsedSitemap.urlset) {
                const pageCount = (parsedSitemap.urlset.url || []).length;
                totalPages += pageCount;
            }
        } catch (error) {
            // Skip failed sitemaps, continue with others
            continue;
        }
    }

    return totalPages;
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return new Response("Missing 'url' parameter", { status: 400 });
    }

    try {
        const pageCount = await getSitemapPageCount(decodeURIComponent(url));
        if (pageCount === null) {
            return new Response("Failed to retrieve sitemap", { status: 500 });
        }
        return new Response(JSON.stringify({ pageCount }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in GET handler:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
