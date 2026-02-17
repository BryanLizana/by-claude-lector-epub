/**
 * Interfaz abstracta para analizadores de libros (SRP + DIP)
 * Define el contrato que deben cumplir todos los analizadores
 */
class AnalizadorLibro {
    /**
     * Analiza un archivo y extrae su contenido
     * @param {ArrayBuffer} datosArchivo - Datos binarios del archivo
     * @returns {Promise<LibroAnalizado>} Libro procesado
     */
    async analizar(datosArchivo) {
        throw new Error('El método analizar() debe ser implementado por las subclases');
    }

    /**
     * Verifica si este analizador puede procesar el archivo
     * @param {string} nombreArchivo - Nombre del archivo
     * @returns {boolean}
     */
    puedeAnalizar(nombreArchivo) {
        throw new Error('El método puedeAnalizar() debe ser implementado por las subclases');
    }

    /**
     * Obtiene los formatos soportados por este analizador
     * @returns {string[]}
     */
    obtenerFormatosSoportados() {
        throw new Error('El método obtenerFormatosSoportados() debe ser implementado');
    }
}

/**
 * Estructura de datos para un libro analizado
 */
class LibroAnalizado {
    constructor({ titulo, autor, capitulos, metadatos, estilos }) {
        this.titulo = titulo || 'Sin título';
        this.autor = autor || 'Autor desconocido';
        this.capitulos = capitulos || [];
        this.metadatos = metadatos || {};
        this.estilos = estilos || '';
    }
}

/**
 * Estructura de datos para un capítulo
 */
class Capitulo {
    constructor({ id, titulo, contenidoHtml, orden }) {
        this.id = id;
        this.titulo = titulo || `Capítulo ${orden}`;
        this.contenidoHtml = contenidoHtml || '';
        this.orden = orden || 0;
    }
}
