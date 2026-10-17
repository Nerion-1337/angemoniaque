const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    // En mode hors-ligne ou si le conteneur back redémarre, on ne bloque jamais l'interface 3D
    return null;
  }
}

// Alias pour compatibilité avec tous les composants
export const apiRequest = apiClient;