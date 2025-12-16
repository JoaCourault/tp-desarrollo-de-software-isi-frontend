"use client";

import { useState } from "react";
import {
    Search,
    Trash2,
    User,
    BedDouble,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    RefreshCcw
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
    DialogFooter
} from "@/components/ui/dialog";

// IMPORTANTE: Ajusta la ruta si tu ModalAlert está en otra carpeta
import ModalAlert from "@/components/modalAlert/modalAlert";

// --- TIPOS ---
interface ReservaListadoDTO {
    idReserva: string;
    apellidoHuesped: string;
    nombreHuesped: string;
    numeroHabitacion: number;
    tipoHabitacion: string;
    fechaIngreso: string;
    fechaEgreso: string;
}

// --- UTILIDADES ---
const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "-";

    // Intentamos extraer día, mes y año usando regex para mayor seguridad
    // Busca grupos de dígitos en la cadena (ej: 16, 12, 2025)
    const match = fechaStr.match(/(\d{1,2}).*?(\d{1,2}).*?(\d{4})/);

    if (match) {
        const [, dia, mes, año] = match;
        const d = dia.padStart(2, '0');
        const m = mes.padStart(2, '0');
        return `${d}/${m}/${año}`;
    }

    // Si el regex falla, intentamos el split básico por si el formato cambia
    return fechaStr.split('T')[0].split('-').reverse().join('/');
};

export default function CancelReservationPanel() {
    // --- ESTADOS ---
    const [apellido, setApellido] = useState("");
    const [nombre, setNombre] = useState("");

    const [reservas, setReservas] = useState<ReservaListadoDTO[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // --- ESTADOS DE MODALES ---
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [modalExitoOpen, setModalExitoOpen] = useState(false);

    // --- ESTADO PARA ALERTAS GENÉRICAS (Reemplazo de window.alert) ---
    const [modalAlert, setModalAlert] = useState<{ open: boolean; type: 'info'|'warning'|'error'|'success'; title: string; msg: string }>({
        open: false, type: 'info', title: '', msg: ''
    });

    const triggerAlert = (type: 'info'|'warning'|'error'|'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    // --- LÓGICA DE BÚSQUEDA ---
    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!apellido.trim()) {
            triggerAlert("warning", "Campo Requerido", "El apellido es obligatorio para realizar la búsqueda.");
            return;
        }

        setLoading(true);
        setSearched(false);
        setSelectedIds([]);
        setReservas([]);

        try {
            const params = new URLSearchParams();
            params.append("apellido", apellido);
            if (nombre) params.append("nombre", nombre);

            const res = await fetch(`http://localhost:8080/Reserva/Buscar?${params.toString()}`, {
                method: 'GET',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 404) {
                    setReservas([]); // No hay resultados, array vacío
                } else {
                    triggerAlert("error", "Error de Búsqueda", errorData.mensaje || "Ocurrió un error al buscar reservas.");
                }
            } else {
                const data = await res.json();
                setReservas(data || []);
            }
        } catch (error) {
            console.error(error);
            triggerAlert("error", "Error de Conexión", "No se pudo conectar con el servidor. Verifique que el backend esté corriendo.");
            setReservas([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    // --- LÓGICA DE SELECCIÓN ---
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(item => item !== id);
            return [...prev, id];
        });
    };

    const toggleAll = () => {
        if (selectedIds.length === reservas.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(reservas.map(r => r.idReserva));
        }
    };

    // --- LÓGICA DE CANCELACIÓN ---
    const handleConfirmarCancelacion = async () => {
        if (selectedIds.length === 0) return;

        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/Reserva/Cancelar", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedIds)
            });

            if (res.ok) {
                setModalConfirmOpen(false);
                setModalExitoOpen(true); // Éxito

                // Actualizamos la lista eliminando las canceladas
                const remanentes = reservas.filter(r => !selectedIds.includes(r.idReserva));
                setReservas(remanentes);
                setSelectedIds([]);
            } else {
                const errorData = await res.json();
                setModalConfirmOpen(false);
                triggerAlert("error", "Error al Cancelar", errorData.mensaje || "No se pudieron cancelar las reservas.");
            }
        } catch (error) {
            console.error(error);
            setModalConfirmOpen(false);
            triggerAlert("error", "Error Inesperado", "Ocurrió un error de conexión al intentar cancelar.");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="container mx-auto max-w-7xl p-8 space-y-6 min-h-screen bg-gray-50/30">

            {/* HEADER */}
            <Card className="bg-white border-red-100 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-50 text-red-900 border border-red-100">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Cancelar Reservas</h2>
                            <p className="text-gray-500">
                                Busque por apellido del huésped para liberar las habitaciones.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* FORMULARIO DE BÚSQUEDA */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Search className="h-4 w-4" /> Criterios de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Diseño optimizado para Desktop (Grid horizontal) */}
                    <form onSubmit={handleBuscar} className="flex flex-row gap-6 items-end">
                        <div className="w-1/3">
                            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Apellido del Titular *</label>
                            <Input
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                placeholder="Ej: GOMEZ"
                                className="bg-white h-10"
                                autoFocus
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Nombre (Opcional)</label>
                            <Input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: JUAN"
                                className="bg-white h-10"
                            />
                        </div>
                        <div className="w-auto">
                            <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white h-10 px-8 min-w-[140px]" disabled={loading}>
                                {loading ? <RefreshCcw className="h-4 w-4 animate-spin mr-2"/> : <Search className="h-4 w-4 mr-2" />}
                                Buscar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* RESULTADOS */}
            {searched && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {reservas.length === 0 ? (
                        <div className="text-center p-16 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 flex flex-col items-center justify-center shadow-sm">
                            <div className="bg-gray-50 p-4 rounded-full mb-3">
                                <User className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">No se encontraron reservas</p>
                            <p className="text-sm">Verifique los datos ingresados e intente nuevamente.</p>
                        </div>
                    ) : (
                        <Card className="overflow-hidden border-gray-200 shadow-md">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700 ml-2">Resultados encontrados: {reservas.length}</h3>
                                {selectedIds.length > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setModalConfirmOpen(true)}
                                        className="animate-in fade-in zoom-in shadow-sm"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Cancelar ({selectedIds.length}) Seleccionadas
                                    </Button>
                                )}
                            </div>

                            <div className="relative w-full overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-4 w-14 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4 transition-all"
                                                checked={reservas.length > 0 && selectedIds.length === reservas.length}
                                                onChange={toggleAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-gray-600">Huésped Titular</th>
                                        <th className="px-6 py-4 font-semibold text-gray-600">Habitación</th>
                                        <th className="px-6 py-4 font-semibold text-gray-600">Tipo</th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-600">Fecha Ingreso</th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-600">Fecha Egreso</th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-600">Estado</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                    {reservas.map((res) => (
                                        <tr key={res.idReserva} className={`group hover:bg-red-50/40 transition-colors duration-200 ${selectedIds.includes(res.idReserva) ? 'bg-red-50/70' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                                    checked={selectedIds.includes(res.idReserva)}
                                                    onChange={() => toggleSelection(res.idReserva)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 p-1.5 rounded-full text-gray-500 group-hover:bg-white group-hover:text-red-500 transition-colors">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-900 text-base">
                                                        {res.apellidoHuesped}, {res.nombreHuesped}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                                                    Hab. {res.numeroHabitacion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <BedDouble className="h-4 w-4 text-gray-400" />
                                                    {res.tipoHabitacion}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-gray-600 bg-gray-50/50">
                                                {formatearFecha(res.fechaIngreso)}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-gray-600 bg-gray-50/50">
                                                {formatearFecha(res.fechaEgreso)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                                    ACTIVA
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* --- MODALES --- */}

            {/* 1. Modal Alerta Genérico */}
            <ModalAlert
                open={modalAlert.open}
                title={modalAlert.title}
                message={modalAlert.msg}
                type={modalAlert.type}
                onOk={() => setModalAlert(prev => ({...prev, open: false}))}
                okText="Aceptar"
            />

            {/* 2. Confirmación de Cancelación */}
            <Dialog open={modalConfirmOpen} onOpenChange={setModalConfirmOpen}>
                <DialogContent className="border-red-200 bg-red-50 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-red-900 flex items-center gap-2 text-xl">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            Confirmar Cancelación
                        </DialogTitle>
                        <DialogDescription className="text-red-800 pt-3 text-base">
                            Está a punto de cancelar <b>{selectedIds.length} reserva(s)</b>.
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-red-700">
                                <li>Las habitaciones quedarán liberadas inmediatamente.</li>
                                <li>Esta acción <b>no se puede deshacer</b>.</li>
                            </ul>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setModalConfirmOpen(false)} className="border-red-200 text-red-800 hover:bg-red-100 hover:text-red-900">
                            Cancelar Operación
                        </Button>
                        <Button onClick={handleConfirmarCancelacion} variant="destructive" disabled={loading} className="bg-red-700 hover:bg-red-800">
                            {loading ? "Procesando..." : "Sí, Cancelar Definitivamente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Éxito */}
            <Dialog open={modalExitoOpen} onOpenChange={setModalExitoOpen}>
                <DialogContent className="border-green-200 bg-green-50 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            Operación Exitosa
                        </DialogTitle>
                        <DialogDescription className="text-green-800 pt-2 text-base font-medium">
                            Las reservas seleccionadas han sido canceladas correctamente.
                        </DialogDescription>
                        <p className="text-sm text-green-700">
                            Las habitaciones ya figuran como disponibles en la grilla.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => setModalExitoOpen(false)} className="bg-green-700 hover:bg-green-800 text-white min-w-[100px]">
                            Aceptar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}