"use client";

import { useState, useEffect } from "react";
import {
    Bed,
    Search,
    CheckCircle2,
    CalendarRange,
    Trash2,
    ArrowRight,
    ListChecks,
    CalendarDays,
    AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import ModalAlert from "@/components/modalAlert/modalAlert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    GrillaDisponibilidad,
    type HabitacionDisponibilidad,
} from "@/components/GrillaDisponibilidad";

interface Seleccion {
    idHabitacion: string;
    fechaDesde: string;
    fechaHasta: string;
    numero: number;
}

const isDatePast = (dateStr: string) => {
    const checkDate = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
};

// HELPER: Busca una habitación en la lista manejando ambos tipos de ID
const findHabitacionById = (lista: HabitacionDisponibilidad[], idBusqueda: string | null) => {
    if (!idBusqueda) return undefined;
    return lista.find(h => {
        const idReal = h.habitacion.idHabitacion || h.habitacion.id_habitacion;
        return idReal === idBusqueda;
    });
}; //uso id_habitacion porq el back me devuelve id_habitacion

export function RoomManagement() {
    // Estados de búsqueda
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [loading, setLoading] = useState(false);

    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);

    // Selección temporal
    const [tempSelect, setTempSelect] = useState<{
        start: string | null;
        end: string | null;
        roomId: string | null;
    }>({ start: null, end: null, roomId: null });

    // Lista de reservas
    const [selecciones, setSelecciones] = useState<Seleccion[]>([]);

    // Modales de Flujo
    const [guestFormOpen, setGuestFormOpen] = useState(false);
    const [pendingSelectionOpen, setPendingSelectionOpen] = useState(false);

    // Datos del Huésped
    const [guestData, setGuestData] = useState({
        nombre: "",
        apellido: "",
        telefono: "",
    });

    // Estados para Modal Alert
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoType, setInfoType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [infoTitle, setInfoTitle] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [infoOnOk, setInfoOnOk] = useState<(() => void) | null>(null);

    const showInfo = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, onOk?: () => void) => {
        setInfoType(type);
        setInfoTitle(title);
        setInfoMessage(message);
        if (onOk) setInfoOnOk(() => onOk); else setInfoOnOk(null);
        setInfoOpen(true);
    };

    const formatearFecha = (fechaStr: string) => {
        if (!fechaStr) return "-";
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
        }).format(date);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setTempSelect({ start: null, end: null, roomId: null });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desde || !hasta) return;

        if (new Date(desde) > new Date(hasta)) {
            showInfo("warning", "Fechas Incorrectas", "La fecha 'Desde' no puede ser mayor a 'Hasta'.");
            return;
        }

        setLoading(true);
        setTempSelect({ start: null, end: null, roomId: null });
        setSearched(false);

        try {
            const res = await fetch(
                `http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}`
            );
            if (!res.ok) throw new Error("Error API");
            const data: HabitacionDisponibilidad[] = await res.json();
            setGridData(data);
            setSearched(true);
        } catch (err) {
            console.error(err);
            setGridData([]);
            setSearched(true);
            showInfo("error", "Error de Conexión", "No se pudo obtener la disponibilidad.");
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (
        roomId: string,
        dateStr: string,
        estado: string,
        numero: number
    ) => {
        if (isDatePast(dateStr)) return;
        if (estado === "OCUPADA" || estado === "MANTENIMIENTO") return;

        if (estado === "RESERVADA") {
            showInfo("info", "Habitación Reservada", `La habitación ${numero} ya está reservada el día ${formatearFecha(dateStr)}.`);
            return;
        }

        if (!tempSelect.start) {
            setTempSelect({ start: dateStr, end: null, roomId });
            return;
        }

        if (tempSelect.start && !tempSelect.end) {
            if (tempSelect.roomId !== roomId) {
                setTempSelect({ start: dateStr, end: null, roomId });
                return;
            }

            const start = tempSelect.start;
            let from = start;
            let to = dateStr;

            if (new Date(dateStr) < new Date(start)) {
                from = dateStr;
                to = start;
            }

            // CORRECCIÓN: Usamos el helper para encontrar la habitación de forma segura
            const habitacionActual = findHabitacionById(gridData, roomId);

            if (habitacionActual) {
                const diaConflicto = habitacionActual.disponibilidad.find((dia) => {
                    const enRango = dia.fecha >= from && dia.fecha <= to;
                    const esPasado = isDatePast(dia.fecha);
                    return (
                        enRango &&
                        (["OCUPADA", "MANTENIMIENTO", "RESERVADA"].includes(dia.estado) || esPasado)
                    );
                });

                if (diaConflicto) {
                    showInfo("warning", "Rango Inválido", "La selección incluye días ocupados o pasados.");
                    setTempSelect({ start: null, end: null, roomId: null });
                    return;
                }
            }

            setTempSelect({ start: from, end: to, roomId });
            return;
        }

        setTempSelect({ start: dateStr, end: null, roomId });
    };

    const agregarSeleccion = () => {
        if (!tempSelect.start || !tempSelect.end || !tempSelect.roomId) return;

        // CORRECCIÓN: Usamos el helper para encontrar la habitación
        const hab = findHabitacionById(gridData, tempSelect.roomId);

        if (!hab) {
            console.error("No se encontró la habitación con ID:", tempSelect.roomId);
            return;
        }

        setSelecciones((prev) => [
            ...prev,
            {
                idHabitacion: tempSelect.roomId!,
                fechaDesde: tempSelect.start!,
                fechaHasta: tempSelect.end!,
                numero: hab.habitacion.numero,
            },
        ]);

        setTempSelect({ start: null, end: null, roomId: null });
    };

    const eliminarSeleccion = (index: number) => {
        setSelecciones((prev) => prev.filter((_, i) => i !== index));
    };

    const checkPendingSelection = () => {
        if (tempSelect.start && tempSelect.end && tempSelect.roomId) {
            setPendingSelectionOpen(true);
        } else {
            setGuestFormOpen(true);
        }
    };

    const handleAddAndProceed = () => {
        agregarSeleccion();
        setPendingSelectionOpen(false);
        setGuestFormOpen(true);
    };

    const handleDiscardAndProceed = () => {
        setTempSelect({ start: null, end: null, roomId: null });
        setPendingSelectionOpen(false);
        setGuestFormOpen(true);
    };

    const handleConfirmarReserva = async () => {
        if (!guestData.nombre || !guestData.apellido || !guestData.telefono) {
            showInfo("warning", "Datos Incompletos", "Por favor, complete todos los campos del huésped.");
            return;
        }

        if (selecciones.length === 0) {
            showInfo("warning", "Sin Selecciones", "No hay habitaciones seleccionadas.");
            return;
        }

        const payload = {
            nombreCliente: guestData.nombre,
            apellidoCliente: guestData.apellido,
            telefonoCliente: guestData.telefono,
            reservas: selecciones.map((sel) => ({
                idHabitacion: sel.idHabitacion,
                fechaDesde: sel.fechaDesde,
                fechaHasta: sel.fechaHasta,
            })),
        };

        try {
            const res = await fetch("http://localhost:8080/Reserva/Crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error al crear la reserva");
            }

            setGuestFormOpen(false);

            showInfo("success", "Reserva Creada", "La reserva se ha registrado exitosamente.", () => {
                setSelecciones([]);
                setGuestData({ nombre: "", apellido: "", telefono: "" });
                setSearched(false);
                setDesde("");
                setHasta("");
                setTempSelect({ start: null, end: null, roomId: null });
            });

        } catch (err) {
            console.error(err);
            showInfo("error", "Error", "No se pudo crear la reserva. " + (err as Error).message);
        }
    };

    // Helper para renderizar número de habitación en el panel lateral
    const selectedRoomNumber = tempSelect.roomId
        ? findHabitacionById(gridData, tempSelect.roomId)?.habitacion.numero
        : null;

    return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 pb-10 min-h-screen">
            <Card className="bg-white border-rose-100 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <CalendarRange className="h-5 w-5 text-rose-900" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-rose-950">
                                Gestión de Reservas
                            </h2>
                            <p className="text-sm text-gray-500">
                                Consulta disponibilidad y arma tu reserva.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-1/4">
                            <label className="text-sm font-medium text-gray-700">Desde</label>
                            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required />
                        </div>
                        <div className="w-full sm:w-1/4">
                            <label className="text-sm font-medium text-gray-700">Hasta</label>
                            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
                        </div>
                        <Button className="bg-rose-900 text-white hover:bg-rose-800 w-full sm:w-auto" disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            {loading ? "Buscando..." : "Buscar Disponibilidad"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {searched && (
                <div className="flex flex-col lg:flex-row gap-6 items-start animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-full lg:flex-1 min-w-0">
                        <Card className="border-rose-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center">
                                <h3 className="font-semibold text-rose-950 flex items-center gap-2">
                                    <Bed className="h-4 w-4" /> Estado de Habitaciones
                                </h3>
                                <span className="text-xs text-gray-400 hidden lg:inline-block">
                                    Presiona <kbd className="font-mono bg-gray-100 px-1 rounded border">ESC</kbd> para cancelar selección
                                </span>
                            </div>

                            <GrillaDisponibilidad
                                data={gridData}
                                loading={loading}
                                tempSelection={tempSelect}
                                finalSelections={selecciones}
                                onCellClick={handleCellClick}
                                modo="reserva"
                            />
                        </Card>
                    </div>

                    <aside className="w-full lg:w-80 shrink-0 space-y-4 sticky top-6 animate-in slide-in-from-right duration-500">
                        <Card className={`border-2 transition-all shadow-md ${tempSelect.roomId ? "border-blue-400 bg-blue-50/50" : "border-gray-100 bg-gray-50 opacity-80"}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" /> Selección Actual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tempSelect.roomId ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                                            {/* CORRECCIÓN VISUAL: Usamos la variable calculada arriba */}
                                            <span className="font-bold text-blue-900">
                                                Hab {selectedRoomNumber || "?"}
                                            </span>
                                            <div className="text-xs text-right">
                                                <div className="text-gray-500">Entrada: {formatearFecha(tempSelect.start!)}</div>
                                                {tempSelect.end && (
                                                    <div className="text-gray-500">Salida: {formatearFecha(tempSelect.end)}</div>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={agregarSeleccion}
                                            disabled={!tempSelect.end}
                                        >
                                            {tempSelect.end ? "Agregar a la Lista" : "Seleccione fecha fin"}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Haz click en la grilla para comenzar una selección.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 shadow-sm h-fit max-h-[500px] flex flex-col">
                            <CardHeader className="pb-3 border-b bg-gray-50">
                                <CardTitle className="text-base font-semibold text-gray-800 flex justify-between items-center">
                                    <span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Mis Reservas</span>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{selecciones.length}</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                {selecciones.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-400">No hay habitaciones seleccionadas.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {selecciones.map((sel, i) => (
                                            <div key={i} className="p-3 hover:bg-gray-50 transition flex justify-between items-center group">
                                                <div>
                                                    <div className="font-semibold text-gray-800 text-sm">Habitación {sel.numero}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        {formatearFecha(sel.fechaDesde)} <ArrowRight className="h-3 w-3" /> {formatearFecha(sel.fechaHasta)}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => eliminarSeleccion(i)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>

                            {(selecciones.length > 0 || (tempSelect.start && tempSelect.end)) && (
                                <div className="p-4 border-t bg-gray-50">
                                    <Button className="w-full bg-rose-900 hover:bg-rose-800 text-white shadow-md" onClick={checkPendingSelection}>
                                        Confirmar Todo
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </aside>
                </div>
            )}

            <ModalAlert open={infoOpen} title={infoTitle} message={infoMessage} type={infoType} onOk={() => { setInfoOpen(false); if (infoOnOk) infoOnOk(); }} okText="Aceptar" />

            <AlertDialog open={pendingSelectionOpen} onOpenChange={setPendingSelectionOpen}>
                <AlertDialogContent className="bg-amber-50 border-amber-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-800 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Selección Pendiente</AlertDialogTitle>
                        <AlertDialogDescription className="text-amber-700">Tienes una habitación seleccionada en la grilla que no has agregado a tu lista.<br/><br/>¿Deseas agregarla a la reserva o descartarla?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingSelectionOpen(false)} className="border-amber-200 text-amber-900 hover:bg-amber-100">Cancelar</AlertDialogCancel>
                        <Button variant="ghost" onClick={handleDiscardAndProceed} className="text-red-600 hover:bg-red-100 hover:text-red-700">Descartar</Button>
                        <AlertDialogAction onClick={handleAddAndProceed} className="bg-blue-600 text-white hover:bg-blue-700 border-blue-700">Agregar y Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={guestFormOpen} onOpenChange={setGuestFormOpen}>
                <DialogContent className="sm:max-w-md border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Finalizar Reserva</DialogTitle>
                        <DialogDescription>Estás por reservar <b>{selecciones.length} habitaciones</b>.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Input placeholder="Nombre" value={guestData.nombre} onChange={(e) => setGuestData({ ...guestData, nombre: e.target.value })} />
                        <Input placeholder="Apellido" value={guestData.apellido} onChange={(e) => setGuestData({ ...guestData, apellido: e.target.value })} />
                        <Input placeholder="Teléfono" value={guestData.telefono} onChange={(e) => setGuestData({ ...guestData, telefono: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGuestFormOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmarReserva} className="bg-rose-900 text-white hover:bg-rose-800">Confirmar Reserva</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}