"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { HuespedApi } from "@/src/api/huesped.api";

import {
    Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";


// ---------------------- VALIDACIÓN ----------------------
const schema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    numDoc: z.string().min(1),
    tipoDocumento: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;


// ---------------------- COMPONENTE ----------------------
export default function DarAltaHuespedPage() {

    const router = useRouter();
    const api = new HuespedApi();

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nombre: "",
            apellido: "",
            tipoDocumento: "DNI",
            numDoc: "",
        }
    });

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        setErrorMsg("");

        // ⭐ ESTA ES LA CORRECCIÓN CLAVE ⭐
        const payload = {
            huesped: {
                idHuesped: null,
                nombre: values.nombre,
                apellido: values.apellido,
                tipoDocumento: { tipoDocumento: values.tipoDocumento },
                numDoc: values.numDoc,
                posicionIva: "",
                cuit: "",
                fechaNacimiento: "",
                telefono: "",
                email: "",
                ocupacion: "",
                nacionalidad: "",
                direccion: {
                    calle: "",
                    numero: "",
                    departamento: "",
                    piso: "",
                    cp: "",
                    localidad: "",
                    provincia: "",
                    pais: "",
                    id: null
                },
                idsEstadias: [],
                eliminado: false
            }
        };

        try {
            const res = await api.alta(payload);

            if (res.resultado.id === 0) {
                alert("Huésped creado correctamente");
                router.push("/GestionHuespedes");
            } else {
                setErrorMsg(res.resultado.mensaje);
            }
        } catch (error) {
            setErrorMsg("Error al registrar el huésped");
            console.error("Error alta:", error);
        }

        setLoading(false);
    };


    // ---------------------- UI ----------------------
    return (
        <div className="p-8">
            <Card className="max-w-3xl mx-auto shadow-md">
                <CardHeader>
                    <CardTitle>Dar Alta Huésped</CardTitle>
                </CardHeader>

                <CardContent>
                    {/* ---------------- FORMULARIO ---------------- */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* APELLIDO */}
                                <FormField
                                    control={form.control}
                                    name="apellido"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellido *</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* NOMBRE */}
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre *</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* TIPO DOCUMENTO */}
                                <FormField
                                    control={form.control}
                                    name="tipoDocumento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo Documento *</FormLabel>
                                            <FormControl>
                                                <select {...field} className="border rounded-md p-2 w-full">
                                                    <option value="DNI">DNI</option>
                                                    <option value="Pasaporte">Pasaporte</option>
                                                    <option value="LE">LE</option>
                                                    <option value="LC">LC</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* NUM DOC */}
                                <FormField
                                    control={form.control}
                                    name="numDoc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>N° Documento *</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {errorMsg && (
                                <p className="text-center text-red-600">{errorMsg}</p>
                            )}

                            {/* BOTONES */}
                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/GestionHuespedes")}
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="submit"
                                    className="bg-[#8e1126] hover:bg-[#750d1f]"
                                >
                                    {loading ? "Guardando..." : "Siguiente"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
