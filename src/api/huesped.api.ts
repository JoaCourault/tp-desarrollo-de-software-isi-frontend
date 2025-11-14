import { Service } from "../service";

export interface AltaHuespedResponse {
    resultado: {
        id: number;
        mensaje: string;
    };
    huesped: any;
}

export class HuespedApi {
    private basePath = "/Huesped";

    public async alta(payload: any) {
        return await Service.post<any, any>(
            `${this.basePath}/Alta`,
            payload
        );
    }
}
