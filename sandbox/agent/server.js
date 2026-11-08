import httpserver from "./src/app.js";

const PORT = process.env.PORT || 3000;

httpserver.listen(PORT, () => {
    console.log(`sandbox agent server is running on port ${PORT}`);
});
