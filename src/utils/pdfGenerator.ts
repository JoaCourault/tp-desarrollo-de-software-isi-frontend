import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Definimos una interfaz flexible para el PDF, ya que el cliente puede venir en varios formatos
export interface DatosFacturaPDF {
    numeroComprobante: string;
    fechaEmision: string;
    tipoFactura: string;
    cliente: any; // Usamos any aquí para permitir el polimorfismo de tus 3 objetos de cliente
    items: {
        cantidad: number;
        descripcion: string;
        precioUnitario: number;
    }[];
    total: number;
}

export const generarFacturaPDF = (datos: DatosFacturaPDF) => {
    const doc = new jsPDF();

    // ---------------------------------------------------------
    // 1. LÓGICA DE NORMALIZACIÓN DE DATOS (Polimorfismo)
    // ---------------------------------------------------------
    let nombreStr = "";
    let docLabel = "";
    let docValue = "";
    let direccionStr = "Dirección no informada";
    let telefonoStr = "";

    // A. Detectar si es el objeto respuesta del Backend ("ResponsableDePagoGenerado")
    // Si viene dentro de un wrapper, lo extraemos.
    let clienteReal = datos.cliente;
    if (datos.cliente && datos.cliente.responsableDePagoGenerado) {
        clienteReal = datos.cliente.responsableDePagoGenerado;
    }

    // B. Analizar la estructura del objeto "clienteReal"
    if (clienteReal) {
        // CASO 1: Es el NUEVO DTO (ResponsableDePago) -> Tiene propiedad "tipo"
        if ("tipo" in clienteReal) {
            const esJuridica = clienteReal.tipo === "PERSONA_JURIDICA";

            if (esJuridica) {
                nombreStr = clienteReal.razonSocial || "Razón Social no informada";
                docLabel = "CUIT";
                docValue = clienteReal.cuit || "-";
            } else {
                // Es Persona Física (los datos están dentro de 'huesped')
                const huesped = clienteReal.huesped;
                if (huesped) {
                    nombreStr = `${huesped.apellido}, ${huesped.nombre}`;
                    docLabel = huesped.tipoDocumento?.tipoDocumento || "DOC"; // Manejo seguro si viene objeto o string
                    docValue = huesped.numDoc || "-";
                } else {
                    nombreStr = "Huésped no identificado";
                }
            }
            telefonoStr = clienteReal.telefono || "";
        }
        // CASO 2: Es el VIEJO DTO (PayerDTO) -> Tiene propiedad "esPersonaJuridica" (booleano)
        else if ("esPersonaJuridica" in clienteReal) {
            if (clienteReal.esPersonaJuridica) {
                nombreStr = clienteReal.razonSocial;
                docLabel = "CUIT";
                docValue = clienteReal.cuit;
            } else {
                nombreStr = `${clienteReal.apellido}, ${clienteReal.nombre}`;
                docLabel = "DNI";
                docValue = clienteReal.dni;
            }
            telefonoStr = clienteReal.telefono || "";
        }
        // CASO 3: Fallback por si llega algo inesperado
        else {
            nombreStr = "Cliente Desconocido";
        }

        // C. Normalización de Dirección (Funciona para ambos casos si respetan la estructura básica)
        if (clienteReal.direccion) {
            const d = clienteReal.direccion;
            // El backend nuevo devuelve 'localidad', el viejo 'ciudad'. Concatenamos lo que haya.
            const ciudad = d.ciudad || d.localidad || "";
            const calle = d.calle || "";
            const numero = d.numero || "";

            if (calle) {
                direccionStr = `${calle} ${numero}, ${ciudad}`;
            }
        }
    }

    // ---------------------------------------------------------
    // 2. GENERACIÓN DEL PDF (Visual)
    // ---------------------------------------------------------

    // --- ENCABEZADO EMPRESA ---
    doc.setFontSize(22);
    doc.text("Flower Hotel", 14, 20);
    doc.setFontSize(10);
    doc.text("Av. Siempreviva 123, Santa Fe, Argentina", 14, 26);
    doc.text("IVA Responsable Inscripto", 14, 31);

    // --- DATOS DEL COMPROBANTE ---
    doc.setFontSize(14);
    doc.text(`FACTURA ${datos.tipoFactura}`, 150, 20);
    doc.setFontSize(10);
    doc.text(`N°: ${datos.numeroComprobante}`, 150, 26);
    doc.text(`Fecha: ${datos.fechaEmision}`, 150, 31);

    // --- DATOS DEL CLIENTE ---
    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35);

    doc.setFontSize(12);
    doc.text("Datos del Cliente", 14, 42);
    doc.setFontSize(10);

    // Usamos las variables normalizadas arriba
    doc.text(`Nombre/Razón Social: ${nombreStr}`, 14, 48);
    doc.text(`${docLabel}: ${docValue}`, 14, 53);
    doc.text(`Dirección: ${direccionStr}`, 14, 58);

    if (telefonoStr) {
        doc.text(`Teléfono: ${telefonoStr}`, 120, 53);
    }

    // --- TABLA DE ITEMS ---
    const tableBody = datos.items.map(item => [
        item.cantidad,
        item.descripcion,
        `$ ${item.precioUnitario.toFixed(2)}`,
        `$ ${(item.cantidad * item.precioUnitario).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Cant.', 'Descripción', 'Precio Unit.', 'Subtotal']],
        body: tableBody,
        foot: [['', '', 'TOTAL', `$ ${datos.total.toFixed(2)}`]],
        theme: 'striped',
        headStyles: { fillColor: [136, 19, 55] }, // Color Rose-900 aprox
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // --- DESCARGAR ---
    doc.save(`Factura_${datos.numeroComprobante}.pdf`);
};