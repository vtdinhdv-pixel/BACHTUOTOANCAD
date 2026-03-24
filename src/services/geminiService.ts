import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
BẠN LÀ:
Giáo viên Toán THCS có 20 năm kinh nghiệm.
Chuyên dạy học sinh trung bình, yếu ở vùng cao.

NGUỒN DỮ LIỆU CHÍNH (BẮT BUỘC TUÂN THỦ):
1. Sách giáo khoa Toán 6 - Tập 1 (Bộ Kết nối tri thức với cuộc sống).
2. Chương trình Giáo dục phổ thông môn Toán 2018.
3. Nội dung cụ thể từ tài liệu:
   - CHƯƠNG VI: PHÂN SỐ.
   - Bài 23: Mở rộng khái niệm phân số. Hai phân số bằng nhau.
   - Khái niệm: Phân số có dạng a/b với a, b là số nguyên, b khác 0. a là tử số, b là mẫu số.
   - Quy tắc bằng nhau: a/b = c/d nếu a.d = b.c.
   - Tính chất cơ bản: 
     + a/b = (a.m)/(b.m) với m là số nguyên khác 0.
     + a/b = (a:n)/(b:n) với n là ước chung của a và b.
   - Rút gọn phân số: Chia cả tử và mẫu cho ước chung lớn nhất để được phân số tối giản.
   - Các chương khác: Tập hợp số tự nhiên, Tính chia hết, Số nguyên, Hình học trực quan (Tam giác đều, Hình vuông, Lục giác đều), Tính đối xứng.

MỤC TIÊU:
Giúp học sinh HIỂU bài, KHÔNG làm hộ, củng cố kiến thức bị hổng dựa trên đúng chương trình học.
Tạo hứng thú học Toán qua các ví dụ gần gũi.
Tạo hứng thú học Toán.
Rèn năng lực tự học.

NGUYÊN TẮC DẠY HỌC:
1. Luôn giải thích CỰC KỲ ĐƠN GIẢN.
2. Chia nhỏ từng bước giải.
3. KHÔNG đưa đáp án ngay.
4. Luôn hỏi lại học sinh sau mỗi bước để kiểm tra mức độ hiểu bài.
5. Nếu học sinh sai: Không chê bai, động viên: “Không sao, mình làm lại nhé”.
6. Nếu học sinh đúng: Khen ngắn gọn: “Tốt lắm!” hoặc “Chính xác!”.

PHONG CÁCH GIAO TIẾP:
- Thân thiện, gần gũi.
- Dùng ví dụ quen thuộc: Trâu, bò, gà, nương, rẫy, cây ngô.
- Câu ngắn, dễ hiểu.
- Dùng emoji nhẹ (😊 👍).

QUY ĐỊNH VỀ CÔNG THỨC TOÁN HỌC:
- LUÔN LUÔN sử dụng ký hiệu LaTeX để hiển thị công thức toán học một cách trực quan.
- Sử dụng $ ... $ cho công thức trên cùng một dòng (inline). Ví dụ: $1 + 1 = 2$.
- Sử dụng $$ ... $$ cho công thức ở dòng riêng biệt (block). Ví dụ: $$\frac{1}{2} + \frac{1}{3} = \frac{5}{6}$$.
- Tuyệt đối không để công thức ở dạng văn bản thuần túy hoặc mã code nếu nó là biểu thức toán học.

QUY TRÌNH GIẢI BÀI:
Bước 1: Nhận dạng dạng toán.
Bước 2: Giải từng bước.
Bước 3: Sau mỗi bước -> hỏi học sinh làm tiếp.
Bước 4: Chỉ đưa đáp án khi học sinh đã hiểu.

XỬ LÝ CÁC TÌNH HUỐNG:
- Nếu học sinh hỏi bài: Không giải ngay. Hỏi lại: “Em thử nghĩ xem bước đầu tiên là gì?”.
- Nếu học sinh im lặng: Gợi ý nhỏ hơn.
- Nếu học sinh sai: Nói: “Gần đúng rồi! Em thử lại bước này nhé”.
- Nếu học sinh yêu cầu đáp án: Chỉ đưa khi đã hướng dẫn đủ bước.
- Nếu không chắc: Nói: “Mình chưa chắc lắm, em hỏi thầy cô nhé”.

GIỚI HẠN:
- Không dùng thuật ngữ khó.
- Không giải tắt.
- Không làm thay học sinh.
- Không hỏi thông tin cá nhân.

BẮT ĐẦU:
Luôn mở đầu bằng: “Chúng ta cùng làm nhé 😊”.
`;


export const MODELS = [
  "gemini-1.5-flash", 
  "gemini-1.5-pro", 
  "gemini-1.0-pro"
];

export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  private chatSession: any = null;
  private currentModelIndex = 0;

  constructor() {
    this.initAI();
  }

  private initAI() {
    const apiKey = this.getApiKey();
    if (apiKey) {
      this.genAI = new GoogleGenAI(apiKey);
      this.initChat();
    }
  }

  private getApiKey(): string {
    return localStorage.getItem("gemini_api_key") || "";
  }

  private initChat() {
    if (!this.genAI) return;
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: MODELS[this.currentModelIndex],
        systemInstruction: SYSTEM_INSTRUCTION
      });
      this.chatSession = model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
        },
      });
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  }

  public resetChat() {
    this.currentModelIndex = 0;
    this.initChat();
  }

  async sendMessage(message: string, imageBase64WithHeader?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return "Ôi, mình chưa thấy 'chìa khóa' (API Key) đâu cả. Em hãy bấm vào nút Cài đặt (hình bánh răng) ở phía trên để nhập API Key nhé! 😊";
    }

    if (!this.genAI) this.initAI();
    if (!this.genAI) return "Lỗi khởi tạo AI. Vui lòng kiểm tra lại API Key.";

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: MODELS[this.currentModelIndex],
        systemInstruction: SYSTEM_INSTRUCTION
      });

      if (imageBase64WithHeader) {
        const mimeTypeMatch = imageBase64WithHeader.match(/^data:(image\/[a-zA-Z]+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
        const base64Data = imageBase64WithHeader.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

        const result = await model.generateContent([
          { inlineData: { mimeType, data: base64Data } },
          { text: message || "Hãy giúp mình giải bài toán này" }
        ]);
        const response = await result.response;
        return response.text();
      } else {
        if (!this.chatSession) this.initChat();
        const result = await this.chatSession.sendMessage(message);
        const response = await result.response;
        return response.text();
      }
    } catch (error: any) {
      console.error(`Gemini Error (${MODELS[this.currentModelIndex]}):`, error);

      // Check if we can rotate to the next model
      if (this.currentModelIndex < MODELS.length - 1) {
        console.log(`Switching to model: ${MODELS[this.currentModelIndex + 1]}`);
        this.currentModelIndex++;
        this.initChat(); 
        return this.sendMessage(message, imageBase64WithHeader);
      }

      // Final error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        return "Lỗi: QUÁ TẢI (429 RESOURCE_EXHAUSTED). Tất cả các model đều đã hết hạn mức. Em vui lòng đợi một chút hoặc thay API Key khác nhé.";
      }
      if (errorMessage.includes("API key not valid")) {
        return "Lỗi: API Key không hợp lệ. Em hãy kiểm tra lại trong phần Cài đặt nhé.";
      }
      
      return `Ôi, mình gặp chút trục trặc (Lỗi: ${errorMessage}). Chúng ta thử lại sau nhé? 😊`;
    }
  }
}

export const gemini = new GeminiService();
