"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Save, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ModalAlert from "@/components/modalAlert/modalAlert";
import { HuespedApi } from "@/src/api/huesped.api";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { BajaHuespedRequestDTO } from "@/src/dto/Huesped/BajaHuespedRequest.dto";
import { ModificarHuespedRequestDTO } from "@/src/dto/Huesped/ModificarHuespedRequest.dto";

const REGEX = {
    LETRAS_ESPACIOS: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
    NUMEROS: /^[0-9]+$/,
    NUMEROS_GUIONES: /^[0-9\-]+$/,
    ALFANUMERICO_ESPACIOS: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/,
    ALFANUMERICO: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]+$/,
    TELEFONO: /^\+?[0-9]+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

interface EditGuestFormProps {
    guestData: HuespedDTO;
    onBack: () => void;
    onSuccess: () => void;
}

export function EditGuestForm({ guestData, onBack, onSuccess }: EditGuestFormProps) {
    const api = new HuespedApi();

    // --- ESTADO DEL FORMULARIO (CONTROLADO) ---
    // Inicializamos el estado con los datos que vienen de la BDD
    const [formData, setFormData] = useState<HuespedDTO>(guestData);

    const [saving, setSaving] = useState(false);

    // --- ESTADOS PARA ELIMINACIÓN ---
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // --- MODALES ---
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false); // Modal Cancelar
    const [modalAlert, setModalAlert] = useState<{ open: boolean; type: 'info'|'warning'|'error'|'success'; title: string; msg: string }>({ open: false, type: 'info', title: '', msg: '' });
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [pendingUpdatePayload, setPendingUpdatePayload] = useState<ModificarHuespedRequestDTO | null>(null);

    const triggerAlert = (type: 'info'|'warning'|'error'|'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    // --- MANEJO DE CAMBIOS EN INPUTS ---

    // 1. Campos Raíz (Nombre, Apellido, etc)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 2. Campos de Dirección
    const handleDirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            direccion: { ...prev.direccion, [name]: value }
        }));
    };

    // 3. Campo Tipo Documento (Anidado)
    const handleTipoDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            tipoDoc: { ...prev.tipoDoc, tipoDocumento: value }
        }));
    };

    // --- HELPER PARA ESTILOS CONDICIONALES ---
    // Compara el valor actual (formData) con el original (guestData)
    // Si es diferente, devuelve clases para borde celeste
    const getInputStyle = (field: keyof HuespedDTO, isDireccion = false, dirField?: string) => {
        const baseStyle = "bg-white transition-all duration-300";
        const modifiedStyle = "border-blue-400 ring-2 ring-blue-100 bg-blue-50/30"; // Celeste

        let originalVal = "";
        let currentVal = "";

        if (isDireccion && dirField) {
            // @ts-ignore
            originalVal = String(guestData.direccion?.[dirField] || "");
            // @ts-ignore
            currentVal = String(formData.direccion?.[dirField] || "");
        } else if (field === "tipoDoc") {
            originalVal = String(guestData.tipoDoc?.tipoDocumento || "");
            currentVal = String(formData.tipoDoc?.tipoDocumento || "");
        } else {
            // @ts-ignore
            originalVal = String(guestData[field] || "");
            // @ts-ignore
            currentVal = String(formData[field] || "");
        }

        return originalVal !== currentVal ? `${baseStyle} ${modifiedStyle}` : baseStyle;
    };


    // --- LÓGICA DE CANCELAR ---
    const handleCancelClick = () => {
        // Abre el modal de confirmación
        setCancelConfirmOpen(true);
    };

    const handleConfirmCancel = () => {
        setCancelConfirmOpen(false);
        onBack(); // Vuelve a la pantalla anterior
    };


    // --- VALIDACIÓN Y ENVÍO ---
    const validarCampos = (): string | null => {
        if (!formData.apellido || !REGEX.LETRAS_ESPACIOS.test(formData.apellido)) return "El apellido es obligatorio (solo letras).";
        if (!formData.nombre || !REGEX.LETRAS_ESPACIOS.test(formData.nombre)) return "El nombre es obligatorio (solo letras).";
        if (!formData.numDoc || !REGEX.NUMEROS.test(formData.numDoc)) return "El número de documento debe ser numérico.";

        const cp = formData.direccion.codigoPostal;
        if (!cp || !REGEX.ALFANUMERICO.test(cp)) return "El CP es obligatorio (letras y números).";

        return null;
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const error = validarCampos();
        if (error) {
            triggerAlert("warning", "Datos Inválidos", error);
            return;
        }

        const payload: ModificarHuespedRequestDTO = {
            aceptarIgualmente: false,
            huesped: formData // Ya tenemos el estado actualizado
        };

        setPendingUpdatePayload(payload);
        setSaveConfirmOpen(true);
    };

    const handleConfirmUpdate = async () => {
        setSaveConfirmOpen(false);
        if (pendingUpdatePayload) await enviarModificacion(pendingUpdatePayload);
    };

    const enviarModificacion = async (payload: ModificarHuespedRequestDTO) => {
        setSaving(true);
        try {
            const res = await api.modificar(payload);
            if (res.resultado.id === 0) {
                triggerAlert("success", "Huésped Actualizado", "Los datos se guardaron correctamente.");
            } else if (res.resultado.id === 3) {
                setPendingUpdatePayload(payload);
                setDuplicateModalOpen(true);
            } else {
                triggerAlert("error", "Error al modificar", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            triggerAlert("error", "Error", "Error inesperado al modificar.");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmarDuplicadoUpdate = () => {
        if (pendingUpdatePayload) {
            enviarModificacion({ ...pendingUpdatePayload, aceptarIgualmente: true });
            setDuplicateModalOpen(false);
        }
    };

    // --- LÓGICA DE ELIMINAR ---
    const handleDeleteClick = () => setDeleteConfirmOpen(true);

    const handleConfirmDelete = async () => {
        setDeleteConfirmOpen(false);
        setDeleting(true);
        const payload: BajaHuespedRequestDTO = { idHuesped: guestData.idHuesped || "" };

        try {
            const res = await api.baja(payload);
            if (res.resultado.id === 0) {
                setDeleteSuccessOpen(true);
            } else {
                triggerAlert("error", "No se pudo eliminar", res.resultado.mensaje);
            }
        } catch (error) {
            console.error(error);
            triggerAlert("error", "Error de Conexión", "Ocurrió un error al intentar eliminar el huésped.");
        } finally {
            setDeleting(false);
        }
    };

    const handleFinishDelete = () => {
        setDeleteSuccessOpen(false);
        onSuccess();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleCancelClick} className="hover:bg-rose-100 text-rose-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold text-rose-950">Editar Huésped</h2>
                        <p className="text-sm text-gray-600">Modifique los datos o elimine el registro</p>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteClick}
                    disabled={deleting || saving}
                    className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 shadow-sm"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Huésped
                </Button>
            </div>

            <form onSubmit={handlePreSubmit} className="px-6 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Apellido *</label>
                        <Input name="apellido" value={formData.apellido} onChange={handleChange} required className={getInputStyle("apellido")} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Nombre *</label>
                        <Input name="nombre" value={formData.nombre} onChange={handleChange} required className={getInputStyle("nombre")} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tipo Doc. *</label>
                        <select name="tipoDocumento" value={formData.tipoDoc.tipoDocumento} onChange={handleTipoDocChange} className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ${getInputStyle("tipoDoc")}`} required>
                            <option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="LE">LE</option><option value="LC">LC</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Número Doc. *</label>
                        <Input name="numDoc" value={formData.numDoc} onChange={handleChange} required className={getInputStyle("numDoc")} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">CUIT</label>
                        <Input name="cuit" value={formData.cuit || ""} onChange={handleChange} className={getInputStyle("cuit")} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Fecha Nac. *</label>
                        <Input name="fechaNac" type="date" value={formData.fechaNac} onChange={handleChange} required className={getInputStyle("fechaNac")} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Posición IVA *</label>
                        <select name="posicionIva" value={formData.posicionIva} onChange={handleChange} className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ${getInputStyle("posicionIva")}`} required>
                            <option>Consumidor Final</option><option>Responsable Inscripto</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Calle *</label>
                            <Input name="calle" value={formData.direccion.calle} onChange={handleDirChange} required className={getInputStyle("direccion", true, "calle")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Número *</label>
                            <Input name="numero" value={formData.direccion.numero} onChange={handleDirChange} required className={getInputStyle("direccion", true, "numero")} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Depto</label>
                            <Input name="departamento" value={formData.direccion.departamento || ""} onChange={handleDirChange} className={getInputStyle("direccion", true, "departamento")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Piso</label>
                            <Input name="piso" value={formData.direccion.piso || ""} onChange={handleDirChange} className={getInputStyle("direccion", true, "piso")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">CP *</label>
                            {/* Usamos 'codigoPostal' para state y style */}
                            <Input name="codigoPostal" value={formData.direccion.codigoPostal} onChange={handleDirChange} required className={getInputStyle("direccion", true, "codigoPostal")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Localidad *</label>
                            <Input name="localidad" value={formData.direccion.localidad} onChange={handleDirChange} required className={getInputStyle("direccion", true, "localidad")} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Provincia *</label>
                            <Input name="provincia" value={formData.direccion.provincia} onChange={handleDirChange} required className={getInputStyle("direccion", true, "provincia")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">País *</label>
                            <Input name="pais" value={formData.direccion.pais} onChange={handleDirChange} required className={getInputStyle("direccion", true, "pais")} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Otros Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                            <Input name="telefono" value={formData.telefono} onChange={handleChange} required className={getInputStyle("telefono")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input name="email" type="email" value={formData.email || ""} onChange={handleChange} className={getInputStyle("email")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Nacionalidad *</label>
                            <Input name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} required className={getInputStyle("nacionalidad")} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Ocupación *</label>
                            <Input name="ocupacion" value={formData.ocupacion} onChange={handleChange} required className={getInputStyle("ocupacion")} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6 pb-6">
                    {/* Botón Cancelar con lógica */}
                    <Button type="button" variant="outline" onClick={handleCancelClick}>Cancelar Edición</Button>
                    <Button type="submit" className="bg-rose-900 text-white min-w-[150px]" disabled={saving}>
                        {saving ? "Guardando..." : <><Save className="h-4 w-4 mr-2" /> Guardar Cambios</>}
                    </Button>
                </div>
            </form>

            <ModalAlert open={modalAlert.open} title={modalAlert.title} message={modalAlert.msg} type={modalAlert.type} onOk={() => setModalAlert(prev => ({...prev, open: false}))} okText="Aceptar" />

            {/* CONFIRMACIÓN DE CANCELAR */}
            <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent className="border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950">¿Descartar cambios?</DialogTitle>
                        <DialogDescription>
                            Si cancela ahora, perderá las modificaciones realizadas.
                            <br/>
                            ¿Desea volver a la búsqueda?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>
                            No, seguir editando
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmCancel}>
                            Sí, descartar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
                <DialogContent className="bg-blue-50 border-blue-200">
                    <DialogHeader><DialogTitle className="text-blue-800 flex gap-2"><CheckCircle2/> Confirmar Cambios</DialogTitle><DialogDescription>¿Desea guardar los cambios realizados?</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setSaveConfirmOpen(false)}>Volver</Button><Button onClick={handleConfirmUpdate} className="bg-blue-700 text-white">Confirmar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
                <DialogContent className="bg-yellow-50 border-yellow-200">
                    <DialogHeader><DialogTitle className="text-yellow-800"><AlertTriangle/> Conflicto de Datos</DialogTitle><DialogDescription>El documento ingresado ya pertenece a otro huésped activo. ¿Desea continuar igualmente?</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setDuplicateModalOpen(false)}>Corregir</Button><Button onClick={handleConfirmarDuplicadoUpdate} className="bg-yellow-600 text-white">Aceptar Igualmente</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="border-red-200 bg-red-50 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            ¿Eliminar Huésped?
                        </DialogTitle>
                        <DialogDescription className="text-red-700 pt-2">
                            Está a punto de eliminar a <b>{guestData.apellido}, {guestData.nombre}</b>.
                            <br/><br/>
                            Esta acción verificará si el huésped posee historial. Si es así, no podrá ser eliminado.
                            <br/>
                            ¿Desea continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="border-red-200 text-red-800 hover:bg-red-100">
                            No, cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
                            {deleting ? "Procesando..." : "Sí, Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteSuccessOpen} onOpenChange={setDeleteSuccessOpen}>
                <DialogContent className="border-green-200 bg-green-50 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Huésped Eliminado
                        </DialogTitle>
                        <DialogDescription className="text-green-700 pt-2">
                            El registro ha sido dado de baja exitosamente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleFinishDelete} className="bg-green-700 hover:bg-green-800 text-white w-full">
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}