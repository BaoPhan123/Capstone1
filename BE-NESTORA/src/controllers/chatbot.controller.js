const ChatSession = require("../models/ChatSession");
const Product = require("../models/Product");
const Order = require("../models/Order");
const openaiService = require("../services/openai.service");

async function getOrCreateSession(userId) {
	try {
		let session = await ChatSession.findOne({ user: userId, status: "active" }).sort({ createdAt: -1 });
		if (!session) {
			session = new ChatSession({ user: userId, messages: [], status: "active" });
			await session.save();
		}
		return session;
	} catch (error) {
		console.error("Lỗi lấy/tạo session:", error);
		throw error;
	}
}

function extractJson(text) {
	if (!text || typeof text !== "string") return null;
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) return null;
	const jsonText = text.slice(start, end + 1);
	try {
		return JSON.parse(jsonText);
	} catch (e) {
		return null;
	}
}

exports.sendMessage = async (req, res) => {
	try {
		const { message, userId, history = [] } = req.body;
		if (!message || typeof message !== "string" || !message.trim()) {
			return res.status(400).json({ error: "message phải là chuỗi không rỗng" });
		}
		const session = userId ? await getOrCreateSession(userId) : null;

		if (session) {
			session.messages.push({ role: "user", content: message, metadata: { timestamp: new Date() } });
			session.lastMessageAt = new Date();
			await session.save();
		}

		const historyMessages = session
			? session.messages
				.slice(-12)
				.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") }))
			: (Array.isArray(history) ? history : [])
				.slice(-12)
				.map(m => ({
					role: m.role === "assistant" || m.type === "bot" ? "assistant" : "user",
					content: String(m.content || m.text || "")
				}))
				.filter(m => m.content.trim());

		const products = await Product.find({})
			.select("name description category price images stock color material dimensions warranty")
			.limit(60)
			.lean();

		const productsForPrompt = products.map(p => ({
			id: String(p._id),
			name: p.name,
			category: p.category,
			price: p.price || null,
			stock: p.stock ?? 0,
			short: (p.description || "").slice(0, 200),
			color: p.color || ""
		}));

		const systemPrompt = `
Bạn là trợ lý bán hàng thân thiện của Nestora.

Phong cách:
- Nói tiếng Việt tự nhiên, gần gũi, không sáo rỗng.
- Ưu tiên giúp khách ra quyết định, không ép mua.
- Trả lời ngắn gọn, thường 2-5 câu.
- Nếu khách hỏi mơ hồ, vẫn cố gợi ý hướng phù hợp thay vì hỏi lại quá nhiều.
- Chỉ hỏi tối đa 1 câu nếu thật sự cần thêm thông tin.
- Có thể nhắc tên 1-3 sản phẩm phù hợp và lý do ngắn gọn.
- Không bịa thông tin ngoài dữ liệu sản phẩm.
- Nếu không có sản phẩm phù hợp, nói thật và gợi ý tiêu chí thay thế.

Xử lý stock:
- Kiểm tra trường "stock" của sản phẩm. Nếu stock = 0, sản phẩm đó hết hàng.
- Vẫn có thể gợi ý sản phẩm hết hàng, nhưng PHẢI nói rõ trong reply rằng "...tuy nhiên hiện đã hết hàng" hoặc tương tự.
- Nếu gợi ý sản phẩm hết hàng, có thể đề xuất sản phẩm tương tự còn hàng.

Nhiệm vụ:
Dựa vào lịch sử chat, tin nhắn mới và danh sách sản phẩm, hãy trả về JSON hợp lệ:
{
	"reply": "câu trả lời tự nhiên cho khách",
	"selectedProductIds": ["id1", "id2"]
}

Quy tắc chọn sản phẩm:
- Chọn tối đa 6 sản phẩm.
- Nếu khách chỉ chào hỏi hoặc hỏi không liên quan sản phẩm, selectedProductIds = [].
- Nếu khách hỏi gợi ý chung, hãy chọn vài sản phẩm nổi bật/phù hợp nhất (kể cả hết hàng nếu còn khác tốt hơn).
- Nếu khách hỏi theo tiêu chí, chọn sản phẩm khớp tiêu chí nhất.
`;

		let assistantReply = "Mình chưa rõ lắm, bạn mô tả lại giúp mình được không? (ví dụ: màu, phong cách, kích thước, ngân sách)";
		let selectedProductIds = [];

		const userInstruction = `
Tin nhắn mới của khách: ${message}

Danh sách sản phẩm:
${JSON.stringify(productsForPrompt)}
`;

		const messagesForAI = [
			{ role: "system", content: systemPrompt },
			...historyMessages,
			{ role: "user", content: userInstruction }
		];

		const aiResult = await openaiService.chatCompletion(messagesForAI);

		let aiText = "";
		try {
			if (aiResult?.choices && aiResult.choices[0]?.message?.content) aiText = aiResult.choices[0].message.content;
			else if (aiResult?.choices && aiResult.choices[0]?.text) aiText = aiResult.choices[0].text;
			else if (typeof aiResult === 'string') aiText = aiResult;
			else aiText = JSON.stringify(aiResult);
		} catch (e) {
			aiText = String(aiResult || "");
		}

		const parsed = extractJson(aiText);

		if (parsed && typeof parsed.reply === "string") {
			assistantReply = parsed.reply.trim();
			selectedProductIds = Array.isArray(parsed.selectedProductIds) ? parsed.selectedProductIds : [];
		} else {
			assistantReply = (parsed && parsed.reply) ? String(parsed.reply).slice(0, 2000) : aiText.slice(0, 2000);
		}

		const productsById = new Map(products.map(p => [String(p._id), p]));
		const finalSelected = (selectedProductIds || [])
			.map(id => productsById.get(String(id)))
			.filter(Boolean)
			.slice(0, 6);

		if (session) {
			session.messages.push({
				role: "assistant",
				content: assistantReply,
				metadata: { timestamp: new Date(), productsShown: finalSelected.map(p => String(p._id)) }
			});
			session.lastMessageAt = new Date();
			await session.save();
		}

		const productsForFE = finalSelected.map(p => ({ id: p._id, name: p.name, price: p.price, category: p.category, image: (p.images || [])[0] || "" }));

		return res.json({ reply: assistantReply, products: productsForFE, sessionId: session?._id || null });
	} catch (error) {
		console.error("Lỗi /api/chatbot/send:", error);
		res.status(500).json({ error: error.message || "Lỗi server khi xử lý chat" });
	}
};

exports.resetSession = async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ error: "Thiếu userId" });
		await ChatSession.updateOne({ user: userId, status: "active" }, { status: "archived" });
		const newSession = new ChatSession({ user: userId, messages: [], status: "active" });
		await newSession.save();
		res.json({ success: true, message: "Đã reset session chat", sessionId: newSession._id });
	} catch (error) {
		console.error("Lỗi /api/chatbot/reset:", error);
		res.status(500).json({ error: error.message || "Lỗi server khi reset session" });
	}
};

exports.getChatHistory = async (req, res) => {
	try {
		const { userId } = req.query;
		if (!userId) return res.status(400).json({ error: "Thiếu userId" });
		const session = await ChatSession.findOne({ user: userId, status: "active" }).sort({ createdAt: -1 });
		if (!session) return res.json({ messages: [], sessionId: null });
		const messages = session.messages.map(msg => ({ role: msg.role, content: msg.content, metadata: msg.metadata, createdAt: msg.createdAt }));
		res.json({ messages, sessionId: session._id });
	} catch (error) {
		console.error("Lỗi /api/chatbot/history:", error);
		res.status(500).json({ error: error.message || "Lỗi server khi lấy lịch sử chat" });
	}
};

exports.checkOrderStatus = async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ error: "Thiếu userId" });
		const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).select("_id status paymentStatus totalAmount items createdAt shippingCode").populate("items.product", "name price");
		const formatted = orders.map(o => ({ id: o._id, status: o.status, paymentStatus: o.paymentStatus, totalAmount: o.totalAmount, items: o.items, createdAt: o.createdAt, shippingCode: o.shippingCode }));
		res.json({ orders: formatted });
	} catch (error) {
		console.error("Lỗi /api/chatbot/orders:", error);
		res.status(500).json({ error: error.message || "Lỗi server khi kiểm tra đơn hàng" });
	}
};

exports.searchProducts = async (req, res) => {
	try {
		const { query, category, maxPrice, minPrice } = req.body;
		const filter = { stock: { $gt: 0 } };
		if (query) filter.$or = [{ name: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }, { category: { $regex: query, $options: "i" } }];
		if (category) filter.category = { $regex: category, $options: "i" };
		if (maxPrice || minPrice) { filter.price = {}; if (minPrice) filter.price.$gte = minPrice; if (maxPrice) filter.price.$lte = maxPrice; }
		const products = await Product.find(filter).select("-embedding").limit(200).lean();
		res.json({ products: products.map(p => ({ id: p._id, name: p.name, price: p.price, category: p.category, description: p.description, images: p.images, stock: p.stock })) });
	} catch (error) {
		console.error("Lỗi /api/chatbot/search:", error);
		res.status(500).json({ error: error.message || "Lỗi server khi tìm kiếm sản phẩm" });
	}
};

exports.getProductDetails = async (req, res) => {
	try {
		const { productId } = req.params;
		if (!productId) return res.status(400).json({ error: "Thiếu productId" });
		const product = await Product.findById(productId).select("-embedding");
		if (!product) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
		res.json({ product: { id: product._id, name: product.name, price: product.price, description: product.description, category: product.category, images: product.images, stock: product.stock, material: product.material, dimensions: product.dimensions, color: product.color, warranty: product.warranty } });
	} catch (error) {
		console.error("Lỗi /api/chatbot/product:", error);
		res.status(500).json({ error: error.message || "Lỗi server khi lấy chi tiết sản phẩm" });
	}
};
