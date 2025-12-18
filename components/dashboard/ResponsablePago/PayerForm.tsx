"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { responsableApi } from "@/src/api/responsable.api";
import { Loader2, Save, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { ResponsableDePago } from "@/src/dto/ResponsableDePago/ResponsableDePago.dto";
import ModalAlert from "@/components/modalAlert/modalAlert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

interface PayerFormProps {
    cuitInicial?: string;
    onCancel: () => void;
    onSuccess: (nuevoPayer: ResponsableDePago) => void;
}

export function PayerForm({ cuitInicial = "", onCancel, onSuccess }: PayerFormProps) {
    const [loading, setLoading] = useState(false);

    // Modales de Confirmación
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

    // Alerta de error
    const [alert, setAlert] = useState<{ open: boolean; type: 'warning' | 'error' | 'success'; title: string; msg: string }>({
        open: false, type: 'warning', title: '', msg: ''
    });

    // Errores visuales por campo
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState<Partial<ResponsableDePago>>({
        tipo: "PERSONA_JURIDICA",
        cuit: cuitInicial || "",
        razonSocial: "",
        telefono: "",
        direccion: {
            calle: '',
            numero: 0,
            localidad: 'Santa Fe',
            codigoPostal: '',
            pais: 'Argentina',
            provincia: 'Santa Fe',
            piso: '',
            departamento: ''
        }
    });

    // --- FILTROS FÍSICOS DE ENTRADA (onChange) ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, type: 'alpha' | 'numeric' | 'tel' | 'alphanumeric') => {
        let val = e.target.value;

        // 1. Bloqueo de longitud máxima
        const limits: Record<string, number> = { cuit: 12, numero: 10, piso: 3 };
        if (limits[field] && val.length > limits[field]) return;

        // 2. Bloqueo de caracteres prohibidos
        if (type === 'numeric' && val !== "" && !/^\d+$/.test(val)) return;
        if (type === 'tel' && val !== "" && !/^[0-9+]+$/.test(val)) return;
        if (type === 'alphanumeric' && val !== "" && !/^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]+$/.test(val)) return;
        if (type === 'alpha') {
            if (val.startsWith(" ")) return; // No espacios al inicio
            if (val.includes("  ")) return; // No dobles espacios
            if (val !== "" && !/^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/.test(val)) return;
        }

        // Actualizar estado
        if (field === 'cuit' || field === 'razonSocial' || field === 'telefono') {
            setFormData({ ...formData, [field]: val });
            setFieldErrors({ ...fieldErrors, [field]: false });
        } else {
            setFormData({
                ...formData,
                direccion: { ...formData.direccion!, [field]: val }
            });
            setFieldErrors({ ...fieldErrors, [field]: false });
        }
    };

    const validate = () => {
        const errors: Record<string, boolean> = {};
        const d = formData.direccion!;

        // Trimeamos los campos antes de validar (quitar espacios al final)
        const razonSocial = formData.razonSocial?.trim() || "";
        const calle = d.calle?.trim() || "";
        const localidad = d.localidad?.trim() || "";
        const provincia = d.provincia?.trim() || "";
        const pais = d.pais?.trim() || "";

        if (!razonSocial) errors.razonSocial = true;
        if (!formData.cuit) errors.cuit = true;
        if (!formData.telefono) errors.telefono = true;
        if (!calle) errors.calle = true;
        if (!d.numero || d.numero === 0) errors.numero = true;
        if (!d.codigoPostal) errors.codigoPostal = true;
        if (!localidad) errors.localidad = true;
        if (!provincia) errors.provincia = true;
        if (!pais) errors.pais = true;

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlert({ open: true, type: 'warning', title: 'Campos Obligatorios', msg: 'Por favor, complete todos los campos marcados en rojo.' });
            return false;
        }
        return true;
    };

    const handlePreSave = () => {
        if (validate()) setSaveConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        setSaveConfirmOpen(false);
        setLoading(true);

        // Limpieza final de espacios antes de enviar
        const payload = {
            ...formData,
            razonSocial: formData.razonSocial?.trim(),
            direccion: {
                ...formData.direccion!,
                calle: formData.direccion?.calle?.trim(),
                localidad: formData.direccion?.localidad?.trim(),
                provincia: formData.direccion?.provincia?.trim(),
                pais: formData.direccion?.pais?.trim(),
            }
        };

        try {
            const nuevo = await responsableApi.crear(payload);
            onSuccess(nuevo);
        } catch (err: any) {
            setAlert({ open: true, type: 'error', title: 'Error de Sistema', msg: err.message || "No se pudo guardar el responsable." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border p-4 rounded-md bg-gray-50 space-y-4 animate-in fade-in zoom-in-95 h-fit">
            <h3 className="font-bold text-rose-900 border-b pb-2 mb-4">Alta de Responsable de Pago (Jurídico)</h3>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                    <Label className={fieldErrors.razonSocial ? "text-red-600 font-bold" : "text-gray-700"}>Razón Social *</Label>
                    <Input
                        className={`bg-white ${fieldErrors.razonSocial ? "border-red-500 ring-1 ring-red-500" : "border-rose-200"}`}
                        value={formData.razonSocial || ''}
                        onChange={e => handleInputChange(e, 'razonSocial', 'alpha')}
                    />
                </div>

                <div className="space-y-1">
                    <Label className={fieldErrors.cuit ? "text-red-600 font-bold" : "text-gray-700"}>CUIT *</Label>
                    <Input
                        className={`bg-white ${fieldErrors.cuit ? "border-red-500 ring-1 ring-red-500" : "border-rose-200"}`}
                        value={formData.cuit || ''}
                        onChange={e => handleInputChange(e, 'cuit', 'numeric')}
                    />
                </div>

                <div className="space-y-1">
                    <Label className={fieldErrors.telefono ? "text-red-600 font-bold" : "text-gray-700"}>Teléfono *</Label>
                    <Input
                        className={`bg-white ${fieldErrors.telefono ? "border-red-500 ring-1 ring-red-500" : "border-rose-200"}`}
                        value={formData.telefono || ''}
                        onChange={e => handleInputChange(e, 'telefono', 'tel')}
                    />
                </div>

                {/* DIRECCION */}
                <div className="col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-bold text-rose-900 mb-3 uppercase tracking-wider">Dirección Fiscal</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label className={`text-xs ${fieldErrors.calle ? "text-red-600 font-bold" : "text-gray-600"}`}>Calle *</Label>
                            <Input
                                className={`bg-white ${fieldErrors.calle ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.calle || ''}
                                onChange={e => handleInputChange(e, 'calle', 'alpha')}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.numero ? "text-red-600 font-bold" : "text-gray-600"}`}>Número *</Label>
                            <Input
                                className={`bg-white ${fieldErrors.numero ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.numero || ''}
                                onChange={e => handleInputChange(e, 'numero', 'numeric')}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.departamento ? "text-red-600 font-bold" : "text-gray-600"}`}>Departamento</Label>
                            <Input
                                className={`bg-white ${fieldErrors.departamento ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.departamento || ''}
                                onChange={e => handleInputChange(e, 'departamento', 'alphanumeric')}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.piso ? "text-red-600 font-bold" : "text-gray-600"}`}>Piso</Label>
                            <Input
                                className={`bg-white ${fieldErrors.piso ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.piso || ''}
                                onChange={e => handleInputChange(e, 'piso', 'numeric')}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.codigoPostal ? "text-red-600 font-bold" : "text-gray-600"}`}>CP *</Label>
                            <Input
                                className={`bg-white ${fieldErrors.codigoPostal ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.codigoPostal || ''}
                                onChange={e => handleInputChange(e, 'codigoPostal', 'alphanumeric')}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.localidad ? "text-red-600 font-bold" : "text-gray-600"}`}>Localidad *</Label>
                            <Input
                                className={`bg-white ${fieldErrors.localidad ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.localidad || ''}
                                onChange={e => handleInputChange(e, 'localidad', 'alpha')}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.provincia ? "text-red-600 font-bold" : "text-gray-600"}`}>Provincia *</Label>
                            <Input
                                className={`bg-white ${fieldErrors.provincia ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.provincia || ''}
                                onChange={e => handleInputChange(e, 'provincia', 'alpha')}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className={`text-xs ${fieldErrors.pais ? "text-red-600 font-bold" : "text-gray-600"}`}>País *</Label>
                            <Input
                                className={`bg-white ${fieldErrors.pais ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                value={formData.direccion?.pais || ''}
                                onChange={e => handleInputChange(e, 'pais', 'alpha')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <Button variant="outline" onClick={() => setCancelConfirmOpen(true)} disabled={loading} className="text-rose-900 border-rose-200">
                    <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={handlePreSave} disabled={loading} className="bg-rose-900 hover:bg-rose-800 text-white shadow-md">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar Responsable
                </Button>
            </div>

            {/* MODALES DE ALERTAS Y DIÁLOGOS */}

            <ModalAlert
                open={alert.open}
                type={alert.type}
                title={alert.title}
                message={alert.msg}
                onOk={() => setAlert({ ...alert, open: false })}
                okText="Aceptar"
            />

            <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Cancelar Operación?</DialogTitle>
                        <DialogDescription>
                            Se perderán todos los datos cargados en este formulario.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>Seguir Editando</Button>
                        <Button variant="destructive" onClick={onCancel}>Sí, Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
                <DialogContent className="bg-green-50 border-green-200">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> Confirmar Alta
                        </DialogTitle>
                        <DialogDescription className="text-green-700">
                            ¿Está seguro de que desea dar de alta al responsable de pago <strong>{formData.razonSocial}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveConfirmOpen(false)} className="border-green-200 text-green-700 hover:bg-green-100">
                            Revisar Datos
                        </Button>
                        <Button onClick={handleConfirmSave} className="bg-green-700 hover:bg-green-800 text-white">
                            Confirmar Alta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}