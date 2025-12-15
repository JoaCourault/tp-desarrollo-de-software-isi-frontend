import { EstadiaDetalleDTO } from "@/src/dto/Facturacion.dto";


const BASE_URL = "http://localhost:8080/Estadia";

export const estadiaApi = {
    // Busca la estadía activa por número de habitación
    buscarPorHabitacion: async (numeroHabitacion: string): Promise<EstadiaDetalleDTO> => {
        // Se asume endpoint: GET /Estadia/BuscarPorHabitacion?numero=101
        const response = await fetch(`${BASE_URL}/BuscarPorHabitacion?numero=${numeroHabitacion}`);

        if (response.status === 404) {
            throw new Error("No hay una estadía activa en esta habitación.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensaje || "Error al buscar estadía.");
        }

        return await response.json();
    }
};