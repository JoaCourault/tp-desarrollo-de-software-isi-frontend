"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import AltaHuespedForm from "./huesped/AltaHuespedForm";
import BuscarHuespedForm from "./huesped/BuscarHuespedForm";

export default function GuestManagementTabs() {
    const [activeTab, setActiveTab] = useState<"alta" | "buscar">("alta");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* SUB-TABS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setActiveTab("alta")}
                    className={`flex flex-col items-center justify-center border rounded-lg py-4 px-4 ${
                        activeTab === "alta"
                            ? "bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-200"
                            : "bg-white text-rose-900"
                    }`}
                >
                    <UserPlus className="h-5 w-5 mb-2" />
                    <span>Dar Alta Huésped</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("buscar")}
                    className={`flex flex-col items-center justify-center border rounded-lg py-4 px-4 ${
                        activeTab === "buscar"
                            ? "bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-200"
                            : "bg-white text-rose-900"
                    }`}
                >
                    <Users className="h-5 w-5 mb-2" />
                    <span>Buscar Huésped</span>
                </button>
            </div>

            {/* CONTENIDO */}
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
                {activeTab === "alta" ? <AltaHuespedForm /> : <BuscarHuespedForm />}
            </div>
        </div>
    );
}
