"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Hotel, LogOut, Users, Bed } from "lucide-react";

import GuestManagementTabs from "@/components/dashboard/GuestManagementTabs";
import { RoomManagement } from "@/components/dashboard/room/RoomManagement";


export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"guests" | "rooms">("guests");
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const usuario = localStorage.getItem("usuarioLogueado");
        if (!usuario) router.push("/");
        else setIsChecking(false);
    }, [router]);

    if (isChecking) return null;

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* HEADER */}
            <header className="sticky top-0 z-50 border-b bg-white/95">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-900 rounded-lg flex items-center justify-center">
                                <Hotel className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Flower Hotel</h1>
                            </div>
                        </div>

                        <Button variant="outline" onClick={() => {
                            localStorage.removeItem("usuarioLogueado");
                            router.push("/");
                        }}>
                            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </header>

            {/* TABS */}
<div className="border-b bg-white shadow-sm">
    <div className="container mx-auto px-4 lg:px-6">
        <nav className="flex gap-2 py-2">

            {/* pestaña gestión huespedes */}
            <Button
                onClick={() => setActiveTab("guests")}
                className={
                    activeTab === "guests"
                        ? "bg-rose-900 text-white hover:bg-rose-800"
                        : "bg-white text-rose-900 border border-rose-200 hover:bg-rose-50"
                }
            >
                <Users className="w-4 h-4 mr-2" />
                Gestión de Huéspedes
            </Button>

            {/* pestaña gestión habitaciones */}
            <Button
                onClick={() => setActiveTab("rooms")}
                className={
                    activeTab === "rooms"
                        ? "bg-rose-900 text-white hover:bg-rose-800"
                        : "bg-white text-rose-900 border border-rose-200 hover:bg-rose-50"
                }
            >
                <Bed className="w-4 h-4 mr-2" />
                Gestión de Habitaciones
            </Button>

        </nav>
    </div>
</div>


            {/* CONTENIDO */}
            <main className="container mx-auto px-4 lg:px-6 py-8">
                {activeTab === "guests" ? <GuestManagementTabs /> : <RoomManagement />}
            </main>
        </div>
    );
}
