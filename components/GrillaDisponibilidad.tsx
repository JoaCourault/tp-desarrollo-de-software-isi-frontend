"use client";

import { useMemo, useEffect } from "react";

// --- TIPOS ---
export interface HabitacionDTO {
    // Definimos ambos para que TypeScript no se queje, venga como venga
    idHabitacion?: string;
    id_habitacion?: string;

    numero: number;
    tipoHabitacion: string;
    precio: number;
}

export interface DisponibilidadDia {
    fecha: string;
    estado: "DISPONIBLE" | "OCUPADA" | "RESERVADA" | "MANTENIMIENTO";
}

export interface HabitacionDisponibilidad {
    habitacion: HabitacionDTO;
    disponibilidad: DisponibilidadDia[];
}

interface GrillaProps {
    data: HabitacionDisponibilidad[];
    loading: boolean;
    tempSelection: {
        start: string | null;
        end: string | null;
        roomId: string | null;
    };
    finalSelections: {
        idHabitacion: string;
        fechaDesde: string;
        fechaHasta: string;
    }[];
    onCellClick: (roomId: string, dateStr: string, estado: string, numero: number) => void;
    modo: "reserva" | "checkin";
}

const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "-";
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
};

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isDatePast = (dateStr: string) => {
    return dateStr < getTodayString();
};

export function GrillaDisponibilidad({
                                         data,
                                         loading,
                                         tempSelection,
                                         finalSelections,
                                         onCellClick,
                                         modo
                                     }: GrillaProps) {

    // DEBUG: Ver qué llega realmente desde el backend
    useEffect(() => {
        if (data && data.length > 0) {
            console.log("🟢 Datos recibidos en Grilla:", data);
            console.log("🟢 Ejemplo fila 1 habitacion:", data[0].habitacion);
        }
    }, [data]);

    // --- 1. DEDUPLICACIÓN ROBUSTA ---
    const uniqueData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];

        const seen = new Set<string>();

        return data.filter(row => {
            if (!row.habitacion) return false;

            // TRUCO: Intentamos leer el ID de las dos formas posibles
            const idReal = row.habitacion.idHabitacion || row.habitacion.id_habitacion;

            // Si no tiene ID, lo mostramos en consola para avisar, pero no lo renderizamos
            if (!idReal) {
                console.warn("⚠️ Fila ignorada por falta de ID:", row);
                return false;
            }

            // Si ya vimos este ID, es un duplicado del backend
            if (seen.has(idReal)) {
                return false;
            }

            seen.add(idReal);
            return true;
        });
    }, [data]);

    // --- 2. LÓGICA DE SELECCIÓN ---
    const isTempSelected = (roomId: string, dateStr: string) => {
        if (tempSelection.roomId && tempSelection.roomId !== roomId) return false;
        if (!tempSelection.start) return false;
        if (!tempSelection.end) return dateStr === tempSelection.start;

        const s = tempSelection.start < tempSelection.end ? tempSelection.start : tempSelection.end;
        const e = tempSelection.start < tempSelection.end ? tempSelection.end : tempSelection.start;
        return dateStr >= s && dateStr <= e;
    };

    const isFinalSelected = (roomId: string, dateStr: string) => {
        return finalSelections.some(sel =>
            sel.idHabitacion === roomId &&
            dateStr >= sel.fechaDesde && dateStr <= sel.fechaHasta
        );
    };

    // --- RENDER ---

    if (loading) return <div className="p-12 text-center text-gray-500">Cargando disponibilidad...</div>;

    // Si uniqueData está vacío, significa que el filtro borró todo o no llegó nada
    if (!uniqueData || uniqueData.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                <p>No hay datos disponibles.</p>
                <p className="text-xs text-gray-400">(Revise la consola F12 para ver detalles del JSON)</p>
            </div>
        );
    }

    const colorHeaderHoy = modo === "checkin" ? "bg-green-100 text-green-900 border-b-green-300" : "bg-rose-100 text-rose-900";
    const colorHabitacion = modo === "checkin" ? "text-green-900" : "text-rose-950";

    return (
        <div className="overflow-x-auto border rounded-lg border-gray-200">
            <table className="w-full text-xs text-center border-collapse select-none">
                <thead>
                <tr>
                    <th className="p-3 text-left bg-gray-50 border-b text-gray-600 font-medium sticky left-0 z-10 w-32 shadow-sm">
                        Habitación
                    </th>
                    {uniqueData[0].disponibilidad.map((d) => {
                        const esHoy = d.fecha === getTodayString();
                        const highlight = (modo === "checkin" && esHoy);
                        return (
                            <th key={d.fecha} className={`p-2 border-b min-w-[50px] transition-colors ${
                                highlight ? `${colorHeaderHoy} font-bold` : 'bg-gray-50 text-gray-600 font-medium'
                            } ${isDatePast(d.fecha) ? 'opacity-50' : ''}`}>
                                {highlight && <div className="text-[9px] uppercase tracking-wider">Hoy</div>}
                                {formatearFecha(d.fecha)}
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {uniqueData.map((row) => {
                    // Obtenemos el ID seguro para usarlo en Keys y Clicks
                    const currentId = row.habitacion.idHabitacion || row.habitacion.id_habitacion || "unknown";

                    return (
                        <tr key={currentId} className="hover:bg-gray-50/30">
                            <td className="p-3 text-left bg-white border-r border-b sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className={`font-bold text-sm ${colorHabitacion}`}>
                                    Hab {row.habitacion.numero}
                                </div>
                                <div className="text-[10px] text-gray-400 font-normal uppercase">
                                    {row.habitacion.tipoHabitacion}
                                </div>
                            </td>

                            {row.disponibilidad.map((dia) => {
                                const esSeleccionado = isTempSelected(currentId, dia.fecha);
                                const esFinal = isFinalSelected(currentId, dia.fecha);
                                const esHoy = dia.fecha === getTodayString();
                                const pasado = isDatePast(dia.fecha);

                                let bg = "bg-white";
                                let txtColor = "text-gray-300";
                                let content = "•";
                                let cursor = "cursor-not-allowed";

                                if (dia.estado === "DISPONIBLE") {
                                    bg = "bg-green-50/50 hover:bg-green-100";
                                    txtColor = "text-green-600";
                                    content = "Libre";
                                    cursor = "cursor-pointer";
                                } else if (dia.estado === "OCUPADA") {
                                    bg = "bg-red-50";
                                    txtColor = "text-red-300";
                                    content = "Ocu";
                                } else if (dia.estado === "MANTENIMIENTO") {
                                    bg = "bg-gray-100";
                                    txtColor = "text-gray-400";
                                    content = "Mant";
                                } else if (dia.estado === "RESERVADA") {
                                    bg = "bg-yellow-50 hover:bg-yellow-100";
                                    txtColor = "text-yellow-600";
                                    content = "Res";
                                    cursor = "cursor-pointer";
                                }

                                if (pasado) {
                                    bg = "bg-gray-50";
                                    txtColor = "text-gray-300";
                                    cursor = "cursor-not-allowed";
                                }

                                if (esFinal) {
                                    bg = "bg-blue-100 border-blue-200";
                                    txtColor = "text-blue-800 font-bold";
                                    content = "✓";
                                }

                                if (esSeleccionado) {
                                    bg = modo === "checkin" ? "bg-blue-600 shadow-sm" : "bg-rose-600 shadow-sm";
                                    txtColor = "text-white font-bold";
                                    content = "+";
                                }

                                const borderClass = (modo === "checkin" && esHoy) ? "ring-2 ring-inset ring-green-300" : "";

                                return (
                                    <td
                                        key={dia.fecha}
                                        onClick={() => !pasado && onCellClick(currentId, dia.fecha, dia.estado, row.habitacion.numero)}
                                        className={`p-1 border-b border-r h-10 transition-all duration-150 ${bg} ${txtColor} ${cursor} ${borderClass}`}
                                    >
                                        {content}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}