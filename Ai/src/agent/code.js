import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { ChatOpenRouter } from "@langchain/openrouter"
import { ChatOpenAI } from "@langchain/openai"
import { RunnableLambda } from "@langchain/core/runnables"
import { createAgent } from "langchain"
import { listfiles, readfiles, updatefile } from "./tool.js"

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") })

const openRouterKey = process.env.OPENROUTER_KEY ?? process.env.openrouter_key
const nemotronKey = process.env.NEMOTRON_API_KEY ?? process.env.NEMOTRON_key ??
    process.env.NVIDIA_API_KEY ?? process.env.nemotron_key
const models = []

if (openRouterKey) {
    models.push(new ChatOpenRouter({
        model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
        temperature: 0,
        maxRetries: 0,
        apiKey: openRouterKey,
    }))
}

if (nemotronKey) {
    models.push(new ChatOpenAI({
        model: process.env.NEMOTRON_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b",
        temperature: 0,
        maxRetries: 0,
        apiKey: nemotronKey,
        configuration: {
            baseURL: "https://integrate.api.nvidia.com/v1",
        },
    }))
}

if (models.length === 0) {
    throw new Error("Set OPENROUTER_KEY and/or NEMOTRON_API_KEY to enable an AI provider.")
}

const model = models[0]
if (models.length > 1) {
    const bindPrimaryTools = model.bindTools.bind(model)
    const fallbackModels = models.slice(1)

    // Agents require bindTools() on the model. Bind tools per provider first,
    // then add fallback behavior to the resulting runnable.
    model.bindTools = (tools, options) => {
        const primaryWithTools = bindPrimaryTools(tools, options)
        const fallbacksWithTools = fallbackModels.map((fallback) => fallback.bindTools(tools, options))

        return RunnableLambda.from(async (input, config) => {
            try {
                return await primaryWithTools.invoke(input, config)
            } catch (primaryError) {
                console.warn("OpenRouter failed; trying Nemotron:", primaryError.message)
            }

            let fallbackError
            for (const fallback of fallbacksWithTools) {
                try {
                    return await fallback.invoke(input, config)
                } catch (error) {
                    fallbackError = error
                    console.error("Nemotron fallback failed:", error)
                }
            }

            throw fallbackError ?? new Error("All configured AI providers failed.")
        })
    }
}

const agent = createAgent({
    model,
    tools: [listfiles, readfiles, updatefile],
    systemPrompt: `
    You are a senior frontend developer experienced with React, TypeScript, and modern Tailwind CSS.
    The user's task is in the latest user message.

    Available tools:
    - listfiles: list files in the sandbox
    - readfiles: read selected files in the sandbox
    - updatefile: update a file in the sandbox

    Work efficiently and stop when the task is complete:
    1. Call listfiles once to inspect the project.
    2. Read only the files needed for the requested change.
    3. Make focused edits with updatefile.
    4. Verify the result at most once when the available tools allow it.
    5. Respond with a concise summary. Do not repeat the workflow or call tools again
       after the requested change is complete. If a tool fails or the required files
       are unclear, stop and explain the issue instead of retrying indefinitely.

    CRITICAL UI & RESPONSIVE DESIGN REQUIREMENTS:
    - Build 100% mobile-first responsive layouts using standard Tailwind CSS classes.
    - NEVER use rigid or fixed pixel widths (like w-[800px] or inline styles style={{ width: '...' }}).
    - Always use responsive container wrappers (w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8).
    - Use responsive grids (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) and flex (flex-col lg:flex-row).
    - If building a navbar, include a mobile hamburger menu toggle (hidden md:flex for desktop, md:hidden for mobile button).
    - Scale typography smoothly with breakpoints (text-3xl sm:text-5xl lg:text-6xl).
    - Ensure zero horizontal overflow (min-h-screen w-full overflow-x-hidden).
    `,
    description: "An assistant that makes focused changes to the user's frontend project.",
})

export default agent
