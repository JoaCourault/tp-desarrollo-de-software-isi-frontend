"use client";

import { useState } from "react";
import { Search as SearchIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HuespedApi } from "@/src/api/huesped.api";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";

interface BuscarHuespedFormProps {
    onGoToCreate: () => void;
    onEdit: (h: HuespedDTO) => void;
    results: HuespedDTO[];
    setResults: (res: HuespedDTO[]) => void;
    filters: any;
    setFilters: (filters: any) => void;
    message: string;
    setMessage: (msg: string) => void;
}

export function BuscarHuespedForm({
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

    // --- VALIDACIÓN EN TIEMPO REAL ---
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // VALIDACIÓN SOLO NÚMEROS (Para el campo numDoc)
        if (name === "numDoc") {
            // Si no está vacío y contiene algo que NO sea número, se ignora
            if (value !== "" && !/^\d+$/.test(value)) {
                return;
            }
        }

        // VALIDACIÓN SOLO LETRAS Y ESPACIOS (Para Nombre y Apellido)
        if (name === "nombre" || name === "apellido") {
            // Si el valor comienza con un espacio, lo evitamos
            if (value.startsWith(" ")) return;

            // RegEx: Solo permite letras y espacios.
            if (!/^[a-zA-Z\u00C0-\u017F\s]*$/.test(value)) {
                return;
            }

        }

        setLocalFilters({ ...localFilters, [name]: value });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        
        // Esto elimina los espacios sobrantes al inicio y AL FINAL automáticamente.
        const filtrosLimpios = {
            ...localFilters,
            nombre: localFilters.nombre?.trim(),
            apellido: localFilters.apellido?.trim(),
            numDoc: localFilters.numDoc?.trim()
        };

        setFilters(filtrosLimpios); // Actualizamos el estado global con los datos limpios

        const payload: BuscarHuespedRequestDTO = {
            huesped: {
                nombre: filtrosLimpios.nombre || null,
                apellido: filtrosLimpios.apellido || null,
                tipoDoc: filtrosLimpios.tipoDocumento ? { tipoDocumento: filtrosLimpios.tipoDocumento } : null,
                numDoc: filtrosLimpios.numDoc || null,
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
        <div className="flex flex-col">
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-rose-950">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">Filtre por nombre, apellido o documento</p>
            </div>

            <div className="p-6 space-y-6 flex flex-col">
                <form onSubmit={handleSearch} className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Nombre</label>
                            <Input
                                name="nombre"
                                value={localFilters.nombre}
                                onChange={handleLocalChange}
                                placeholder="Ej: Juan"
                                className="bg-white"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Apellido</label>
                            <Input
                                name="apellido"
                                value={localFilters.apellido}
                                onChange={handleLocalChange}
                                placeholder="Ej: Perez"
                                className="bg-white"
                                autoComplete="off"
                            />
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
                                <Input
                                    name="numDoc"
                                    value={localFilters.numDoc}
                                    onChange={handleLocalChange}
                                    placeholder="123..."
                                    className="bg-white"
                                    autoComplete="off"
                                />
                            </div>
                            <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white mb-0.5" disabled={searching}>
                                {searching ? "..." : <SearchIcon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="space-y-3">
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