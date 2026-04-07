import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tự động chuyển đổi link xem Google Drive thành link ảnh trực tiếp
export function getDirectImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Nếu là format: drive.google.com/open?id=MAX_ID
  let match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  
  // Nếu là format: drive.google.com/file/d/MAX_ID/view
  match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

  return url;
}
