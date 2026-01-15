/**
 * Controlador del visor de lectura (SRP)
 * Responsabilidad única: gestionar la visualización del contenido
 */
class ControladorVisor {
    constructor(elementoContenedor) {
        this.contenedor = elementoContenedor;
        this.libroActual = null;
        this.capituloActual = 0;
        this.posicionesCapitulos = [];
        this.estilosPersonalizados = null;
        this.controladorBionica = null;
    }

    /**
     * Establece el controlador de lectura biónica (DIP)
     * @param {ControladorLecturaBionica} controlador
     */
    establecerControladorBionica(controlador) {
        this.controladorBionica = controlador;
    }

    /**
     * Carga un libro en el visor
     * @param {LibroAnalizado} libro
     */
    cargarLibro(libro) {
        this.libroActual = libro;
        this.capituloActual = 0;
        this._renderizarLibro();
        this._calcularPosicionesCapitulos();
        this._guardarProgreso();
    }

    /**
     * Renderiza todo el libro con scroll continuo
     * @private
     */
    _renderizarLibro() {
        if (!this.libroActual) return;

        let html = '';

        for (const capitulo of this.libroActual.capitulos) {
            let contenido = capitulo.contenidoHtml;

            if (this.controladorBionica && this.controladorBionica.estaActivo()) {
                contenido = this.controladorBionica.aplicar(contenido);
            }

            html += `
                <section class="capitulo" id="capitulo-${capitulo.id}" data-orden="${capitulo.orden}">
                    <h2 class="titulo-capitulo">${this._escaparHtml(capitulo.titulo)}</h2>
                    <div class="contenido-capitulo" data-contenido-original="${this._codificarBase64(capitulo.contenidoHtml)}">
                        ${contenido}
                    </div>
                </section>
            `;
        }

        this.contenedor.innerHTML = `
            <article class="visor-contenido">
                ${html}
            </article>
        `;

        this._aplicarEstilosLibro();
        this._restaurarProgreso();
    }

    /**
     * Actualiza la lectura biónica sin recargar el libro
     */
    actualizarLecturaBionica() {
        if (!this.libroActual) return;

        const scrollActual = window.scrollY;
        const contenidos = this.contenedor.querySelectorAll('.contenido-capitulo');

        contenidos.forEach((contenedor) => {
            const original = contenedor.dataset.contenidoOriginal;
            if (original) {
                let contenido = this._decodificarBase64(original);

                if (this.controladorBionica && this.controladorBionica.estaActivo()) {
                    contenido = this.controladorBionica.aplicar(contenido);
                }

                contenedor.innerHTML = contenido;
            }
        });

        window.scrollTo({ top: scrollActual, behavior: 'auto' });
    }

    /**
     * Codifica texto a Base64
     * @private
     */
    _codificarBase64(texto) {
        try {
            return btoa(encodeURIComponent(texto).replace(/%([0-9A-F]{2})/g,
                (match, p1) => String.fromCharCode('0x' + p1)));
        } catch (e) {
            return '';
        }
    }

    /**
     * Decodifica Base64 a texto
     * @private
     */
    _decodificarBase64(base64) {
        try {
            return decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        } catch (e) {
            return '';
        }
    }

    /**
     * Aplica los estilos CSS del libro si existen
     * @private
     */
    _aplicarEstilosLibro() {
        const estilosExistentes = document.getElementById('estilos-libro');
        if (estilosExistentes) {
            estilosExistentes.remove();
        }

        if (this.libroActual.estilos) {
            const elementoEstilo = document.createElement('style');
            elementoEstilo.id = 'estilos-libro';
            elementoEstilo.textContent = this._sanitizarCss(this.libroActual.estilos);
            document.head.appendChild(elementoEstilo);
        }
    }

    /**
     * Sanitiza CSS para evitar estilos peligrosos
     * @private
     */
    _sanitizarCss(css) {
        return css
            .replace(/position\s*:\s*fixed/gi, 'position: relative')
            .replace(/position\s*:\s*absolute/gi, 'position: relative')
            .replace(/@import/gi, '/* import deshabilitado */')
            .replace(/javascript:/gi, '');
    }

    /**
     * Escapa HTML para prevenir XSS
     * @private
     */
    _escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    /**
     * Calcula las posiciones de cada capítulo para navegación
     * @private
     */
    _calcularPosicionesCapitulos() {
        this.posicionesCapitulos = [];
        const secciones = this.contenedor.querySelectorAll('.capitulo');

        secciones.forEach((seccion, indice) => {
            this.posicionesCapitulos.push({
                indice,
                id: seccion.id,
                offsetTop: seccion.offsetTop
            });
        });
    }

    /**
     * Navega a un capítulo específico
     * @param {number} indice
     */
    irACapitulo(indice) {
        if (indice < 0 || indice >= this.posicionesCapitulos.length) return;

        const posicion = this.posicionesCapitulos[indice];
        const seccion = document.getElementById(posicion.id);

        if (seccion) {
            seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.capituloActual = indice;
            this._guardarProgreso();
        }
    }

    /**
     * Va al capítulo siguiente
     */
    siguienteCapitulo() {
        this.irACapitulo(this.capituloActual + 1);
    }

    /**
     * Va al capítulo anterior
     */
    anteriorCapitulo() {
        this.irACapitulo(this.capituloActual - 1);
    }

    /**
     * Obtiene la lista de capítulos para el índice
     * @returns {Array}
     */
    obtenerIndiceCapitulos() {
        if (!this.libroActual) return [];

        return this.libroActual.capitulos.map((cap, indice) => ({
            indice,
            titulo: cap.titulo,
            id: cap.id
        }));
    }

    /**
     * Detecta el capítulo actual basado en scroll
     * @param {number} scrollTop
     */
    actualizarCapituloActual(scrollTop) {
        for (let i = this.posicionesCapitulos.length - 1; i >= 0; i--) {
            if (scrollTop >= this.posicionesCapitulos[i].offsetTop - 100) {
                if (this.capituloActual !== i) {
                    this.capituloActual = i;
                    this._guardarProgreso();
                    return i;
                }
                return null;
            }
        }
        return null;
    }

    /**
     * Guarda el progreso de lectura
     * @private
     */
    _guardarProgreso() {
        if (!this.libroActual) return;

        try {
            const progreso = {
                titulo: this.libroActual.titulo,
                capitulo: this.capituloActual,
                scrollY: window.scrollY,
                fecha: new Date().toISOString()
            };

            const clave = `lectorEpub_progreso_${this._generarIdLibro()}`;
            localStorage.setItem(clave, JSON.stringify(progreso));
        } catch (e) {
            console.warn('No se pudo guardar el progreso:', e);
        }
    }

    /**
     * Restaura el progreso de lectura
     * @private
     */
    _restaurarProgreso() {
        if (!this.libroActual) return;

        try {
            const clave = `lectorEpub_progreso_${this._generarIdLibro()}`;
            const guardado = localStorage.getItem(clave);

            if (guardado) {
                const progreso = JSON.parse(guardado);
                this.capituloActual = progreso.capitulo || 0;

                setTimeout(() => {
                    window.scrollTo({
                        top: progreso.scrollY || 0,
                        behavior: 'auto'
                    });
                }, 100);
            }
        } catch (e) {
            console.warn('No se pudo restaurar el progreso:', e);
        }
    }

    /**
     * Genera un ID único para el libro basado en título y autor
     * @private
     */
    _generarIdLibro() {
        const texto = `${this.libroActual.titulo}_${this.libroActual.autor}`;
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            const char = texto.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Busca texto en el libro
     * @param {string} termino
     * @returns {Array} Resultados de búsqueda
     */
    buscarTexto(termino) {
        if (!this.libroActual || !termino.trim()) return [];

        const resultados = [];
        const terminoLower = termino.toLowerCase();

        this.libroActual.capitulos.forEach((capitulo, indice) => {
            const textoPlano = this._extraerTextoPlano(capitulo.contenidoHtml);
            const posicion = textoPlano.toLowerCase().indexOf(terminoLower);

            if (posicion !== -1) {
                const contexto = textoPlano.substring(
                    Math.max(0, posicion - 50),
                    Math.min(textoPlano.length, posicion + termino.length + 50)
                );

                resultados.push({
                    capituloIndice: indice,
                    capituloTitulo: capitulo.titulo,
                    contexto: `...${contexto}...`,
                    posicion
                });
            }
        });

        return resultados;
    }

    /**
     * Extrae texto plano del HTML
     * @private
     */
    _extraerTextoPlano(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || '';
    }

    /**
     * Obtiene información del libro actual
     * @returns {Object|null}
     */
    obtenerInfoLibro() {
        if (!this.libroActual) return null;

        return {
            titulo: this.libroActual.titulo,
            autor: this.libroActual.autor,
            totalCapitulos: this.libroActual.capitulos.length,
            capituloActual: this.capituloActual,
            metadatos: this.libroActual.metadatos
        };
    }
}

export { ControladorVisor };
