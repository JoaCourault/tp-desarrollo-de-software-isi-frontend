"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PayerDTO, PersonaFisicaDTO, PersonaJuridicaDTO } from "@/src/dto/Facturacion.dto";
import { responsableApi } from "@/src/api/responsable.api";
import { Loader2 } from "lucide-react";

interface PayerFormProps {
    cuitInicial?: string;
    onCancel: () => void;
    onSuccess: (nuevoPayer: PayerDTO) => void;
}

export function PayerForm({ cuitInicial = "", onCancel, onSuccess }: PayerFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<Partial<PayerDTO>>({
        esPersonaJuridica: false,
        condicionIva: "CONSUMIDOR_FINAL",
        direccion: { calle: '', numero: 0, ciudad: 'Santa Fe', codigoPostal: '', pais: 'Argentina', provincia: 'Santa Fe' },
        ...(cuitInicial ? { dni: cuitInicial, cuit: cuitInicial } : {})
    });

    const handleSave = async () => {
        // Validaciones básicas front
        if (!formData.email || !formData.telefono) {
            setError("Email y teléfono son obligatorios");
            return;
        }

        setError("");
        setLoading(true);

        try {

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
            <h3 className="font-bold text-rose-900 border-b pb-2 mb-4">Alta de Responsable de Pago</h3>


            <div className="flex gap-4 mb-2 bg-white p-2 rounded border">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="radio"
                        checked={!formData.esPersonaJuridica}
                        onChange={() => setFormData({...formData, esPersonaJuridica: false, condicionIva: "CONSUMIDOR_FINAL"})}
                    /> Persona Física
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="radio"
                        checked={formData.esPersonaJuridica}
                        onChange={() => setFormData({...formData, esPersonaJuridica: true, condicionIva: "RESPONSABLE_INSCRIPTO"})}
                    /> Persona Jurídica
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">

                 {!formData.esPersonaJuridica ? (
                    <>
                        <div><Label>Nombre</Label><Input className="bg-white" value={(formData as PersonaFisicaDTO).nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                        <div><Label>Apellido</Label><Input className="bg-white" value={(formData as PersonaFisicaDTO).apellido || ''} onChange={e => setFormData({...formData, apellido: e.target.value})} /></div>
                        <div><Label>DNI</Label><Input className="bg-white" value={(formData as PersonaFisicaDTO).dni || ''} onChange={e => setFormData({...formData, dni: e.target.value})} /></div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2"><Label>Razón Social</Label><Input className="bg-white" value={(formData as PersonaJuridicaDTO).razonSocial || ''} onChange={e => setFormData({...formData, razonSocial: e.target.value})} /></div>
                        <div><Label>CUIT</Label><Input className="bg-white" value={(formData as PersonaJuridicaDTO).cuit || ''} onChange={e => setFormData({...formData, cuit: e.target.value})} /></div>
                    </>
                )}

                {/* Select de IVA */}
                <div>
                    <Label>Condición IVA</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        value={formData.condicionIva}
                        onChange={(e) => setFormData({...formData, condicionIva: e.target.value as any})}
                    >
                        <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                        <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                        <option value="MONOTRIBUTO">Monotributo</option>
                        <option value="EXENTO">Exento</option>
                    </select>
                </div>

                <div><Label>Email</Label><Input className="bg-white" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><Label>Teléfono</Label><Input className="bg-white" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>

                {/* ... (Dirección - IGUAL QUE ANTES) ... */}
                 <div className="col-span-2 border-t pt-2 mt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Dirección Fiscal</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2"><Input className="bg-white" placeholder="Calle" value={formData.direccion?.calle || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, calle: e.target.value}})} /></div>
                        <div><Input className="bg-white" placeholder="Nro" type="number" value={formData.direccion?.numero || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, numero: parseInt(e.target.value)}})} /></div>
                        <div><Input className="bg-white" placeholder="Ciudad" value={formData.direccion?.ciudad || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, ciudad: e.target.value}})} /></div>
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel} disabled={loading} className="text-rose-900 border-rose-200">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="bg-rose-900 hover:bg-rose-800 text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Nuevo Responsable
                </Button>
            </div>
        </div>
    );
}