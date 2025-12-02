// src/api/habitacion.api.ts

const BASE = "http://localhost:8080";

export async function listarHabitaciones() {
    const res = await fetch(`${BASE}/Habitacion/Listar`);
    return await res.json();
}

export async function obtenerDisponibilidad(desde: string, hasta: string) {
    const res = await fetch(
        `${BASE}/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}`
    );
    return await res.json();
}
