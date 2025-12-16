"use client";

import { useState, useRef } from "react";
import {
    UserPlus,
    Search as SearchIcon,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Save,
    Trash2
} from "lucide-react";

import { HuespedApi } from "@/src/api/huesped.api";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { AltaHuespedRequestDTO } from "@/src/dto/Huesped/AltaHuespedRequest.dto";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";

// --- COMPONENTES UI ---
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

// IMPORTAMOS EL COMPONENTE DE EDICIÓN
import { EditGuestForm } from "./EditGuestForm";

// ==========================================
// COMPONENTE PRINCIPAL: GUEST MANAGEMENT
// ==========================================
export function GuestManagement() {
    // ESTADOS GLOBALES DE LA VISTA
    const [view, setView] = useState<"buscar" | "alta" | "editar">("buscar");
    const [guestToEdit, setGuestToEdit] = useState<HuespedDTO | null>(null);

    // --- STATE LIFTING PARA PERSISTENCIA DE BÚSQUEDA ---
    const [searchResults, setSearchResults] = useState<HuespedDTO[]>([]);
    const [lastFilters, setLastFilters] = useState({
        nombre: "",
        apellido: "",
        numDoc: "",
        tipoDocumento: ""
    });
    const [searchMessage, setSearchMessage] = useState("");

    const handleEditClick = (huesped: HuespedDTO) => {
        setGuestToEdit(huesped);
        setView("editar");
    };

    const handleEditSuccess = () => {
        setGuestToEdit(null);
        setView("buscar");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-150px)]">
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden h-full flex flex-col">

                {view === "buscar" && (
                    <BuscarHuespedForm
                        onGoToCreate={() => setView("alta")}
                        onEdit={handleEditClick}
                        results={searchResults}
                        setResults={setSearchResults}
                        filters={lastFilters}
                        setFilters={setLastFilters}
                        message={searchMessage}
                        setMessage={setSearchMessage}
                    />
                )}

                {view === "alta" && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                         <AltaHuespedForm onBack={() => setView("buscar")} />
                    </div>
                )}

                {view === "editar" && guestToEdit && (
                    <EditGuestForm
                        guestData={guestToEdit}
                        onBack={() => setView("buscar")}
                        onSuccess={handleEditSuccess}
                    />
                )}

            </div>
        </div>
    );
}

// ==========================================
// SUB-COMPONENTE: VALIDACIONES REGEX
// ==========================================
const REGEX = {
    LETRAS_ESPACIOS: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
    NUMEROS: /^[0-9]+$/,
    NUMEROS_GUIONES: /^[0-9\-]+$/,
    ALFANUMERICO_ESPACIOS: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/,
    ALFANUMERICO: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]+$/,
    TELEFONO: /^\+?[0-9]+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// ==========================================
// SUB-COMPONENTE: FORMULARIO ALTA
// ==========================================

interface AltaHuespedFormProps {
    onBack: () => void;
}

function AltaHuespedForm({ onBack }: AltaHuespedFormProps) {
    const api = new HuespedApi();
    const formRef = useRef<HTMLFormElement>(null);

    // --- MODALES DE ALERTA GENÉRICOS ---
    const [modalAlert, setModalAlert] = useState<{ open: boolean; type: 'info'|'warning'|'error'|'success'; title: string; msg: string }>({
        open: false, type: 'info', title: '', msg: ''
    });

    // --- MODALES DE FLUJO ---
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
    const [successActionOpen, setSuccessActionOpen] = useState(false); // ¿Cargar otro?

    // --- MODAL DE DUPLICADO (CU09) ---
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<AltaHuespedRequestDTO | null>(null);

    // --- ESTADO LOCAL DEL FORMULARIO (Para poder leerlo al guardar) ---
    // Usamos FormData directamente en el submit, pero para re-enviar el payload necesitamos guardarlo.
    const [currentPayload, setCurrentPayload] = useState<AltaHuespedRequestDTO | null>(null);


    const triggerAlert = (type: 'info'|'warning'|'error'|'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    const validarCampos = (data: FormData): string | null => {
        if (!REGEX.LETRAS_ESPACIOS.test(String(data.get("apellido")))) return "El apellido solo debe contener letras y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(String(data.get("nombre")))) return "El nombre solo debe contener letras y espacios.";
        if (!REGEX.NUMEROS.test(String(data.get("numDoc")))) return "El número de documento solo debe contener números.";
        const cuit = String(data.get("cuit"));
        if (cuit && !REGEX.NUMEROS_GUIONES.test(cuit)) return "El CUIT solo permite números y guiones.";
        if (!REGEX.ALFANUMERICO_ESPACIOS.test(String(data.get("calle")))) return "La calle solo permite letras, números y espacios.";
        if (!REGEX.NUMEROS.test(String(data.get("numero")))) return "El número de calle debe ser numérico.";
        const depto = String(data.get("departamento"));
        if (depto && !REGEX.ALFANUMERICO.test(depto)) return "El departamento solo permite letras y números.";
        const piso = String(data.get("piso"));
        if (piso && !REGEX.NUMEROS.test(piso)) return "El piso debe ser numérico.";
        const cp = String(data.get("cp"));
        if (!REGEX.ALFANUMERICO.test(cp)) return "El CP solo permite letras y números.";
        if (!REGEX.ALFANUMERICO_ESPACIOS.test(String(data.get("localidad")))) return "La localidad solo permite letras, números y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(String(data.get("provincia")))) return "La provincia solo permite letras y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(String(data.get("pais")))) return "El país solo permite letras y espacios.";
        if (!REGEX.TELEFONO.test(String(data.get("telefono")))) return "El teléfono solo permite números (y '+' al inicio).";
        const email = String(data.get("email"));
        if (email && !REGEX.EMAIL.test(email)) return "El formato del email es inválido.";
        if (!REGEX.LETRAS_ESPACIOS.test(String(data.get("nacionalidad")))) return "La nacionalidad solo permite letras y espacios.";
        if (!REGEX.LETRAS_ESPACIOS.test(String(data.get("ocupacion")))) return "La ocupación solo permite letras y espacios.";
        return null;
    };

    // 1. PRE-SUBMIT: Valida y abre modal de confirmación
    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);

        const errorValidacion = validarCampos(data);
        if (errorValidacion) {
            triggerAlert("warning", "Datos Inválidos", errorValidacion);
            return;
        }

        // Armamos el payload
        const payload: AltaHuespedRequestDTO = {
            aceptarIgualmente: false,
            huesped: {
                idHuesped: null,
                nombre: String(data.get("nombre") ?? ""),
                apellido: String(data.get("apellido") ?? ""),
                tipoDoc: { tipoDocumento: String(data.get("tipoDocumento") ?? "") },
                numDoc: String(data.get("numDoc") ?? ""),
                posicionIva: String(data.get("posicionIva") ?? ""),
                cuit: String(data.get("cuit") ?? "") || null,
                fechaNac: String(data.get("fechaNacimiento") ?? ""),
                telefono: String(data.get("telefono") ?? ""),
                email: String(data.get("email") ?? ""),
                ocupacion: String(data.get("ocupacion") ?? ""),
                nacionalidad: String(data.get("nacionalidad") ?? ""),
                direccion: {
                    calle: String(data.get("calle") ?? ""),
                    numero: String(data.get("numero")),
                    departamento: String(data.get("departamento") ?? ""),
                    piso: String(data.get("piso") ?? ""),
                    codigoPostal: String(data.get("cp")),
                    localidad: String(data.get("localidad") ?? ""),
                    provincia: String(data.get("provincia") ?? ""),
                    pais: String(data.get("pais") ?? ""),
                    id: null,
                },
                idsEstadias: [],
                eliminado: false,
            },
        };

        setCurrentPayload(payload);
        setSaveConfirmOpen(true);
    };

    // 2. CONFIRMAR GUARDADO
    const handleConfirmSave = async () => {
        setSaveConfirmOpen(false);
        if (currentPayload) {
            await enviarAlta(currentPayload);
        }
    };

    const enviarAlta = async (payload: AltaHuespedRequestDTO) => {
        try {
            const res = await api.alta(payload);
            if (res.resultado.id === 0) {
                // ÉXITO: Abrimos el modal especial de "¿Cargar otro?"
                setDuplicateModalOpen(false);
                setPendingPayload(null);
                setSuccessActionOpen(true);
            } else if (res.resultado.id === 3) {
                // DUPLICADO
                setPendingPayload(payload);
                setDuplicateModalOpen(true);
            } else {
                triggerAlert("error", "Error al crear huésped", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            triggerAlert("error", "Error inesperado", "Ocurrió un error inesperado al guardar el huésped.");
        }
    };

    // 3. LOGICA DUPLICADO
    const handleConfirmarDuplicado = () => {
        if (pendingPayload) {
            const nuevoPayload = { ...pendingPayload, aceptarIgualmente: true };
            enviarAlta(nuevoPayload);
        }
    };

    // 4. LÓGICA DE CANCELAR
    const handleCancelClick = () => {
        setCancelConfirmOpen(true);
    };

    const handleConfirmCancel = () => {
        setCancelConfirmOpen(false);
        onBack();
    };

    // 5. LÓGICA DE "CARGAR OTRO"
    const handleLoadAnother = () => {
        formRef.current?.reset();
        setSuccessActionOpen(false);
        setCurrentPayload(null);
    };

    const handleExitSuccess = () => {
        setSuccessActionOpen(false);
        onBack();
    };

    return (
        <>
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleCancelClick} className="hover:bg-rose-100 text-rose-900" type="button">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-lg font-semibold text-rose-950">Formulario de Alta</h2>
                    <p className="text-sm text-gray-600">Ingrese los datos personales del nuevo huésped</p>
                </div>
            </div>

            <form ref={formRef} id="formAltaHuesped" onSubmit={handlePreSubmit} className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Apellido *</label><Input name="apellido" placeholder="Ingrese apellido" required className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nombre *</label><Input name="nombre" placeholder="Ingrese nombre" required className="bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Tipo Doc. *</label><select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required><option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="LE">LE</option><option value="LC">LC</option></select></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Número Doc. *</label><Input name="numDoc" placeholder="Ingrese número" required className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CUIT</label><Input name="cuit" placeholder="XX-XXXXXXXX-X" className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Fecha Nac. *</label><Input name="fechaNacimiento" type="date" required className="bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Posición IVA *</label><select name="posicionIva" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required><option>Consumidor Final</option><option>Responsable Inscripto</option></select></div>
                </div>
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5"><label className="text-sm font-medium text-gray-700">Calle *</label><Input name="calle" placeholder="Nombre de la calle" required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Número *</label><Input name="numero" placeholder="123" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Depto</label><Input name="departamento" placeholder="-" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Piso</label><Input name="piso" placeholder="-" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CP *</label><Input name="cp" required placeholder="0000" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Localidad *</label><Input name="localidad" placeholder="Localidad" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Provincia *</label><Input name="provincia" placeholder="Provincia" required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">País *</label><Input name="pais" placeholder="País" required className="bg-white" /></div>
                    </div>
                </div>
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Otros Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Teléfono *</label><Input name="telefono" placeholder="+54 11 ..." required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Email</label><Input name="email" type="email" placeholder="ejemplo@mail.com" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nacionalidad *</label><Input name="nacionalidad" placeholder="Nacionalidad" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Ocupación *</label><Input name="ocupacion" placeholder="Ocupación" required className="bg-white" /></div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6 pb-6">
                    <Button type="button" variant="outline" onClick={handleCancelClick} className="text-rose-900 border-rose-200 hover:bg-rose-50">Cancelar</Button>
                    <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white min-w-[120px]">
                        <Save className="h-4 w-4 mr-2" /> Guardar Huésped
                    </Button>
                </div>
            </form>

            {/* --- MODALES --- */}

            {/* 1. Alertas genéricas (Error, Warning) */}
            <ModalAlert open={modalAlert.open} title={modalAlert.title} message={modalAlert.msg} type={modalAlert.type} onOk={() => setModalAlert(prev => ({...prev, open: false}))} okText="Aceptar" />

            {/* 2. Confirmación de Cancelar */}
            <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-rose-950">¿Cancelar Alta?</DialogTitle>
                        <DialogDescription>Si cancela ahora se perderán todos los datos ingresados.<br/>¿Desea volver al menú?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>No, seguir editando</Button>
                        <Button variant="destructive" onClick={handleConfirmCancel}>Sí, cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Confirmación de Guardar */}
            <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
                <DialogContent className="sm:max-w-md border-green-200 bg-green-50">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> Confirmar Creación
                        </DialogTitle>
                        <DialogDescription className="text-green-700">
                            ¿Está seguro que desea dar de alta a este nuevo huésped?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveConfirmOpen(false)} className="border-green-200 text-green-800 hover:bg-green-100">No, volver</Button>
                        <Button onClick={handleConfirmSave} className="bg-green-700 hover:bg-green-800 text-white">Sí, Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 4. Duplicado (CU09) */}
            <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
                <DialogContent className="border-yellow-200 bg-yellow-50">
                    <DialogHeader><DialogTitle className="text-yellow-800 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> ¡Cuidado! Huésped Existente</DialogTitle><DialogDescription className="text-yellow-700">El tipo y número de documento ya existen.<br/><br/>¿Desea corregir o aceptar igualmente?</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setDuplicateModalOpen(false)} className="border-yellow-200 text-yellow-900 hover:bg-yellow-100">Corregir</Button><Button onClick={handleConfirmarDuplicado} className="bg-yellow-600 hover:bg-yellow-700 text-white">Aceptar Igualmente</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 5. ÉXITO + CARGAR OTRO */}
            <Dialog open={successActionOpen} onOpenChange={setSuccessActionOpen}>
                <DialogContent className="sm:max-w-md border-green-200 bg-green-50">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ¡Huésped Creado!
                        </DialogTitle>
                        <DialogDescription className="text-green-700 pt-2 font-medium">
                            El huésped se guardó exitosamente.
                            <br/><br/>
                            ¿Desea cargar otro huésped ahora?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleExitSuccess} className="border-green-200 text-green-700 hover:bg-green-100 w-full sm:w-auto">
                            No, volver al menú
                        </Button>
                        <Button onClick={handleLoadAnother} className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">
                            Sí, cargar otro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


// ==========================================
// SUB-COMPONENTE: FORMULARIO BUSQUEDA
// ==========================================

interface BuscarHuespedFormProps {
    onGoToCreate: () => void;
    onEdit: (h: HuespedDTO) => void;
    // Props para persistencia
    results: HuespedDTO[];
    setResults: (res: HuespedDTO[]) => void;
    filters: any;
    setFilters: (filters: any) => void;
    message: string;
    setMessage: (msg: string) => void;
}

function BuscarHuespedForm({
    onGoToCreate,
    onEdit,
    results,
    setResults,
    filters,
    setFilters,
    message,
    setMessage
}: BuscarHuespedFormProps) {

    const api = new HuespedApi();
    const [searching, setSearching] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setLocalFilters({ ...localFilters, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        setFilters(localFilters);

        const payload: BuscarHuespedRequestDTO = {
            huesped: {
                nombre: localFilters.nombre || null,
                apellido: localFilters.apellido || null,
                tipoDoc: localFilters.tipoDocumento ? { tipoDocumento: localFilters.tipoDocumento } : null,
                numDoc: localFilters.numDoc || null,
            },
        };

        try {
            const res = await api.buscar(payload);
            if (res.resultado.id === 0) {
                const ordenados = res.huespedesEncontrados.sort((a: HuespedDTO, b: HuespedDTO) =>
                    a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' })
                );
                setResults(ordenados);
                setMessage(ordenados.length === 0 ? "No se encontraron resultados." : "");
            } else {
                setResults([]);
                setMessage(res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            setResults([]);
            setMessage("Error interno al buscar huéspedes");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-rose-950">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">Filtre por nombre, apellido o documento</p>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                 <form onSubmit={handleSearch} className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Nombre</label>
                            <Input name="nombre" value={localFilters.nombre} onChange={handleLocalChange} placeholder="Ej: Juan" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Apellido</label>
                            <Input name="apellido" value={localFilters.apellido} onChange={handleLocalChange} placeholder="Ej: Perez" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Tipo Doc.</label>
                            <select name="tipoDocumento" value={localFilters.tipoDocumento} onChange={handleLocalChange} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                <option value="">Todos</option>
                                <option value="DNI">DNI</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="LE">LE</option>
                                <option value="LC">LC</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="space-y-1.5 w-full">
                                <label className="text-xs font-medium text-gray-600">Número</label>
                                <Input name="numDoc" value={localFilters.numDoc} onChange={handleLocalChange} placeholder="123..." className="bg-white" />
                            </div>
                            <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white mb-0.5" disabled={searching}>
                                {searching ? "..." : <SearchIcon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-2">Resultados ({results.length})</h3>
                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {results.map((h, i) => (
                                <div key={i} className="p-4 border border-rose-100 rounded-lg bg-white shadow-sm flex justify-between items-center group hover:border-rose-300 transition-all">
                                    <div>
                                        <div className="font-medium text-rose-950">{h.apellido}, {h.nombre}</div>
                                        <div className="text-sm text-gray-500 flex gap-2 mt-1">
                                            <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-xs border border-rose-100">
                                                {h.tipoDoc?.tipoDocumento}: {h.numDoc}
                                            </span>
                                            {h.email && <span>• {h.email}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="sm" className="text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => onEdit(h)}>
                                            Editar / Ver
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            {message || "Ingrese filtros para buscar huéspedes"}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-50/30 p-4 rounded-lg shrink-0">
                    <div className="text-sm text-gray-600 text-center sm:text-left">
                        <p className="font-medium text-rose-950">¿No encuentra al huésped?</p>
                        <p>Puede registrar un nuevo huésped manualmente.</p>
                    </div>
                    <Button onClick={onGoToCreate} className="bg-white text-rose-900 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 shadow-sm">
                        <UserPlus className="h-4 w-4 mr-2" /> Dar Alta Nuevo Huésped
                    </Button>
                </div>
            </div>
        </div>
    );
}