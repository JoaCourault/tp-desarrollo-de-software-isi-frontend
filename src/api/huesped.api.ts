import { Service } from "../service";
import { AltaHuespedRequestDTO, HuespedDTO } from "../dto/Huesped/AltaHuespedRequest.dto";

export interface AltaHuespedResponse {
    resultado: {
        id: number;
        mensaje: string;
    };
    huesped: HuespedDTO | null;
}

export class HuespedApi {
    private basePath = "/Huesped";

    public async alta(payload: AltaHuespedRequestDTO): Promise<AltaHuespedResponse> {
        return await Service.post<AltaHuespedRequestDTO, AltaHuespedResponse>(
            `${this.basePath}/Alta`,
            payload
        );
    }
}
