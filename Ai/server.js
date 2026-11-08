import app from './src/app.js'

const PORT = process.env.PORT || process.env.AI_PORT || 3002

app.listen(PORT, () => {
    console.log(`AI server is running on port ${PORT}`)
})
