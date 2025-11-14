import { AutenticarUsuarioRequestDto } from "../dto/Usuario/AutenticarUsuario/AutenticarUsuarioRequest.dt";
import { AutenticarUsuarioResponseDto } from "../dto/Usuario/AutenticarUsuario/AutenticarUsuarioResponse.dto";
import { Service } from "../service";

export class UsuarioApi {
    private basePath = "/Usuario";

    public async login(
        nombre: string,
        apellido: string,
        password: string
    ): Promise<AutenticarUsuarioResponseDto> {

        const payload: AutenticarUsuarioRequestDto = {
            nombre,
            apellido,
            password,
        };

        return await Service.post<any, AutenticarUsuarioResponseDto>(
            `${this.basePath}/Login`,
            payload
        );
    }
}
