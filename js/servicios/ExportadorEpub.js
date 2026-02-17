/**
 * Exportador de EPUB con lectura biónica aplicada (SRP)
 * Responsabilidad única: generar un archivo EPUB con resaltado biónico
 */
class ExportadorEpub {

    /**
     * Exporta el libro con lectura biónica aplicada como archivo EPUB
     * @param {LibroAnalizado} libro - Libro cargado
     * @param {ControladorLecturaBionica} controladorBionica - Controlador con configuración activa
     */
    async exportar(libro, controladorBionica) {
        const JSZipLib = window.JSZip;
        if (!JSZipLib) {
            throw new Error('JSZip no está disponible.');
        }

        const zip = new JSZipLib();

        // mimetype DEBE ser el primer archivo y sin compresión
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // META-INF/container.xml
        zip.file('META-INF/container.xml', this._generarContainer());

        // Aplicar biónica a cada capítulo
        const capitulosConBionica = libro.capitulos.map(cap => ({
            ...cap,
            contenidoBionico: controladorBionica.aplicar(cap.contenidoHtml)
        }));

        // Generar CSS
        const cssBionica = this._generarCssBionica(controladorBionica);
        const cssCompleto = (libro.estilos || '') + '\n' + cssBionica;
        zip.file('OEBPS/estilos.css', cssCompleto);

        // Generar cada capítulo como XHTML
        capitulosConBionica.forEach((cap, i) => {
            const xhtml = this._generarXhtmlCapitulo(cap, i);
            zip.file(`OEBPS/capitulo-${i}.xhtml`, xhtml);
        });

        // content.opf
        zip.file('OEBPS/content.opf', this._generarContentOpf(libro, capitulosConBionica));

        // toc.ncx
        zip.file('OEBPS/toc.ncx', this._generarTocNcx(libro, capitulosConBionica));

        // Generar blob y descargar
        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
        this._descargarBlob(blob, `${this._sanitizarNombreArchivo(libro.titulo)}_bionica.epub`);
    }

    /**
     * Genera container.xml
     * @private
     */
    _generarContainer() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    }

    /**
     * Genera el CSS con estilos para lectura biónica
     * @private
     */
    _generarCssBionica(controladorBionica) {
        const config = controladorBionica.obtenerConfiguracion();
        const colorRegla = config.color !== 'inherit'
            ? `color: ${config.color};`
            : '';

        return `
/* Estilos de lectura biónica */
b.bionica {
    font-weight: bold;
    ${colorRegla}
}

.palabra-bionica {
    display: inline;
}
`;
    }

    /**
     * Genera un capítulo como XHTML válido para EPUB
     * @private
     */
    _generarXhtmlCapitulo(capitulo, indice) {
        const contenido = this._limpiarParaXhtml(capitulo.contenidoBionico);
        const titulo = this._escaparXml(capitulo.titulo);

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es">
<head>
    <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8"/>
    <title>${titulo}</title>
    <link rel="stylesheet" type="text/css" href="estilos.css"/>
</head>
<body>
    <h2>${titulo}</h2>
    ${contenido}
</body>
</html>`;
    }

    /**
     * Genera content.opf con metadatos, manifest y spine
     * @private
     */
    _generarContentOpf(libro, capitulos) {
        const titulo = this._escaparXml(libro.titulo);
        const autor = this._escaparXml(libro.autor);
        const idioma = (libro.metadatos && libro.metadatos.idioma) || 'es';
        const uid = 'bionica-' + Date.now();

        let manifestItems = `    <item id="estilos" href="estilos.css" media-type="text/css"/>\n`;
        let spineItems = '';

        capitulos.forEach((_, i) => {
            manifestItems += `    <item id="cap-${i}" href="capitulo-${i}.xhtml" media-type="application/xhtml+xml"/>\n`;
            spineItems += `    <itemref idref="cap-${i}"/>\n`;
        });

        manifestItems += `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${titulo}</dc:title>
    <dc:creator>${autor}</dc:creator>
    <dc:language>${idioma}</dc:language>
    <dc:identifier id="BookId">${uid}</dc:identifier>
  </metadata>
  <manifest>
${manifestItems}  </manifest>
  <spine toc="ncx">
${spineItems}  </spine>
</package>`;
    }

    /**
     * Genera toc.ncx (tabla de contenidos)
     * @private
     */
    _generarTocNcx(libro, capitulos) {
        const titulo = this._escaparXml(libro.titulo);
        const uid = 'bionica-' + Date.now();

        let navPoints = '';
        capitulos.forEach((cap, i) => {
            const tituloCapitulo = this._escaparXml(cap.titulo);
            navPoints += `    <navPoint id="navpoint-${i}" playOrder="${i + 1}">
      <navLabel><text>${tituloCapitulo}</text></navLabel>
      <content src="capitulo-${i}.xhtml"/>
    </navPoint>\n`;
        });

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${titulo}</text></docTitle>
  <navMap>
${navPoints}  </navMap>
</ncx>`;
    }

    /**
     * Limpia HTML para que sea XHTML válido
     * @private
     */
    _limpiarParaXhtml(html) {
        // Cerrar etiquetas auto-cerrantes que no lo estén
        let xhtml = html
            .replace(/<br\s*>/gi, '<br/>')
            .replace(/<hr\s*>/gi, '<hr/>')
            .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1/>')
            .replace(/&nbsp;/g, '&#160;');

        // Asegurar que las imágenes base64 tengan alt
        xhtml = xhtml.replace(/<img((?:(?!alt=)[^>])*?)\/>/gi, '<img$1 alt="imagen"/>');

        return xhtml;
    }

    /**
     * Escapa caracteres especiales para XML
     * @private
     */
    _escaparXml(texto) {
        if (!texto) return '';
        return texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Sanitiza el nombre del archivo para descarga
     * @private
     */
    _sanitizarNombreArchivo(nombre) {
        return (nombre || 'libro')
            .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑüÜ\s\-_]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 80);
    }

    /**
     * Dispara la descarga de un blob como archivo
     * @private
     */
    _descargarBlob(blob, nombreArchivo) {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }
}
