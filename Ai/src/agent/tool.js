import * as z from "zod"
import { tool } from "langchain"
import axios from "axios"

const getAgentBaseUrl = () => {
    if (process.env.SANDBOX_AGENT_URL) return process.env.SANDBOX_AGENT_URL

    // Fall back to the local router, which proxies to the sandbox agent
    return `http://localhost:3002`
}

const listfiles = tool(
    async ({},config) => {
        const writer = config.writer;
        writer("lstening files ......")
        
        console.log("listfile started")
        try {
            const { data } = await axios.get(`${getAgentBaseUrl()}/list-files`)
            writer("list file completed")
            return JSON.stringify(data)
        } catch (err) {
            return JSON.stringify(err.response?.data ?? { error: err.message })
        }
    },
    {
        name: "listfiles",
        description: "list files in the sandbox",
        schema: z.object({}),
    }
)

const readfiles = tool(
    async ({ filepath ,config}) => {
        const writer = config.writer;
        writer("readfile started .....")
        console.log("readfile started")
        try {
            const paths = Array.isArray(filepath)
                ? filepath
                : String(filepath).split(",").map((file) => file.trim()).filter(Boolean)
            const { data } = await axios.get(`${getAgentBaseUrl()}/read-file`, {
                params: { filepath: paths.join(",") },
            })
            writer("readfile successfully .....")
            return JSON.stringify(data)
        } catch (err) {
            return JSON.stringify(err.response?.data ?? { error: err.message })
        }
    },
    {
        name: "readfiles",
        description: "read files in the sandbox",
        schema: z.object({
            filepath: z.array(z.string()),
        }),
    }
)

const updatefile = tool(
    async ({ filepath, content ,config }) => {
        const writer = config.writer
        writer("updatefile started .....")
        console.log("updatefile started")
        try {
            const { data } = await axios.patch(`${getAgentBaseUrl()}/update-files`, {
                files: [{ filepath, content }],
            })
               writer("updatefile sucessfully .....")
            return JSON.stringify(data)
        } catch (err) {
            return JSON.stringify(err.response?.data ?? { error: err.message })
        }
    },
    {
        name: "updatefile",
        description: "update files in the sandbox",
        schema: z.object({
            filepath: z.string(),
            content: z.string(),
        }),
    }
)

export { listfiles, readfiles, updatefile }
