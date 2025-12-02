"use client";

import { useState } from "react";
import {
    Bed,
    Search,
    CheckCircle2,
    AlertCircle,
    CalendarRange,
    X,
    Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

//Tipos
interface HabitacionDTO {
    id_habitacion: string;
    numero: number;
    tipoHabitacion: string;
    precio: number;
}

interface DisponibilidadDia {
    fecha: string;
    estado: "DISPONIBLE" | "OCUPADA" | "RESERVADA" | "MANTENIMIENTO";
}

interface HabitacionDisponibilidad {
    habitacion: HabitacionDTO;
    disponibilidad: DisponibilidadDia[];
}


interface Seleccion {
    idHabitacion: string;
    fechaDesde: string;
    fechaHasta: string;
    numero: number;
}

//COMPONENTE PRINCIPAL

export function RoomManagement() {

    // Estados de búsqueda
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);

    // Estado para selección temporal de rango al hacer click
    const [tempSelect, setTempSelect] = useState<{
        start: string | null,
        end: string | null,
        roomId: string | null
    }>({ start: null, end: null, roomId: null });

    // Lista de reservas acumuladas
    const [selecciones, setSelecciones] = useState<Seleccion[]>([]);

    // Modal final de confirmación
    const [modalOpen, setModalOpen] = useState(false);
    const [guestData, setGuestData] = useState({ nombre: "", apellido: "", telefono: "" });

    // Slide-over (panel lateral)
    const [panelOpen, setPanelOpen] = useState(false);

    // Función de formateo de fechas
    const formatearFecha = (fechaStr: string) => {
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
    };

    // BUSCAR DISPONIBILIDAD

    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();

        if (new Date(desde) > new Date(hasta)) {
            alert("La fecha 'Desde' no puede ser mayor a 'Hasta'");
            return;
        }

        setLoading(true);
        setSearched(true);
        setTempSelect({ start: null, end: null, roomId: null });

        try {
            const res = await fetch(`http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}`);
            if (!res.ok) throw new Error("Error al obtener datos");
            const data: HabitacionDisponibilidad[] = await res.json();
            setGridData(data);
        } catch (e) {
            alert("Error cargando disponibilidad");
        } finally {
            setLoading(false);
        }
    };


    // SELECCIÓN DE RANGOS
    const handleCellClick = (roomId: string, dateStr: string, estado: string, numero: number) => {
    // 🚫 No permitir click en OCUPADA / MANTENIMIENTO / RESERVADA
    if (estado === "OCUPADA" || estado === "MANTENIMIENTO") return;

    if (estado === "RESERVADA") {
        alert(`La habitación ${numero} ya está reservada en esa fecha. No es posible seleccionarla.`);
        return;
    }


    if (!tempSelect.start) {
        setTempSelect({ start: dateStr, end: null, roomId });
    } else if (tempSelect.start && !tempSelect.end) {
        const start = tempSelect.start;
        let from = start;
        let to = dateStr;

        if (new Date(dateStr) < new Date(start)) {
            from = dateStr;
            to = start;
        }

        setTempSelect({ start: from, end: to, roomId });
    } else {
        // reiniciar selección
        setTempSelect({ start: dateStr, end: null, roomId });
    }
    };


    const isTempSelected = (roomId: string, dateStr: string) => {
        if (tempSelect.roomId !== roomId) return false;
        if (!tempSelect.start) return false;

        const d = new Date(dateStr);
        const start = new Date(tempSelect.start);
        if (!tempSelect.end) return d.getTime() === start.getTime();

        const end = new Date(tempSelect.end);
        return d >= start && d <= end;
    };


    // AÑADIR RESERVA

    const agregarSeleccion = () => {
        if (!tempSelect.start || !tempSelect.end || !tempSelect.roomId) return;

        const hab = gridData.find(h => h.habitacion.id_habitacion === tempSelect.roomId);
        if (!hab) return;

        setSelecciones(prev => {
            if (tempSelect.roomId === null) {
                return prev; // No hacer nada si roomId es null
            }
            return [
                ...prev,
                {
                    idHabitacion: tempSelect.roomId, // Ahora sabemos que roomId no es null
                    fechaDesde: tempSelect.start,
                    fechaHasta: tempSelect.end,
                    numero: hab.habitacion.numero
                }
            ];
        });

        setTempSelect({ start: null, end: null, roomId: null });
        setPanelOpen(true);
    };

    // Quitar una selección
    const eliminarSeleccion = (index: number) => {
        setSelecciones(prev => prev.filter((_, i) => i !== index));
    };

    // Marcar celdas ya seleccionadas en celeste
    const isFinalSelected = (roomId: string, dateStr: string) => {
        return selecciones.some(sel =>
            sel.idHabitacion === roomId &&
            new Date(dateStr) >= new Date(sel.fechaDesde) &&
            new Date(dateStr) <= new Date(sel.fechaHasta)
        );
    };


    // CONFIRMAR RESERVA
    const handleConfirmarReserva = async () => {
        if (!guestData.nombre || !guestData.apellido || !guestData.telefono) {
            alert("Complete todos los campos del huésped");
            return;
        }

        const payload = {
            nombreCliente: guestData.nombre,
            apellidoCliente: guestData.apellido,
            telefonoCliente: guestData.telefono,
            reservas: selecciones.map(s => ({
                idHabitacion: s.idHabitacion,
                fechaDesde: s.fechaDesde,
                fechaHasta: s.fechaHasta
            }))
        };

        try {
            const res = await fetch("http://localhost:8080/Reserva/Crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("¡Reserva creada!");
                setSelecciones([]);
                setTempSelect({ start: null, end: null, roomId: null });
                setModalOpen(false);
                setPanelOpen(false);
                setGuestData({ nombre: "", apellido: "", telefono: "" });

                const ev = { preventDefault() {} } as React.FormEvent;
                handleBuscar(ev);
            } else {
                alert("Error al reservar.");
            }
        } catch (e) {
            alert("Error de conexión");
        }
    };

    //  RENDER
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/*  HEADER */}
            <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-rose-100 pb-4">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <CalendarRange className="h-5 w-5 text-rose-900" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-rose-950">Consultar Disponibilidad</h2>
                        <p className="text-sm text-gray-500">Seleccione un rango de fechas.</p>
                    </div>
                </div>

                <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Desde</label>
                        <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} required />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Hasta</label>
                        <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} required />
                    </div>

                    <Button className="bg-rose-900 text-white hover:bg-rose-800" disabled={loading}>
                        <Search className="h-4 w-4" />
                        {loading ? "Buscando..." : "Buscar"}
                    </Button>
                </form>
            </div>

            {/* GRILLA  */}
            {searched && (
                <Card className="border-rose-100 shadow-sm overflow-hidden">

                    {/*  Panel superior */}
                    <div className="p-4 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center">
                        <h3 className="font-semibold text-rose-950 flex items-center gap-2">
                            <Bed className="h-4 w-4" /> Estado de Habitaciones
                        </h3>

                        <Button
                            onClick={() => setPanelOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
                        >
                            Reservas Seleccionadas ({selecciones.length})
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Cargando...</div>
                        ) : gridData.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                <tr>
                                    <th className="p-3 text-left bg-gray-50 border-b text-gray-600 font-medium sticky left-0 z-10">
                                        Habitación
                                    </th>
                                    {gridData[0].disponibilidad.map((d, i) => (
                                        <th key={i} className="p-2 border-b bg-gray-50 text-gray-600 font-medium">
                                            {formatearFecha(d.fecha)}
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                <tbody>
                                {gridData.map(row => (
                                    <tr key={row.habitacion.id_habitacion}>
                                        <td className="p-3 text-left bg-white sticky left-0 border-r border-b text-gray-700">
                                            <div className="font-semibold text-rose-950">Hab {row.habitacion.numero}</div>
                                            <div className="text-xs text-gray-400">{row.habitacion.tipoHabitacion}</div>
                                        </td>

                                        {row.disponibilidad.map((dia, idx) => {
                                            const temp = isTempSelected(row.habitacion.id_habitacion, dia.fecha);
                                            const finalSel = isFinalSelected(row.habitacion.id_habitacion, dia.fecha);

                                            let bgColor = "bg-green-100 text-green-800";
                                            let content = "Libre";

                                            if (dia.estado === "OCUPADA") {
                                                bgColor = "bg-red-100 text-red-700";
                                                content = "Ocu";
                                            } else if (dia.estado === "MANTENIMIENTO") {
                                                bgColor = "bg-gray-200 text-gray-600";
                                                content = "Mant";
                                            } else if (dia.estado === "RESERVADA") {
                                                bgColor = "bg-yellow-100 text-yellow-800";
                                                content = "Res";
                                            }

                                            if (finalSel) {
                                                bgColor = "bg-blue-200 text-blue-900 font-semibold";
                                                content = "Sel";
                                            }

                                            if (temp) {
                                                bgColor = "bg-blue-500 text-white font-bold";
                                                content = "✓";
                                            }

                                            const clickable =
                                                    dia.estado !== "OCUPADA" &&
                                                    dia.estado !== "MANTENIMIENTO" &&
                                                    dia.estado !== "RESERVADA";      // 👈 también bloqueamos RESERVADA

                                            const cursorClass = clickable ? "cursor-pointer" : "cursor-not-allowed";

                                            return (
                                                <td
                                                    key={idx}
                                                    onClick={() =>
                                                        clickable &&
                                                        handleCellClick(
                                                                row.habitacion.id_habitacion,
                                                                dia.fecha,
                                                                dia.estado,
                                                                row.habitacion.numero
                                                        )
                                                    }
                                                    className={`p-1 border-b border-r transition ${bgColor} ${cursorClass}`}
                                                >
                                                    {content}
                                                </td>
                                            );

                                        })}

                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-gray-500">No hay datos.</div>
                        )}
                    </div>
                </Card>
            )}


            {/* SLIDE-OVER */}

            {panelOpen && (
                <div className="fixed inset-0 z-40 flex">
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setPanelOpen(false)}
                    />

                    {/* Panel RIGHT  */}
                    <div className="ml-auto h-full w-[35%] bg-white shadow-xl border-l border-rose-100 p-6 animate-in slide-in-from-right duration-300 overflow-y-auto relative z-50">

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-rose-950">
                                Selecciones de Reserva
                            </h2>
                            <button onClick={() => setPanelOpen(false)}>
                                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        {/* Mostrar lista */}
                        {selecciones.length === 0 ? (
                            <p className="text-gray-500 text-sm">No hay selecciones aún.</p>
                        ) : (
                            <div className="space-y-3">
                                {selecciones.map((sel, i) => (
                                    <div
                                        key={i}
                                        className="border border-rose-100 rounded-lg p-3 bg-rose-50/40 shadow-sm flex justify-between"
                                    >
                                        <div>
                                            <div className="font-semibold text-rose-900">
                                                Habitación {sel.numero}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {formatearFecha(sel.fechaDesde)} → {formatearFecha(sel.fechaHasta)}
                                            </div>
                                        </div>

                                        <button onClick={() => eliminarSeleccion(i)}>
                                            <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botón para agregar la selección temporal */}
                        {tempSelect.start && tempSelect.end && (
                            <Button
                                onClick={agregarSeleccion}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Añadir esta selección
                            </Button>
                        )}

                        {/* Botón confirmar */}
                        {selecciones.length > 0 && (
                            <Button
                                onClick={() => setModalOpen(true)}
                                className="w-full mt-4 bg-rose-900 hover:bg-rose-800 text-white shadow"
                            >
                                Confirmar Reserva ({selecciones.length})
                            </Button>
                        )}
                    </div>
                </div>
            )}


            {/*  MODAL FINAL  */}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Confirmar Reserva
                        </DialogTitle>
                        <DialogDescription>
                            Complete los datos del huésped.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Datos huésped */}
                    <div className="space-y-4">
                        <Input
                            placeholder="Nombre"
                            value={guestData.nombre}
                            onChange={e => setGuestData({ ...guestData, nombre: e.target.value })}
                        />
                        <Input
                            placeholder="Apellido"
                            value={guestData.apellido}
                            onChange={e => setGuestData({ ...guestData, apellido: e.target.value })}
                        />
                        <Input
                            placeholder="Teléfono"
                            value={guestData.telefono}
                            onChange={e => setGuestData({ ...guestData, telefono: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmarReserva} className="bg-rose-900 text-white">
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
