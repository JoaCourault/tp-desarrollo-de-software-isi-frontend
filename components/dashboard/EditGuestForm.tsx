"use client";

import { useState } from "react";
import {
    Save,
    ArrowLeft,
    Trash2,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";

import { HuespedApi } from "@/src/api/huesped.api";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { ModificarHuespedRequestDTO } from "@/src/dto/Huesped/ModificarHuespedRequest.dto";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalAlert from "@/components/modalAlert/modalAlert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

// --- VALIDACIONES ---
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

    const [formData, setFormData] = useState<HuespedDTO>(guestData);
    const [initialState] = useState<HuespedDTO>(JSON.parse(JSON.stringify(guestData)));

    // Modales
    const [alertModal, setAlertModal] = useState<{ open: boolean; type: 'info' | 'success' | 'warning' | 'error'; title: string; msg: string }>({
        open: false, type: 'info', title: '', msg: ''
    });

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);

    const [pendingPayload, setPendingPayload] = useState<ModificarHuespedRequestDTO | null>(null);

    // --- ESTILOS VISUALES ---
    const getInputStyle = (fieldValue: string | null | undefined, initialValue: string | null | undefined) => {
        const valActual = fieldValue ?? "";
        const valInicial = initialValue ?? "";
        return valActual !== valInicial
            ? "bg-white border-green-400 ring-1 ring-green-100 text-gray-900 font-medium transition-all"
            : "bg-white text-gray-500 border-gray-200";
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, [name]: value } }));
    };

    const handleTipoDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, tipoDoc: { ...prev.tipoDoc, tipoDocumento: e.target.value } }));
    };

    // --- VALIDACIÓN ---
    const validarCampos = (): string | null => {
        if (!REGEX.LETRAS_ESPACIOS.test(formData.apellido)) return "El apellido solo debe contener letras y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(formData.nombre)) return "El nombre solo debe contener letras y espacios.";
        if (!REGEX.NUMEROS.test(formData.numDoc)) return "El número de documento solo debe contener números.";
        if (formData.cuit && !REGEX.NUMEROS_GUIONES.test(formData.cuit)) return "El CUIT solo permite números y guiones.";

        if (!REGEX.ALFANUMERICO_ESPACIOS.test(formData.direccion.calle)) return "La calle solo permite letras, números y espacios.";
        if (!REGEX.NUMEROS.test(formData.direccion.numero)) return "El número de calle debe ser numérico.";
        if (formData.direccion.departamento && !REGEX.ALFANUMERICO.test(formData.direccion.departamento)) return "Depto solo letras/números.";
        if (formData.direccion.piso && !REGEX.NUMEROS.test(formData.direccion.piso)) return "Piso solo números.";
        if (!REGEX.ALFANUMERICO.test(formData.direccion.codigoPostal)) return "CP solo letras/números.";
        if (!REGEX.ALFANUMERICO_ESPACIOS.test(formData.direccion.localidad)) return "Localidad solo letras, núm, espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(formData.direccion.provincia)) return "Provincia solo letras y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(formData.direccion.pais)) return "País solo letras y espacios.";

        if (!REGEX.TELEFONO.test(formData.telefono)) return "Teléfono solo números (y + al inicio).";
        if (formData.email && !REGEX.EMAIL.test(formData.email)) return "Formato de email inválido.";
        if (!REGEX.LETRAS_ESPACIOS.test(formData.nacionalidad)) return "Nacionalidad solo letras y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(formData.ocupacion)) return "Ocupación solo letras y espacios.";

        return null;
    };

    // --- PREPARAR ENVÍO ---
    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const error = validarCampos();
        if (error) {
            setAlertModal({ open: true, type: 'warning', title: 'Datos Inválidos', msg: error });
            return;
        }
        setSaveModalOpen(true);
    };

    const ejecutarGuardado = async () => {
        setSaveModalOpen(false);
        const payload: ModificarHuespedRequestDTO = {
            huesped: formData,
            aceptarIgualmente: false
        };
        await enviarModificacion(payload);
    };

    const enviarModificacion = async (payload: ModificarHuespedRequestDTO) => {
        try {
            const res = await api.modificar(payload);

            if (res.resultado.id === 0) {
                // EXITO: Mostramos el modal y NO navegamos automáticamente.
                // La navegación ocurre en el onOk del modal (ver abajo).
                setAlertModal({ open: true, type: 'success', title: 'Modificación Exitosa', msg: 'Los cambios han sido guardados correctamente.' });
                setDuplicateModalOpen(false);
                setPendingPayload(null);
            }
            else if (res.resultado.id === 3) {
                setPendingPayload(payload);
                setDuplicateModalOpen(true);
            }
            else {
                setAlertModal({ open: true, type: 'error', title: 'Error', msg: res.resultado.mensaje });
            }
        } catch (err) {
            console.error(err);
            setAlertModal({ open: true, type: 'error', title: 'Error Inesperado', msg: 'No se pudo contactar con el servidor.' });
        }
    };

    const handleConfirmarDuplicado = () => {
        if (pendingPayload) {
            const nuevoPayload = { ...pendingPayload, aceptarIgualmente: true };
            enviarModificacion(nuevoPayload);
        }
    };

    // --- MANEJO DEL BOTÓN OK DEL MODAL PRINCIPAL ---
    const handleAlertOk = () => {
        setAlertModal(prev => ({...prev, open: false}));
        // Si el modal que se cerró era de ÉXITO, entonces volvemos a la pantalla anterior
        if (alertModal.type === 'success') {
            onSuccess();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* HEADER */}
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setCancelModalOpen(true)} className="hover:bg-rose-100 text-rose-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold text-rose-950">Modificar Huésped</h2>
                        <p className="text-sm text-gray-600">Edite los campos necesarios. Los cambios se resaltarán en verde.</p>
                    </div>
                </div>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => {}}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                </Button>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handlePreSubmit} className="px-6 py-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                {/* 1. DATOS PERSONALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Apellido</label>
                        <Input name="apellido" value={formData.apellido} onChange={handleChange} className={getInputStyle(formData.apellido, initialState.apellido)} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                        <Input name="nombre" value={formData.nombre} onChange={handleChange} className={getInputStyle(formData.nombre, initialState.nombre)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Doc.</label>
                        <select name="tipoDocumento" value={formData.tipoDoc.tipoDocumento} onChange={handleTipoDocChange} className={`flex h-10 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${getInputStyle(formData.tipoDoc.tipoDocumento, initialState.tipoDoc.tipoDocumento)}`}>
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE">LE</option>
                            <option value="LC">LC</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número Doc.</label>
                        <Input name="numDoc" value={formData.numDoc} onChange={handleChange} className={getInputStyle(formData.numDoc, initialState.numDoc)} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CUIT</label>
                        <Input name="cuit" value={formData.cuit || ""} onChange={handleChange} className={getInputStyle(formData.cuit, initialState.cuit)} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Nac.</label>
                        <Input type="date" name="fechaNac" value={formData.fechaNac} onChange={handleChange} className={getInputStyle(formData.fechaNac, initialState.fechaNac)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Posición IVA</label>
                        <select name="posicionIva" value={formData.posicionIva} onChange={handleChange} className={`flex h-10 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${getInputStyle(formData.posicionIva, initialState.posicionIva)}`}>
                            <option>Consumidor Final</option>
                            <option>Responsable Inscripto</option>
                        </select>
                    </div>
                </div>

                {/* 2. DIRECCIÓN */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-rose-900">Datos de Domicilio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Calle</label>
                            <Input name="calle" value={formData.direccion.calle} onChange={handleAddressChange} className={getInputStyle(formData.direccion.calle, initialState.direccion.calle)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</label>
                            <Input name="numero" value={formData.direccion.numero} onChange={handleAddressChange} className={getInputStyle(formData.direccion.numero, initialState.direccion.numero)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Depto</label>
                            <Input name="departamento" value={formData.direccion.departamento || ""} onChange={handleAddressChange} className={getInputStyle(formData.direccion.departamento, initialState.direccion.departamento)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Piso</label>
                            <Input name="piso" value={formData.direccion.piso || ""} onChange={handleAddressChange} className={getInputStyle(formData.direccion.piso, initialState.direccion.piso)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CP</label>
                            <Input name="codigoPostal" value={formData.direccion.codigoPostal} onChange={handleAddressChange} className={getInputStyle(formData.direccion.codigoPostal, initialState.direccion.codigoPostal)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Localidad</label>
                            <Input name="localidad" value={formData.direccion.localidad} onChange={handleAddressChange} className={getInputStyle(formData.direccion.localidad, initialState.direccion.localidad)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Provincia</label>
                            <Input name="provincia" value={formData.direccion.provincia} onChange={handleAddressChange} className={getInputStyle(formData.direccion.provincia, initialState.direccion.provincia)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">País</label>
                            <Input name="pais" value={formData.direccion.pais} onChange={handleAddressChange} className={getInputStyle(formData.direccion.pais, initialState.direccion.pais)} />
                        </div>
                    </div>
                </div>

                {/* 3. OTROS DATOS */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-rose-900">Contacto y Otros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</label>
                            <Input name="telefono" value={formData.telefono} onChange={handleChange} className={getInputStyle(formData.telefono, initialState.telefono)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                            <Input name="email" value={formData.email || ""} onChange={handleChange} className={getInputStyle(formData.email, initialState.email)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nacionalidad</label>
                            <Input name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className={getInputStyle(formData.nacionalidad, initialState.nacionalidad)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ocupación</label>
                            <Input name="ocupacion" value={formData.ocupacion} onChange={handleChange} className={getInputStyle(formData.ocupacion, initialState.ocupacion)} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6 pb-6">
                    <Button type="button" variant="outline" onClick={() => setCancelModalOpen(true)} className="text-rose-900 border-rose-200 hover:bg-rose-50">
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white min-w-[150px] shadow-md">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                    </Button>
                </div>
            </form>

            <ModalAlert
                open={alertModal.open}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.msg}
                onOk={handleAlertOk}
                okText="Entendido"
            />

            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Cancelar Modificación?</DialogTitle>
                        <DialogDescription>Perderá todos los cambios no guardados. ¿Desea volver?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelModalOpen(false)}>No, seguir editando</Button>
                        <Button variant="destructive" onClick={onBack}>Sí, cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
                <DialogContent className="border-yellow-200 bg-yellow-50">
                    <DialogHeader>
                        <DialogTitle className="text-yellow-800 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Conflicto de Datos</DialogTitle>
                        <DialogDescription className="text-yellow-700">El documento ya existe. ¿Desea corregir o forzar el guardado?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDuplicateModalOpen(false)} className="border-yellow-200 text-yellow-900 hover:bg-yellow-100">Corregir</Button>
                        <Button onClick={handleConfirmarDuplicado} className="bg-yellow-600 hover:bg-yellow-700 text-white">Aceptar Igualmente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
                <DialogContent className="sm:max-w-md border-green-200 bg-green-50">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Confirmar Cambios</DialogTitle>
                        <DialogDescription className="text-green-700">¿Está seguro que desea persistir los cambios realizados en este huésped?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveModalOpen(false)} className="border-green-200 text-green-800 hover:bg-green-100">No, seguir editando</Button>
                        <Button onClick={ejecutarGuardado} className="bg-green-700 hover:bg-green-800 text-white">Sí, Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}