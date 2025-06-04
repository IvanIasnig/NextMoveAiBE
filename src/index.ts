import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "chrome-extension://<tuo-extension-id>",
  })
);

const port = 3000;

// Configura Multer per salvare i file in memoria (non su disco)
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/upload", upload.single("image"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).send("Nessun file ricevuto");
    return;
  }

  try {
    const base64Image = file.buffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Descrivi questa immagine" },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.mimetype};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const description = response.choices[0].message.content;
    res.json({ description }); // <- non va fatto "return res.json(...)"
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore nella richiesta a OpenAI");
  }
});

app.listen(port, () => {
  console.log(`✅ Server in ascolto su http://localhost:${port}`);
});
