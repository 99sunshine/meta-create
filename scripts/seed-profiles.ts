/**
 * MetaCreate — Seed script for 20+ demo creator profiles.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
 *   npx tsx scripts/seed-profiles.ts
 *
 * This script uses the Supabase service role key (bypasses RLS) to:
 * 1. Create auth users via admin API
 * 2. Insert matching profile rows
 *
 * All passwords default to "MetaCreate2025!" — change before sharing.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DEFAULT_PASSWORD = 'MetaCreate2025!'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

interface SeedProfile {
  email: string
  name: string
  role: 'Visionary' | 'Builder' | 'Strategist' | 'Connector'
  school: string
  city: string
  skills: string[]
  interests: string[]
  availability: 'available' | 'flexible' | 'evenings' | 'unavailable'
  hackathon_track: string
  manifesto: string
  looking_for: string[]
  ai_tags: string[]
}

const PROFILES: SeedProfile[] = [
  {
    email: 'alex.zhang@metacreate.demo',
    name: 'Alex Zhang', role: 'Builder',
    school: 'Tsinghua University', city: 'Beijing',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    interests: ['AI', 'Developer Tools', 'Open Source'],
    availability: 'available', hackathon_track: 'AI & Data',
    manifesto: 'Building tools that make creators more powerful every day.',
    looking_for: ['Visionary', 'Strategist'],
    ai_tags: ['full-stack', 'open-source enthusiast', 'fast learner'],
  },
  {
    email: 'mia.chen@metacreate.demo',
    name: 'Mia Chen', role: 'Visionary',
    school: 'CAFA', city: 'Beijing',
    skills: ['Figma', 'Prototyping', 'Branding', 'UX Research'],
    interests: ['Design Systems', 'Motion', 'Creative Technology'],
    availability: 'flexible', hackathon_track: 'Creative Tech',
    manifesto: 'Design is the bridge between imagination and execution.',
    looking_for: ['Builder', 'Connector'],
    ai_tags: ['design thinker', 'visual storyteller', 'UX-focused'],
  },
  {
    email: 'james.li@metacreate.demo',
    name: 'James Li', role: 'Strategist',
    school: 'CEIBS', city: 'Shanghai',
    skills: ['Product Strategy', 'Growth Hacking', 'Market Research', 'SQL'],
    interests: ['SaaS', 'Creator Economy', 'FinTech'],
    availability: 'available', hackathon_track: 'Business & Society',
    manifesto: 'Strategy without execution is just a dream. I close the gap.',
    looking_for: ['Builder', 'Visionary'],
    ai_tags: ['strategic thinker', 'data-driven', 'growth mindset'],
  },
  {
    email: 'sophie.wang@metacreate.demo',
    name: 'Sophie Wang', role: 'Connector',
    school: 'Peking University', city: 'Beijing',
    skills: ['Community Building', 'Social Media', 'Content Strategy', 'PR'],
    interests: ['Social Impact', 'EdTech', 'Youth Culture'],
    availability: 'evenings', hackathon_track: 'Education & Society',
    manifesto: 'People are the product. I build communities that last.',
    looking_for: ['Visionary', 'Builder'],
    ai_tags: ['community catalyst', 'storyteller', 'connector'],
  },
  {
    email: 'ryan.liu@metacreate.demo',
    name: 'Ryan Liu', role: 'Builder',
    school: 'Shanghai Jiao Tong University', city: 'Shanghai',
    skills: ['Python', 'Machine Learning', 'PyTorch', 'FastAPI'],
    interests: ['Computer Vision', 'NLP', 'Robotics'],
    availability: 'available', hackathon_track: 'AI & Data',
    manifesto: 'Training models by day, training myself by night.',
    looking_for: ['Strategist', 'Connector'],
    ai_tags: ['AI researcher', 'ML engineer', 'problem solver'],
  },
  {
    email: 'luna.xu@metacreate.demo',
    name: 'Luna Xu', role: 'Visionary',
    school: 'China Academy of Art', city: 'Hangzhou',
    skills: ['Illustration', 'Motion Design', 'After Effects', 'Procreate'],
    interests: ['Generative Art', 'NFT', 'Immersive Experience'],
    availability: 'flexible', hackathon_track: 'Creative Tech',
    manifesto: 'Art meets algorithm. That\'s where magic lives.',
    looking_for: ['Builder', 'Strategist'],
    ai_tags: ['creative visionary', 'generative artist', 'boundary pusher'],
  },
  {
    email: 'kai.zhou@metacreate.demo',
    name: 'Kai Zhou', role: 'Builder',
    school: 'Fudan University', city: 'Shanghai',
    skills: ['Swift', 'SwiftUI', 'Kotlin', 'Firebase'],
    interests: ['Mobile Apps', 'HealthTech', 'Wearables'],
    availability: 'available', hackathon_track: 'HealthTech',
    manifesto: 'The best app you will ever use is the one you haven\'t built yet.',
    looking_for: ['Visionary', 'Connector'],
    ai_tags: ['mobile-first', 'product hacker', 'health nerd'],
  },
  {
    email: 'ivy.huang@metacreate.demo',
    name: 'Ivy Huang', role: 'Strategist',
    school: 'Wuhan University', city: 'Wuhan',
    skills: ['Business Development', 'Pitching', 'Excel', 'Canva'],
    interests: ['Startup Ecosystems', 'Impact Investing', 'Climate Tech'],
    availability: 'evenings', hackathon_track: 'Sustainability',
    manifesto: 'Profit and purpose don\'t have to be in conflict.',
    looking_for: ['Builder', 'Visionary'],
    ai_tags: ['impact-driven', 'BD specialist', 'sustainability champion'],
  },
  {
    email: 'ethan.ma@metacreate.demo',
    name: 'Ethan Ma', role: 'Builder',
    school: 'Zhejiang University', city: 'Hangzhou',
    skills: ['Solidity', 'Web3', 'React', 'Ethers.js'],
    interests: ['DeFi', 'DAO', 'Tokenomics'],
    availability: 'available', hackathon_track: 'Web3 & Blockchain',
    manifesto: 'Code is law. Let\'s write better laws together.',
    looking_for: ['Strategist', 'Connector'],
    ai_tags: ['Web3 native', 'smart contract dev', 'decentralization believer'],
  },
  {
    email: 'chloe.wu@metacreate.demo',
    name: 'Chloe Wu', role: 'Connector',
    school: 'Tongji University', city: 'Shanghai',
    skills: ['Event Planning', 'Partnerships', 'English', 'HubSpot'],
    interests: ['Innovation Ecosystems', 'Cross-cultural Exchange', 'Hackathons'],
    availability: 'flexible', hackathon_track: 'Open Innovation',
    manifesto: 'The best teams are built on trust. I earn it first.',
    looking_for: ['Visionary', 'Builder', 'Strategist'],
    ai_tags: ['super connector', 'ecosystem builder', 'multilingual'],
  },
  {
    email: 'noah.lin@metacreate.demo',
    name: 'Noah Lin', role: 'Builder',
    school: 'HKUST', city: 'Hong Kong',
    skills: ['Go', 'Kubernetes', 'Docker', 'AWS'],
    interests: ['Cloud Infrastructure', 'DevOps', 'Open Source'],
    availability: 'available', hackathon_track: 'Enterprise Tech',
    manifesto: 'If it can break under load, I\'ve already fixed it.',
    looking_for: ['Visionary', 'Strategist'],
    ai_tags: ['infra wizard', 'reliability engineer', 'open-source contributor'],
  },
  {
    email: 'bella.tang@metacreate.demo',
    name: 'Bella Tang', role: 'Visionary',
    school: 'Sun Yat-sen University', city: 'Guangzhou',
    skills: ['Product Management', 'User Research', 'JIRA', 'A/B Testing'],
    interests: ['Consumer Tech', 'Social Commerce', 'Gen-Z Trends'],
    availability: 'evenings', hackathon_track: 'Consumer & Commerce',
    manifesto: 'I don\'t just imagine better products. I ship them.',
    looking_for: ['Builder', 'Connector'],
    ai_tags: ['product intuition', 'Gen-Z insider', 'user advocate'],
  },
  {
    email: 'daniel.guo@metacreate.demo',
    name: 'Daniel Guo', role: 'Strategist',
    school: 'Renmin University', city: 'Beijing',
    skills: ['Financial Modeling', 'PowerPoint', 'Market Sizing', 'Tableau'],
    interests: ['Venture Capital', 'Deep Tech', 'Semiconductor'],
    availability: 'available', hackathon_track: 'Hard Tech',
    manifesto: 'Deep tech needs sharp thinking. I bring both.',
    looking_for: ['Builder', 'Visionary'],
    ai_tags: ['analytical', 'VC-minded', 'deep tech enthusiast'],
  },
  {
    email: 'zoe.feng@metacreate.demo',
    name: 'Zoe Feng', role: 'Builder',
    school: 'Nanjing University', city: 'Nanjing',
    skills: ['Vue.js', 'Django', 'Redis', 'Celery'],
    interests: ['EdTech', 'Open Education', 'Gamification'],
    availability: 'flexible', hackathon_track: 'Education & Society',
    manifesto: 'Learning is the only skill that compounds forever.',
    looking_for: ['Visionary', 'Connector'],
    ai_tags: ['edu-tech builder', 'full-stack dev', 'lifelong learner'],
  },
  {
    email: 'leo.jiang@metacreate.demo',
    name: 'Leo Jiang', role: 'Visionary',
    school: 'Xi\'an Jiaotong University', city: "Xi'an",
    skills: ['Hardware Prototyping', 'Arduino', 'Fusion 360', 'C++'],
    interests: ['IoT', 'Smart Cities', 'Maker Culture'],
    availability: 'available', hackathon_track: 'Hard Tech',
    manifesto: 'Atoms are the new bits. I build for both worlds.',
    looking_for: ['Builder', 'Strategist'],
    ai_tags: ['hardware hacker', 'IoT pioneer', 'maker'],
  },
  {
    email: 'grace.shen@metacreate.demo',
    name: 'Grace Shen', role: 'Connector',
    school: 'UIBE', city: 'Beijing',
    skills: ['Translation', 'Localization', 'Content Writing', 'SEO'],
    interests: ['Cross-border Commerce', 'Language Technology', 'Global Markets'],
    availability: 'evenings', hackathon_track: 'Open Innovation',
    manifesto: 'Language is the ultimate UX layer. I optimize it.',
    looking_for: ['Builder', 'Visionary'],
    ai_tags: ['global mindset', 'language pro', 'content strategist'],
  },
  {
    email: 'oliver.bao@metacreate.demo',
    name: 'Oliver Bao', role: 'Builder',
    school: 'USTC', city: 'Hefei',
    skills: ['Rust', 'WebAssembly', 'Systems Programming', 'Linux'],
    interests: ['Performance Engineering', 'Compilers', 'Low-level Tech'],
    availability: 'available', hackathon_track: 'Hard Tech',
    manifesto: 'Zero-cost abstractions. Maximum impact.',
    looking_for: ['Visionary', 'Strategist'],
    ai_tags: ['systems hacker', 'performance obsessed', 'Rust evangelist'],
  },
  {
    email: 'amy.qian@metacreate.demo',
    name: 'Amy Qian', role: 'Strategist',
    school: 'Xiamen University', city: 'Xiamen',
    skills: ['Marketing Analytics', 'Douyin', 'KOL Management', 'Copywriting'],
    interests: ['Brand Building', 'Influencer Economy', 'Gen-Z Culture'],
    availability: 'flexible', hackathon_track: 'Consumer & Commerce',
    manifesto: 'Virality is engineered, not wished for.',
    looking_for: ['Builder', 'Visionary'],
    ai_tags: ['growth hacker', 'brand builder', 'social media native'],
  },
  {
    email: 'chris.yang@metacreate.demo',
    name: 'Chris Yang', role: 'Builder',
    school: 'Harbin Institute of Technology', city: 'Harbin',
    skills: ['Computer Graphics', 'Unity', 'Unreal Engine', 'C#'],
    interests: ['XR / AR / VR', 'Spatial Computing', 'Game Dev'],
    availability: 'available', hackathon_track: 'Creative Tech',
    manifesto: 'Virtual worlds are the new canvas. Let\'s paint.',
    looking_for: ['Visionary', 'Connector'],
    ai_tags: ['XR developer', 'spatial computing pioneer', 'game dev'],
  },
  {
    email: 'nina.xie@metacreate.demo',
    name: 'Nina Xie', role: 'Visionary',
    school: 'Nankai University', city: 'Tianjin',
    skills: ['Service Design', 'Workshop Facilitation', 'Miro', 'Design Sprint'],
    interests: ['Human-centered Design', 'Public Services', 'Behavioral Science'],
    availability: 'evenings', hackathon_track: 'Business & Society',
    manifesto: 'Every system was designed by someone. Let\'s redesign them better.',
    looking_for: ['Builder', 'Strategist'],
    ai_tags: ['systems thinker', 'facilitator', 'change maker'],
  },
  {
    email: 'kevin.peng@metacreate.demo',
    name: 'Kevin Peng', role: 'Connector',
    school: 'Sichuan University', city: 'Chengdu',
    skills: ['Investor Relations', 'Networking', 'Pitch Deck', 'LinkedIn'],
    interests: ['Angel Investing', 'Startup Mentorship', 'Chengdu Tech Scene'],
    availability: 'available', hackathon_track: 'Open Innovation',
    manifesto: 'I invest in people before products.',
    looking_for: ['Visionary', 'Builder'],
    ai_tags: ['connector', 'startup scout', 'investor-minded'],
  },
  {
    email: 'wendy.cao@metacreate.demo',
    name: 'Wendy Cao', role: 'Builder',
    school: 'Chongqing University', city: 'Chongqing',
    skills: ['Data Engineering', 'Spark', 'Airflow', 'dbt', 'Snowflake'],
    interests: ['Data Platforms', 'Real-time Analytics', 'Open Data'],
    availability: 'flexible', hackathon_track: 'AI & Data',
    manifesto: 'Data is inert until someone builds the pipeline. That\'s me.',
    looking_for: ['Visionary', 'Strategist'],
    ai_tags: ['data engineer', 'pipeline builder', 'analytics lover'],
  },
]

async function run() {
  let created = 0
  let skipped = 0

  for (const p of PROFILES) {
    try {
      // Create auth user
      const { data: userRes, error: authErr } = await admin.auth.admin.createUser({
        email: p.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      })

      if (authErr) {
        if (authErr.message.includes('already registered')) {
          console.log(`⏭  Skipped (exists): ${p.email}`)
          skipped++
          continue
        }
        throw authErr
      }

      const userId = userRes.user.id

      // Upsert profile
      const { error: profileErr } = await admin
        .from('profiles')
        .upsert({
          id: userId,
          name: p.name,
          role: p.role,
          school: p.school,
          city: p.city,
          skills: p.skills,
          interests: p.interests,
          availability: p.availability,
          hackathon_track: p.hackathon_track,
          manifesto: p.manifesto,
          looking_for: p.looking_for,
          ai_tags: p.ai_tags,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileErr) throw profileErr

      console.log(`✅ Created: ${p.name} <${p.email}>`)
      created++
    } catch (e) {
      console.error(`❌ Failed for ${p.email}:`, (e as Error).message)
    }
  }

  console.log(`\n🎉 Done: ${created} created, ${skipped} skipped, ${PROFILES.length - created - skipped} failed`)
}

run()
