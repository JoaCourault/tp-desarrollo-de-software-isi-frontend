"use client";

import { useState } from "react";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";

import { BuscarHuespedForm } from "./components/BuscarHuespedForm";
import { AltaHuespedForm } from "./components/AltaHuespedForm";
import { EditGuestForm } from "./components/EditGuestForm";

export function GuestManagement() {
    // --- ESTADOS GLOBALES ---
    const [view, setView] = useState<"buscar" | "alta" | "editar">("buscar");
    const [guestToEdit, setGuestToEdit] = useState<HuespedDTO | null>(null);

    // --- STATE LIFTING (Para no perder la búsqueda al volver) ---
    const [searchResults, setSearchResults] = useState<HuespedDTO[]>([]);
    const [lastFilters, setLastFilters] = useState({
        nombre: "",
        apellido: "",
        numDoc: "",
        tipoDocumento: ""
    });
    const [searchMessage, setSearchMessage] = useState("");

    // --- HANDLERS ---
    const handleEditClick = (huesped: HuespedDTO) => {
        setGuestToEdit(huesped);
        setView("editar");
    };

    const handleBackToSearch = () => {
        setGuestToEdit(null);
        setView("buscar");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-150px)] h-auto pb-10">
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm flex flex-col">

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
                        <AltaHuespedForm onBack={handleBackToSearch} />
                    </div>
                )}

                {view === "editar" && guestToEdit && (
                    <EditGuestForm
                        guestData={guestToEdit}
                        onBack={handleBackToSearch}
                        onSuccess={handleBackToSearch}
                    />
                )}

            </div>
        </div>
    );
}