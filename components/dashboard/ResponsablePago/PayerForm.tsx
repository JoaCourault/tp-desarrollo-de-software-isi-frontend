"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Importamos la interfaz correcta

import { responsableApi } from "@/src/api/responsable.api";
import { Loader2 } from "lucide-react";
import {ResponsableDePago} from "@/src/dto/ResponsableDePago/ResponsableDePago.dto";

interface PayerFormProps {
    cuitInicial?: string;
    onCancel: () => void;
    onSuccess: (nuevoPayer: ResponsableDePago) => void;
}

export function PayerForm({ cuitInicial = "", onCancel, onSuccess }: PayerFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Inicializamos el estado respetando la estructura del nuevo DTO
    const [formData, setFormData] = useState<Partial<ResponsableDePago>>({
        tipo: "PERSONA_JURIDICA", // Hardcodeado porque este form pide Razón Social/CUIT
        cuit: cuitInicial || "",
        razonSocial: "",
        telefono: "",
        direccion: {
            calle: '',
            numero: 0,
            ciudad: 'Santa Fe',
            codigoPostal: '',
            pais: 'Argentina',
            provincia: 'Santa Fe',
            piso: '',
            departamento: ''
        }
    });

    // Helper para actualizar dirección anidada
    const updateDireccion = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            direccion: {
                ...prev.direccion!, // Asumimos que dirección ya existe por el estado inicial
                [field]: value
            }
        }));
    };

    // Helper para validar solo números (CUIT, Teléfono)
    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ResponsableDePago) => {
        const val = e.target.value;
        if (val === "" || /^\d+$/.test(val)) {
            setFormData({ ...formData, [field]: val });
        }
    };

    const handleSave = async () => {
        setError("");

        // Validaciones básicas antes de enviar
        if (!formData.razonSocial?.trim()) { setError("La razón social es obligatoria"); return; }
        if (!formData.cuit?.trim()) { setError("El CUIT es obligatorio"); return; }

        setLoading(true);

        try {
            // Enviamos el formData que ahora cumple con la interfaz ResponsableDePago
            const nuevoResponsable = await responsableApi.crear(formData);
            onSuccess(nuevoResponsable);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al guardar responsable");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border p-4 rounded-md bg-gray-50 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-rose-900 border-b pb-2 mb-4">Alta de Responsable de Pago (Jurídico)</h3>

            <div className="grid grid-cols-2 gap-3">

                {/* Razón Social */}
                <div className="col-span-2">
                    <Label>Razón Social</Label>
                    <Input
                        className="bg-white"
                        value={formData.razonSocial || ''}
                        onChange={e => setFormData({...formData, razonSocial: e.target.value})}
                        placeholder="Ej: Empresa S.A."
                    />
                </div>

                {/* CUIT */}
                <div>
                    <Label>CUIT</Label>
                    <Input
                        className="bg-white"
                        value={formData.cuit || ''}
                        onChange={(e) => handleNumericChange(e, 'cuit')}
                        placeholder="Solo números"
                        maxLength={11}
                    />
                </div>

                {/* Teléfono */}
                <div>
                    <Label>Teléfono</Label>
                    <Input
                        className="bg-white"
                        value={formData.telefono || ''}
                        onChange={(e) => handleNumericChange(e, 'telefono')}
                        placeholder="Solo números"
                    />
                </div>

                {/* Sección Dirección Fiscal */}
                <div className="col-span-2 border-t pt-2 mt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Dirección Fiscal</p>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Calle */}
                        <div className="col-span-2">
                            <Input
                                className="bg-white"
                                placeholder="Calle"
                                value={formData.direccion?.calle || ''}
                                onChange={e => updateDireccion('calle', e.target.value)}
                            />
                        </div>
                        {/* Número */}
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="Nro"
                                value={formData.direccion?.numero || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    if(val === "" || /^\d+$/.test(val)) updateDireccion('numero', val === "" ? 0 : parseInt(val));
                                }}
                            />
                        </div>

                        {/* Piso y Depto */}
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="Piso"
                                value={formData.direccion?.piso || ''}
                                onChange={e => updateDireccion('piso', e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="Depto"
                                value={formData.direccion?.departamento || ''}
                                onChange={e => updateDireccion('departamento', e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="CP"
                                value={formData.direccion?.codigoPostal || ''}
                                onChange={e => updateDireccion('codigoPostal', e.target.value)}
                            />
                        </div>

                        {/* Ubicación */}
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="Ciudad"
                                value={formData.direccion?.ciudad || ''}
                                onChange={e => updateDireccion('ciudad', e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="Provincia"
                                value={formData.direccion?.provincia || ''}
                                onChange={e => updateDireccion('provincia', e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                className="bg-white"
                                placeholder="País"
                                value={formData.direccion?.pais || ''}
                                onChange={e => updateDireccion('pais', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel} disabled={loading} className="text-rose-900 border-rose-200">
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading} className="bg-rose-900 hover:bg-rose-800 text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                </Button>
            </div>
        </div>
    );
}