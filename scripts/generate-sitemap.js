// Generate sitemap.xml for PollPeak
import 'dotenv/config';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase credentials not found in environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get the base URL from environment or use a default
const baseUrl = process.env.VITE_SITE_URL || 'https://pollpeak.com';

// Define static routes
const staticRoutes = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/polls', changefreq: 'hourly', priority: 0.9 },
  { url: '/trivia', changefreq: 'daily', priority: 0.8 },
  { url: '/leaderboard', changefreq: 'daily', priority: 0.7 },
  { url: '/rewards', changefreq: 'weekly', priority: 0.6 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.5 },
  { url: '/terms-of-service', changefreq: 'monthly', priority: 0.5 }
];

async function generateSitemap() {
  try {
    console.log('Generating sitemap...');
    
    // Fetch dynamic poll routes
    console.log('Fetching poll slugs from database...');
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(1000);
    
    if (pollsError) {
      console.error('Error fetching polls:', pollsError);
      polls = [];
    } else {
      console.log(`Found ${polls.length} active polls`);
    }
    
    // Fetch dynamic trivia game routes
    console.log('Fetching trivia games from database...');
    const { data: triviaGames, error: triviaError } = await supabase
      .from('trivia_games')
      .select('id, updated_at')
      .eq('is_active', true)
      .limit(500);
    
    if (triviaError) {
      console.error('Error fetching trivia games:', triviaError);
      triviaGames = [];
    } else {
      console.log(`Found ${triviaGames.length} active trivia games`);
    }
    
    // Create dynamic routes
    const dynamicRoutes = [
      // Poll detail pages
      ...(polls || []).map(poll => ({
        url: `/polls/${poll.slug}`,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: poll.updated_at
      })),
      
      // Trivia game pages
      ...(triviaGames || []).map(game => ({
        url: `/trivia/game/${game.id}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: game.updated_at
      }))
    ];
    
    // Combine static and dynamic routes
    const routes = [...staticRoutes, ...dynamicRoutes];
    
    // Create a sitemap stream
    const stream = new SitemapStream({ hostname: baseUrl });
    
    // Add URLs to the sitemap
    const data = Readable.from(routes).pipe(stream);
    
    // Generate XML
    const xml = await streamToPromise(data);
    
    // Write sitemap to file
    const outputPath = path.join(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(outputPath, xml.toString());
    
    console.log(`Sitemap generated successfully at ${outputPath}`);
    
    // Log some stats
    console.log(`Total URLs in sitemap: ${routes.length}`);
    console.log(`- Static routes: ${staticRoutes.length}`);
    console.log(`- Dynamic poll routes: ${polls?.length || 0}`);
    console.log(`- Dynamic trivia routes: ${triviaGames?.length || 0}`);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the sitemap generator
generateSitemap();