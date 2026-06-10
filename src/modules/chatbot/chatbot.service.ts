import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BackenDBQuery } from './DBQuery/db-query';
import { Client } from 'pg';

@Injectable()
export class ChatbotService {
  private client: Client;
  private model: any;
  constructor(private configService: ConfigService) {
    this.client = new Client({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
    });

    this.client
      .connect()
      .then(() => console.log(`Connected to DB: ${this.configService.get('DB_NAME')}`))
      .catch((err) => console.error('DB connection error:', err));

    const genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY') as string,
    );
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async query(sql: string, params: any[] = []) {
    return this.client.query(sql, params);
  }

  toSlug(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async handleChat(question: string) {
    if (!question) {
      return { error: 'Question is required' };
    }
    try {
      const analysisPrompt = `
    Phân tích câu hỏi người dùng và xác định họ muốn gì:
    "${question}"
    
    Trả về JSON:
    {
      "intent": "find_film_by_genre|film_detail|thanks_you|find_film_by_country|find_film_by_director|find_film_by_actor",
      "keywords": ["keyword1", "keyword2"],
      "genre": "tìm genre code nếu có (G_ACTION, G_HORROR, G_ROMANCE, G_COMEDY, G_SCIFI, G_THRILLER, G_DETECTIVE, G_SCHOOL, G_WAR, G_FANTASY, G_HISTORY, G_DOC, G_FAMILY, G_MUSICAL...)",
      "country": "tìm country code nếu có (C_VN, C_US, C_KR, C_CN, C_JP, C_HK, C_FR, C_TH, C_UK, C_DE, C_TW, C_AU, C_CA...)",
      "actor_name": "tên diễn viên nếu người dùng hỏi về phim có diễn viên X",
      "director_name": "tên đạo diễn nếu người dùng hỏi về phim của đạo diễn Y"
    }
    
    Lưu ý:
    - Nếu intent rơi vào trường hợp "film_detail", thì keywords chỉ lấy tên phim và viết hoa chữ cái đầu mỗi từ
    - Nếu câu hỏi có ý ngĩa tương tự như "Phim theo quốc gia nào/Có các phim của các quốc gia nào/ phim của một quốc gia X/ Quốc gia X có phim nào/ Nguồn gốc của phim Y/ Phim Y là phim của nước nào" ==> intent: "find_film_by_country"
    - Nếu hỏi các câu hỏi có nghĩa tương tự như "liệt kê thể loại phim/ tìm phim thể loại X/ liệt kê phim có thể loại X/ có phim nào có thể loại X hay không" ==> intent: "find_film_by_genre"
    - Nếu câu hỏi có ý ngĩa tương tự như  "phim X" nhưng dạng đầy đủ như xem "chi tiết phim / xem nội dung phim /  thông tin phim tên X" hoặc chỉ cần dính 1 tên phim cụ thể ==> intent: "film_detail"
    - Nếu câu được cung cấp là 1 câu có vẻ như "cảm ơn" vì  được giúp đỡ, có thể là hơi  hướng genZ một chút ==> intent: "thanks_you"
    - Nếu câu hỏi có ý ngĩa tương tự như "Liệt kê phim theo diễn viên/ danh sách phim của diễn viên X/ diễn viên X có phim nào/ phim Y là của diễn viên nào" ==> intent: "find_film_by_actor"
    - Nếu câu hỏi có ý ngĩa tương tự như "Liệt kê phim theo đạo diễn/ danh sách phim của đạo diễn X/ đạo diễn X có phim nào/ phim Y là của đạo diễn nào" ==> intent: "find_film_by_director"
    
    CHỈ trả về JSON.
    `;

      const analysisResult = await this.model.generateContent(analysisPrompt);
      let analysisText = analysisResult.response
        .text()
        .replace(/```json|```/g, '')
        .trim();
      const intent = JSON.parse(analysisText);

      let dbQuery = '';
      let queryParams: (string | number)[] = [];

      switch (intent.intent) {
        case 'find_film_by_genre':
          dbQuery = BackenDBQuery.filmGenreFullData;
          queryParams = [];
          break;

        case 'find_film_by_country':
          dbQuery = BackenDBQuery.filmCountryFullData;
          queryParams = [];
          break;

        case 'find_film_by_actor':
          dbQuery = BackenDBQuery.film_by_actor;
          queryParams = [];
          break;
        case 'find_film_by_director':
          dbQuery = BackenDBQuery.film_by_director;
          queryParams = [];
          break;

        case 'thanks_you':
          const prompt = `Bạn tên là FlixAI. Khi người dùng nói "cảm ơn" hoặc tương tự, hãy trả về một câu trả lời ngắn, thân thiện, hơi GenZ nhưng phù hợp với ChillFlix. CHỈ TRẢ VỀ 1 DÒNG TEXT, KHÔNG DÙNG JSON, KHÔNG DÙNG MARKDOWN.`;
          const content = await this.model.generateContent(prompt);

          let finalText = content.response.text().trim();
          finalText = finalText.replace(/^```(?:\w+)?\n?|```$/g, '').trim();

          return { answer: finalText, data: [] };

        case 'film_detail':
          const filmName = intent.keywords?.join(' ') || question;
          dbQuery = BackenDBQuery.filmDetailQuery;
          const slug = this.toSlug(filmName);
          queryParams = [slug];

          break;

        default:
          // General search - tìm theo nhiều tiêu chí
          dbQuery = `
          SELECT 
            f."filmId", 
            f.title,
            f."originalTitle",
            f.description,
            f.year,
            f."thumbUrl",
            f.slug,
            f.view,
            ac_type."valueVi" as film_type,
            ac_country."valueVi" as country,
            STRING_AGG(DISTINCT ac_genre."valueVi", ', ') as genres
          FROM films f
          LEFT JOIN all_code ac_type ON f."typeCode" = ac_type."keyMap"
          LEFT JOIN all_code ac_country ON f."countryCode" = ac_country."keyMap"
          LEFT JOIN film_genre fg ON f."filmId" = fg."filmId"
          LEFT JOIN all_code ac_genre ON fg."genreCode" = ac_genre."keyMap"
          WHERE 
            f."deletedAt" IS NULL AND
            (f.title ILIKE $1 OR f."originalTitle" ILIKE $1 OR f.description ILIKE $1)
          GROUP BY 
            f."filmId", f.title, f."originalTitle", f.description, f.year, 
            f."thumbUrl", f.slug, f.view,
            ac_type."valueVi", ac_country."valueVi"
          ORDER BY f.view DESC
          LIMIT 10
        `;
          queryParams = [`%${question}%`];
      }

      if (!dbQuery) {
        return { error: 'Không xác định được ý định truy vấn' };
      }

      // const dbResult = await this.databaseService.query(dbQuery, queryParams);
      const dbResult = await this.query(dbQuery, queryParams);

      if (dbResult.rows.length === 0) {
        return {
          answer:
            'Xin lỗi, tôi không tìm thấy thông tin trong hệ thống.Bạn có thể hỏi thông tin khác, ví dụ như diễn viên, đạo diễn, các gói đăng ký VIP, ...',
          data: [],
        };
      }

      const responsePrompt = `
    Bạn là trợ lý AI thông minh của ChillFlix - nền tảng xem phim trực tuyến tại Việt Nam.
    
    Người dùng hỏi: "${question}"
    
    Dữ liệu từ cơ sở dữ liệu ChillFlix:
    ${JSON.stringify(dbResult.rows, null, 2)}
    
    Hãy trả lời câu hỏi một cách tự nhiên, thân thiện, hấp dẫn, **KHÔNG dùng markdown hay ký tự đặc biệt**.
    
    QUY TẮC BẮT BUỘC:
    - CHỈ dùng thông tin từ dữ liệu trên
    - KHÔNG bịa đặt phim, diễn viên, đạo diễn không có trong database
    - Nếu thiếu thông tin, nói rõ "Không có trong hệ thống"
    - Nếu là gói đăng ký, format giá tiền dễ đọc (VD: 49.000đ/tháng)
    - Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin
    - Nếu tìm phim theo diễn viên/đạo diễn, liệt kê thông tin có trong dữ liệu
    - Nếu tìm phim theo quốc gia, liệt kê thông tin của các phim có trog dữ liệu ứng với quốc gia được hỏi
    - Nếu câu trả lời là thông tin 1 phim nào đó, hay là một danh sách phim hãy thêm 1 dòng cuối vào dưới thông tin của mỗi phim 1 đoạn có nội dung là : "http://localhost:3000/film-detail/{slug}", trong đó slug là trường slug ứng với phim
    đó trong dữ liệu, hãy thay thế giá trị thật của slug vào link trên, và đường link này phải nằm riêng ở dòng cuối cùng của kết quả
    
    Trả về JSON:
    {
          "answer": "Câu trả lời dựa trên cơ sở dữ liệu (tối đa 250 từ)",
          "data": ${
            intent.intent === 'info_plan'
              ? '[{planId, planName, price, duration, duration_type}]'
              : intent.intent === 'actor_info' || intent.intent === 'director_info'
                ? '[{name, birth_date, nationality, bio, films}]'
                : intent.intent === 'all_user'
                  ? '[{User_userId, User_email, User_fullName, User_phoneNumber, User_avatarUrl, User_gender_code, User_age, User_role_id, User_birthDate, User_isVip, User_status_code, User_vipExpireDate}]'
                  : intent.intent === 'film_detail'
                    ? '[{ filmId, title, originalTitle, description, year, genres, country, age_rating, film_type, images }]'
                    : intent.intent === 'find_film_by_genre'
                      ? 'tất cả dữ liệu liên quan'
                      : ''
          }
    }
    
    CHỈ trả JSON, không markdown.
    `;

      const finalResult = await this.model.generateContent(responsePrompt);
      let finalText = finalResult.response
        .text()
        .replace(/```json|```/g, '')
        .trim();
      const response = JSON.parse(finalText);

      return response;
    } catch (error) {
      console.log('Check error chatbot: ', error);
    }
  }
}
