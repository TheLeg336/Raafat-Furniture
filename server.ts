import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.VITE_CLOUDINARY_API_SECRET,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to delete image from Cloudinary
  app.post("/api/cloudinary/delete", async (req: Request, res: Response) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    try {
      // Extract public_id from Cloudinary URL
      // Example: https://res.cloudinary.com/cloud_name/image/upload/v123456789/public_id.jpg
      const regex = /\/v\d+\/([^.]+)\./;
      const match = imageUrl.match(regex);
      const publicId = match ? match[1] : null;

      if (!publicId) {
        // If it's not a standard Cloudinary URL, try another way or just return success if it's not Cloudinary
        if (!imageUrl.includes("cloudinary.com")) {
            return res.json({ message: "Not a Cloudinary URL, skipping Cloudinary deletion" });
        }
        return res.status(400).json({ error: "Could not extract public_id from URL" });
      }

      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ result });
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      res.status(500).json({ error: "Failed to delete image from Cloudinary" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
