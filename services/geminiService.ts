
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeDocuments(files: { data: string; mimeType: string }[]): Promise<AnalysisData> {
  const parts = files.map(file => ({
    inlineData: {
      data: file.data,
      mimeType: file.mimeType
    }
  }));

  const prompt = `Bạn là chuyên gia phân tích dữ liệu hành chính cho UBND Phường Lâm Viên. 
  Hãy phân tích các tài liệu đính kèm (Báo cáo KT-XH, Lịch công tác, Báo cáo hồ sơ đến hạn) và trích xuất dữ liệu vào cấu trúc JSON.

  YÊU CẦU QUAN TRỌNG: 
  - Trích xuất CHÍNH XÁC NGUYÊN VĂN "Mã hồ sơ" (ví dụ: H36.102-260114-0005) từ cột "SỐ HỒ SƠ" trong danh sách hồ sơ đến hạn. Không được tự ý thay đổi định dạng.
  - Trích xuất đầy đủ họ tên người nộp, người xử lý và ngày giờ hết hạn đúng như trong file.

  1. TRANG 1 - BÁO CÁO THỐNG KÊ (Từ file Báo cáo KT-XH):
     - Số liệu hồ sơ: Tổng tiếp nhận, Đã giải quyết, Đang giải quyết.
     - Số liệu du lịch: Tổng lượt khách, Khách quốc tế.
     - Số liệu kinh doanh: Lũy kế hộ kinh doanh.
     - Tạo biểu đồ tròn: "Tình hình giải quyết hồ sơ" và "Cơ cấu khách du lịch".

  2. TRANG 2 - LỊCH CÔNG TÁC (Từ file Lịch công tác):
     - Trích xuất: Thời gian, Nội dung, Địa điểm, Lãnh đạo chủ trì.

  3. TRANG 3 - DANH SÁCH HỒ SƠ ĐẾN HẠN (Từ file Báo cáo hồ sơ đến hạn):
     - Trích xuất danh sách: id (Mã hồ sơ), applicant (Người đăng ký), handler (Người xử lý), deadline (Ngày trả kết quả).

  Trả về định dạng JSON theo schema đã quy định.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [...parts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reportTitle: { type: Type.STRING },
          reportStats: {
            type: Type.OBJECT,
            properties: {
              totalDossiers: { type: Type.NUMBER },
              resolvedDossiers: { type: Type.NUMBER },
              pendingDossiers: { type: Type.NUMBER },
              totalTourists: { type: Type.NUMBER },
              internationalTourists: { type: Type.NUMBER },
              businessLũyKế: { type: Type.NUMBER }
            },
            required: ["totalDossiers", "resolvedDossiers", "pendingDossiers", "totalTourists", "businessLũyKế"]
          },
          charts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    },
                    required: ["name", "value"]
                  }
                }
              },
              required: ["title", "data"]
            }
          },
          schedules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                content: { type: Type.STRING },
                location: { type: Type.STRING },
                handler: { type: Type.STRING }
              },
              required: ["time", "content", "location", "handler"]
            }
          },
          deadlines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                applicant: { type: Type.STRING },
                handler: { type: Type.STRING },
                deadline: { type: Type.STRING }
              },
              required: ["id", "applicant", "handler", "deadline"]
            }
          }
        },
        required: ["reportTitle", "reportStats", "charts", "schedules", "deadlines"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AnalysisData;
}
