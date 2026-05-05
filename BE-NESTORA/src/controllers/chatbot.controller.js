const { searchMenuByVector, filterMenuByNutrition, chatCompletion, updateProductEmbedding, updateAllEmbeddings } = require("../services/openai.service");
const { getOrCreateSession, addMessage, clearSession } = require("../utils/sessionManager");

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_menu",
      description: "Tìm kiếm sản phẩm bằng vector search (semantic). SỬ DỤNG khi: tìm theo loại sản phẩm, đặc điểm, mô tả chung.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Chuỗi tìm kiếm mô tả sản phẩm (VD: 'đồ gia dụng nhà bếp', 'dụng cụ làm vườn', 'đồ nội thất')"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "filter_menu",
      description: "Lọc sản phẩm theo tiêu chí CỤ THỂ về giá. SỬ DỤNG KHI: user hỏi về giá tiền cụ thể.",
      parameters: {
        type: "object",
        properties: {
          maxCalories: {
            type: "number",
            description: "Không áp dụng cho sản phẩm gia dụng"
          },
          minProtein: {
            type: "number",
            description: "Không áp dụng cho sản phẩm gia dụng"
          },
          maxPrice: {
            type: "number",
            description: "Giá tối đa tính bằng VNĐ (đồng). Sản phẩm thường từ 50,000 - 5,000,000đ."
          },
          category: {
            type: "string",
            description: "Loại sản phẩm (VD: 'Nhà bếp', 'Phòng khách', 'Đồ điện')"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "show_products",
      description: "Hiển thị sản phẩm đã chọn. GỌI sau khi lọc xong.",
      parameters: {
        type: "object",
        properties: {
          product_ids: {
            type: "array",
            items: { type: "string" },
            description: "Mảng ID của các sản phẩm muốn hiển thị"
          }
        },
        required: ["product_ids"]
      }
    }
  }
];

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message phải là string" });
    }

    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const currentMessages = addMessage(sid, "user", message);
    let iteration = 0;
    const maxIterations = 5;
    let allSearchResults = [];
    let selectedProducts = [];

    while (iteration < maxIterations) {
      const completion = await chatCompletion(currentMessages, TOOLS);
      const responseMessage = completion.choices[0].message;
      currentMessages.push(responseMessage);

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === "search_menu") {
            const args = JSON.parse(toolCall.function.arguments);
            const searchResults = await searchMenuByVector(args.query);
            allSearchResults = searchResults;

            const simplified = searchResults.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              category: p.category,
              ingredients: p.ingredients,
              nutrition: p.nutrition
            }));

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(simplified)
            });
          } else if (toolCall.function.name === "filter_menu") {
            const args = JSON.parse(toolCall.function.arguments);
            const filterResults = await filterMenuByNutrition(args);
            allSearchResults = filterResults;

            const simplified = filterResults.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              nutrition: p.nutrition
            }));

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(simplified)
            });
          } else if (toolCall.function.name === "show_products") {
            const args = JSON.parse(toolCall.function.arguments);
            const productIds = args.product_ids || [];
            
            selectedProducts = allSearchResults.filter(p => productIds.includes(p.id));

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: true, count: selectedProducts.length })
            });
          }
        }
        iteration++;
        continue;
      }

      const productsForFE = selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        thumbnail: p.thumbnail,
        price: p.currentPrice,
        hasDiscount: p.hasDiscount
      }));

      return res.json({
        reply: responseMessage.content,
        products: productsForFE,
        sessionId: sid
      });
    }

    return res.status(500).json({ 
      error: "Đã vượt quá số lần gọi tool tối đa" 
    });

  } catch (error) {
    console.error("Lỗi /api/chatbot/send:", error);
    res.status(500).json({ 
      error: error.message || "Lỗi server khi xử lý chat" 
    });
  }
};

exports.clearSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Thiếu sessionId" });
    }

    clearSession(sessionId);
    res.json({ success: true, message: "Đã xóa session" });

  } catch (error) {
    console.error("Lỗi /api/chatbot/clear:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages phải là một mảng" });
    }

    let currentMessages = [...messages];
    let iteration = 0;
    const maxIterations = 5;

    while (iteration < maxIterations) {
      const completion = await chatCompletion(currentMessages, TOOLS);
      const responseMessage = completion.choices[0].message;
      currentMessages.push(responseMessage);

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === "search_menu") {
            const args = JSON.parse(toolCall.function.arguments);
            const searchResults = await searchMenuByVector(args.query);

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(searchResults, null, 2)
            });
          }
        }
        iteration++;
        continue;
      }

      return res.json({
        message: responseMessage.content,
        usage: completion.usage
      });
    }

    return res.status(500).json({ 
      error: "Đã vượt quá số lần gọi tool tối đa" 
    });

  } catch (error) {
    console.error("Lỗi /api/chat:", error);
    res.status(500).json({ 
      error: error.message || "Lỗi server khi xử lý chat" 
    });
  }
};

exports.updateEmbedding = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Thiếu productId" });
    }

    const product = await updateProductEmbedding(productId);

    res.json({ 
      success: true,
      message: "Đã cập nhật embedding thành công",
      productId: product._id
    });

  } catch (error) {
    console.error("Lỗi /api/update-embedding:", error);
    res.status(500).json({ 
      error: error.message || "Lỗi server khi cập nhật embedding" 
    });
  }
};

exports.updateAllEmbeddings = async (req, res) => {
  try {
    const result = await updateAllEmbeddings();

    res.json({
      success: true,
      message: `Đã cập nhật ${result.updated} sản phẩm, thất bại ${result.failed} sản phẩm`,
      ...result
    });

  } catch (error) {
    console.error("Lỗi /api/update-all-embeddings:", error);
    res.status(500).json({ 
      error: error.message || "Lỗi server khi cập nhật embeddings" 
    });
  }
};
