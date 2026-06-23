import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
}

async function callWithRetryAndModelFallback<T>(
  ai: any,
  apiCallFn: (modelName: string) => Promise<T>,
  preferredModel: string = "gemini-2.5-flash",
  fallbackModel: string = "gemini-3.1-flash-lite",
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let delay = options.initialDelayMs ?? 1000;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCallFn(preferredModel);
    } catch (error: any) {
      lastError = error;
      const errorMsg = (error.message || "").toLowerCase();
      const status = error.status;
      const isTransient = 
        errorMsg.includes("resource_exhausted") || 
        errorMsg.includes("quota") || 
        errorMsg.includes("unavailable") || 
        errorMsg.includes("high demand") || 
        status === 429 || 
        status === 503;

      if (!isTransient) {
        throw error;
      }

      console.warn(`[Gemini API] Attempt ${attempt} failed with transient error: ${error.message || error}. Retrying in ${delay}ms...`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // gentle backoff
      }
    }
  }

  console.warn(`[Gemini API] Preferred model '${preferredModel}' exhausted. Attempting fallback model '${fallbackModel}'...`);
  try {
    return await apiCallFn(fallbackModel);
  } catch (error: any) {
    console.error(`[Gemini API] Fallback model '${fallbackModel}' also failed:`, error);
    throw lastError || error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Health Screening
  app.post("/api/ai/screen", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `
Bạn là AI Sàng Lọc Sức Khỏe cho ứng dụng Family Medical Vault. 
Nhiệm vụ của bạn là hỗ trợ phân loại mức độ nguy cơ, gợi ý chuyên khoa và tạo tóm tắt để người dùng đi khám.
Bạn PHẢI tuân thủ các quy tắc SAU ĐÂY:
- KHÔNG ĐƯỢC khẳng định chẩn đoán bệnh.
- KHÔNG kê đơn thuốc, không tư vấn ngưng thuốc, không đưa ra phác đồ điều trị, không đưa ra liều thuốc.
- KHÔNG thay thế bác sĩ.
- KHÔNG kết luận là "không sao".
- LUÔN LUÔN nhắc lại (ở đầu hoặc cuối): "Thông tin chỉ mang tính tham khảo, không thay thế tư vấn, chẩn đoán hoặc điều trị của bác sĩ."
- NẾU người dùng nhập thông tin quá sơ sài, hãy tiếp tục đặt câu hỏi ngắn gọn để thu thập thêm triệu chứng, thông tin dị ứng, thời gian bị.

Hệ thống phân loại mức độ nguy cơ gồm:
1. Cấp cứu ngay
2. Cần đi khám trong ngày
3. Nên đặt lịch khám
4. Theo dõi tại nhà
5. Cần bổ sung thông tin

Khi đủ thông tin, kết quả cuối cùng của bạn ĐƯỢC ĐỊNH DẠNG rõ ràng có các phần:
- Phân loại mức độ
- Gợi ý chuyên khoa phù hợp (ví dụ: Nội tiêu hóa, Nội tim mạch, Da liễu, v.v.)
- Gợi ý câu hỏi nên hỏi bác sĩ (danh sách 2-3 câu thiết thực)
- Bản tóm tắt bệnh sử (để người dùng có thể in/gửi dễ dàng)
`;

      // For simplicity, let's just construct a single prompt concatenating history.
      let prompt = "";
      if (history && history.length > 0) {
        prompt += "Dưới đây là lịch sử hội thoại trước đó:\n";
        history.forEach((h: any) => {
          prompt += `${h.role === 'user' ? 'Người dùng' : 'AI'}: ${h.text}\n`;
        });
        prompt += "\nTin nhắn mới của người dùng:\n" + message;
      } else {
        prompt = message;
      }

      const response = await callWithRetryAndModelFallback(
        ai,
        (modelName) => {
          const chat = ai.chats.create({
            model: modelName,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          return chat.sendMessage({ message: prompt });
        },
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite"
      );
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Screen Error:", error);
      const isQuota = error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.includes("quota") || error.message?.includes("UNAVAILABLE") || error.status === 429 || error.status === 503;
      if (isQuota) {
        res.status(429).json({ error: "Yêu cầu tư vấn AI hiện đang quá tải hoặc hết lượt sử dụng. Vui lòng thử lại sau 15 giây nhé!" });
      } else {
        res.status(500).json({ error: error.message || "Failed to process AI request" });
      }
    }
  });

  // API Route for Drug Interaction Check
  app.post("/api/ai/check-interactions", async (req, res) => {
    try {
      const { newMedications, existingMedications } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const systemInstruction = `
Bạn là Dược sĩ Lâm sàng AI. Nhiệm vụ của bạn là kiểm tra tương tác thuốc.
Người dùng sẽ cung cấp danh sách thuốc đang dùng và danh sách thuốc CHUẨN BỊ thêm vào.
Hãy so sánh chéo để tìm ra CÁC TƯƠNG TÁC THUỐC NGUY HIỂM tiềm ẩn.
Quy tắc:
1. NẾU CÓ tương tác: Nêu rõ Mức độ nghiêm trọng (Nhẹ, Trung bình, Nặng, Chống chỉ định) và Bản chất/cơ chế của tương tác, gợi ý hướng xử trí ngắn gọn.
2. NẾU KHÔNG CÓ tương tác quan trọng: Chỉ cần phản hồi ngắn gọn: "Không phát hiện tương tác nguy hiểm."
3. Bằng tiếng Việt. KHÔNG kê đơn thuốc.
`;
      const prompt = `Thuốc ĐANG DÙNG (hoặc sẽ dùng chung):\n${existingMedications.join(", ") || "Không có"}\n\nThuốc MỚI CHUẨN BỊ THÊM:\n${newMedications.join(", ") || "Không có"}`;

      const response = await callWithRetryAndModelFallback(
        ai,
        (modelName) => ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction, temperature: 0.2 }
        }),
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite"
      );

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Drug Interaction AI Error:", error);
      const isQuota = error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.includes("quota") || error.message?.includes("UNAVAILABLE") || error.status === 429 || error.status === 503;
      if (isQuota) {
        res.status(429).json({ error: "Tính năng kiểm tra tương tác đạt giới hạn tần suất yêu cầu hoặc tạm quá tải. Vui lòng kiểm tra lại sau ít giây!" });
      } else {
        res.status(500).json({ error: error.message || "Failed to check interactions" });
      }
    }
  });

  // API Route for Scanning Prescription Image
  app.post("/api/ai/scan-prescription", async (req, res) => {
    try {
      const { imageBase64 } = req.body; // e.g., "data:image/jpeg;base64,/9j/4AAQ..."
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1];

      const systemInstruction = `
Bạn là Trợ lý Y tế AI. Hãy đọc hình ảnh đơn thuốc/toạ thuốc được cung cấp và trích xuất danh sách các loại thuốc.
Trả về dữ liệu dưới định dạng JSON là một mảng các object. Tuyệt đối chỉ trả về JSON, KHÔNG CÓ text nào khác, không dùng markdown \`\`\`json.
Mỗi object có các trường:
{
  "name": "tên thuốc",
  "strength": "hàm lượng (ví dụ 500mg)",
  "dosage": "liều dùng 1 lần (ví dụ 1 viên)",
  "timesPerDay": số (ví dụ 2),
  "timing": "thời điểm uống (ví dụ sau ăn sáng)",
  "days": số ngày uống (ví dụ 5)
}
Nếu không đọc được, hãy trả về mảng rỗng [].
`;

      const response = await callWithRetryAndModelFallback(
        ai,
        (modelName) => ai.models.generateContent({
          model: modelName,
          contents: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            "Trích xuất danh sách thuốc từ ảnh này."
          ],
          config: { systemInstruction, temperature: 0.1 }
        }),
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite"
      );

      let text = response.text || "[]";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      res.json({ result: JSON.parse(text) });
    } catch (error: any) {
      console.error("Scan AI Error:", error);
      const isQuota = error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.includes("quota") || error.message?.includes("UNAVAILABLE") || error.status === 429 || error.status === 503;
      if (isQuota) {
        res.status(429).json({ error: "Chức năng quét đơn thuốc bằng AI tạm thời quá tải hoặc chạm giới hạn. Vui lòng nhập tay hoặc thử lại sau 30 giây." });
      } else {
        res.status(500).json({ error: error.message || "Failed to scan prescription" });
      }
    }
  });

  // API Route for the Weekly Health Summary
  app.post("/api/ai/health-summary", async (req, res) => {
    try {
      const { members, records } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ result: "Chưa cấu hình API Key AI. Vui lòng thiết lập để sử dụng tính năng này." });
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
Bạn là Trợ lý Y tế AI giám sát sức khỏe gia đình.
Nhiệm vụ: Phân tích danh sách thành viên và bệnh sử (các đợt khám bệnh gần đây), sau đó tóm tắt tình trạng sức khỏe chung của gia đình trong tuần qua.
Hãy viết một đoạn Tóm tắt Sức khỏe Tuần (ngắn gọn, khoảng 3 - 4 dòng) thật súc tích, chuyên nghiệp bằng tiếng Việt.
- Nêu bật những điểm tốt hoặc cần lưu ý.
- Nếu không có bệnh án mới, có thể khuyên duy trì thói quen tốt.
- KHÔNG kê đơn thuốc hoặc chẩn đoán y tế tự phát.
`;

      const prompt = `Dữ liệu thành viên: ${JSON.stringify(members)}\nDữ liệu bệnh án: ${JSON.stringify(records)}`;

      try {
        const response = await callWithRetryAndModelFallback(
          ai,
          (modelName) => ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { systemInstruction, temperature: 0.3 }
          }),
          "gemini-2.5-flash",
          "gemini-3.1-flash-lite"
        );

        res.json({ result: response.text });
      } catch (genError: any) {
        console.error("Generation Error Details:", genError.message || genError);
        const isQuota = genError.message?.includes("RESOURCE_EXHAUSTED") || genError.message?.includes("quota") || genError.message?.includes("UNAVAILABLE") || genError.status === 429 || genError.status === 503;
        if (isQuota) {
          res.json({ result: "Hệ thống tóm tắt sức khỏe AI đang tạm thời đạt giới hạn quota hoặc bận. Vui lòng nhấp tải lại sau chút nữa nhé!" });
        } else {
          res.json({ result: "Hệ thống AI đang quá tải hoặc tạm thời không phản hồi. Vui lòng thử lại sau chút nhé!" });
        }
      }
    } catch (error: any) {
      console.error("Health Summary AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate health summary" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
