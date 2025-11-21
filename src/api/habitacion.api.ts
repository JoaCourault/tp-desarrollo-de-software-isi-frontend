export class HabitacionApi {
    private base = "http://localhost:8080/habitaciones";

    async listar() {
        const res = await fetch(this.base);
        return res.json();
    }
}
