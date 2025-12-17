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
    AlertTriangle
} from "lucide-react";
import { crearReserva } from "@/src/api/reserva.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

// IMPORTAMOS EL MODAL PERSONALIZADO
import ModalAlert from "@/components/modalAlert/modalAlert";

// Importamos el componente hijo y sus tipos
import {
    GrillaDisponibilidad,
    type HabitacionDisponibilidad
} from "@/components/GrillaDisponibilidad";

// Importamos la constante compartida
import { TIPOS_HABITACION } from "@/src/constants/tiposHabitacion";

//  TIPOS LOCALES 
interface Seleccion {
    idHabitacion: string;
    fechaDesde: string;
    fechaHasta: string;
    numero: number;
}

//  UTILIDADES 
const isDatePast = (dateStr: string) => {
    const checkDate = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
};

// NUEVO HELPER: Obtener el día siguiente a una fecha dada
const getNextDay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};


//  COMPONENTE PRINCIPAL 
export function RoomManagement() {

    // Estados de búsqueda
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [tipoHabitacion, setTipoHabitacion] = useState("");

    const [loading, setLoading] = useState(false);
    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);

    // Selección temporal
    const [tempSelect, setTempSelect] = useState<{
        start: string | null,
        end: string | null,
        roomId: string | null
    }>({ start: null, end: null, roomId: null });

    // Lista de reservas
    const [selecciones, setSelecciones] = useState<Seleccion[]>([]);

    // Modales de Flujo
    const [modalOpen, setModalOpen] = useState(false); // Modal de carga de datos huesped
    const [alertOpen, setAlertOpen] = useState(false); // Modal de selección pendiente
    const [guestData, setGuestData] = useState({ nombre: "", apellido: "", telefono: "" });

    //  MODAL DE ALERTAS GENÉRICAS 
    const [modalAlert, setModalAlert] = useState<{
        open: boolean;
        type: 'info'|'warning'|'error'|'success';
        title: string;
        msg: string
    }>({
        open: false, type: 'info', title: '', msg: ''
    });

    const triggerAlert = (type: 'info'|'warning'|'error'|'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    const formatearFecha = (fechaStr: string) => {
        if (!fechaStr) return "-";
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
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

    //  LOGICA 

    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDACIÓN DE RANGO EN EL FRONT (Mínimo 1 noche)
        // Usamos >= porque "desde" no puede ser igual a "hasta"
        if (new Date(desde) >= new Date(hasta)) {
            triggerAlert("warning", "Fechas Incorrectas", "La fecha 'Hasta' debe ser posterior a 'Desde' (Mínimo 1 noche).");
            return;
        }

        setLoading(true);
        setTempSelect({ start: null, end: null, roomId: null });
        setSearched(false);

        try {
            const url = `http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}&tipo=${tipoHabitacion}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error API");
            const data: HabitacionDisponibilidad[] = await res.json();
            setGridData(data);
            setSearched(true);
        } catch (e) {
            setGridData([]);
            setSearched(true);
            triggerAlert("error", "Error de Conexión", "No se pudo obtener la disponibilidad. Verifique el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (roomId: string, dateStr: string, estado: string, numero: number) => {
        if (isDatePast(dateStr)) return;
        if (estado === "OCUPADA" || estado === "MANTENIMIENTO") return;

        if (estado === "RESERVADA") {
            triggerAlert("info", "Habitación Reservada", `La habitación ${numero} ya está reservada el día ${formatearFecha(dateStr)}.`);
            return;
        }

        if (!tempSelect.start) {
            setTempSelect({ start: dateStr, end: null, roomId });
        } else if (tempSelect.start && !tempSelect.end) {
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

            const habitacionActual = gridData.find(h => h.habitacion.id_habitacion === roomId);
            if (habitacionActual) {
                const diaConflicto = habitacionActual.disponibilidad.find(dia => {
                    const enRango = dia.fecha >= from && dia.fecha <= to;
                    const esPasado = isDatePast(dia.fecha);
                    return enRango && (["OCUPADA", "MANTENIMIENTO", "RESERVADA"].includes(dia.estado) || esPasado);
                });

                if (diaConflicto) {
                    triggerAlert("warning", "Selección Inválida", `El rango seleccionado contiene días ocupados o pasados.`);
                    setTempSelect({ start: null, end: null, roomId: null });
                    return;
                }
            }
            setTempSelect({ start: from, end: to, roomId });
        } else {
            setTempSelect({ start: dateStr, end: null, roomId });
        }
    };

    const agregarSeleccion = () => {
        if (!tempSelect.start || !tempSelect.end || !tempSelect.roomId) return;
        const hab = gridData.find(h => h.habitacion.id_habitacion === tempSelect.roomId);
        if (!hab) return;

        setSelecciones(prev => [
            ...prev,
            {
                idHabitacion: tempSelect.roomId!,
                fechaDesde: tempSelect.start!,
                fechaHasta: tempSelect.end!,
                numero: hab.habitacion.numero
            }
        ]);
        setTempSelect({ start: null, end: null, roomId: null });
    };

    const eliminarSeleccion = (index: number) => {
        setSelecciones(prev => prev.filter((_, i) => i !== index));
    };

    const checkPendingSelection = () => {
        if (tempSelect.start && tempSelect.end && tempSelect.roomId) {
            setAlertOpen(true);
        } else {
            setModalOpen(true);
        }
    };

    const handleAddAndProceed = () => {
        agregarSeleccion();
        setAlertOpen(false);
        setModalOpen(true);
    };

    const handleDiscardAndProceed = () => {
        setTempSelect({ start: null, end: null, roomId: null });
        setAlertOpen(false);
        setModalOpen(true);
    };

    const handleConfirmarReserva = async () => {
        const nombreRegex = /^[a-zA-Z\s]+$/;
        const telefonoRegex = /^[0-9]+$/;

        if (!guestData.nombre || !guestData.apellido || !guestData.telefono) {
            triggerAlert("warning", "Campos Incompletos", "Por favor complete todos los campos del huésped titular.");
            return;
        }

        if (!nombreRegex.test(guestData.nombre)) {
            triggerAlert("warning", "Nombre Inválido", "El nombre solo puede contener letras y espacios.");
            return;
        }
        if (!nombreRegex.test(guestData.apellido)) {
            triggerAlert("warning", "Apellido Inválido", "El apellido solo puede contener letras y espacios.");
            return;
        }
        if (!telefonoRegex.test(guestData.telefono)) {
            triggerAlert("warning", "Teléfono Inválido", "El teléfono solo puede contener números.");
            return;
        }

        const payload = {
            nombreCliente: guestData.nombre,
            apellidoCliente: guestData.apellido,
            telefonoCliente: guestData.telefono,
            reservas: selecciones.map((sel) => ({
                idHabitacion: sel.idHabitacion,
                fechaDesde: sel.fechaDesde,
                fechaHasta: sel.fechaHasta
            }))
        };

        setLoading(true);

        try {
            const data = await crearReserva(payload);

            if (data && (data.id === 0 || data.idReserva)) {
                setModalOpen(false);
                triggerAlert("success", "Reserva Creada", "¡La reserva ha sido registrada exitosamente!");
            } else {
                triggerAlert("error", "Error al Reservar", (data.mensaje || "Respuesta desconocida del servidor."));
            }

        } catch (error: any) {
            console.error(error);
            triggerAlert("error", "Error de Sistema", "Ocurrió un error inesperado: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAlertOk = () => {
        setModalAlert(prev => ({ ...prev, open: false }));
        if (modalAlert.type === 'success') {
            setSelecciones([]);
            setGuestData({ nombre: "", apellido: "", telefono: "" });
            handleBuscar({ preventDefault: () => {} } as React.FormEvent);
        }
    };

    //  RENDER 
    return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 pb-10 min-h-screen">

            {/* HEADER */}
            <Card className="bg-white border-rose-100 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <CalendarRange className="h-5 w-5 text-rose-900" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-rose-950">Gestión de Reservas</h2>
                            <p className="text-sm text-gray-500">Consulta disponibilidad y arma tu reserva.</p>
                        </div>
                    </div>

                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-1/4">
                            <label className="text-sm font-medium text-gray-700">Desde</label>
                            <Input
                                type="date"
                                value={desde}
                                onChange={e => setDesde(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-full sm:w-1/4">
                            <label className="text-sm font-medium text-gray-700">Hasta</label>
                            {/* AQUÍ ESTÁ EL BLOQUEO VISUAL */}
                            <Input
                                type="date"
                                value={hasta}
                                min={desde ? getNextDay(desde) : undefined}
                                onChange={e => setHasta(e.target.value)}
                                required
                            />
                        </div>

                        <div className="w-full sm:w-1/4">
                            <label className="text-sm font-medium text-gray-700">Tipo</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={tipoHabitacion}
                                onChange={e => setTipoHabitacion(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {TIPOS_HABITACION.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <Button className="bg-rose-900 text-white hover:bg-rose-800 w-full sm:w-auto" disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            {loading ? "Buscando..." : "Buscar Disponibilidad"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* CONTENEDOR PRINCIPAL */}
            {searched && (
                <div className="flex flex-col lg:flex-row gap-6 items-start animate-in slide-in-from-bottom-4 duration-500">

                    {/* ZONA DE LA GRILLA */}
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

                    {/* PANELES LATERALES */}
                    <aside className="w-full lg:w-80 shrink-0 space-y-4 sticky top-6 animate-in slide-in-from-right duration-500">

                        {/* Panel de Selección Actual */}
                        <Card className={`border-2 transition-all shadow-md ${tempSelect.roomId ? 'border-blue-400 bg-blue-50/50' : 'border-gray-100 bg-gray-50 opacity-80'}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Selección Actual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tempSelect.roomId ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                                            <span className="font-bold text-blue-900">Hab {gridData.find(h => h.habitacion.id_habitacion === tempSelect.roomId)?.habitacion.numero}</span>
                                            <div className="text-xs text-right">
                                                <div className="text-gray-500">Entrada: {formatearFecha(tempSelect.start!)}</div>
                                                {tempSelect.end && <div className="text-gray-500">Salida: {formatearFecha(tempSelect.end)}</div>}
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

                        {/* Carrito de Reservas */}
                        <Card className="border-gray-200 shadow-sm h-fit max-h-[500px] flex flex-col">
                            <CardHeader className="pb-3 border-b bg-gray-50">
                                <CardTitle className="text-base font-semibold text-gray-800 flex justify-between items-center">
                                    <span className="flex items-center gap-2"><ListChecks className="h-4 w-4"/> Mis Reservas</span>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{selecciones.length}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                {selecciones.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-400">
                                        No hay habitaciones seleccionadas.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {selecciones.map((sel, i) => (
                                            <div key={i} className="p-3 hover:bg-gray-50 transition flex justify-between items-center group">
                                                <div>
                                                    <div className="font-semibold text-gray-800 text-sm">Habitación {sel.numero}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        {formatearFecha(sel.fechaDesde)} <ArrowRight className="h-3 w-3"/> {formatearFecha(sel.fechaHasta)}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => eliminarSeleccion(i)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>

                            {(selecciones.length > 0 || (tempSelect.start && tempSelect.end)) && (
                                <div className="p-4 border-t bg-gray-50">
                                    <Button
                                        className="w-full bg-rose-900 hover:bg-rose-800 text-white shadow-md"
                                        onClick={checkPendingSelection}
                                    >
                                        Confirmar Todo
                                    </Button>
                                </div>
                            )}
                        </Card>

                    </aside>
                </div>
            )}

            {/*  MODALES  */}

            {/* 1. Modal Alerta Genérico (Success, Error, Warning) */}
            <ModalAlert
                open={modalAlert.open}
                type={modalAlert.type}
                title={modalAlert.title}
                message={modalAlert.msg}
                onOk={handleAlertOk}
                okText="Aceptar"
            />

            {/* 2. Modal Selección Pendiente */}
            <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
                <DialogContent className="sm:max-w-md border-amber-200 bg-amber-50">
                    <DialogHeader>
                        <DialogTitle className="text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Selección Pendiente
                        </DialogTitle>
                        <DialogDescription className="text-amber-700">
                            Tienes una habitación seleccionada en la grilla que no has agregado a tu lista.
                            <br/><br/>
                            ¿Deseas agregarla a la reserva o descartarla?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setAlertOpen(false)} className="border-amber-200 text-amber-900 hover:bg-amber-100">
                            Cancelar
                        </Button>
                        <Button onClick={handleDiscardAndProceed} variant="ghost" className="text-red-600 hover:bg-red-50">
                            Descartar
                        </Button>
                        <Button onClick={handleAddAndProceed} className="bg-blue-600 text-white hover:bg-blue-700">
                            Agregar y Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Modal Carga Datos Huésped */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Finalizar Reserva
                        </DialogTitle>
                        <DialogDescription>
                            Estás por reservar <b>{selecciones.length} habitaciones</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Input placeholder="Nombre" value={guestData.nombre} onChange={e => setGuestData({ ...guestData, nombre: e.target.value })} />
                        <Input placeholder="Apellido" value={guestData.apellido} onChange={e => setGuestData({ ...guestData, apellido: e.target.value })} />
                        <Input placeholder="Teléfono" value={guestData.telefono} onChange={e => setGuestData({ ...guestData, telefono: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmarReserva} className="bg-rose-900 text-white">Confirmar Reserva</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}