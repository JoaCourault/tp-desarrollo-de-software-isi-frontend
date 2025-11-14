import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { showModal } from 'hooks/useModalAlert';

/**
 * Servicio HTTP generico que usa axios y toma la URL base desde una variable
 * de entorno. Se exporta la clase para que las APIs concretas la utilicen.
 *
 * Variables de entorno soportadas (en un proyecto Next.js normalmente usar `NEXT_PUBLIC_`):
 * - NEXT_PUBLIC_API_BASE_URL
 */
export class Service {
  private static client: AxiosInstance;
  private static interceptorsInstalled = false;

  constructor(baseURL?: string) {
    const envBase = baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

    Service.client = axios.create({
      baseURL: envBase,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Instala interceptores una sola vez. El interceptor de respuesta muestra
    // un modal de antd en el cliente si ocurre un error.
    if (typeof window !== 'undefined' && !Service.interceptorsInstalled) {
      Service.interceptorsInstalled = true;

      Service.client.interceptors.response.use(
        (response) => response,
        async (error) => {
          try {
            // Determinar mensaje de error
            const respData = error?.response?.data;
            const status = error?.response?.status;
            const url = error?.config?.url || '';
            const message =
              (respData && (respData.message || respData.error || JSON.stringify(respData))) ||
              error.message ||
              'Error en la comunicación con el servidor.';

            // emite error al bus de UI para que el ModalAlertHost lo muestre
            showModal({
              title: `Error${status ? ` (${status})` : ''}`,
              message: `${message}${url ? '\n' + url : ''}`,
              type: 'error',
            });
          } catch (showErr) {
            // Si mostrar el modal falla, al menos loguear en consola

            console.error('Error mostrando modal de error:', showErr);
          }

          // Relanza el error para que el llamador también pueda manejarlo
          return Promise.reject(error);
        }
      );
    }
  }


  static async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.get<T>(path, config);
    return res.data;
  }


  static async post<T = any, R = any>(path: string, payload?: T, config?: AxiosRequestConfig): Promise<R> {
    const res = await this.client.post<R>(path, payload, config);
    return res.data;
  }


  static getClient(): AxiosInstance {
    return this.client;
  }
}
export default new Service();
