import { AnalizadorEpub } from '../analizadores/AnalizadorEpub.js';
import { AnalizadorMobi } from '../analizadores/AnalizadorMobi.js';

/**
 * Servicio para gestionar la carga de archivos (SRP + OCP)
 * Abierto para extensión: nuevos analizadores se registran sin modificar
 */
class GestorArchivos {
    constructor() {
        this.analizadores = [];
        this._registrarAnalizadoresPorDefecto();
    }

    /**
     * Registra los analizadores por defecto
     * @private
     */
    _registrarAnalizadoresPorDefecto() {
        this.registrarAnalizador(new AnalizadorEpub());
        this.registrarAnalizador(new AnalizadorMobi());
    }

    /**
     * Registra un nuevo analizador (OCP - abierto para extensión)
     * @param {AnalizadorLibro} analizador
     */
    registrarAnalizador(analizador) {
        this.analizadores.push(analizador);
    }

    /**
     * Obtiene todos los formatos soportados
     * @returns {string[]}
     */
    obtenerFormatosSoportados() {
        const formatos = [];
        for (const analizador of this.analizadores) {
            formatos.push(...analizador.obtenerFormatosSoportados());
        }
        return formatos;
    }

    /**
     * Carga y analiza un archivo
     * @param {File} archivo - Archivo seleccionado por el usuario
     * @returns {Promise<LibroAnalizado>}
     */
    async cargarArchivo(archivo) {
        const analizador = this._buscarAnalizador(archivo.name);

        if (!analizador) {
            const formatosSoportados = this.obtenerFormatosSoportados().join(', ');
            throw new Error(
                `Formato no soportado: ${archivo.name}. ` +
                `Formatos válidos: ${formatosSoportados}`
            );
        }

        const datosArchivo = await this._leerArchivo(archivo);
        return await analizador.analizar(datosArchivo);
    }

    /**
     * Busca el analizador apropiado para el archivo
     * @private
     */
    _buscarAnalizador(nombreArchivo) {
        return this.analizadores.find(a => a.puedeAnalizar(nombreArchivo)) || null;
    }

    /**
     * Lee un archivo como ArrayBuffer
     * @private
     */
    _leerArchivo(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();

            lector.onload = () => resolve(lector.result);
            lector.onerror = () => reject(new Error('Error al leer el archivo'));

            lector.readAsArrayBuffer(archivo);
        });
    }
}

export { GestorArchivos };
