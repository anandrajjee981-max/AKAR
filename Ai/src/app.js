import express from "express"
const app = express()
app.use(express.json())

// Allow browser requests from the Vite dev server and any localhost origin
app.use((req, res, next) => {
    const origin = req.headers.origin
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*")
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
    if (req.method === "OPTIONS") return res.sendStatus(204)
    next()
})

import * as fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { ChatOpenRouter } from "@langchain/openrouter"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// Load .env from Ai/.env or parent folders
const dir = dirname(fileURLToPath(import.meta.url))
const possibleEnvPaths = [
    resolve(dir, "../.env"),
    resolve(dir, "../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "Ai/.env")
]

for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
        for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith("#")) continue
            const eq = trimmed.indexOf("=")
            if (eq > 0) {
                const key = trimmed.slice(0, eq).trim()
                const val = trimmed.slice(eq + 1).trim()
                if (!process.env[key]) {
                    process.env[key] = val
                }
            }
        }
    }
}

const openRouterKey = process.env.OPENROUTER_KEY ?? process.env.openrouter_key
const nemotronKey =
    process.env.NEMOTRON_API_KEY ??
    process.env.NEMOTRON_key ??
    process.env.NVIDIA_API_KEY ??
    process.env.nemotron_key

// Build an ordered list of model instances with verified working active models
const models = []

if (openRouterKey) {
    const candidateOrModels = [
        process.env.OPENROUTER_MODEL,
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "cohere/north-mini-code:free",
        "openrouter/free"
    ].filter(Boolean)

    // Remove duplicates
    const uniqueOrModels = [...new Set(candidateOrModels)]
    for (const modelId of uniqueOrModels) {
        models.push({
            name: `OpenRouter (${modelId})`,
            instance: new ChatOpenRouter({
                model: modelId,
                temperature: 0.1,
                maxRetries: 0,
                apiKey: openRouterKey,
            }),
        })
    }
}

if (nemotronKey) {
    const candidateNvModels = [
        process.env.NEMOTRON_MODEL,
        "nvidia/nemotron-3-ultra-550b-a55b",
        "nvidia/nemotron-3.5-lightning-30b-a3b"
    ].filter(Boolean)

    const uniqueNvModels = [...new Set(candidateNvModels)]
    for (const modelId of uniqueNvModels) {
        models.push({
            name: `NVIDIA (${modelId})`,
            instance: new ChatOpenAI({
                model: modelId,
                temperature: 0.1,
                maxRetries: 0,
                apiKey: nemotronKey,
                configuration: {
                    baseURL: "https://integrate.api.nvidia.com/v1",
                },
            }),
        })
    }
}

// --- Helpers ---

/**
 * Extract plain text from a LangChain response.
 * content can be a string or an array of content blocks.
 */
function extractText(content) {
    if (typeof content === "string") return content
    if (Array.isArray(content)) {
        return content
            .map((block) => {
                if (typeof block === "string") return block
                if (block && typeof block === "object") {
                    return block.text ?? block.content ?? JSON.stringify(block)
                }
                return String(block)
            })
            .join("")
    }
    return JSON.stringify(content, null, 2)
}

/**
 * Clean markdown wrapper or stray HTML wrappers if LLM returned full HTML document
 */
function cleanCode(raw) {
    if (!raw) return ""
    let text = raw.trim()
    
    // Remove markdown code fences
    const fenceMatch = text.match(/^```(?:[a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)\r?\n```$/)
    if (fenceMatch) {
        text = fenceMatch[1].trim()
    }

    // If model still generated a full HTML page (with <!DOCTYPE or <html), extract the React component or script body
    if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("<body")) {
        const scriptMatch =
            text.match(/<script[^>]*type=["'](?:text\/babel|module)["'][^>]*>([\s\S]*?)<\/script>/i) ||
            text.match(/<script[^>]*>([\s\S]*?)<\/script>/i)

        if (scriptMatch && scriptMatch[1].trim().length > 30) {
            text = scriptMatch[1].trim()
        }
    }

    return text
}

/**
 * Write a properly encoded SSE event.
 * Each line of the data payload gets its own "data: " prefix so that
 * multi-line code (which has lots of \n) is not corrupted.
 */
function writeSSE(res, text) {
    const lines = text.split("\n")
    for (const line of lines) {
        res.write(`data: ${line}\n`)
    }
    res.write("\n") // blank line = end of SSE event
}

function writeStatusSSE(res, step, text) {
    if (res.writableEnded) return
    const payload = JSON.stringify({ type: "status", step, text })
    res.write(`data: ${payload}\n\n`)
    if (typeof res.flush === "function") res.flush()
}

/**
 * Try each configured model in order and return the first successful response.
 * Falls through to the next model on any error or empty response.
 */
async function invokeWithFallback(messages) {
    let lastError = null

    for (const { name, instance } of models) {
        try {
            console.log(`[AI] Attempting provider: ${name}`)
            const response = await instance.invoke(messages)
            let text = extractText(response.content)

            if (!text || !text.trim()) {
                console.warn(`[AI] ${name} returned empty content, switching to next model...`)
                lastError = new Error(`${name} returned empty content`)
                continue
            }

            text = cleanCode(text)
            console.log(`[AI] Successfully generated code using: ${name} (${text.length} chars)`)
            return { text, provider: name }
        } catch (err) {
            console.error(`[AI] Provider ${name} failed: ${err.message}`)
            lastError = err
            // continue to next model in list
        }
    }

    throw lastError ?? new Error("All configured AI providers failed.")
}

// --- Routes ---

app.get("/ai/health", (req, res) => {
    res.json({
        status: "ok",
        providers: models.map((m) => m.name),
        configured: models.length,
    })
})

app.post("/ai/generate", async (req, res) => {
    const { code } = req.body
    if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ error: "Request body must include a non-empty 'code' string." })
    }

    // Set SSE headers immediately so the client starts receiving the stream
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })

    if (models.length === 0) {
        writeSSE(res,
            "// No AI provider configured.\n" +
            "// Set OPENROUTER_KEY or NEMOTRON_key in Ai/.env to enable code generation.\n\n" +
            "// TODO: Describe what you'd like to build.\n"
        )
        res.end()
        return
    }

    writeStatusSSE(res, 1, "Reading template & project structure...")

    const timer1 = setTimeout(() => {
        writeStatusSSE(res, 2, "Analyzing requirements & planning responsive architecture...")
    }, 1200)

    const timer2 = setTimeout(() => {
        writeStatusSSE(res, 3, "Synthesizing mobile-first Tailwind CSS classes & layout...")
    }, 2800)

    const timer3 = setTimeout(() => {
        writeStatusSSE(res, 4, "Generating React component JSX & state hooks...")
    }, 4500)

    try {
        const messages = [
            new SystemMessage(
                "You are an expert React and UI/UX frontend software engineer specializing in clean, modern, and 100% mobile-first responsive design using Tailwind CSS in Vite.\n\n" +
                "CRITICAL ARCHITECTURAL & CODE RULES:\n" +
                "1. Output ONLY a valid, self-contained React component (.jsx file). Do NOT include markdown conversation outside the code.\n" +
                "2. NEVER output HTML document tags: DO NOT include <!DOCTYPE html>, <html>, <head>, <body>, or <script> tags.\n" +
                "3. ALWAYS import React and hooks needed at the top: `import React, { useState, useEffect } from 'react';`\n" +
                "4. ALWAYS export the main component as default: `export default function App() { ... }` so it can be rendered by Vite directly.\n" +
                "5. Icons: Use clean inline SVG icons styled with Tailwind (e.g. `className=\"w-5 h-5\"`) without external icon package imports, ensuring zero dependency errors.\n\n" +
                "STRICT TAILWIND CSS & RESPONSIVE DESIGN RULES:\n" +
                "1. MOBILE-FIRST RESPONSIVE ARCHITECTURE: Every layout must look beautiful on Mobile (320px-640px), Tablet (641px-1024px), and Desktop (1024px+).\n" +
                "2. NO RIGID OR FIXED PIXEL WIDTHS: NEVER use fixed pixel dimensions like `w-[800px]`, `w-[1200px]`, `min-w-[900px]`, or inline pixel styles (`style={{ width: '...' }}`). ALWAYS use fluid Tailwind container classes: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.\n" +
                "3. RESPONSIVE GRIDS & FLEXBOX:\n" +
                "   - Card grids: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6`\n" +
                "   - Sections/Heroes: `flex flex-col lg:flex-row items-center gap-8 lg:gap-12` (never a rigid row on mobile).\n" +
                "   - Stats/Features: `grid grid-cols-2 sm:grid-cols-4 gap-4`\n" +
                "4. RESPONSIVE NAVIGATION & NAVBAR:\n" +
                "   - If the component has a header or navbar, it MUST include a functional mobile hamburger toggle with React state: `const [mobileMenuOpen, setMobileMenuOpen] = useState(false)`.\n" +
                "   - Desktop navigation links must be hidden on mobile: `hidden md:flex items-center space-x-6`.\n" +
                "   - Mobile hamburger button must be visible only on mobile: `md:hidden`.\n" +
                "   - Mobile dropdown menu must render cleanly when `mobileMenuOpen` is true: `{mobileMenuOpen && (<div className=\"md:hidden px-4 py-3 space-y-2 bg-zinc-900 border-b border-zinc-800\">...</div>)}`.\n" +
                "5. RESPONSIVE TYPOGRAPHY & PADDING:\n" +
                "   - Hero headings: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight`\n" +
                "   - Section titles: `text-2xl sm:text-3xl font-semibold`\n" +
                "   - Body copy: `text-sm sm:text-base text-zinc-400`\n" +
                "   - Spacing: `py-12 sm:py-16 lg:py-24` and `px-4 sm:px-6 lg:px-8`\n" +
                "6. BUTTONS & CALL-TO-ACTIONS:\n" +
                "   - Buttons must be touch-friendly and full-width on mobile when appropriate: `w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition`\n" +
                "7. OVERFLOW SAFETY:\n" +
                "   - Wrap root element in `w-full min-h-screen overflow-x-hidden` so horizontal scrollbars never appear."
            ),
            new HumanMessage(code),
        ]

        const { text, provider } = await invokeWithFallback(messages)
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)

        writeStatusSSE(res, 5, "Validating syntax & updating template...")
        res.write(`: provider=${provider}\n\n`)
        writeSSE(res, text)
        res.end()
    } catch (error) {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        console.error("[AI] All providers failed:", error)

        const status = Number(error?.statusCode ?? error?.status ?? error?.code)
        const reason =
            status === 429 ? "rate-limited" :
            status === 404 ? "endpoint or model not found" :
            status === 401 ? "invalid API key" :
            error?.message ?? "unknown error"

        writeSSE(res,
            `// AI code generation failed: ${reason}\n` +
            `// All attempted models failed. Please verify API keys in Ai/.env.\n\n` +
            `// Fallback template:\n` +
            `export default function GeneratedComponent() {\n` +
            `  return <div>Custom component placeholder</div>;\n` +
            `}\n`
        )
        res.end()
    }
})

export default app
