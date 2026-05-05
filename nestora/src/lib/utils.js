import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper function để xử lý URL ảnh sản phẩm
export function getImageUrl(imagePath) {
  if (!imagePath) return '/images/AnhCat/sp-1.png'; // Default image

  // Nếu đã là URL đầy đủ (http/https), trả về nguyên
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Nếu đã có đường dẫn bắt đầu bằng /, trả về nguyên
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // Nếu thiếu / ở đầu, thêm vào
  return `/${imagePath}`;
}
