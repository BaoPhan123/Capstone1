import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper function để xử lý URL ảnh sản phẩm
export function getImageUrl(imagePath) {
  if (!imagePath) return '/images/AnhCat/sp-1.png'; // Default image
  const normalized = String(imagePath).trim().replace(/\\/g, '/');

  // Nếu đã là URL đầy đủ (http/https), trả về nguyên
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    // Tránh mixed content khi site chạy https nhưng ảnh là http
    if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && normalized.startsWith('http://')) {
      return `https://${normalized.slice('http://'.length)}`;
    }
    // Một số host (vd googleusercontent) chặn hotlink → proxy qua backend
    if (/googleusercontent\.com/i.test(normalized)) {
      const apiBase = import.meta?.env?.VITE_API_URL?.replace(/\/$/, '') || '';
      return `${apiBase}/api/media/proxy?url=${encodeURIComponent(normalized)}`;
    }
    return normalized;
  }

  // Nếu đã có đường dẫn bắt đầu bằng /, trả về nguyên
  if (normalized.startsWith('/')) {
    return normalized;
  }

  // Nếu thiếu / ở đầu, thêm vào
  return `/${normalized}`;
}
