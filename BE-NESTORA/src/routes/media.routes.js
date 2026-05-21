const express = require("express");
const router = express.Router();
const { Readable } = require("stream");

function isSafeUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

router.get("/proxy", async (req, res, next) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== "string" || !isSafeUrl(url)) {
      return res.status(400).send("Invalid url");
    }

    // Prefer global fetch (Node 18+). This avoids adding dependencies.
    const upstream = await fetch(url, {
      redirect: "follow",
      headers: {
        // Many hosts block requests without a UA / accept header
        "User-Agent": "nestora-be/1.0",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        // Some hosts (googleusercontent) can be sensitive to referrer; we omit it
      },
    });

    if (!upstream.ok) {
      return res.status(502).send(`Upstream error: ${upstream.status}`);
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    // Stream body to client (Node18+: Response.body is a web ReadableStream)
    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on("error", (e) => res.destroy(e));
      return nodeStream.pipe(res);
    }

    return res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

