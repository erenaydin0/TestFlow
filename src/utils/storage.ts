/**
 * LocalStorage utility fonksiyonları
 * SSR uyumlu ve type-safe LocalStorage işlemleri için
 */

/**
 * LocalStorage'dan değer okur
 * @param key - LocalStorage key
 * @param defaultValue - Key bulunamazsa döndürülecek varsayılan değer
 * @returns Okunan değer veya varsayılan değer
 */
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      return defaultValue;
    }
    
    // Boş string veya sadece whitespace kontrolü
    const trimmedItem = item.trim();
    if (trimmedItem === '' || trimmedItem === 'null' || trimmedItem === 'undefined') {
      return defaultValue;
    }
    
    return JSON.parse(item) as T;
  } catch (error) {
    // Bozuk JSON verisi varsa temizle ve varsayılan değeri döndür
    console.error(`Error reading localStorage key "${key}":`, error);
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error(`Error removing corrupted localStorage key "${key}":`, removeError);
    }
    return defaultValue;
  }
}

/**
 * LocalStorage'a değer yazar
 * @param key - LocalStorage key
 * @param value - Yazılacak değer
 */
export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

/**
 * LocalStorage'dan değer siler
 * @param key - Silinecek LocalStorage key
 */
export function removeItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

/**
 * LocalStorage değişikliklerini dinler
 * @param key - Dinlenecek LocalStorage key
 * @param callback - Değişiklik olduğunda çağrılacak callback
 * @returns Cleanup fonksiyonu
 */
export function onStorageChange<T>(
  key: string,
  callback: (newValue: T | null) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === key) {
      try {
        if (!e.newValue || e.newValue.trim() === '' || e.newValue === 'null' || e.newValue === 'undefined') {
          callback(null);
          return;
        }
        const newValue = JSON.parse(e.newValue) as T;
        callback(newValue);
      } catch (error) {
        console.error(`Error parsing storage change for key "${key}":`, error);
        callback(null);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

