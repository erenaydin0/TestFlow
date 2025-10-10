// Cosmic tema renk paleti
const COSMIC_COLORS = [
  '#D07E47', // Orange
  '#a66794', // Purple
  '#e89558', // Light Orange
  '#b87aa6', // Light Purple
  '#d88575', // Coral
  '#c96d3d', // Dark Orange
  '#955b84', // Dark Purple
  '#d88446', // Amber
  '#6b9bd1', // Blue
  '#88b87a', // Green
  '#c77435', // Brown Orange
  '#845075', // Deep Purple
  '#7daee0', // Light Blue
  '#9bc98d', // Light Green
  '#b85e34', // Rust
  '#a66794', // Mauve
];

/**
 * String'den tutarlı bir renk üretir (aynı string her zaman aynı rengi verir)
 * @param str - Renk üretilecek string (örn: test grubu adı)
 * @returns Cosmic tema renginden bir renk kodu
 */
export function getConsistentColorFromString(str: string): string {
  // String'den basit bir hash üret
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer'a dönüştür
  }
  
  // Hash'i pozitif yap ve renk paletinden seç
  const index = Math.abs(hash) % COSMIC_COLORS.length;
  return COSMIC_COLORS[index];
}

