import { HuespedDTO } from "./Huesped.dto";

export interface ModificarHuespedRequestDTO {
    huesped: HuespedDTO;
    aceptarIgualmente?: boolean;
}