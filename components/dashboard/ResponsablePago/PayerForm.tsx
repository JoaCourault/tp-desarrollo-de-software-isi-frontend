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
        condicionIva: "Responsable Inscripto",
        direccion: { calle: '', numero: 0, ciudad: 'Santa Fe', codigoPostal: '', pais: 'Argentina', provincia: 'Santa Fe' },
        ...(cuitInicial ? { dni: cuitInicial, cuit: cuitInicial } : {})
    });

    const handleSave = async () => {
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

            <label className="flex items-center gap-2 text-sm cursor-pointer">Persona Jurídica</label>

            <div className="grid grid-cols-2 gap-3">

                
                <>
                    <div className="col-span-2"><Label>Razón Social</Label><Input className="bg-white" value={(formData as PersonaJuridicaDTO).razonSocial || ''} onChange={e => setFormData({...formData, razonSocial: e.target.value})} /></div>
                    <div><Label>CUIT</Label><Input className="bg-white" value={(formData as PersonaJuridicaDTO).cuit || ''} onChange={e => setFormData({...formData, cuit: e.target.value})} /></div>
                </>
                

                {/* Select de IVA */}
                <div>
                    <Label>Condición IVA</Label>
                    <Input className="bg-white" type="text" value={"Responsable Inscripto"} contentEditable={false}/>
                </div>

                <div><Label>Teléfono</Label><Input className="bg-white" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>

                {/* ... (Dirección Fiscal) ... */}
                <div className="col-span-2 border-t pt-2 mt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Dirección Fiscal</p>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Calle y Número */}
                        <div className="col-span-2">
                            <Input className="bg-white" placeholder="Calle" value={formData.direccion?.calle || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, calle: e.target.value}})} />
                        </div>
                        <div>
                            <Input className="bg-white" placeholder="Nro" type="number" value={formData.direccion?.numero || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, numero: parseInt(e.target.value)}})} />
                        </div>

                        {/* Piso y Departamento (Opcionales) */}
                        <div>
                            <Input className="bg-white" placeholder="Piso (opc.)" value={formData.direccion?.piso || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, piso: e.target.value}})} />
                        </div>
                        <div>
                            <Input className="bg-white" placeholder="Depto (opc.)" value={formData.direccion?.departamento || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, departamento: e.target.value}})} />
                        </div>
                        <div>
                            <Input className="bg-white" placeholder="Cód. Postal" value={formData.direccion?.codigoPostal || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, codigoPostal: e.target.value}})} />
                        </div>

                        {/* Ciudad, Provincia y País */}
                        <div>
                            <Input className="bg-white" placeholder="Ciudad" value={formData.direccion?.ciudad || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, ciudad: e.target.value}})} />
                        </div>
                        <div>
                            <Input className="bg-white" placeholder="Provincia" value={formData.direccion?.provincia || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, provincia: e.target.value}})} />
                        </div>
                        <div>
                            <Input className="bg-white" placeholder="País" value={formData.direccion?.pais || ''} onChange={e => setFormData({...formData, direccion: {...formData.direccion!, pais: e.target.value}})} />
                        </div>
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