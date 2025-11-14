"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { UsuarioApi } from "@/src/api/usuario.api";
import { AutenticarUsuarioResponseDto } from "@/src/dto/Usuario/AutenticarUsuario/AutenticarUsuarioResponse.dto";

import { useRouter } from "next/navigation";

import {
    Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form, FormField, FormItem,
    FormControl, FormLabel, FormMessage
} from "@/components/ui/form";

import { Eye, EyeOff } from "lucide-react";


const formSchema = z.object({
    nombre: z.string().min(1, "Ingrese un nombre"),
    apellido: z.string().min(1, "Ingrese un apellido"),
    password: z.string().min(1, "Ingrese una contraseña"),
});


export default function LoginPage() {
    const router = useRouter();
    const usuarioApi = new UsuarioApi();

    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errorMensaje, setErrorMensaje] = useState("");

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { nombre: "", apellido: "", password: "" }
    });

    type LoginFormValues = z.infer<typeof formSchema>;

    const onSubmit = async (values: LoginFormValues) => {
        setLoading(true);
        setErrorMensaje("");

        try {
            const response: AutenticarUsuarioResponseDto = await usuarioApi.login(values.nombre, values.apellido, values.password);
            console.log("RESPUESTA LOGIN:", response);

            // Validación correcta según tu backend JSON
            if (response?.usuario?.idUsuario) {

                // Guardar solo el usuario
                localStorage.setItem("usuarioLogueado", JSON.stringify(response.usuario));

                router.push("/GestionHuespedes");
            } else {
                setErrorMensaje("Credenciales incorrectas.");
            }


        } catch (e) {
            console.error(e);
            setErrorMensaje("Credenciales incorrectas.");
        }

        setLoading(false);
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fdeaea] px-4">
            <Card className="w-full max-w-md shadow-xl border-none">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-semibold">Hotel 25</CardTitle>
                    <CardDescription>Inicie sesión para acceder al panel</CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>

                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                    className="pr-10"
                                                    {...field}
                                                />
                                            </FormControl>

                                            <button
                                                type="button"
                                                onClick={() => setPasswordVisible(!passwordVisible)}
                                                className="absolute inset-y-0 right-2 flex items-center"
                                            >
                                                {passwordVisible ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {errorMensaje && (
                                <p className="text-center text-red-600 text-sm">{errorMensaje}</p>
                            )}

                            <Button type="submit" className="w-full bg-[#8e1126] hover:bg-[#750d1f]">
                                {loading ? "Ingresando..." : "Iniciar Sesión"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
