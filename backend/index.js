const axios = require("axios");
const cors = require("cors");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins (you can restrict this in production)
app.use(cors());

app.get("/api", async (req, res) => {
    try {
        //https://www.barbershoptags.com/dbpage.php?pg=api
        let builder = "https://www.barbershoptags.com/api.php?";
        if (!!req.query.q) builder += `q=${encodeURI(req.query.q)}&`;
        if (!!req.query.id) builder += `id=${req.query.id}&`;
        if (!!req.query.parts) builder += `Parts=${req.query.parts}&`;
        if (!!req.query.learning) builder += `Learning=${req.query.learning}&`;
        if (!!req.query.minRating)
            builder += `MinRating=${req.query.minRating}&`;
        if (!!req.query.minDownloaded)
            builder += `MinDownloaded=${req.query.minDownLoaded}&`;

        if (!!req.query.sortby) builder += `Sortby=${req.query.sortby}&`;

        builder +=
            "fldlist=id,Title,AltTitle,WritKey,Parts,Lyrics,Rating,RatingCount,Downloaded,SheetMusic,SheetMusicAlt,AllParts,Bass,Bari,Lead,Tenor";
        builder += "client=Tagaholic";

        const response = await axios.get(builder);
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching from barbershop API:", error.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
