const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const FormData = require('form-data');

// Set ffmpeg path if not in system PATH
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify Client
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const ffprobe = require('ffprobe-static');
ffmpeg.setFfprobePath(ffprobe.path);

async function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration);
        });
    });
}

async function transcribeChunk(chunkPath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(chunkPath));
    formData.append('model', 'saarika:v2.5');
    formData.append('language_code', 'unknown');

    const response = await axios.post('https://api.sarvam.ai/speech-to-text', formData, {
        headers: {
            ...formData.getHeaders(),
            'api-subscription-key': process.env.SARVAM_API_KEY
        }
    });
    return response.data.transcript || '';
}

async function processTranscription(audioPath, baseFilename, transcriptDir) {
    try {
        const duration = await getAudioDuration(audioPath);
        console.log(`Audio duration: ${duration}s`);

        let fullTranscript = '';

        if (duration <= 30) {
            console.log(`Transcribing ${path.basename(audioPath)} directly...`);
            fullTranscript = await transcribeChunk(audioPath);
        } else {
            console.log(`Audio is ${Math.round(duration)}s, splitting into chunks...`);
            const chunkDuration = 25; // Use 25s to be safe
            const numChunks = Math.ceil(duration / chunkDuration);

            for (let i = 0; i < numChunks; i++) {
                const startTime = i * chunkDuration;
                if (startTime >= duration) break;

                const chunkFilename = `${baseFilename}_part${i}.mp3`;
                const chunkPath = path.join(path.dirname(audioPath), chunkFilename);

                console.log(`Processing chunk ${i + 1}/${numChunks} (starts at ${startTime}s)...`);

                await new Promise((resolve, reject) => {
                    ffmpeg(audioPath)
                        .setStartTime(startTime)
                        .setDuration(chunkDuration)
                        .on('end', resolve)
                        .on('error', (err) => {
                            console.error(`Error splitting chunk ${i}:`, err);
                            reject(err);
                        })
                        .save(chunkPath);
                });

                try {
                    const chunkTranscript = await transcribeChunk(chunkPath);
                    if (chunkTranscript) {
                        fullTranscript += (fullTranscript ? ' ' : '') + chunkTranscript;
                    }
                } catch (err) {
                    console.error(`Error transcribing chunk ${i}:`, err.response?.data || err.message);
                    // Continue with other chunks if one fails? Or fail whole thing?
                    // Let's continue to get as much as possible.
                } finally {
                    // Clean up chunk
                    if (fs.existsSync(chunkPath)) {
                        try { fs.unlinkSync(chunkPath); } catch (e) { }
                    }
                }
            }
        }

        if (fullTranscript) {
            const transcriptPath = path.join(transcriptDir, `${baseFilename}.txt`);
            await fs.promises.writeFile(transcriptPath, fullTranscript);
            console.log(`Transcript saved: ${transcriptPath}`);
            return { transcript: fullTranscript, transcriptPath };
        }
    } catch (err) {
        console.error('Error during transcription process:', err.response?.data || err.message);
    }
    return null;
}

async function analyzeTranscript(transcript, baseFilename, analysisDir) {
    try {
        console.log(`Analyzing transcript for ${baseFilename} using Gemini...`);

        const prompt = `
Analyze the SPEAKER'S STYLE and DELIVERY in the following Instagram Reel transcript. Focus on how they speak, their personality, and communication patterns.
Provide a numerical rating (1 to 5) for each feature.

Features to rate:
- Voice Clarity: How clear and understandable is their speech?
- Confidence Level: How confident and assured do they sound?
- Energy & Enthusiasm: What's their energy level and passion in delivery?
- Speaking Pace: How well-paced is their speech? (too fast/slow/just right)
- Vocabulary Richness: Quality and variety of words used
- Authenticity: How genuine and natural does the speaker sound?
- Persuasiveness: How convincing is their delivery style?
- Articulation: How well do they pronounce and enunciate words?
- Emotional Expression: How well do they convey emotions through words?
- Professional Tone: How professional vs casual is their speaking style?

Additionally, provide:
1. Frequently Used Words / Phrases: List 3-5 words or phrases they repeat often
2. Speaking Style: Describe their overall speaking style in 1-2 sentences (e.g., casual, formal, conversational, energetic, calm)
3. Slang / Colloquialisms: Note any slang, filler words, or regional expressions used
4. Personality Indicators: What does their speech reveal about their personality? (2-3 traits)
5. Overall Feedback: 2-3 sentences summarizing their speaking strengths and areas for improvement

Transcript:
"${transcript}"
`;

        const result = await model.generateContent(prompt);
        const analysisOutput = result.response.text();

        const analysisPath = path.join(analysisDir, `${baseFilename}_analysis.txt`);
        await fs.promises.writeFile(analysisPath, analysisOutput);
        console.log(`Analysis saved: ${analysisPath}`);

        return { analysisOutput, analysisPath };
    } catch (err) {
        console.error('Error during Gemini analysis:', err.message);
        return null;
    }
}

async function generateNewContent(analyses, viralTranscript) {
    try {
        console.log(`Generating new reel remake script by combining ${analyses.length} analysis and a viral transcript...`);

        const prompt = `
You are an expert content strategist creating a VERBATIM TALKING SCRIPT for a NEW Instagram Reel. 
Your task is to REMAKE the content of a viral video into a script that matches a specific creator's unique speaking style and personality perfectly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SPEAKER ANALYSIS (From Their Previous Reels):

${analyses.join('\n\n━━━ ANALYSIS FROM NEXT REEL ━━━\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 VIRAL REFERENCE REEL TRANSCRIPT (Topic to Adapt):

"${viralTranscript}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 YOUR MISSION:

Write a WORD-FOR-WORD script that adapts the viral reel's topic. This is not a "content idea" or a "summary" - it is a script ready to be read aloud. 
The viewer should feel like this is 100% authentic to the speaker, matching their rhythm, energy, and vocabulary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 CRITICAL MATCHING REQUIREMENTS:

1️⃣ VOICE & DELIVERY REPLICATION:
   ✓ Match their Voice Clarity rating - speak as clearly (or casually) as they do
   ✓ Match their Confidence Level - be as assured or humble as they are
   ✓ Match their Energy & Enthusiasm - use their exact energy level
   ✓ Match their Speaking Pace - use their rhythm (fast/slow/varied)
   ✓ Match their Articulation style - pronunciate like they do
   ✓ Match their Professional Tone - be as formal or casual as they are

2️⃣ LINGUISTIC DNA:
   ✓ MUST USE their "Frequently Used Words/Phrases" naturally throughout
   ✓ Include their Slang/Colloquialisms if they use them
   ✓ Match their Vocabulary Richness level
   ✓ Reflect their Personality Indicators in every sentence
   ✓ Use their typical sentence structures and rhythm

3️⃣ EMOTIONAL & PERSUASIVE STYLE:
   ✓ Match their Emotional Expression level
   ✓ Match their Persuasiveness approach
   ✓ Match their Authenticity - stay true to how genuine they sound
   ✓ Use their natural persuasion techniques (logic/emotion/storytelling)

4️⃣ SCRIPT REQUIREMENTS:
   ✓ Write it exactly as the speaker would say it.
   ✓ Ensure the hook is immediate and in their tone.
   ✓ Translate the "points" of the viral video into natural spoken dialogue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OUTPUT FORMAT (STRICT):

[REMAKE SCRIPT]
(Write the full verbatim script here. Use a natural flow. Include any characteristic pauses or emphases the analysis suggests.)

[DELIVERY NOTES]
- Speaking pace: [fast/moderate/slow based on analysis]
- Key phrases to emphasize: [list 2-3 based on their frequent words]
- Suggested tone shifts: [any variations in energy/emotion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate the verbatim REMAKE SCRIPT now:
`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        if (err.message.includes('429') || err.message.includes('quota')) {
            console.error('Gemini Quota Exceeded during generation.');
            return "ERROR: AI Quota Exceeded. Please try again in a few minutes.";
        }
        console.error('Error generating new content:', err.message);
        return null;
    }
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/downloads', express.static(path.join(__dirname, '..', 'downloads')));

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

async function processReelFromItem(item, skipAnalysis = false) {
    const videoUrl = item.videoUrl || item.video_url || item.displayUrl;
    if (!videoUrl) return null;

    // Prepare directories
    const rootDir = path.join(__dirname, '..');
    const videoDir = path.join(rootDir, 'downloads', 'videos');
    const audioDir = path.join(rootDir, 'downloads', 'audios');
    const transcriptDir = path.join(rootDir, 'downloads', 'transcripts');
    const analysisDir = path.join(rootDir, 'downloads', 'analysis');
    ensureDir(videoDir);
    ensureDir(audioDir);
    ensureDir(transcriptDir);
    ensureDir(analysisDir);

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const randomSuffix = Math.floor(Math.random() * 1000);
        const baseFilename = `reel_${timestamp}_${randomSuffix}`;

        const videoFilename = `${baseFilename}.mp4`;
        const audioFilename = `${baseFilename}.mp3`;

        const videoPath = path.join(videoDir, videoFilename);
        const audioPath = path.join(audioDir, audioFilename);

        console.log(`Downloading ${videoFilename} to ${videoPath}...`);

        const videoResponse = await fetch(videoUrl);
        if (videoResponse.ok) {
            const arrayBuffer = await videoResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.promises.writeFile(videoPath, buffer);
            console.log(`Saved Video: ${videoPath}`);

            // Extract Audio
            await new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .toFormat('mp3')
                    .on('end', () => {
                        console.log(`Audio extracted: ${audioPath}`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('Error extracting audio:', err);
                        // Still resolve to not block response, but mark as failed audio
                        resolve();
                    })
                    .save(audioPath);
            });

            const result = {
                filename: videoFilename,
                videoPath: `/downloads/videos/${videoFilename}`,
                audioPath: `/downloads/audios/${audioFilename}`,
                status: 'saved'
            };

            // Transcribe Audio using Sarvam AI (Handles long audios by splitting)
            const transcriptionResult = await processTranscription(audioPath, baseFilename, transcriptDir);
            if (transcriptionResult) {
                result.transcriptPath = `/downloads/transcripts/${baseFilename}.txt`;
                result.transcript = transcriptionResult.transcript;

                if (!skipAnalysis) {
                    // Analyze Transcript using Gemini
                    const analysisResult = await analyzeTranscript(transcriptionResult.transcript, baseFilename, analysisDir);
                    if (analysisResult) {
                        result.analysisPath = `/downloads/analysis/${baseFilename}_analysis.txt`;
                        result.analysis = analysisResult.analysisOutput;
                    }
                }
            }
            return result;
        } else {
            console.error(`Failed to fetch video content for ${videoUrl}`);
        }
    } catch (err) {
        console.error('Error processing item', err);
    }
    return null;
}

app.post('/api/download', async (req, res) => {
    try {
        const { urls, url, viralUrl } = req.body;
        let targetUrls = [];

        if (urls && Array.isArray(urls)) {
            // Filter empty and remove duplicates
            targetUrls = [...new Set(urls.filter(u => u && u.trim() !== ''))];
        } else if (url) {
            targetUrls = [url];
        }

        console.log(`Processing ${targetUrls.length} URL(s) and potentially 1 viral URL...`);

        const results = [];
        let viralResult = null;

        // Process main URLs if any
        if (targetUrls.length > 0) {
            const input = {
                directUrls: targetUrls,
                resultsType: "posts",
                searchType: "hashtag",
                searchLimit: 1,
                addParentData: false
            };

            const run = await client.actor("apify/instagram-scraper").call(input);
            console.log('Actor run started for main URLs:', run.id);
            const { items } = await client.dataset(run.defaultDatasetId).listItems();

            if (items && items.length > 0) {
                for (const item of items) {
                    const result = await processReelFromItem(item, false);
                    if (result) results.push(result);
                }
            }
        }

        // Process Viral URL if provided
        if (viralUrl && viralUrl.trim() !== '') {
            console.log(`Processing viral URL: ${viralUrl}`);
            const viralInput = {
                directUrls: [viralUrl],
                resultsType: "posts",
                searchType: "hashtag",
                searchLimit: 1,
                addParentData: false
            };

            const viralRun = await client.actor("apify/instagram-scraper").call(viralInput);
            console.log('Actor run started for viral URL:', viralRun.id);
            const { items: viralItems } = await client.dataset(viralRun.defaultDatasetId).listItems();

            if (viralItems && viralItems.length > 0) {
                viralResult = await processReelFromItem(viralItems[0], true); // skipAnalysis = true
            }
        }

        if (results.length > 0 || viralResult) {
            // Check if we can generate new content
            let generatedContent = null;
            if (results.length > 0 && viralResult && viralResult.transcript) {
                const analyses = results
                    .filter(r => r.analysis)
                    .map(r => r.analysis);

                if (analyses.length > 0) {
                    generatedContent = await generateNewContent(analyses, viralResult.transcript);
                }
            }

            res.json({
                success: true,
                message: `Processed ${results.length} main reels and ${viralResult ? 1 : 0} viral reel.`,
                results,
                viralResult,
                generatedContent
            });
        } else {
            res.status(404).json({ error: 'No videos processed.' });
        }

    } catch (error) {
        console.error('Error downloading reel:', error);
        res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
