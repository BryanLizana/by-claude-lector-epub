/**
 * Analizador específico para archivos EPUB (SRP)
 * Responsabilidad única: parsear archivos EPUB
 */
class AnalizadorEpub extends AnalizadorLibro {
    constructor() {
        super();
        this.FORMATOS_SOPORTADOS = ['.epub'];
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
            const zip = await this._descomprimirEpub(datosArchivo);
            const contenedor = await this._leerContenedor(zip);
            const rutaOpf = this._extraerRutaOpf(contenedor);
            const opf = await this._leerOpf(zip, rutaOpf);

            const metadatos = this._extraerMetadatos(opf);
            const capitulos = await this._extraerCapitulos(zip, opf, rutaOpf);
            const estilos = await this._extraerEstilos(zip, opf, rutaOpf);

            return new LibroAnalizado({
                titulo: metadatos.titulo,
                autor: metadatos.autor,
                capitulos,
                metadatos,
                estilos
            });
        } catch (error) {
            throw new Error(`Error al analizar EPUB: ${error.message}`);
        }
    }

    /**
     * Descomprime el archivo EPUB (es un ZIP)
     * @private
     */
    async _descomprimirEpub(datosArchivo) {
        const JSZip = window.JSZip;
        if (!JSZip) {
            throw new Error('JSZip no está disponible. Asegúrese de incluir la librería.');
        }
        return await JSZip.loadAsync(datosArchivo);
    }

    /**
     * Lee el archivo container.xml
     * @private
     */
    async _leerContenedor(zip) {
        const archivoContenedor = zip.file('META-INF/container.xml');
        if (!archivoContenedor) {
            throw new Error('Archivo container.xml no encontrado');
        }
        const contenido = await archivoContenedor.async('text');
        return new DOMParser().parseFromString(contenido, 'application/xml');
    }

    /**
     * Extrae la ruta del archivo OPF desde el contenedor
     * @private
     */
    _extraerRutaOpf(contenedor) {
        const rootfile = contenedor.querySelector('rootfile');
        if (!rootfile) {
            throw new Error('No se encontró el rootfile en container.xml');
        }
        return rootfile.getAttribute('full-path');
    }

    /**
     * Lee y parsea el archivo OPF
     * @private
     */
    async _leerOpf(zip, rutaOpf) {
        const archivoOpf = zip.file(rutaOpf);
        if (!archivoOpf) {
            throw new Error(`Archivo OPF no encontrado: ${rutaOpf}`);
        }
        const contenido = await archivoOpf.async('text');
        return new DOMParser().parseFromString(contenido, 'application/xml');
    }

    /**
     * Extrae metadatos del OPF
     * @private
     */
    _extraerMetadatos(opf) {
        const obtenerTexto = (selector) => {
            const elemento = opf.querySelector(selector);
            return elemento ? elemento.textContent.trim() : null;
        };

        return {
            titulo: obtenerTexto('metadata title') || obtenerTexto('dc\\:title') || 'Sin título',
            autor: obtenerTexto('metadata creator') || obtenerTexto('dc\\:creator') || 'Autor desconocido',
            idioma: obtenerTexto('metadata language') || obtenerTexto('dc\\:language') || 'es',
            descripcion: obtenerTexto('metadata description') || obtenerTexto('dc\\:description') || '',
            editorial: obtenerTexto('metadata publisher') || obtenerTexto('dc\\:publisher') || ''
        };
    }

    /**
     * Extrae los capítulos del libro
     * @private
     */
    async _extraerCapitulos(zip, opf, rutaOpf) {
        const directorio = rutaOpf.includes('/')
            ? rutaOpf.substring(0, rutaOpf.lastIndexOf('/') + 1)
            : '';

        const spine = opf.querySelector('spine');
        const manifest = opf.querySelector('manifest');

        if (!spine || !manifest) {
            throw new Error('Estructura OPF inválida');
        }

        const itemrefs = spine.querySelectorAll('itemref');
        const capitulos = [];

        for (let i = 0; i < itemrefs.length; i++) {
            const idref = itemrefs[i].getAttribute('idref');
            const item = manifest.querySelector(`item[id="${idref}"]`);

            if (item) {
                const href = item.getAttribute('href');
                const rutaCompleta = directorio + href;
                const archivo = zip.file(rutaCompleta);

                if (archivo) {
                    let contenido = await archivo.async('text');
                    contenido = await this._procesarContenidoHtml(contenido, zip, directorio);

                    capitulos.push(new Capitulo({
                        id: idref,
                        titulo: this._extraerTituloCapitulo(contenido, i + 1),
                        contenidoHtml: contenido,
                        orden: i
                    }));
                }
            }
        }

        return capitulos;
    }

    /**
     * Procesa el contenido HTML para convertir imágenes a base64
     * @private
     */
    async _procesarContenidoHtml(html, zip, directorio) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const imagenes = doc.querySelectorAll('img');

        for (const img of imagenes) {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('data:')) {
                const rutaImagen = this._resolverRuta(directorio, src);
                const archivoImagen = zip.file(rutaImagen);

                if (archivoImagen) {
                    const extension = src.split('.').pop().toLowerCase();
                    const tipoMime = this._obtenerTipoMimeImagen(extension);
                    const datosBase64 = await archivoImagen.async('base64');
                    img.setAttribute('src', `data:${tipoMime};base64,${datosBase64}`);
                }
            }
        }

        return doc.body ? doc.body.innerHTML : html;
    }

    /**
     * Resuelve rutas relativas
     * @private
     */
    _resolverRuta(directorio, rutaRelativa) {
        if (rutaRelativa.startsWith('../')) {
            const partes = directorio.split('/').filter(p => p);
            const partesRelativas = rutaRelativa.split('/');

            for (const parte of partesRelativas) {
                if (parte === '..') {
                    partes.pop();
                } else if (parte !== '.') {
                    partes.push(parte);
                }
            }
            return partes.join('/');
        }
        return directorio + rutaRelativa;
    }

    /**
     * Obtiene el tipo MIME de una imagen por extensión
     * @private
     */
    _obtenerTipoMimeImagen(extension) {
        const tipos = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp'
        };
        return tipos[extension] || 'image/jpeg';
    }

    /**
     * Intenta extraer el título del capítulo del contenido HTML
     * @private
     */
    _extraerTituloCapitulo(html, numeroCapitulo) {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const selectores = ['h1', 'h2', 'h3', '.chapter-title', '.titulo'];
        for (const selector of selectores) {
            const elemento = doc.querySelector(selector);
            if (elemento && elemento.textContent.trim()) {
                return elemento.textContent.trim();
            }
        }

        return `Capítulo ${numeroCapitulo}`;
    }

    /**
     * Extrae los estilos CSS del EPUB
     * @private
     */
    async _extraerEstilos(zip, opf, rutaOpf) {
        const directorio = rutaOpf.includes('/')
            ? rutaOpf.substring(0, rutaOpf.lastIndexOf('/') + 1)
            : '';

        const manifest = opf.querySelector('manifest');
        const itemsCss = manifest.querySelectorAll('item[media-type="text/css"]');

        let estilosCombinados = '';

        for (const item of itemsCss) {
            const href = item.getAttribute('href');
            const archivo = zip.file(directorio + href);

            if (archivo) {
                const contenido = await archivo.async('text');
                estilosCombinados += contenido + '\n';
            }
        }

        return estilosCombinados;
    }
}
