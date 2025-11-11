import { Resultado } from "@/dto/Resultado";
import { Usuario } from "@/models/Usuario/Usuario";

export interface AutenticarUsuarioResponseDto {
    resultado: Resultado;
    usuario: Usuario;
}