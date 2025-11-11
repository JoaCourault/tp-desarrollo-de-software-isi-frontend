import { AutenticarUsuarioRequestDto } from '@/dto/Usuario/AutenticarUsuario/AutenticarUsuarioRequest.dt';
import { AutenticarUsuarioResponseDto } from '@/dto/Usuario/AutenticarUsuario/AutenticarUsuarioResponse.dto';
import { Service } from '@/service';
import { env } from 'process';



export class UsuarioApi {
  private basePath = env.NEXT_PUBLIC_API_USUARIO_ENDPOINT || '/Usuario';

  public async login(nombre: string, apellido: string, password: string): Promise<AutenticarUsuarioResponseDto> {
    const payload: AutenticarUsuarioRequestDto = { nombre, apellido, password };
    const res: AutenticarUsuarioResponseDto =
      await Service.post<any, AutenticarUsuarioResponseDto>(`${this.basePath}/Login`, payload);

    return res;
  }
}