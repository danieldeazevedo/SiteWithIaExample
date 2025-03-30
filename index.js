import fs from "fs";
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 5000;
const app = express();

// Configuração do Multer para upload
const storage = multer.diskStorage({ 
    destination: './image/get/', 
    filename: (req, file, cb) => { cb(null, file.originalname); } 
}); 
const upload = multer({ storage });

const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");

app.use(express.static('public'));

// Garantindo que a pasta de saída exista
const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Criado diretório: ${dirPath}`);
    }
};

async function generateImage(inputPath, outputPath, imageName) {
    try {
        console.log(`📂 Lendo imagem de entrada: ${inputPath}`);

        if (!fs.existsSync(inputPath)) {
            console.error("❌ Arquivo de entrada não encontrado!");
            return;
        }

        const imageData = fs.readFileSync(inputPath);
        const base64Image = imageData.toString('base64');

        const contents = [
                    { text: "Please enhance the given image by improving its details, clarity, and overall quality. Increase the resolution if possible, and sharpen the edges for better definition. Add depth and texture where needed, making colors more vibrant while maintaining a natural look. Adjust lighting and contrast for a more dynamic and visually appealing result.Focus on enhancing any specific elements that can benefit from more detail, such as textures, shadows, and highlights."},
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ];

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            generationConfig: { responseModalities: ['Text', 'Image'] },
            safetySettings: safetySettings,
        });

        console.log("⏳ Enviando imagem para aprimoramento...");
        const result = await model.generateContent(contents);
        const response = await result.response;

        if (!response || !response.candidates || response.candidates.length === 0) {
            console.error("❌ A API não retornou uma resposta válida.");
            return;
        }

        console.log("✅ Resposta da API recebida!");

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                ensureDirectoryExistence(outputPath);
                
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                const savePath = path.join(outputPath, `${imageName}.jpg`);

                console.log(`💾 Salvando imagem aprimorada em: ${savePath}`);
                fs.writeFileSync(savePath, buffer);

                console.log(`✅ Imagem salva com sucesso: ${savePath}`);
                return;
            }
        }

        console.error("❌ Nenhuma imagem foi retornada pela API.");
    } catch (error) {
        console.error("🔥 Erro ao processar a imagem:", error);
    }
}

// Rota de upload da imagem
app.post('/upload', upload.single('image'), async (req, res) => {
    console.log("📤 Recebendo upload de imagem...");

    if (!req.file) {
        console.error("❌ Nenhum arquivo foi enviado!");
        return res.status(400).send("Nenhum arquivo foi enviado.");
    }

    const inputImagePath = path.join(__dirname, './image/get/', req.file.filename);
    const outputImagePath = path.join(__dirname, './image/imagetest/');

    console.log(`🔄 Processando imagem: ${req.file.filename}`);
    await generateImage(inputImagePath, outputImagePath, "test");

    console.log("✅ Processo finalizado, redirecionando...");
    res.redirect('/');
});

// Rota para exibir a imagem processada
app.get('/get-image', (req, res) => {
    const imagePath = path.join(__dirname, './image/imagetest/test.jpg');

    console.log("🔍 Buscando imagem aprimorada...");

    if (fs.existsSync(imagePath)) {
        console.log("✅ Imagem encontrada! Enviando ao usuário.");
        res.sendFile(imagePath);
    } else {
        console.error("❌ Imagem aprimorada ainda não está disponível.");
        res.status(404).send("Imagem aprimorada ainda não está disponível.");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});