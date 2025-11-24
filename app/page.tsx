"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Imports de TU lógica de negocio
import { UsuarioApi } from "@/src/api/usuario.api";
import { AutenticarUsuarioResponseDto } from "@/src/dto/Usuario/AutenticarUsuario/AutenticarUsuarioResponse.dto";

// Componentes de UI
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form, FormField, FormItem,
    FormControl, FormLabel, FormMessage
} from "@/components/ui/form";

import { Eye, EyeOff, Hotel } from "lucide-react";

const formSchema = z.object({
    nombre: z.string().min(1, "Ingrese un nombre"),
    apellido: z.string().min(1, "Ingrese un apellido"),
    password: z.string().min(1, "Ingrese una contraseña"),
});

export default function LoginPage() {
    const router = useRouter();
    const usuarioApi = new UsuarioApi(); // Instancia de tu API real

    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errorMensaje, setErrorMensaje] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { nombre: "", apellido: "", password: "" }
    });

    // 1. NUEVO: Verificar si ya está logueado al entrar a la raíz
    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuarioLogueado");
        if (usuarioGuardado) {
            router.push("/dashboard");
        }
    }, [router]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        setErrorMensaje("");

        try {
            // 2. Tu llamada a la API real
            const response: AutenticarUsuarioResponseDto = await usuarioApi.login(values.nombre, values.apellido, values.password);
            console.log("RESPUESTA LOGIN:", response);

            if (response?.usuario?.idUsuario) {
                // Guardar usuario en LocalStorage
                localStorage.setItem("usuarioLogueado", JSON.stringify(response.usuario));

                // 3. CAMBIO CLAVE: Redirigir al nuevo Dashboard unificado
                router.push("/dashboard");
            } else {
                setErrorMensaje("Credenciales incorrectas.");
            }

        } catch (e) {
            console.error(e);
            setErrorMensaje("Error de conexión o datos inválidos.");
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-rose-50/50 px-4 font-sans">
            <Card className="w-full max-w-md shadow-xl border-rose-100 bg-white">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-rose-900 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-rose-900/20">
                        <Hotel className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-rose-950">Flower Hotel</CardTitle>
                    <CardDescription>Inicie sesión para acceder al sistema</CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="bg-white" placeholder="Ej: Juan" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="apellido"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellido</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="bg-white" placeholder="Ej: Pérez" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input
                                                    type={passwordVisible ? "text" : "password"}
                                                    className="pr-10 bg-white"
                                                    placeholder="••••••"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <button
                                                type="button"
                                                onClick={() => setPasswordVisible(!passwordVisible)}
                                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                            >
                                                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {errorMensaje && (
                                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm text-center border border-red-100">
                                    {errorMensaje}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-rose-900 hover:bg-rose-800 text-white font-medium shadow-md shadow-rose-900/10 transition-all"
                                disabled={loading}
                            >
                                {loading ? "Ingresando..." : "Iniciar Sesión"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}