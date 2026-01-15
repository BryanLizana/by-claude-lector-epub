import { AnalizadorLibro, LibroAnalizado, Capitulo } from './AnalizadorLibro.js';

/**
 * Analizador específico para archivos MOBI (SRP)
 * Responsabilidad única: parsear archivos MOBI/AZW
 *
 * Nota: MOBI es un formato propietario complejo.
 * Esta implementación maneja los casos más comunes.
 */
class AnalizadorMobi extends AnalizadorLibro {
    constructor() {
        super();
        this.FORMATOS_SOPORTADOS = ['.mobi', '.azw', '.azw3'];
        this.COMPRESION_NINGUNA = 1;
        this.COMPRESION_PALMDOC = 2;
        this.COMPRESION_HUFF = 17480;
    }

    /**
     * @inheritdoc
     */
    puedeAnalizar(nombreArchivo) {
        const extension = nombreArchivo.toLowerCase().slice(nombreArchivo.lastIndexOf('.'));
        return this.FORMATOS_SOPORTADOS.includes(extension);
    }

    /**
     * @inheritdoc
     */
    obtenerFormatosSoportados() {
        return [...this.FORMATOS_SOPORTADOS];
    }

    /**
     * @inheritdoc
     */
    async analizar(datosArchivo) {
        try {
            const vista = new DataView(datosArchivo);
            const cabeceraPdb = this._leerCabeceraPdb(vista);
            const registros = this._leerRegistros(vista, cabeceraPdb);
            const cabeceraMobi = this._leerCabeceraMobi(vista, registros[0].offset);

            const contenidoHtml = await this._extraerContenido(vista, registros, cabeceraMobi);
            const capitulos = this._dividirEnCapitulos(contenidoHtml);

            return new LibroAnalizado({
                titulo: cabeceraMobi.titulo || cabeceraPdb.nombre,
                autor: cabeceraMobi.autor || 'Autor desconocido',
                capitulos,
                metadatos: {
                    titulo: cabeceraMobi.titulo,
                    autor: cabeceraMobi.autor,
                    idioma: cabeceraMobi.idioma || 'es'
                },
                estilos: ''
            });
        } catch (error) {
            throw new Error(`Error al analizar MOBI: ${error.message}`);
        }
    }

    /**
     * Lee la cabecera PDB del archivo
     * @private
     */
    _leerCabeceraPdb(vista) {
        const decodificador = new TextDecoder('utf-8');

        const nombre = this._leerCadena(vista, 0, 32);
        const numRegistros = vista.getUint16(76, false);

        return {
            nombre: nombre.replace(/\0/g, '').trim(),
            numRegistros
        };
    }

    /**
     * Lee un string desde un DataView
     * @private
     */
    _leerCadena(vista, offset, longitud) {
        const bytes = new Uint8Array(vista.buffer, offset, longitud);
        const decodificador = new TextDecoder('utf-8');
        return decodificador.decode(bytes);
    }

    /**
     * Lee la lista de registros del PDB
     * @private
     */
    _leerRegistros(vista, cabecera) {
        const registros = [];
        const inicioLista = 78;

        for (let i = 0; i < cabecera.numRegistros; i++) {
            const offsetRegistro = inicioLista + (i * 8);
            registros.push({
                offset: vista.getUint32(offsetRegistro, false),
                atributos: vista.getUint8(offsetRegistro + 4)
            });
        }

        return registros;
    }

    /**
     * Lee la cabecera MOBI del primer registro
     * @private
     */
    _leerCabeceraMobi(vista, offsetRegistro0) {
        const compresion = vista.getUint16(offsetRegistro0, false);
        const longitudTexto = vista.getUint32(offsetRegistro0 + 4, false);
        const numRegistrosTexto = vista.getUint16(offsetRegistro0 + 8, false);
        const tamanoRegistro = vista.getUint16(offsetRegistro0 + 10, false);

        let titulo = '';
        let autor = '';
        let idioma = 'es';

        const identificador = this._leerCadena(vista, offsetRegistro0 + 16, 4);

        if (identificador === 'MOBI') {
            const longitudCabecera = vista.getUint32(offsetRegistro0 + 20, false);
            const offsetTitulo = vista.getUint32(offsetRegistro0 + 84, false);
            const longitudTitulo = vista.getUint32(offsetRegistro0 + 88, false);

            if (offsetTitulo && longitudTitulo) {
                titulo = this._leerCadena(vista, offsetRegistro0 + offsetTitulo, longitudTitulo);
            }

            const offsetExth = offsetRegistro0 + 16 + longitudCabecera;
            const exthInfo = this._leerExth(vista, offsetExth);

            if (exthInfo.autor) autor = exthInfo.autor;
            if (exthInfo.idioma) idioma = exthInfo.idioma;
        }

        return {
            compresion,
            longitudTexto,
            numRegistrosTexto,
            tamanoRegistro,
            titulo: titulo.replace(/\0/g, '').trim(),
            autor,
            idioma
        };
    }

    /**
     * Lee el header EXTH para metadatos adicionales
     * @private
     */
    _leerExth(vista, offset) {
        const resultado = { autor: '', idioma: '' };

        try {
            const identificador = this._leerCadena(vista, offset, 4);
            if (identificador !== 'EXTH') return resultado;

            const numRegistros = vista.getUint32(offset + 8, false);
            let posActual = offset + 12;

            for (let i = 0; i < numRegistros; i++) {
                const tipo = vista.getUint32(posActual, false);
                const longitud = vista.getUint32(posActual + 4, false);
                const valor = this._leerCadena(vista, posActual + 8, longitud - 8);

                if (tipo === 100) resultado.autor = valor.replace(/\0/g, '').trim();
                if (tipo === 524) resultado.idioma = valor.replace(/\0/g, '').trim();

                posActual += longitud;
            }
        } catch (e) {
            // EXTH opcional, ignorar errores
        }

        return resultado;
    }

    /**
     * Extrae el contenido HTML del MOBI
     * @private
     */
    async _extraerContenido(vista, registros, cabecera) {
        const contenidoPartes = [];
        const numRegistros = Math.min(cabecera.numRegistrosTexto, registros.length - 1);

        for (let i = 1; i <= numRegistros; i++) {
            const inicio = registros[i].offset;
            const fin = i < registros.length - 1 ? registros[i + 1].offset : vista.byteLength;
            const datosRegistro = new Uint8Array(vista.buffer, inicio, fin - inicio);

            let contenido;
            if (cabecera.compresion === this.COMPRESION_PALMDOC) {
                contenido = this._descomprimirPalmDoc(datosRegistro);
            } else {
                contenido = datosRegistro;
            }

            const decodificador = new TextDecoder('utf-8');
            contenidoPartes.push(decodificador.decode(contenido));
        }

        return contenidoPartes.join('');
    }

    /**
     * Descomprime datos con algoritmo PalmDOC
     * @private
     */
    _descomprimirPalmDoc(datos) {
        const resultado = [];
        let i = 0;

        while (i < datos.length) {
            const byte = datos[i++];

            if (byte === 0) {
                resultado.push(0);
            } else if (byte >= 1 && byte <= 8) {
                for (let j = 0; j < byte && i < datos.length; j++) {
                    resultado.push(datos[i++]);
                }
            } else if (byte >= 9 && byte <= 127) {
                resultado.push(byte);
            } else if (byte >= 128 && byte <= 191) {
                if (i < datos.length) {
                    const siguiente = datos[i++];
                    const distancia = ((byte << 8) | siguiente) >> 3;
                    const longitud = (siguiente & 0x07) + 3;
                    const posicion = resultado.length - (distancia & 0x7FF);

                    for (let j = 0; j < longitud; j++) {
                        if (posicion + j >= 0 && posicion + j < resultado.length) {
                            resultado.push(resultado[posicion + j]);
                        }
                    }
                }
            } else {
                resultado.push(32);
                resultado.push(byte ^ 128);
            }
        }

        return new Uint8Array(resultado);
    }

    /**
     * Divide el contenido HTML en capítulos
     * @private
     */
    _dividirEnCapitulos(html) {
        const capitulos = [];
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const body = doc.body || doc.documentElement;

        const marcadores = body.querySelectorAll('h1, h2, mbp\\:pagebreak, [class*="chapter"]');

        if (marcadores.length === 0) {
            capitulos.push(new Capitulo({
                id: 'cap-1',
                titulo: 'Contenido',
                contenidoHtml: body.innerHTML,
                orden: 0
            }));
            return capitulos;
        }

        let contenidoActual = '';
        let tituloActual = 'Inicio';
        let orden = 0;

        const nodos = Array.from(body.childNodes);

        for (const nodo of nodos) {
            const esDelimitador = nodo.nodeType === 1 &&
                (nodo.tagName === 'H1' || nodo.tagName === 'H2' ||
                    nodo.tagName === 'MBP:PAGEBREAK' ||
                    (nodo.className && nodo.className.includes('chapter')));

            if (esDelimitador) {
                if (contenidoActual.trim()) {
                    capitulos.push(new Capitulo({
                        id: `cap-${orden}`,
                        titulo: tituloActual,
                        contenidoHtml: contenidoActual,
                        orden
                    }));
                    orden++;
                }
                contenidoActual = '';
                tituloActual = nodo.textContent?.trim() || `Capítulo ${orden + 1}`;
            }

            if (nodo.nodeType === 1) {
                contenidoActual += nodo.outerHTML;
            } else if (nodo.nodeType === 3) {
                contenidoActual += nodo.textContent;
            }
        }

        if (contenidoActual.trim()) {
            capitulos.push(new Capitulo({
                id: `cap-${orden}`,
                titulo: tituloActual,
                contenidoHtml: contenidoActual,
                orden
            }));
        }

        return capitulos.length > 0 ? capitulos : [new Capitulo({
            id: 'cap-1',
            titulo: 'Contenido',
            contenidoHtml: html,
            orden: 0
        })];
    }
}

export { AnalizadorMobi };
