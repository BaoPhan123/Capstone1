const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");
const Product = require("../models/Product");
const Order = require("../models/Order");

const openaiApiKey = (process.env.OPENAI_API_KEY || "").trim();
const openaiBaseURL = process.env.OPENAI_BASE_URL?.trim();

// Khởi tạo LLM (đọc từ env, hỗ trợ baseURL theo chuẩn LangChain)
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  apiKey: openaiApiKey,
  ...(openaiBaseURL ? { configuration: { baseURL: openaiBaseURL } } : {}),
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 60000,
  maxRetries: 2
});

const SYSTEM_PROMPT = `Bạn là một trợ lý bán hàng thông minh cho Nestora - cửa hàng gia dụng và nội thất.
Nhiệm vụ của bạn:
1. Tư vấn sản phẩm phù hợp với nhu cầu khách hàng
2. Tìm kiếm và gợi ý sản phẩm theo yêu cầu
3. Đề xuất sản phẩm dựa trên phong thủy, phong cách, nhu cầu
4. Kiểm tra đơn hàng và trạng thái giao hàng

Hướng dẫn:
- Hiểu nhu cầu khách hàng một cách sâu sắc
- Khi có sản phẩm phù hợp, KHÔNG liệt kê chi tiết từng sản phẩm trong text (không ID, không giá, không mô tả, không kho) vì frontend sẽ hiển thị bằng card.
- Chỉ trả lời ngắn gọn phần tư vấn (2-5 câu) và kết lại bằng câu mời xem card sản phẩm bên dưới.
- Tuyệt đối KHÔNG dùng markdown table dưới mọi hình thức.
- Có thể dùng markdown cơ bản cho đoạn văn ngắn (bold/line break), nhưng không tạo danh sách chi tiết sản phẩm.
- Luôn lịch sự, thân thiện và chuyên nghiệp
- Trả lời bằng Tiếng Việt`;

/**
 * Lấy tất cả sản phẩm theo thể loại và giá tiền
 */
async function getProductsByFilter(filters = {}) {
  try {
    const query = { stock: { $gt: 0 } };
    
    if (filters.category) {
      // category trong DB là slug (vd phong-khach)
      query.category = filters.category;
    }
    
    if (filters.maxPrice) {
      query.price = { $lte: filters.maxPrice };
    }
    
    if (filters.minPrice) {
      if (!query.price) query.price = {};
      query.price.$gte = filters.minPrice;
    }

    const products = await Product.find(query).limit(50).lean();
    return products;
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error);
    throw error;
  }
}

/**
 * Tìm kiếm sản phẩm theo từ khóa
 */
async function searchProducts(query) {
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { desc: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { material: { $regex: query, $options: "i" } },
        { color: { $regex: query, $options: "i" } },
        { dimensions: { $regex: query, $options: "i" } }
      ],
      stock: { $gt: 0 }
    })
      .limit(50)
      .lean();

    return products;
  } catch (error) {
    console.error("Lỗi tìm kiếm sản phẩm:", error);
    throw error;
  }
}

/**
 * Lấy chi tiết sản phẩm theo ID
 */
async function getProductDetails(productId) {
  try {
    const product = await Product.findById(productId).lean();
    return product;
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    throw error;
  }
}

/**
 * Kiểm tra đơn hàng của người dùng
 */
async function checkUserOrders(userId) {
  try {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("items.product", "name price")
      .lean();

    return orders;
  } catch (error) {
    console.error("Lỗi kiểm tra đơn hàng:", error);
    throw error;
  }
}

/**
 * Lấy chi tiết đơn hàng
 */
async function getOrderDetails(orderId, userId) {
  try {
    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate("items.product")
      .lean();

    return order;
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng:", error);
    throw error;
  }
}

/**
 * Gửi message đến LLM và nhận response
 */
async function chat(messages) {
  try {
    const systemMessage = new SystemMessage(SYSTEM_PROMPT);
    const formattedMessages = [
      systemMessage,
      ...messages.map(msg =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      )
    ];

    const response = await llm.invoke(formattedMessages);
    return response.content;
  } catch (error) {
    console.error("Lỗi gChat với LLM:", error);
    throw error;
  }
}

/**
 * Phân tích nhu cầu từ message của user và trả về thông tin lọc
 */
async function analyzeUserNeeds(userMessage) {
  try {
    const analysisPrompt = `Phân tích nhu cầu từ câu hỏi sau của khách hàng và trả về JSON:
    {
      "intent": "search|filter|order_check|recommendation",
      "category": "nếu có thì là thể loại sản phẩm",
      "maxPrice": "nếu có đề cập đến giá tiền",
      "minPrice": "nếu có đề cập đến giá tiền",
      "keywords": ["từ khóa tìm kiếm"],
      "style": "phong cách nếu có",
      "description": "mô tả nhu cầu ngắn gọn"
    }

    Câu hỏi: "${userMessage}"

    Chỉ trả về JSON, không có text khác.`;

    const response = await chat([
      { role: "user", content: analysisPrompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        intent: "search",
        keywords: [userMessage],
        description: userMessage
      };
    }
  } catch (error) {
    console.error("Lỗi phân tích nhu cầu:", error);
    return {
      intent: "search",
      keywords: [userMessage],
      description: userMessage
    };
  }
}

module.exports = {
  llm,
  chat,
  getProductsByFilter,
  searchProducts,
  getProductDetails,
  checkUserOrders,
  getOrderDetails,
  analyzeUserNeeds,
  SYSTEM_PROMPT
};
