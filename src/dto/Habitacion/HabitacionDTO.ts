// src/dto/Habitacion/HabitacionDTO.ts

export type EstadoHabitacion = "DISPONIBLE" | "OCUPADA" | "MANTENIMIENTO";

export interface HabitacionDTO {
    id_habitacion: string;
    precio: number | null;
    numero: number;
    piso: number;
    estado: EstadoHabitacion;
    capacidad: number;
    detalles: string | null;
    cantidadCamasIndividual: number | null;
    cantidadCamasDobles: number | null;
    cantidadCamasKingSize: number | null;
    // si en el back mandamos tipo_habitacion → lo mapeamos a esto
    tipoHabitacion?: string | null;
}
