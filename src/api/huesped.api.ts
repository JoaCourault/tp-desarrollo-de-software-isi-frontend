import { Service } from "../service";
import { AltaHuespedRequestDTO, HuespedDTO } from "../dto/Huesped/AltaHuespedRequest.dto";
import { AltaHuespedResultDTO } from "@/src/dto/Huesped/AltaHuespedResult.dto";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";
import { BuscarHuespedResultDTO } from "@/src/dto/Huesped/BuscarHuespedResult.dto";

export interface AltaHuespedResponse {
    resultado: {
        id: number;
        mensaje: string;
    };
    huesped: HuespedDTO | null;
}

export class HuespedApi {
    private basePath = "/Huesped";

    public async alta(payload: AltaHuespedRequestDTO): Promise<AltaHuespedResultDTO> {
        return await Service.post<AltaHuespedRequestDTO, AltaHuespedResultDTO>(
            `${this.basePath}/Alta`,
            payload
        );
    }

    public async buscar(
        payload: BuscarHuespedRequestDTO
    ): Promise<BuscarHuespedResultDTO> {
        return await Service.post<BuscarHuespedRequestDTO, BuscarHuespedResultDTO>(
            `${this.basePath}/Buscar`,
            payload
        );
    }


}
