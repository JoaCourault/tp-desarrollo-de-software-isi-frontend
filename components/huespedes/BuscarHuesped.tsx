"use client";

import { useState } from "react";
import { UserPlus, Search as SearchIcon, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { HuespedApi } from "@/src/api/huesped.api";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";
import { BajaHuespedRequestDTO } from "@/src/dto/Huesped/BajaHuespedRequest.dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface BuscarHuespedProps {
    onGoToCreate: () => void;
    onGoToEdit: (huesped: HuespedDTO) => void;
}

const handleTextInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
};

export function BuscarHuespedForm({ onGoToCreate, onGoToEdit }: BuscarHuespedProps) {
    const api = new HuespedApi();
    const [resultados, setResultados] = useState<HuespedDTO[]>([]);
    const [mensaje, setMensaje] = useState("");
    const [searching, setSearching] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [huespedToDelete, setHuespedToDelete] = useState<string | null>(null);

    const [suggestCreateOpen, setSuggestCreateOpen] = useState(false);

    const showAlert = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        setExpandedId(null);
        setMensaje("");

        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);
        const tipoDocValue = String(data.get("tipoDocumento") ?? "");

        const payload: BuscarHuespedRequestDTO = {
            huesped: {
                nombre: String(data.get("nombre") ?? "") || null,
                apellido: String(data.get("apellido") ?? "") || null,
                tipoDocumento: tipoDocValue ? { tipoDocumento: tipoDocValue } : null,
                numDoc: String(data.get("numDoc") ?? "") || null,
            },
        };

        try {
            const res = await api.buscar(payload);
            if (res.resultado.id === 0) {
                setResultados(res.huespedesEncontrados);
                if (res.huespedesEncontrados.length === 0) {
                    setSuggestCreateOpen(true);
                    setMensaje("No se encontraron resultados.");
                }
            } else {
                setResultados([]);
                showAlert("error", "Error en búsqueda", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            setResultados([]);
            showAlert("error", "Error de conexión", "No se pudo conectar con el servidor.");
        } finally {
            setSearching(false);
        }
    };

    const toggleExpand = (id: string | null) => {
        if (!id) return;
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string | null) => {
        e.stopPropagation();
        if (id) {
            setHuespedToDelete(id);
            setDeleteOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!huespedToDelete) return;
        setDeleteOpen(false);

        try {
            const bajaPayload: BajaHuespedRequestDTO = { idHuesped: huespedToDelete };
            const res = await api.baja(bajaPayload);

            if (res.resultado.id === 0) {
                showAlert("success", "Eliminado", "Huésped eliminado exitosamente.");
                setResultados(prev => prev.filter(h => h.idHuesped !== huespedToDelete));
                setExpandedId(null);
            } else if (res.resultado.id === 2) {
                showAlert("warning", "No se puede eliminar", res.resultado.mensaje);
            } else {
                showAlert("error", "Error", res.resultado.mensaje);
            }
        } catch (error) {
            console.error(error);
            showAlert("error", "Error", "Ocurrió un error de red al intentar eliminar.");
        } finally {
            setHuespedToDelete(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-rose-950">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">Filtre por nombre, apellido o documento</p>
            </div>

            <div className="p-6 space-y-6">
                <form onSubmit={handleSearch} className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5"><label className="text-xs font-medium text-gray-600">Nombre</label><Input name="nombre" placeholder="Ej: Juan" onInput={handleTextInput} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-gray-600">Apellido</label><Input name="apellido" placeholder="Ej: Perez" onInput={handleTextInput} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-gray-600">Tipo Doc.</label><select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" defaultValue=""><option value="">Todos</option><option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="LE">LE</option><option value="LC">LC</option></select></div>
                        <div className="flex gap-2">
                            <div className="space-y-1.5 w-full"><label className="text-xs font-medium text-gray-600">Número</label><Input name="numDoc" placeholder="123..." className="bg-white" /></div>
                            <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white mb-0.5" disabled={searching}>{searching ? "..." : <SearchIcon className="h-4 w-4" />}</Button>
                        </div>
                    </div>
                </form>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-2">Resultados ({resultados.length})</h3>
                    {resultados.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {resultados.map((h, i) => {
                                const isExpanded = expandedId === h.idHuesped;
                                return (
                                    <div key={i} onClick={() => toggleExpand(h.idHuesped || null)} className={`border rounded-lg bg-white shadow-sm cursor-pointer transition-all duration-200 overflow-hidden ${isExpanded ? 'border-rose-400 ring-1 ring-rose-100' : 'border-rose-100 hover:border-rose-300'}`}>
                                        <div className="p-4 flex justify-between items-center">
                                            <div><div className="font-medium text-rose-950 text-lg">{h.apellido}, {h.nombre}</div><div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1 items-center"><span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-xs border border-rose-100 font-medium">{h.tipoDocumento?.tipoDocumento}: {h.numDoc}</span></div></div>
                                            <div className="text-rose-300">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
                                        </div>
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                                                <div className="border-t border-rose-50 my-2"></div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                                    <div><span className="font-semibold text-xs uppercase text-rose-900/50">Dirección</span>{h.direccion ? `${h.direccion.calle} ${h.direccion.numero}` : '-'}</div>
                                                    <div><span className="font-semibold text-xs uppercase text-rose-900/50">Contacto</span>{h.telefono || '-'}</div>
                                                    <div><span className="font-semibold text-xs uppercase text-rose-900/50">Nacionalidad</span>{h.nacionalidad || '-'}</div>
                                                    <div><span className="font-semibold text-xs uppercase text-rose-900/50">Ocupación</span>{h.ocupacion || '-'}</div>
                                                </div>
                                                <div className="flex gap-3 justify-end mt-2">
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onGoToEdit(h); }} className="border-amber-200 text-amber-700 hover:bg-amber-50"><Pencil className="h-3.5 w-3.5 mr-2" /> Modificar</Button>
                                                    <Button variant="outline" size="sm" onClick={(e) => handleDeleteClick(e, h.idHuesped || null)} className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">{mensaje || "Ingrese filtros para buscar huéspedes"}</div>
                    )}
                    <div className="mt-8 pt-6 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-50/30 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 text-center sm:text-left"><p className="font-medium text-rose-950">¿No encuentra al huésped?</p><p>Puede registrar un nuevo huésped manualmente.</p></div>
                        <Button onClick={onGoToCreate} className="bg-white text-rose-900 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 shadow-sm"><UserPlus className="h-4 w-4 mr-2" /> Dar Alta Nuevo Huésped</Button>
                    </div>
                </div>
            </div>

            <ModalAlert open={modalOpen} title={modalTitle} message={modalMessage} type={modalType} onOk={() => setModalOpen(false)} okText="Aceptar" />
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-red-50 border-red-200">
                    <AlertDialogHeader><AlertDialogTitle className="text-red-900">¿Eliminar Huésped?</AlertDialogTitle><AlertDialogDescription className="text-red-800">Esta acción eliminará al huésped permanentemente. Si tiene estadías asociadas, no se podrá eliminar.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => { setHuespedToDelete(null); setDeleteOpen(false); }} className="border-red-200 text-red-900 hover:bg-red-100">Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-red-700">Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={suggestCreateOpen} onOpenChange={setSuggestCreateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Huésped no encontrado</AlertDialogTitle><AlertDialogDescription>No se encontraron resultados con los filtros ingresados. ¿Quiere ir a dar de alta un huésped?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setSuggestCreateOpen(false)}>No</AlertDialogCancel><AlertDialogAction onClick={() => { setSuggestCreateOpen(false); onGoToCreate(); }} className="bg-rose-900 hover:bg-rose-800">Sí, dar de alta</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}