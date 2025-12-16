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

// IMPORTAMOS TU COMPONENTE DE ALERTA (Asegúrate que la ruta sea correcta)
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
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
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

    // Estado para Alertas Genéricas (Error, Warning, Info)
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
                    setReservas([]); // Simplemente no hay resultados
                } else {
                    triggerAlert("error", "Error de Búsqueda", errorData.mensaje || "Ocurrió un error al buscar reservas.");
                }
            } else {
                const data = await res.json();
                setReservas(data || []);
            }
        } catch (error) {
            console.error(error);
            triggerAlert("error", "Error de Conexión", "No se pudo conectar con el servidor. Verifique su conexión.");
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
                setModalExitoOpen(true); // Abrimos modal de éxito

                // Limpiamos visualmente
                const remanentes = reservas.filter(r => !selectedIds.includes(r.idReserva));
                setReservas(remanentes);
                setSelectedIds([]);
            } else {
                const errorData = await res.json();
                // Cerramos el de confirmación para mostrar el error
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
        // RESPONSIVE: 'p-4 sm:p-6' ajusta el padding según pantalla. 'max-w-6xl' evita que se estire demasiado en monitores grandes.
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 pb-10 min-h-screen bg-gray-50/30">

            {/* HEADER */}
            <Card className="bg-white border-red-100 shadow-sm">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100 text-red-800 shrink-0">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Cancelar Reservas</h2>
                            <p className="text-sm text-gray-500">
                                Libere habitaciones buscando por el titular.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* FORMULARIO */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Search className="h-4 w-4" /> Criterios de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* RESPONSIVE: flex-col en móvil, md:flex-row en notebook/desktop */}
                    <form onSubmit={handleBuscar} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/3">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Apellido *</label>
                            <Input
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                placeholder="Ej: GOMEZ"
                                className="bg-white"
                            />
                        </div>
                        <div className="w-full md:w-1/3">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre (Opcional)</label>
                            <Input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: JUAN"
                                className="bg-white"
                            />
                        </div>
                        <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white w-full md:w-auto min-w-[120px]" disabled={loading}>
                            {loading ? <RefreshCcw className="h-4 w-4 animate-spin mr-2"/> : <Search className="h-4 w-4 mr-2" />}
                            Buscar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* RESULTADOS */}
            {searched && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                    {reservas.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400 flex flex-col items-center justify-center">
                            <User className="h-10 w-10 mb-2 opacity-20" />
                            <p>No se encontraron reservas con esos datos.</p>
                        </div>
                    ) : (
                        <Card className="overflow-hidden border-gray-200 shadow-sm">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                                <h3 className="font-semibold text-gray-700">Resultados encontrados ({reservas.length})</h3>
                                {selectedIds.length > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setModalConfirmOpen(true)}
                                        className="animate-in fade-in zoom-in w-full sm:w-auto shadow-sm"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Cancelar ({selectedIds.length}) Seleccionadas
                                    </Button>
                                )}
                            </div>

                            {/* RESPONSIVE: overflow-x-auto permite scroll horizontal en móviles */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                                checked={reservas.length > 0 && selectedIds.length === reservas.length}
                                                onChange={toggleAll}
                                            />
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">Huésped</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Habitación</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Detalle</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap">Ingreso</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap">Egreso</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap">Estado</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                    {reservas.map((res) => (
                                        <tr key={res.idReserva} className={`hover:bg-red-50/30 transition-colors ${selectedIds.includes(res.idReserva) ? 'bg-red-50/60' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                                    checked={selectedIds.includes(res.idReserva)}
                                                    onChange={() => toggleSelection(res.idReserva)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    {res.apellidoHuesped}, {res.nombreHuesped}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                        N° {res.numeroHabitacion}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <BedDouble className="h-3 w-3" />
                                                    {res.tipoHabitacion}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-gray-600 whitespace-nowrap">
                                                {formatearFecha(res.fechaIngreso)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-gray-600 whitespace-nowrap">
                                                {formatearFecha(res.fechaEgreso)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                                        Activa
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

            {/* 1. Modal Alerta Genérico (Reemplaza a los window.alert) */}
            <ModalAlert
                open={modalAlert.open}
                title={modalAlert.title}
                message={modalAlert.msg}
                type={modalAlert.type}
                onOk={() => setModalAlert(prev => ({...prev, open: false}))}
                okText="Entendido"
            />

            {/* 2. Confirmación de Cancelación */}
            <Dialog open={modalConfirmOpen} onOpenChange={setModalConfirmOpen}>
                <DialogContent className="border-red-200 bg-red-50 sm:max-w-md mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Confirmar Cancelación
                        </DialogTitle>
                        <DialogDescription className="text-red-700 pt-2">

                            Estás a punto de cancelar <b>{selectedIds.length} reserva(s)</b>.
                            <br/>
                            Las habitaciones quedarán liberadas inmediatamente y esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setModalConfirmOpen(false)} className="border-red-200 text-red-700 hover:bg-red-100 w-full sm:w-auto">
                            Volver
                        </Button>
                        <Button onClick={handleConfirmarCancelacion} variant="destructive" disabled={loading} className="w-full sm:w-auto">
                            {loading ? "Procesando..." : "Sí, Cancelar Reservas"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Éxito */}
            <Dialog open={modalExitoOpen} onOpenChange={setModalExitoOpen}>
                <DialogContent className="border-green-200 bg-green-50 sm:max-w-md mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Operación Exitosa
                        </DialogTitle>
                        <DialogDescription className="text-green-700 pt-2">
                            Las reservas seleccionadas han sido canceladas correctamente y las habitaciones están disponibles.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setModalExitoOpen(false)} className="bg-green-700 hover:bg-green-800 text-white w-full">
                            Aceptar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}