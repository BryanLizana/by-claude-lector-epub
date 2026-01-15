/**
 * Controlador de estilos y tipografía (SRP)
 * Responsabilidad única: gestionar los estilos visuales del lector
 */
class ControladorEstilos {
    constructor() {
        this.CONFIGURACION_POR_DEFECTO = {
            tamanoFuente: 18,
            familiaFuente: 'Georgia',
            alturaLinea: 1.8,
            colorTexto: '#2c3e50',
            colorFondo: '#fefefe',
            anchoMaximo: 800,
            margenHorizontal: 20,
            tema: 'claro'
        };

        this.FUENTES_DISPONIBLES = [
            { valor: 'Georgia', nombre: 'Georgia (Serif)' },
            { valor: 'Times New Roman', nombre: 'Times New Roman' },
            { valor: 'Palatino Linotype', nombre: 'Palatino' },
            { valor: 'Arial', nombre: 'Arial (Sans-serif)' },
            { valor: 'Helvetica', nombre: 'Helvetica' },
            { valor: 'Verdana', nombre: 'Verdana' },
            { valor: 'Trebuchet MS', nombre: 'Trebuchet' },
            { valor: 'Courier New', nombre: 'Courier (Monospace)' },
            { valor: 'OpenDyslexic', nombre: 'OpenDyslexic' }
        ];

        this.TEMAS = {
            claro: {
                colorTexto: '#2c3e50',
                colorFondo: '#fefefe'
            },
            sepia: {
                colorTexto: '#5b4636',
                colorFondo: '#f4ecd8'
            },
            oscuro: {
                colorTexto: '#e0e0e0',
                colorFondo: '#1a1a2e'
            },
            noche: {
                colorTexto: '#b8b8b8',
                colorFondo: '#0d0d0d'
            }
        };

        this.LIMITES = {
            tamanoFuenteMinimo: 12,
            tamanoFuenteMaximo: 36,
            alturaLineaMinima: 1.2,
            alturaLineaMaxima: 2.5,
            anchoMaximoMinimo: 400,
            anchoMaximoMaximo: 1200
        };

        this.configuracionActual = { ...this.CONFIGURACION_POR_DEFECTO };
        this.observadores = [];

        this._cargarConfiguracionGuardada();
    }

    /**
     * Obtiene la configuración actual
     * @returns {Object}
     */
    obtenerConfiguracion() {
        return { ...this.configuracionActual };
    }

    /**
     * Obtiene las fuentes disponibles
     * @returns {Array}
     */
    obtenerFuentesDisponibles() {
        return [...this.FUENTES_DISPONIBLES];
    }

    /**
     * Obtiene los temas disponibles
     * @returns {Object}
     */
    obtenerTemasDisponibles() {
        return Object.keys(this.TEMAS);
    }

    /**
     * Cambia el tamaño de fuente
     * @param {number} tamano
     */
    cambiarTamanoFuente(tamano) {
        const tamanoValidado = this._validarRango(
            tamano,
            this.LIMITES.tamanoFuenteMinimo,
            this.LIMITES.tamanoFuenteMaximo
        );
        this.configuracionActual.tamanoFuente = tamanoValidado;
        this._notificarCambio();
        this._guardarConfiguracion();
    }

    /**
     * Incrementa el tamaño de fuente
     * @param {number} incremento
     */
    aumentarFuente(incremento = 2) {
        this.cambiarTamanoFuente(this.configuracionActual.tamanoFuente + incremento);
    }

    /**
     * Decrementa el tamaño de fuente
     * @param {number} decremento
     */
    reducirFuente(decremento = 2) {
        this.cambiarTamanoFuente(this.configuracionActual.tamanoFuente - decremento);
    }

    /**
     * Cambia la familia de fuente
     * @param {string} familia
     */
    cambiarFamiliaFuente(familia) {
        const fuenteValida = this.FUENTES_DISPONIBLES.find(f => f.valor === familia);
        if (fuenteValida) {
            this.configuracionActual.familiaFuente = familia;
            this._notificarCambio();
            this._guardarConfiguracion();
        }
    }

    /**
     * Cambia la altura de línea
     * @param {number} altura
     */
    cambiarAlturaLinea(altura) {
        const alturaValidada = this._validarRango(
            altura,
            this.LIMITES.alturaLineaMinima,
            this.LIMITES.alturaLineaMaxima
        );
        this.configuracionActual.alturaLinea = alturaValidada;
        this._notificarCambio();
        this._guardarConfiguracion();
    }

    /**
     * Cambia el ancho máximo del contenido
     * @param {number} ancho
     */
    cambiarAnchoMaximo(ancho) {
        const anchoValidado = this._validarRango(
            ancho,
            this.LIMITES.anchoMaximoMinimo,
            this.LIMITES.anchoMaximoMaximo
        );
        this.configuracionActual.anchoMaximo = anchoValidado;
        this._notificarCambio();
        this._guardarConfiguracion();
    }

    /**
     * Cambia el tema de colores
     * @param {string} nombreTema
     */
    cambiarTema(nombreTema) {
        const tema = this.TEMAS[nombreTema];
        if (tema) {
            this.configuracionActual.tema = nombreTema;
            this.configuracionActual.colorTexto = tema.colorTexto;
            this.configuracionActual.colorFondo = tema.colorFondo;
            this._notificarCambio();
            this._guardarConfiguracion();
        }
    }

    /**
     * Restablece la configuración por defecto
     */
    restablecerConfiguracion() {
        this.configuracionActual = { ...this.CONFIGURACION_POR_DEFECTO };
        this._notificarCambio();
        this._guardarConfiguracion();
    }

    /**
     * Genera el CSS basado en la configuración actual
     * @returns {string}
     */
    generarCss() {
        const config = this.configuracionActual;

        return `
            .visor-contenido {
                font-family: ${config.familiaFuente}, serif;
                font-size: ${config.tamanoFuente}px;
                line-height: ${config.alturaLinea};
                color: ${config.colorTexto};
                background-color: ${config.colorFondo};
                max-width: ${config.anchoMaximo}px;
                margin: 0 auto;
                padding: 20px ${config.margenHorizontal}px;
            }

            .visor-contenido p {
                margin-bottom: 1em;
                text-align: justify;
            }

            .visor-contenido h1,
            .visor-contenido h2,
            .visor-contenido h3 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                line-height: 1.3;
            }

            .visor-contenido img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1em auto;
            }

            .visor-contenido a {
                color: inherit;
                text-decoration: underline;
            }

            body {
                background-color: ${config.colorFondo};
                transition: background-color 0.3s ease;
            }
        `;
    }

    /**
     * Registra un observador para cambios de estilo (Observer pattern)
     * @param {Function} callback
     */
    alCambiar(callback) {
        this.observadores.push(callback);
    }

    /**
     * Valida que un valor esté dentro de un rango
     * @private
     */
    _validarRango(valor, minimo, maximo) {
        return Math.max(minimo, Math.min(maximo, valor));
    }

    /**
     * Notifica a los observadores del cambio
     * @private
     */
    _notificarCambio() {
        const css = this.generarCss();
        for (const observador of this.observadores) {
            observador(this.configuracionActual, css);
        }
    }

    /**
     * Guarda la configuración en localStorage
     * @private
     */
    _guardarConfiguracion() {
        try {
            localStorage.setItem(
                'lectorEpub_estilos',
                JSON.stringify(this.configuracionActual)
            );
        } catch (e) {
            console.warn('No se pudo guardar la configuración:', e);
        }
    }

    /**
     * Carga la configuración guardada
     * @private
     */
    _cargarConfiguracionGuardada() {
        try {
            const guardada = localStorage.getItem('lectorEpub_estilos');
            if (guardada) {
                const config = JSON.parse(guardada);
                this.configuracionActual = {
                    ...this.CONFIGURACION_POR_DEFECTO,
                    ...config
                };
            }
        } catch (e) {
            console.warn('No se pudo cargar la configuración guardada:', e);
        }
    }
}

export { ControladorEstilos };
