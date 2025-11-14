export interface AutenticarUsuarioResponseDto {
    resultado: {
        id: number;
        mensaje: string;
    };
    usuario: {
        idUsuario: string;
        nombre: string;
        apellido: string;
        contrasenia: string;
    };
}
