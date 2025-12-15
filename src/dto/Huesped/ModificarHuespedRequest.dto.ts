import { HuespedDTO } from "./Huesped.dto";

export interface ModificarHuespedRequestDTO {
    aceptarIgualmente: boolean;
    huesped: HuespedDTO;
}