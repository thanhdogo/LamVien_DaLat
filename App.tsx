
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { analyzeDocuments } from './services/geminiService';
import { AnalysisData } from './types';
import { PieChartWidget } from './components/PieChartWidget';
import { 
    Upload, 
    ChevronLeft, 
    ChevronRight, 
    Loader2, 
    Clock, 
    Calendar, 
    FileText, 
    MapPin, 
    User, 
    Activity,
    TrendingUp,
    Users,
    Settings2,
    Zap
} from 'lucide-react';

const PAGE_COUNT = 3;
const AUTO_ROTATE_INTERVAL = 15000;
const AUTO_SCROLL_SPEED = 0.5; // Tốc độ cuộn (pixel mỗi frame)

// Cấu trúc các loại hiệu ứng chuyển trang
const TRANSITION_TYPES = [
  { id: 'slide-bottom', label: 'Trượt lên', class: 'slide-in-from-bottom-16' },
  { id: 'slide-right', label: 'Trượt phải', class: 'slide-in-from-right-16' },
  { id: 'slide-left', label: 'Trượt trái', class: 'slide-in-from-left-16' },
  { id: 'zoom', label: 'Phóng to', class: 'zoom-in-90' },
  { id: 'slide-top', label: 'Trượt xuống', class: 'slide-in-from-top-16' },
  { id: 'spin', label: 'Xoay nhẹ', class: 'spin-in-1' },
  { id: 'blur', label: 'Mờ ảo', class: 'blur-in-md' }
];

const SPEED_OPTIONS = [
  { label: 'Nhanh (0.5s)', value: 500 },
  { label: 'Vừa (1s)', value: 1000 },
  { label: 'Chậm (2s)', value: 2000 }
];

const INITIAL_REPORT_DATA: AnalysisData = {
  reportTitle: "BÁO CÁO TÌNH HÌNH KINH TẾ - XÃ HỘI PHƯỜNG LÂM VIÊN - ĐÀ LẠT",
  reportStats: {
    totalDossiers: 365,
    resolvedDossiers: 219,
    pendingDossiers: 146,
    totalTourists: 15000,
    internationalTourists: 1800,
    businessLũyKế: 3364
  },
  charts: [
    {
      title: "Tình hình giải quyết hồ sơ",
      data: [
        { name: "Đã giải quyết", value: 219 },
        { name: "Đang giải quyết", value: 146 }
      ]
    },
    {
      title: "Cơ cấu khách du lịch",
      data: [
        { name: "Khách quốc tế", value: 1800 },
        { name: "Khách nội địa", value: 13200 }
      ]
    }
  ],
  schedules: [
    { time: "Thứ hai 12/01/2026", content: "Họp Ban chỉ đạo, Ủy ban bầu cử công tác bầu cử Hội đồng nhân dân phường", location: "HT Ban Thường vụ", handler: "Chủ tịch và các Phó Chủ tịch" },
    { time: "Thứ hai 12/01/2026", content: "Họp giao ban thường trực Đảng ủy", location: "HT Ban thường Vụ", handler: "Chủ tịch" },
    { time: "Thứ ba 13/01/2026", content: "Tham dự buổi lễ công bố quyết định về công tác cán bộ", location: "HT Đảng ủy", handler: "Chủ tịch và các Phó Chủ tịch" },
    { time: "Thứ ba 13/01/2026", content: "Làm việc giải quyết kiến nghị của bà Nguyễn Thị Lan", location: "HT HĐND", handler: "Chủ tịch" },
    { time: "Thứ tư 14/01/2026", content: "Dự khai mạc Đại hội Thể dục thể thao ngành Giáo dục Cụm 1 lần thứ I", location: "Trường THCS Nguyễn Du", handler: "PCTVX" },
    { time: "Thứ tư 14/01/2026", content: "Họp thẩm tra các báo cáo, tờ trình trình Kỳ họp lần thứ 5 HĐND", location: "HT HĐND", handler: "PCTVX" },
    { time: "Thứ năm 15/01/2026", content: "Tiếp công dân định kỳ của đồng chí Bí thư Đảng ủy", location: "HT HĐND", handler: "Chủ tịch" },
    { time: "Thứ sáu 16/01/2026", content: "Tiếp công dân định kỳ của đồng chí Chủ tịch UBND phường", location: "HT HĐND", handler: "Chủ tịch" },
    { time: "Thứ bảy 17/01/2026", content: "Kiểm tra trật tự xây dựng, trật tự đô thị, quản lý bảo vệ rừng", location: "Địa bàn phường", handler: "Lãnh đạo trực" },
    { time: "Chủ nhật 18/01/2026", content: "Trực lãnh đạo, giải quyết công việc đột xuất", location: "Trụ sở UBND", handler: "Lãnh đạo trực" }
  ],
  deadlines: [
    { id: "H36.102-260114-0005", applicant: "LÊ NGUYỄN HOÀNG NAM", handler: "Trần Thị Hòa", deadline: "8H30 NGÀY 15/1/2026" },
    { id: "H36.102-260114-0010", applicant: "NGUYỄN THỊ SA", handler: "Trần Thị Hòa", deadline: "9H NGÀY 15/1/2026" },
    { id: "H36.102-260114-0009", applicant: "VŨ THỊ XUÂN", handler: "Ngô Thị Thanh Thanh", deadline: "9H NGÀY 15/1/2026" },
    { id: "H36.102-251217-0057", applicant: "Nguyễn Thị Hồng Thanh", handler: "Huỳnh Đức Khánh", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260109-0034", applicant: "NGUYỄN VŨ KHẮC SƠN", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260111-0002", applicant: "Nguyễn Trần Kha Thảo Quyên", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0003", applicant: "Lê Thị Thu Hiền", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0005", applicant: "Lê Thị Thu Hiền", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0010", applicant: "Lê Thị Thu Hiền", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0016", applicant: "NGUYỄN TƯỜNG BẢO VY", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0021", applicant: "Nguyễn Tấn Duy", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0028", applicant: "Võ Thị Thanh Đào", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0030", applicant: "Lê Ngọc Huấn", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0033", applicant: "Nguyễn Thị Hương", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0038", applicant: "Phạm Nguyễn Đăng Khoa", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0045", applicant: "Hoàng Thị Sen", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0047", applicant: "PHAN THỊ HẢI", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0049", applicant: "Phan Đức Uy Hùng", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0051", applicant: "HUỲNH THỊ HÀ", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0053", applicant: "Nguyễn Hồng Thiện", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0056", applicant: "Lương Thị Châu Duyên", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0058", applicant: "Nguyễn Thị Kim Phượng", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0059", applicant: "Dương Văn Tâm", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0061", applicant: "NGUYỄN THỊ TÂM", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0062", applicant: "Chế Thị Bích Trang", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0064", applicant: "Nguyễn Trần Kha Thảo Quyên", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0072", applicant: "HUỲNH THIÊN QUỐC", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0076", applicant: "Trần ngọc tuấn", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0082", applicant: "Nguyễn Thanh Hùng", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0085", applicant: "Nguyễn Lê Duy Phước", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0091", applicant: "NGUYEN THAI LINH", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0092", applicant: "Trần Thị Thúy Vy", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0093", applicant: "Ngô Thị Ngà", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0094", applicant: "NGUYỄN VIỆT DŨNG", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260112-0096", applicant: "nguyễn mạnh hà", handler: "LÊ THỊ MỸ HOA", deadline: "7H30 NGÀY 16/1/2026" },
    { id: "H36.102-260113-0025", applicant: "NGUYỄN HOÀNG ANH KHOA", handler: "Trần Thị Tuyết Nhung", deadline: "13H30 NGÀY 16/1/2026" },
    { id: "H36.102-260113-0066", applicant: "NGUYỄN THỊ LAN ANH", handler: "Trần Thị Tuyết Nhung", deadline: "14H NGÀY 16/1/2026" }
  ]
};

const App: React.FC = () => {
  const [data, setData] = useState<AnalysisData | null>(INITIAL_REPORT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Trạng thái cấu hình hiệu ứng
  const [selectedTransitionId, setSelectedTransitionId] = useState<string>('random');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1000);
  const [currentTransitionClass, setCurrentTransitionClass] = useState<string>('');

  // Logic cập nhật hiệu ứng thực tế khi đổi trang
  useEffect(() => {
    let nextClass = '';
    if (selectedTransitionId === 'random') {
      const available = TRANSITION_TYPES.filter(t => t.class !== currentTransitionClass.split(' ')[2]);
      const random = available[Math.floor(Math.random() * available.length)];
      nextClass = random.class;
    } else {
      const found = TRANSITION_TYPES.find(t => t.id === selectedTransitionId);
      nextClass = found ? found.class : TRANSITION_TYPES[0].class;
    }
    
    // Tạo class animation linh hoạt dựa trên speed
    setCurrentTransitionClass(`animate-in fade-in ${nextClass} ease-out`);
  }, [currentPage, selectedTransitionId]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const deadlineScrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn cho bảng Hồ sơ đến hạn trên trang 3
  useEffect(() => {
    let animationFrame: number;
    const scrollContainer = deadlineScrollRef.current;

    if (currentPage === 2 && scrollContainer && isAutoRotate) {
      // Bắt đầu từ vị trí 0 khi trang được hiển thị
      scrollContainer.scrollTop = 0; 
      
      const performScroll = () => {
        // Kiểm tra xem đã chạm đáy chưa (trừ đi 1-2px sai số)
        if (scrollContainer.scrollTop + scrollContainer.clientHeight < scrollContainer.scrollHeight - 1) {
          scrollContainer.scrollTop += AUTO_SCROLL_SPEED;
          animationFrame = requestAnimationFrame(performScroll);
        } else {
          // Khi chạm đáy, quay lại đầu ngay lập tức để tiếp tục chu trình (không phụ thuộc thời gian chờ)
          scrollContainer.scrollTop = 0;
          animationFrame = requestAnimationFrame(performScroll);
        }
      };
      
      animationFrame = requestAnimationFrame(performScroll);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [currentPage, isAutoRotate, data]);

  // Lọc lịch công tác: chỉ hiển thị ngày hiện tại và 2 ngày gần nhất nếu có
  const filteredSchedules = useMemo(() => {
    if (!data?.schedules) return [];
    
    const parseDate = (dateStr: string) => {
      const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
      return new Date(0);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedSchedules = [...data.schedules].sort((a, b) => parseDate(a.time).getTime() - parseDate(b.time).getTime());

    // Lấy các ngày >= hôm nay
    let upcoming = sortedSchedules.filter(s => parseDate(s.time) >= today);

    // Nếu không có lịch tương lai (dữ liệu cũ), lấy 3 ngày đầu tiên có trong danh sách
    if (upcoming.length === 0) upcoming = sortedSchedules;

    const uniqueDates: string[] = [];
    upcoming.forEach(s => {
      const datePart = s.time.split(' ').pop() || '';
      if (!uniqueDates.includes(datePart)) uniqueDates.push(datePart);
    });

    // Lấy tối đa 3 ngày duy nhất (ngày gần nhất/hôm nay + 2 ngày tiếp)
    const targetDates = uniqueDates.slice(0, 3);
    return upcoming.filter(s => targetDates.includes(s.time.split(' ').pop() || ''));
  }, [data]);

  useEffect(() => {
    let interval: any;
    if (isAutoRotate && data) {
      interval = setInterval(() => {
        setCurrentPage((prev) => (prev + 1) % PAGE_COUNT);
      }, AUTO_ROTATE_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [isAutoRotate, data]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setUploadError(null);

    try {
      const filePromises = Array.from(files).map(async (file: File) => {
        return new Promise<{ data: string; mimeType: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ data: base64, mimeType: file.type });
          };
          reader.readAsDataURL(file);
        });
      });

      const processedFiles = await Promise.all(filePromises);
      const analysis = await analyzeDocuments(processedFiles);
      setData(analysis);
      setCurrentPage(0);
    } catch (error) {
      console.error("Analysis failed:", error);
      setUploadError("Có lỗi xảy ra khi phân tích tài liệu. Vui lòng kiểm tra lại file.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = () => {
    if (!data) return null;

    const pageStyle = { animationDuration: `${selectedSpeed}ms` };

    switch (currentPage) {
      case 0: 
        return (
          <div style={pageStyle} className={`${currentTransitionClass} h-full overflow-y-auto pr-4 custom-scrollbar perspective-container`}>
            <h2 className="text-2xl font-black text-blue-900 flex items-center sticky top-0 bg-slate-50/90 backdrop-blur-xl py-2 z-10 border-b-2 border-blue-200 mb-4 drop-shadow-sm">
                <TrendingUp className="mr-3 text-blue-600 w-8 h-8" /> Tổng Hợp Chỉ Số Kinh Tế - Xã Hội
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard 
                label="Hồ sơ hành chính" 
                subLabel={`Đã giải quyết: ${data.reportStats.resolvedDossiers}`}
                value={data.reportStats.totalDossiers} 
                icon={<FileText className="text-blue-600 w-8 h-8" />} 
                colorClass="bg-blue-600"
              />
              <StatCard 
                label="Lượt khách du lịch" 
                subLabel={`Quốc tế: ${data.reportStats.internationalTourists}`}
                value={data.reportStats.totalTourists} 
                icon={<Users className="text-emerald-600 w-8 h-8" />} 
                colorClass="bg-emerald-600"
              />
              <StatCard 
                label="Lũy kế Hộ kinh doanh" 
                subLabel="Toàn địa bàn phường"
                value={data.reportStats.businessLũyKế} 
                icon={<Activity className="text-amber-600 w-8 h-8" />} 
                colorClass="bg-amber-600"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
              {data.charts.map((chart, idx) => (
                <div key={idx} className="card-3d-deep p-4 min-h-[300px] flex flex-col items-center">
                  <PieChartWidget title={chart.title} data={chart.data} />
                </div>
              ))}
            </div>
          </div>
        );
      case 1: 
        return (
          <div style={pageStyle} className={`${currentTransitionClass} h-full overflow-y-auto pr-4 custom-scrollbar flex flex-col perspective-container`}>
            <h2 className="text-2xl font-black mb-4 text-blue-900 flex items-center sticky top-0 bg-slate-50/90 backdrop-blur-xl py-2 z-10 border-b-2 border-blue-200 drop-shadow-sm">
                <Calendar className="mr-3 text-blue-600 w-8 h-8" /> Lịch Công Tác Lãnh đạo
            </h2>
            <div className="space-y-4 pb-12">
              {filteredSchedules.length > 0 ? filteredSchedules.map((item, idx) => (
                <div key={idx} className="card-3d-deep p-4 flex gap-6 group cursor-default">
                  <div className="w-32 flex-shrink-0 text-lg font-black text-blue-700 border-r-2 border-slate-50 pr-4 flex items-center justify-center text-center slab-3d-concave">
                    {item.time}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xl font-bold mb-2 text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">{item.content}</p>
                    <div className="flex flex-wrap gap-6">
                      <span className="flex items-center text-base font-semibold text-slate-500 glass-3d-panel px-3 py-1 border-slate-100"><MapPin className="mr-2 w-4 h-4 text-red-500" /> {item.location}</span>
                      <span className="flex items-center text-base font-bold text-blue-600 glass-3d-panel px-3 py-1 border-blue-100"><User className="mr-2 w-4 h-4" /> {item.handler}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 text-slate-400 text-xl font-medium italic slab-3d-concave mx-6">Không có lịch công tác phù hợp</div>
              )}
            </div>
          </div>
        );
      case 2: 
        return (
          <div style={pageStyle} className={`${currentTransitionClass} h-full flex flex-col overflow-y-auto pr-4 custom-scrollbar perspective-container`}>
            <h2 className="text-2xl font-black mb-4 text-red-800 flex items-center sticky top-0 bg-slate-50/90 backdrop-blur-xl py-2 z-10 border-b-2 border-red-200 drop-shadow-sm">
                <Clock className="mr-3 text-red-600 w-8 h-8" /> Hồ Sơ Đến Hạn Trả Kết Quả
            </h2>
            <div 
              ref={deadlineScrollRef}
              className="flex-grow overflow-y-auto rounded-[24px] border-2 border-white bg-white/40 card-3d-deep custom-scrollbar mb-10"
            >
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-slate-100/80 backdrop-blur text-slate-700 text-base uppercase sticky top-0 z-20">
                  <tr>
                    <th className="p-4 border-b border-slate-200 font-black tracking-widest">Mã Hồ Sơ</th>
                    <th className="p-4 border-b border-slate-200 font-black tracking-widest">Chủ Hồ Sơ</th>
                    <th className="p-4 border-b border-slate-200 font-black tracking-widest">Cán Bộ</th>
                    <th className="p-4 border-b border-red-200 font-black tracking-widest text-red-700">Thời Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.deadlines.map((record, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-all duration-300">
                      <td className="p-4 text-lg font-mono font-black text-blue-800 whitespace-nowrap">{record.id}</td>
                      <td className="p-4 text-lg font-black text-slate-800">{record.applicant}</td>
                      <td className="p-4 text-lg text-slate-600 font-bold italic">{record.handler}</td>
                      <td className="p-4 text-lg text-red-600 font-black tracking-tighter drop-shadow-sm">{record.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col p-4 max-w-[1366px] mx-auto overflow-hidden text-slate-900">
      <header className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-100 flex-shrink-0 perspective-container">
        <div className="flex items-center space-x-4 floating-3d">
          <div className="p-2 bg-white rounded-[20px] slab-3d-convex">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Emblem_of_Vietnam.svg/960px-Emblem_of_Vietnam.svg.png" 
              className="h-12 w-12 object-contain drop-shadow-xl" 
              alt="Quốc huy" 
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-none drop-shadow-sm">
              UBND PHƯỜNG LÂM VIÊN - ĐÀ LẠT
            </h1>
            <p className="text-blue-700 text-sm font-black tracking-[0.2em] mt-1 drop-shadow-sm italic">HỆ THỐNG ĐIỀU HÀNH THÔNG MINH</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right glass-3d-panel px-4 py-1 slab-3d-convex">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">AI Dashboard</p>
            <p className="text-xl font-black text-slate-900 font-mono">{new Date().toLocaleTimeString('vi-VN')} | {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[12px] font-black text-sm flex items-center transition-all shadow-xl hover:scale-105 active:scale-95 border-b-4 border-blue-800"
          >
            {isLoading ? <Loader2 className="mr-2 animate-spin w-4 h-4" /> : <Upload className="mr-2 w-4 h-4" />}
            CẬP NHẬT
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".pdf,image/*,.docx" />
        </div>
      </header>

      <main className="flex-grow relative overflow-hidden px-2">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xl z-50 rounded-[30px] card-3d-deep mx-4 my-4 border-2 border-white">
            <div className="w-16 h-16 border-[8px] border-slate-50 border-t-blue-600 rounded-full animate-spin mb-4 shadow-xl"></div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">HỆ THỐNG ĐANG XỬ LÝ...</h3>
          </div>
        ) : !data ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-[30px] border-4 border-dashed border-slate-100 card-3d-deep mx-2 my-2 overflow-y-auto custom-scrollbar">
            <div className="p-8 rounded-full bg-blue-50 mb-4 slab-3d-convex floating-3d flex-shrink-0">
              <FileText size={60} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-black mb-4 text-slate-800 tracking-tighter">SẴN SÀNG TIẾP NHẬN DỮ LIỆU</h2>
            <p className="text-lg text-slate-400 font-bold max-w-xl text-center px-4 italic leading-relaxed">Vui lòng tải lên báo cáo để AI tự động thiết lập Dashboard.</p>
            {uploadError && <p className="mt-4 text-red-600 text-lg font-black bg-red-50 px-6 py-2 rounded-[20px] border-2 border-red-100 shadow-lg">{uploadError}</p>}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-grow overflow-hidden px-2 py-1">
              {renderPage()}
            </div>
            
            {/* Toolbar Điều khiển */}
            <div className="flex items-center justify-between py-2 glass-3d-panel px-6 rounded-[20px] border border-white mt-2 flex-shrink-0 card-3d-deep shadow-lg transform-gpu">
              <div className="flex items-center space-x-4">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentPage(idx); setIsAutoRotate(false); }}
                    className={`h-2 rounded-full transition-all duration-700 shadow-inner ${currentPage === idx ? 'w-24 bg-blue-600' : 'w-4 bg-slate-200'}`}
                  >
                    <span className="sr-only">Trang {idx + 1}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                {/* Tùy chỉnh hiệu ứng */}
                <div className="flex items-center space-x-2 bg-slate-50/50 p-1 px-3 rounded-[12px] border border-slate-100 slab-3d-concave">
                  <Settings2 size={14} className="text-slate-500" />
                  <select 
                    value={selectedTransitionId}
                    onChange={(e) => setSelectedTransitionId(e.target.value)}
                    className="bg-transparent text-[11px] font-black text-slate-700 focus:outline-none cursor-pointer uppercase tracking-tighter"
                  >
                    <option value="random">⚡ NGẪU NHIÊN</option>
                    {TRANSITION_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Tùy chỉnh tốc độ */}
                <div className="flex items-center space-x-2 bg-slate-50/50 p-1 px-3 rounded-[12px] border border-slate-100 slab-3d-concave">
                  <Zap size={14} className="text-amber-500" />
                  <select 
                    value={selectedSpeed}
                    onChange={(e) => setSelectedSpeed(Number(e.target.value))}
                    className="bg-transparent text-[11px] font-black text-slate-700 focus:outline-none cursor-pointer uppercase tracking-tighter"
                  >
                    {SPEED_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

                <button 
                  onClick={() => setIsAutoRotate(!isAutoRotate)}
                  className={`px-4 py-1 rounded-[10px] text-[11px] font-black border-2 transition-all shadow-md ${isAutoRotate ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-slate-50'}`}
                >
                  {isAutoRotate ? 'AUTO: BẬT' : 'AUTO: TẮT'}
                </button>
                <div className="flex space-x-1">
                    <button onClick={() => { setCurrentPage(prev => (prev - 1 + PAGE_COUNT) % PAGE_COUNT); setIsAutoRotate(false); }} className="p-2 rounded-[10px] bg-white hover:bg-blue-600 hover:text-white transition-all slab-3d-convex border border-slate-50"><ChevronLeft size={16} /></button>
                    <button onClick={() => { setCurrentPage(prev => (prev + 1) % PAGE_COUNT); setIsAutoRotate(false); }} className="p-2 rounded-[10px] bg-white hover:bg-blue-600 hover:text-white transition-all slab-3d-convex border border-slate-50"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-2 bg-white/95 glass-3d-panel -mx-4 px-4 py-2 border-t-2 border-blue-600/10 overflow-hidden flex-shrink-0 shadow-lg">
        <div className="whitespace-nowrap animate-scroll text-sm font-black text-blue-900 tracking-widest italic">
          HỆ THỐNG ĐIỀU HÀNH THÔNG MINH PHƯỜNG LÂM VIÊN - ĐÀ LẠT       |      TRÍ TUỆ NHÂN TẠO, HỖ TRỢ RA QUYẾT ĐỊNH      |      ĐỊA CHỈ: SỐ 01 TRẦN PHÚ, ĐÀ LẠT      |      HOTLINE: 02633.822.005     |      AI DASHBOARD 3D
        </div>
      </footer>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-scroll { display: inline-block; animation: scroll 60s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.01); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; subLabel?: string; colorClass: string }> = ({ label, value, icon, subLabel, colorClass }) => (
  <div className="card-3d-deep p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-slate-50/50">
    <div className={`absolute -top-6 -right-6 w-24 h-24 ${colorClass} opacity-5 rounded-full blur-[40px] transition-all duration-700`}></div>
    <div className="slab-3d-convex p-3 rounded-[15px] mb-2 bg-white shadow-lg transform transition-all duration-500 group-hover:scale-110">
      {icon}
    </div>
    <p className="text-slate-500 text-xs font-black mb-1 uppercase tracking-[0.1em] text-center opacity-70 leading-none">{label}</p>
    <p className="text-3xl font-black text-slate-900 mb-1 drop-shadow-md font-mono">{value.toLocaleString()}</p>
    {subLabel && (
        <div className="mt-1 glass-3d-panel px-3 py-0.5 border-slate-50 slab-3d-concave">
            <p className="text-blue-800 text-[10px] font-black text-center uppercase tracking-tight">{subLabel}</p>
        </div>
    )}
  </div>
);

export default App;
