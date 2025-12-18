"use client";

import { useMemo } from "react";
import React from "react";

// --- TIPOS ---
export interface HabitacionDTO {
    id_habitacion: string;
    numero: number;
    tipoHabitacion: string;
    precio: number;
}

export interface DisponibilidadDia {
    fecha: string;
    estado: "DISPONIBLE" | "OCUPADA" | "RESERVADA" | "MANTENIMIENTO";
    idReserva?: string;
    esSalida?: boolean;
    tipoSalida?: "ESTADIA" | "RESERVA" | null;
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

    onCellClick: (roomId: string, dateStr: string, estado: string, numero: number, idReserva?: string) => void;

    modo: "reserva" | "checkin";
}

// --- UTILIDADES  ---
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

const formatearTipo = (tipoEnum: string) => {
    if (!tipoEnum) return "-";
    return tipoEnum
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// --- COLORES HEX (Coinciden con las clases *-50 de Tailwind) ---
const COLORS = {
    OCUPADA: "#fef2f2",    // bg-red-50
    RESERVADA: "#fefce8",  // bg-yellow-50
    DISPONIBLE: "#f0fdf4", // bg-green-50
};

export function GrillaDisponibilidad({
                                         data,
                                         loading,
                                         tempSelection,
                                         finalSelections,
                                         onCellClick,
                                         modo
                                     }: GrillaProps) {

    // --- LÓGICA DE ORDENAMIENTO (ASCENDENTE POR NÚMERO) ---
    const sortedData = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => a.habitacion.numero - b.habitacion.numero);
    }, [data]);

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

    if (loading) return <div className="p-12 text-center text-gray-500">Cargando disponibilidad...</div>;
    if (!data || data.length === 0) return <div className="p-12 text-center text-gray-500">No hay datos.</div>;
    if (!data[0]?.disponibilidad) return <div className="p-12 text-center text-red-500">Error: Datos de disponibilidad incompletos.</div>;

    const colorHeaderHoy = modo === "checkin" ? "bg-green-100 text-green-900 border-b-green-300" : "bg-rose-100 text-rose-900";
    const colorHabitacion = modo === "checkin" ? "text-green-900" : "text-rose-950";

    return (
        <div className="overflow-x-auto border rounded-lg border-gray-200 w-full shadow-sm">
            <table className="min-w-full text-xs text-center border-collapse select-none">
                <thead>
                <tr>
                    <th className="p-3 text-left bg-gray-50 border-b text-gray-600 font-medium sticky left-0 z-20 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Habitación
                    </th>
                    {sortedData[0]?.disponibilidad?.map((d, i) => {
                        const esHoy = d.fecha === getTodayString();
                        const highlight = (modo === "checkin" && esHoy);
                        return (
                            <th key={d.fecha || i} className={`p-2 border-b min-w-[50px] transition-colors ${
                                highlight ? `${colorHeaderHoy} font-bold` : 'bg-gray-50 text-gray-600 font-medium'
                            } ${d.fecha ? (isDatePast(d.fecha) ? 'opacity-50' : '') : ''}`}>
                                {highlight && <div className="text-[9px] uppercase tracking-wider">Hoy</div>}
                                {formatearFecha(d.fecha)}
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {sortedData.map(row => (
                    <tr key={row.habitacion.id_habitacion} className="hover:bg-gray-50/30">
                        <td className="p-3 text-left bg-white border-r border-b sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className={`font-bold text-sm ${colorHabitacion}`}>
                                Hab {row.habitacion.numero}
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">
                                {formatearTipo(row.habitacion.tipoHabitacion)}
                            </div>
                        </td>

                        {(row.disponibilidad ?? []).map((dia) => {
                            const esSeleccionado = isTempSelected(row.habitacion.id_habitacion, dia.fecha);
                            const esFinal = isFinalSelected(row.habitacion.id_habitacion, dia.fecha);
                            const esHoy = dia.fecha === getTodayString();
                            const pasado = isDatePast(dia.fecha);
                            const esInicioMismaHab = tempSelection.roomId === row.habitacion.id_habitacion && tempSelection.start === dia.fecha && !tempSelection.end;

                            // Nueva validación: ¿Esta celda es una noche que ya está en el carrito?
                            // Bloqueamos desde el inicio hasta el día ANTERIOR al fin (el fin está libre para entrada)
                            const estaEnCarrito = finalSelections.some(sel =>
                                sel.idHabitacion === row.habitacion.id_habitacion &&
                                dia.fecha >= sel.fechaDesde &&
                                dia.fecha < sel.fechaHasta
                            );

                            // --- LÓGICA DE ESTILOS Y PRIORIDADES ---

                            let bgClass = "bg-white";
                            let customStyle = {};
                            let txtColor = "text-gray-300";
                            let cellContent: React.ReactNode = "•";
                            let cursor = "cursor-not-allowed";
                            let borderClass = (modo === "checkin" && esHoy) ? "ring-2 ring-inset ring-green-300" : "";
                            let alignmentClass = "text-center align-middle";

                            /* REGLA 1: PREVALENCIA (Overlap) */
                            if (dia.estado === "OCUPADA") {
                                bgClass = "bg-red-50";
                                txtColor = "text-red-400 font-medium";
                                cellContent = "Ocupada";
                            }
                            else if (dia.estado === "RESERVADA") {
                                cursor = "cursor-pointer";

                                // === NUEVA LÓGICA: Checkout -> Reserva (DIAGONAL SIN LINEA) ===
                                if (dia.esSalida && dia.tipoSalida === "ESTADIA") {
                                    customStyle = {
                                        background: `linear-gradient(to bottom right, ${COLORS.OCUPADA} 50%, ${COLORS.RESERVADA} 50%)`
                                    };
                                    alignmentClass = "relative";
                                    txtColor = "";
                                    cellContent = (
                                        <>
                                            <span className="absolute top-4 left-2 text-[9px] font-bold text-red-400 leading-none">Out</span>
                                            <span className="absolute bottom-4 right-2 text-[9px] font-bold text-yellow-600 leading-none">Res</span>
                                        </>
                                    );
                                } else {
                                    bgClass = "bg-yellow-50 hover:bg-yellow-100";
                                    txtColor = "text-yellow-600 font-medium";
                                    cellContent = "Res";
                                }
                            }
                            else if (dia.estado === "MANTENIMIENTO") {
                                bgClass = "bg-gray-100";
                                txtColor = "text-gray-400";
                                cellContent = "Mant";
                            }
                            else if (dia.estado === "DISPONIBLE") {
                                bgClass = "bg-green-50/50 hover:bg-green-100";
                                txtColor = "text-green-600";
                                cellContent = "Libre";
                                cursor = "cursor-pointer";

                                if (dia.esSalida) {
                                    alignmentClass = "relative";
                                    txtColor = "";

                                    if (dia.tipoSalida === "ESTADIA") {
                                        customStyle = {
                                            background: `linear-gradient(to bottom right, ${COLORS.OCUPADA} 50%, ${COLORS.DISPONIBLE} 50%)`
                                        };
                                        cellContent = (
                                            <>
                                                <span className="absolute top-4 left-2 text-[9px] font-bold text-red-400 leading-none">Out</span>
                                                <span className="absolute bottom-4 right-2 text-[9px] font-bold text-green-600 leading-none">Lib</span>
                                            </>
                                        );

                                    } else if (dia.tipoSalida === "RESERVA") {
                                        customStyle = {
                                            background: `linear-gradient(to bottom right, ${COLORS.RESERVADA} 50%, ${COLORS.DISPONIBLE} 50%)`
                                        };
                                        cellContent = (
                                            <>
                                                <span className="absolute top-4 left-2 text-[9px] font-bold text-yellow-600 leading-none">Res</span>
                                                <span className="absolute bottom-4 right-2 text-[9px] font-bold text-green-600 leading-none">Lib</span>
                                            </>
                                        );
                                    } else {
                                        bgClass = "bg-gradient-to-br from-yellow-50 via-white to-green-50";
                                        alignmentClass = "text-center align-middle";
                                        txtColor = "text-yellow-600 font-semibold";
                                        cellContent = "Salida";
                                    }
                                }
                            }

                            // --- SOBRESCITURAS DE INTERFAZ (Selección, Pasado, etc) ---

                            if (pasado) {
                                bgClass = "bg-gray-50";
                                customStyle = {};
                                txtColor = "text-gray-300";
                                cursor = "cursor-not-allowed";
                                alignmentClass = "text-center align-middle";
                                cellContent = "•";
                            }

                            if (esFinal) {
                                bgClass = "bg-blue-100 border-blue-200";
                                customStyle = {};
                                txtColor = "text-blue-800 font-bold";
                                alignmentClass = "text-center align-middle";
                                cellContent = "✓";
                            }

                            if (esSeleccionado) {
                                bgClass = "bg-blue-600 shadow-sm";
                                customStyle = {};
                                txtColor = "text-white font-bold";
                                alignmentClass = "text-center align-middle";
                                cellContent = "+";
                            }

                            if (esInicioMismaHab || estaEnCarrito) {
                                cursor = "cursor-not-allowed";
                            }

                            return (
                                <td
                                    key={dia.fecha}
                                    onClick={() => !pasado && !esInicioMismaHab && !estaEnCarrito && onCellClick(row.habitacion.id_habitacion, dia.fecha, dia.estado, row.habitacion.numero, dia.idReserva)}
                                    className={`p-1 border-b border-r h-10 transition-all duration-150 ${bgClass} ${txtColor} ${cursor} ${borderClass} ${alignmentClass}`}
                                    style={customStyle}
                                >
                                    {cellContent}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}