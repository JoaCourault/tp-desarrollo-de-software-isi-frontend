import { HuespedDTO } from "./Huesped.dto";

export interface BuscarHuespedRequestDTO {
    huesped: Partial<HuespedDTO> | null;
}
