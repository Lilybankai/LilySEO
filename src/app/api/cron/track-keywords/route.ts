import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serperApiKey = process.env.SERPER_API_KEY
const cronSecret = process.env.CRON_SECRET

if (!supabaseUrl || !supabaseServiceRoleKey || !serperApiKey || !cronSecret) {
  console.error('Missing required environment variables for keyword tracking cron job.')
  // Optionally throw an error or handle appropriately
}

// Initialize Supabase client with service role key
// Use service role key for backend operations like this cron job
const supabaseAdmin = createClient<Database>(
  supabaseUrl!,       // First argument: URL
  supabaseServiceRoleKey! // Second argument: Service Role Key
)

interface SerperResult {
  position: number;
  link: string;
}

interface OrganicResult {
  position: number;
  link: string;
}

interface SerperResponse {
  organic: OrganicResult[];
}

async function getKeywordRanking(keyword: string): Promise<SerperResult | null> {
  if (!serperApiKey) {
    console.error('Serper API key is not configured.')
    return null
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: keyword,
        gl: 'us', // Example: Geo-location US
        hl: 'en', // Example: Host language English
        num: 100, // Check top 100 results
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Serper API error for keyword "${keyword}": ${response.status} ${response.statusText}`, errorText)
      return null
    }

    const data: SerperResponse = await response.json()

    // Find the first result matching the target domain (simplified for now)
    // TODO: Make target domain matching more robust, potentially based on project URL
    // For now, just return the top result as an example
    if (data.organic && data.organic.length > 0) {
       // For this simple implementation, we just return the first result's rank and link
       // A real implementation might need to find the rank for the project's specific domain
      return {
        position: data.organic[0].position,
        link: data.organic[0].link,
      }
       // Example of finding specific domain (requires project URL context):
       // const targetDomain = getDomainFromProjectUrl(projectUrl); // Function needed
       // const foundRank = data.organic.find(result => result.link.includes(targetDomain));
       // return foundRank ? { position: foundRank.position, link: foundRank.link } : null;
    }

    return null // No ranking found in top 100
  } catch (error) {
    console.error(`Error fetching ranking for keyword "${keyword}":`, error)
    return null
  }
}

export async function GET(request: Request) {
  // 1. Authorize the request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized attempt to run keyword tracking cron job.')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('Starting weekly keyword tracking job...')
  const checkedAt = new Date().toISOString()
  let totalKeywordsProcessed = 0
  let totalProjectsProcessed = 0
  let failedKeywordLookups = 0

  try {
    // 2. Fetch all active projects with keywords
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, keywords, url') // Include URL if needed for domain matching
      .not('keywords', 'is', null) // Ensure keywords array is not null
      .filter('keywords', 'cs', '[]', false) // Ensure keywords array is not empty '[]'
      .eq('status', 'active') // Optional: Only track for active projects

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects', details: projectsError.message }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      console.log('No active projects with keywords found to track.')
      return NextResponse.json({ message: 'No projects to process' }, { status: 200 })
    }

    totalProjectsProcessed = projects.length
    console.log(`Found ${totalProjectsProcessed} projects with keywords.`)

    // 3. Process each project
    for (const project of projects) {
      if (!project.keywords || project.keywords.length === 0) {
        continue // Skip if somehow keywords are null/empty despite filter
      }

      const rankingsToInsert: Array<Database['public']['Tables']['keyword_rankings_history']['Insert']> = []
      console.log(`Processing project ${project.id} with keywords: ${project.keywords.join(', ')}`)

      for (const keyword of project.keywords) {
        totalKeywordsProcessed++
        const rankingData = await getKeywordRanking(keyword)

        if (rankingData) {
          rankingsToInsert.push({
            project_id: project.id,
            keyword: keyword,
            ranking: rankingData.position,
            url: rankingData.link, // URL found at that rank
            search_engine: 'google_us_en', // Example: Standardize this based on Serper params
            checked_at: checkedAt,
            // volume: null, // Set volume if available/implemented
          })
        } else {
          failedKeywordLookups++;
          // Optionally insert a record indicating no rank was found
          // rankingsToInsert.push({
          //   project_id: project.id,
          //   keyword: keyword,
          //   ranking: null, // Indicate no rank found
          //   url: null,
          //   search_engine: 'google_us_en',
          //   checked_at: checkedAt,
          // });
          console.warn(`Failed to get ranking for keyword "${keyword}" in project ${project.id}`)
        }
        // Add a small delay to avoid hitting API rate limits if necessary
        // await new Promise(resolve => setTimeout(resolve, 200)); // e.g., 200ms delay
      }

      // 4. Batch insert rankings for the project
      if (rankingsToInsert.length > 0) {
        const { error: insertError } = await supabaseAdmin
          // Cast to any temporarily to bypass strict type checking until types are regenerated
          // Ideally, regenerate Supabase types to include keyword_rankings_history
          .from('keyword_rankings_history' as any)
          .insert(rankingsToInsert as any)

        if (insertError) {
          console.error(`Error inserting rankings for project ${project.id}:`, insertError)
          // Decide how to handle partial failures - continue or stop?
        } else {
          console.log(`Successfully inserted ${rankingsToInsert.length} rankings for project ${project.id}.`)
        }
      }
    }

    console.log('Finished weekly keyword tracking job.')
    console.log(`Summary: Projects processed: ${totalProjectsProcessed}, Keywords processed: ${totalKeywordsProcessed}, Failed lookups: ${failedKeywordLookups}`)
    return NextResponse.json({
        message: 'Keyword tracking job completed successfully',
        projectsProcessed: totalProjectsProcessed,
        keywordsProcessed: totalKeywordsProcessed,
        failedLookups: failedKeywordLookups
    }, { status: 200 })

  } catch (error) {
    console.error('Unhandled error during keyword tracking job:', error)
    return NextResponse.json({ error: 'Internal server error during keyword tracking', details: (error as Error).message }, { status: 500 })
  }
}

// Required for Next.js Edge Functions / API Routes deployment specifics
export const dynamic = 'force-dynamic' // ensure the route is always executed dynamically 