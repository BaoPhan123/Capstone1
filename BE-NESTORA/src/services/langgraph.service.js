const { StateGraph, START, END, Annotation } = require("@langchain/langgraph");
const {
  chat,
  analyzeUserNeeds,
  searchProducts,
  getProductsByFilter,
  getProductDetails,
  checkUserOrders,
  getOrderDetails
} = require("./langchain.service");
const CATEGORIES = require("../constants/categories");

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveCategorySlug(input, lastUserMessage) {
  const candidates = [input, lastUserMessage].filter(Boolean).map(normalizeText);
  const catList = Object.values(CATEGORIES);

  for (const c of candidates) {
    if (!c) continue;
    // Direct slug match
    const direct = catList.find((cat) => normalizeText(cat.slug) === c);
    if (direct) return direct.slug;

    // Name match (e.g. "phong khach", "phòng khách")
    const byName = catList.find((cat) => {
      const n = normalizeText(cat.name);
      return c.includes(n) || n.includes(c);
    });
    if (byName) return byName.slug;

    // Keyword match (loose)
    if (c.includes("phong khach")) return "phong-khach";
    if (c.includes("phong ngu")) return "phong-ngu";
    if (c.includes("phong bep")) return "phong-bep";
    if (c.includes("phong tam")) return "phong-tam";
    if (c.includes("tre em")) return "tre-em";
    if (c.includes("van phong")) return "van-phong";
    if (c.includes("cau thang")) return "cau-thang";
    if (c.includes("den trang tri") || c.includes("den")) return "den-trang-tri";
  }

  return undefined;
}

/**
 * Define LangGraph State bằng Annotation.Root theo đúng schema mà package yêu cầu.
 */
const StateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: (left, right) => [...(left || []), ...(Array.isArray(right) ? right : [right])],
    default: () => []
  }),
  userNeeds: Annotation(),
  products: Annotation({
    default: () => []
  }),
  userId: Annotation(),
  assistantResponse: Annotation(),
  selectedProducts: Annotation({
    default: () => []
  }),
  orders: Annotation({
    default: () => []
  })
});

/**
 * Node: Phân tích nhu cầu của user
 */
async function analyzeNode(state) {
  const lastUserMessage = state.messages
    .slice()
    .reverse()
    .find(msg => msg.type === "human");

  if (!lastUserMessage) {
    return { ...state };
  }

  const needs = await analyzeUserNeeds(lastUserMessage.content);
  return { ...state, userNeeds: needs };
}

/**
 * Node: Tìm kiếm và lọc sản phẩm
 */
async function searchProductsNode(state) {
  if (!state.userNeeds) return { ...state };

  const needs = state.userNeeds;
  let products = [];
  const lastUserMessage = state.messages
    .slice()
    .reverse()
    .find(msg => msg.type === "human")?.content || "";
  const resolvedCategorySlug = resolveCategorySlug(needs.category, lastUserMessage);

  try {
    // Nếu có keywords, tìm kiếm
    if (needs.keywords && needs.keywords.length > 0) {
      const keyword = needs.keywords.join(" ");
      products = await searchProducts(keyword);
    }

    // Nếu không có hoặc kết quả ít, lọc theo category và price
    if (products.length === 0 || resolvedCategorySlug || needs.maxPrice || needs.minPrice) {
      const filterOptions = {};
      if (resolvedCategorySlug) filterOptions.category = resolvedCategorySlug;
      if (needs.maxPrice) filterOptions.maxPrice = needs.maxPrice;
      if (needs.minPrice) filterOptions.minPrice = needs.minPrice;

      products = await getProductsByFilter(filterOptions);
    }

    // Giới hạn số sản phẩm trả về
    products = products.slice(0, 50);

    return { ...state, products };
  } catch (error) {
    console.error("Lỗi tìm kiếm sản phẩm:", error);
    return { ...state, products: [] };
  }
}

/**
 * Node: Kiểm tra đơn hàng
 */
async function checkOrdersNode(state) {
  if (!state.userId) return { ...state };

  try {
    const orders = await checkUserOrders(state.userId);
    return { ...state, orders };
  } catch (error) {
    console.error("Lỗi kiểm tra đơn hàng:", error);
    return { ...state, orders: [] };
  }
}

/**
 * Node: Tạo phản hồi từ LLM
 */
async function generateResponseNode(state) {
  try {
    const lastUserMessage = state.messages
      .slice()
      .reverse()
      .find(msg => msg.type === "human")?.content || "";

    function normalizeText(value = "") {
      return String(value)
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLowerCase();
    }

    function extractMenh(message) {
      const t = normalizeText(message);
      if (t.includes("menh kim")) return "kim";
      if (t.includes("menh moc")) return "moc";
      if (t.includes("menh thuy")) return "thuy";
      if (t.includes("menh hoa")) return "hoa";
      if (t.includes("menh tho")) return "tho";
      return undefined;
    }

    function colorsForMenh(menh) {
      // Tối giản theo phong thủy phổ biến: dùng để lọc "màu phù hợp"
      switch (menh) {
        case "kim":
          return ["trang", "bac", "xam", "vang", "nau"];
        case "moc":
          return ["xanh", "xanh la", "den", "xanh duong"];
        case "thuy":
          return ["den", "xanh duong", "trang", "bac", "xam"];
        case "hoa":
          return ["do", "hong", "tim", "xanh la"];
        case "tho":
          return ["vang", "nau", "be", "kem", "cam dat"];
        default:
          return [];
      }
    }

    function extractProductType(message, needs) {
      const t = normalizeText(message);
      const keywords = Array.isArray(needs?.keywords) ? needs.keywords.map(normalizeText) : [];
      const hay = [t, ...keywords].join(" ");

      // Các loại hay gặp
      if (hay.includes("sofa")) return "sofa";
      if (hay.includes("ghe")) return "ghe";
      if (hay.includes("ban")) return "ban";
      if (hay.includes("tu")) return "tu";
      if (hay.includes("giuong")) return "giuong";
      if (hay.includes("ke tivi") || hay.includes("ke ti vi")) return "ke tivi";
      if (hay.includes("den")) return "den";
      return undefined;
    }

    const menh = extractMenh(lastUserMessage);
    const desiredColors = colorsForMenh(menh);
    const desiredType = extractProductType(lastUserMessage, state.userNeeds);

    function productMatchesColors(product) {
      if (!desiredColors.length) return true;
      const fields = [
        product?.color,
        product?.name,
        product?.desc,
        product?.description,
      ].filter(Boolean).map(normalizeText).join(" ");
      return desiredColors.some((c) => fields.includes(normalizeText(c)));
    }

    function productMatchesType(product) {
      if (!desiredType) return true;
      const fields = [product?.name, product?.desc, product?.description, product?.category]
        .filter(Boolean)
        .map(normalizeText)
        .join(" ");
      return fields.includes(normalizeText(desiredType));
    }

    function scoreProduct(product) {
      let score = 0;
      if (productMatchesType(product)) score += desiredType ? 50 : 0;
      if (productMatchesColors(product)) score += desiredColors.length ? 30 : 0;

      // Ưu tiên có hàng
      if (typeof product?.stock === "number") score += product.stock > 0 ? 10 : -50;

      // Ưu tiên match keyword
      const keywords = Array.isArray(state.userNeeds?.keywords) ? state.userNeeds.keywords : [];
      const text = [product?.name, product?.desc, product?.description, product?.material, product?.color]
        .filter(Boolean)
        .map(normalizeText)
        .join(" ");
      for (const k of keywords) {
        const nk = normalizeText(k);
        if (nk && text.includes(nk)) score += 5;
      }
      return score;
    }

    const candidates = Array.isArray(state.products) ? state.products : [];
    // Nếu user yêu cầu loại cụ thể (vd sofa) thì lọc chặt theo loại đó
    const filteredByType = desiredType ? candidates.filter(productMatchesType) : candidates;
    const filtered = filteredByType.filter(productMatchesColors);

    const ranked = (filtered.length > 0 ? filtered : filteredByType.length > 0 ? filteredByType : candidates)
      .slice()
      .sort((a, b) => scoreProduct(b) - scoreProduct(a));

    const selectedProducts = ranked.slice(0, 5);

    // Chuẩn bị context cho LLM
    let context = "";

    if (state.products && state.products.length > 0) {
      context = "\n\nSản phẩm khả dụng:\n";
      context += state.products
        .map(
          (p, idx) =>
            `${idx + 1}. **${p.name}** (ID: ${p._id}) - ${p.price.toLocaleString("vi-VN")}đ
   - Danh mục: ${p.category}
   - Mô tả: ${p.description || ""}
   - Kho: ${p.stock} sản phẩm`
        )
        .join("\n");
    }

    if (state.orders && state.orders.length > 0) {
      context += "\n\nĐơn hàng gần đây:\n";
      context += state.orders
        .map(
          (o, idx) =>
            `${idx + 1}. Đơn #${o._id} - Trạng thái: **${o.status}** - Thanh toán: ${o.paymentStatus} - Tổng: ${o.totalAmount.toLocaleString("vi-VN")}đ`
        )
        .join("\n");
    }

    // Tạo message cuối cùng cho LLM
    const conversationMessages = state.messages.map(msg => ({
      role: msg.type === "human" ? "user" : "assistant",
      content: msg.content
    }));

    if (context) {
      conversationMessages.push({
        role: "user",
        content: `\n\n[SYSTEM CONTEXT]${context}\n\nVui lòng tư vấn cho khách hàng dựa trên thông tin trên.`
      });
    }

    const response = await chat(conversationMessages);

    return { ...state, assistantResponse: response, selectedProducts };
  } catch (error) {
    console.error("Lỗi tạo phản hồi:", error);
    return { 
      ...state, 
      assistantResponse: "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn.",
      selectedProducts: []
    };
  }
}

/**
 * Conditional edge: Quyết định xem cần tìm kiếm sản phẩm hay không
 */
function shouldSearchProducts(state) {
  if (!state.userNeeds) return "generate_response";

  const intent = state.userNeeds.intent || "search";
  const lastUserMessage = state.messages
    .slice()
    .reverse()
    .find(msg => msg.type === "human")?.content || "";
  const normalized = String(lastUserMessage).toLowerCase();
  const wantsProducts =
    normalized.includes("liệt kê") ||
    normalized.includes("liet ke") ||
    normalized.includes("tìm") ||
    normalized.includes("tim") ||
    normalized.includes("gợi ý") ||
    normalized.includes("goi y") ||
    normalized.includes("cho mình") ||
    normalized.includes("cho toi") ||
    normalized.includes("có sản phẩm") ||
    normalized.includes("co san pham");

  if (intent === "order_check") {
    return "check_orders";
  }

  if (intent === "search" || intent === "filter" || intent === "recommendation" || wantsProducts) {
    return "search_products";
  }

  return "generate_response";
}

/**
 * Build LangGraph
 */
function createChatbot() {
  const graph = new StateGraph(StateAnnotation);

  // Thêm các node
  graph.addNode("analyze", analyzeNode);
  graph.addNode("search_products", searchProductsNode);
  graph.addNode("check_orders", checkOrdersNode);
  graph.addNode("generate_response", generateResponseNode);

  // Kết nối node
  graph.addEdge(START, "analyze");
  graph.addConditionalEdges("analyze", shouldSearchProducts, {
    search_products: "search_products",
    check_orders: "check_orders",
    generate_response: "generate_response"
  });

  graph.addEdge("search_products", "generate_response");
  graph.addEdge("check_orders", "generate_response");
  graph.addEdge("generate_response", END);

  return graph.compile();
}

module.exports = {
  createChatbot,
  StateAnnotation
};
