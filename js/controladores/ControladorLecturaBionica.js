/**
 * Controlador de Lectura Biónica (SRP + Strategy Pattern)
 * Responsabilidad única: aplicar resaltado biónico al texto
 */
class ControladorLecturaBionica {
    constructor() {
        this.MODOS = {
            DESACTIVADO: 'desactivado',
            INICIO: 'inicio',
            INICIO_MEDIO: 'inicio_medio',
            CONSONANTES: 'consonantes',
            SILABAS: 'silabas',
            VOCAL: 'vocales'
        };

        this.INTENSIDADES = {
            SUAVE: 0.3,
            MEDIA: 0.5,
            FUERTE: 0.7
        };

        this.COLORES_PREDEFINIDOS = [
            { valor: 'inherit', nombre: 'Heredar' },
            { valor: '#e74c3c', nombre: 'Rojo' },
            { valor: '#3498db', nombre: 'Azul' },
            { valor: '#27ae60', nombre: 'Verde' },
            { valor: '#9b59b6', nombre: 'Morado' },
            { valor: '#f39c12', nombre: 'Naranja' }
        ];

        this.configuracion = {
            modo: this.MODOS.DESACTIVADO,
            intensidad: this.INTENSIDADES.MEDIA,
            color: 'inherit'
        };

        this.VOCALES = 'aeiouáéíóúàèìòùäëïöüAEIOUÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ';
        this.observadores = [];

        this._cargarConfiguracion();
    }

    /**
     * Obtiene los modos disponibles con sus descripciones
     * @returns {Array}
     */
    obtenerModosDisponibles() {
        return [
            { valor: this.MODOS.DESACTIVADO, nombre: 'Desactivado', descripcion: 'Texto normal' },
            { valor: this.MODOS.INICIO, nombre: 'Inicio', descripcion: 'Resalta inicio de palabras' },
            { valor: this.MODOS.INICIO_MEDIO, nombre: 'Inicio + Medio', descripcion: 'Resalta inicio y parte media' },
            { valor: this.MODOS.CONSONANTES, nombre: 'Consonantes', descripcion: 'Resalta consonantes' },
            { valor: this.MODOS.VOCAL, nombre: 'Vocales', descripcion: 'Resalta vocales' },
            { valor: this.MODOS.SILABAS, nombre: 'Sílabas', descripcion: 'Resalta primera sílaba' }
        ];
    }

    /**
     * Obtiene las intensidades disponibles
     * @returns {Array}
     */
    obtenerIntensidadesDisponibles() {
        return [
            { valor: this.INTENSIDADES.SUAVE, nombre: 'Suave (30%)' },
            { valor: this.INTENSIDADES.MEDIA, nombre: 'Media (50%)' },
            { valor: this.INTENSIDADES.FUERTE, nombre: 'Fuerte (70%)' }
        ];
    }

    /**
     * Cambia el modo de lectura biónica
     * @param {string} modo
     */
    cambiarModo(modo) {
        if (Object.values(this.MODOS).includes(modo)) {
            this.configuracion.modo = modo;
            this._guardarConfiguracion();
            this._notificarCambio();
        }
    }

    /**
     * Cambia la intensidad del resaltado
     * @param {number} intensidad
     */
    cambiarIntensidad(intensidad) {
        this.configuracion.intensidad = intensidad;
        this._guardarConfiguracion();
        this._notificarCambio();
    }

    /**
     * Cambia el color del resaltado
     * @param {string} color - Color en formato CSS (hex, nombre, inherit)
     */
    cambiarColor(color) {
        this.configuracion.color = color;
        this._guardarConfiguracion();
        this._notificarCambio();
    }

    /**
     * Obtiene los colores predefinidos
     * @returns {Array}
     */
    obtenerColoresPredefinidos() {
        return [...this.COLORES_PREDEFINIDOS];
    }

    /**
     * Obtiene la configuración actual
     * @returns {Object}
     */
    obtenerConfiguracion() {
        return { ...this.configuracion };
    }

    /**
     * Verifica si está activo
     * @returns {boolean}
     */
    estaActivo() {
        return this.configuracion.modo !== this.MODOS.DESACTIVADO;
    }

    /**
     * Aplica lectura biónica a un texto HTML
     * @param {string} html - Contenido HTML
     * @returns {string} HTML con lectura biónica aplicada
     */
    aplicar(html) {
        if (!this.estaActivo()) {
            return html;
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');
        this._procesarNodo(doc.body);
        return doc.body.innerHTML;
    }

    /**
     * Procesa recursivamente los nodos del DOM
     * @private
     */
    _procesarNodo(nodo) {
        if (nodo.nodeType === Node.TEXT_NODE) {
            const textoOriginal = nodo.textContent;
            if (textoOriginal.trim()) {
                const fragmento = this._procesarTexto(textoOriginal);
                nodo.parentNode.replaceChild(fragmento, nodo);
            }
        } else if (nodo.nodeType === Node.ELEMENT_NODE) {
            const etiquetasExcluidas = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA'];
            if (!etiquetasExcluidas.includes(nodo.tagName)) {
                const hijos = Array.from(nodo.childNodes);
                for (const hijo of hijos) {
                    this._procesarNodo(hijo);
                }
            }
        }
    }

    /**
     * Procesa un texto y retorna un fragmento con el formato biónico
     * @private
     */
    _procesarTexto(texto) {
        const fragmento = document.createDocumentFragment();
        const palabras = texto.split(/(\s+)/);

        for (const parte of palabras) {
            if (/^\s+$/.test(parte)) {
                fragmento.appendChild(document.createTextNode(parte));
            } else if (parte.length > 0) {
                const elementoPalabra = this._procesarPalabra(parte);
                fragmento.appendChild(elementoPalabra);
            }
        }

        return fragmento;
    }

    /**
     * Procesa una palabra individual según el modo activo
     * @private
     */
    _procesarPalabra(palabra) {
        const span = document.createElement('span');
        span.className = 'palabra-bionica';

        const estrategia = this._obtenerEstrategia();
        const resultado = estrategia(palabra);

        span.innerHTML = resultado;
        return span;
    }

    /**
     * Obtiene la estrategia de procesamiento según el modo (Strategy Pattern)
     * @private
     */
    _obtenerEstrategia() {
        const estrategias = {
            [this.MODOS.INICIO]: (palabra) => this._aplicarInicio(palabra),
            [this.MODOS.INICIO_MEDIO]: (palabra) => this._aplicarInicioMedio(palabra),
            [this.MODOS.CONSONANTES]: (palabra) => this._aplicarConsonantes(palabra),
            [this.MODOS.VOCAL]: (palabra) => this._aplicarVocal(palabra),
            [this.MODOS.SILABAS]: (palabra) => this._aplicarSilabas(palabra)
        };

        return estrategias[this.configuracion.modo] || ((p) => p);
    }

    /**
     * Genera la etiqueta de resaltado con color
     * @private
     */
    _generarEtiquetaResaltado(caracter) {
        const colorEstilo = this.configuracion.color !== 'inherit'
            ? ` style="color:${this.configuracion.color}"`
            : '';
        return `<b class="bionica"${colorEstilo}>${this._escaparHtml(caracter)}</b>`;
    }

    /**
     * Estrategia: resaltar inicio de palabra
     * @private
     */
    _aplicarInicio(palabra) {
        const soloLetras = palabra.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, '');
        if (soloLetras.length === 0) return this._escaparHtml(palabra);

        const cantidadResaltar = this._calcularCantidadResaltar(soloLetras.length);
        let contador = 0;
        let resultado = '';

        for (let i = 0; i < palabra.length; i++) {
            const char = palabra[i];
            if (/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(char)) {
                if (contador < cantidadResaltar) {
                    resultado += this._generarEtiquetaResaltado(char);
                    contador++;
                } else {
                    resultado += this._escaparHtml(char);
                }
            } else {
                resultado += this._escaparHtml(char);
            }
        }

        return resultado;
    }

    /**
     * Estrategia: resaltar inicio y parte media
     * @private
     */
    _aplicarInicioMedio(palabra) {

        if (palabra.length === 0) return this._escaparHtml(palabra);
        let n_letter = palabra.length;

        let sombreado = n_letter / 2;      

        let contadorLetras = 0;
        let resultado = '';

        for (let i = 0; i < palabra.length; i++) {
            const char = palabra[i];
                // const resaltarInicio = contadorLetras < cantidadInicio;
                // const resaltarMedio = contadorLetras === indiceMedio && soloLetras.length > 4;

                if (i < sombreado) {
                    resultado += this._generarEtiquetaResaltado(char);
                } else {
                    resultado += this._escaparHtml(char);
                }
                contadorLetras++;
          
        }

        return resultado;
    }

    /**
     * Estrategia: resaltar consonantes
     * @private
     */
    _aplicarConsonantes(palabra) {
        let resultado = '';
        let consonantesResaltadas = 0;
        const maxConsonantes = Math.ceil(palabra.length * this.configuracion.intensidad);

        for (let i = 0; i < palabra.length; i++) {
            const char = palabra[i];

            if (/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(char) && !this.VOCALES.includes(char)) {
                if (consonantesResaltadas < maxConsonantes) {
                    resultado += this._generarEtiquetaResaltado(char);
                    consonantesResaltadas++;
                } else {
                    resultado += this._escaparHtml(char);
                }
            } else {
                resultado += this._escaparHtml(char);
            }
        }

        return resultado;
    }


     _aplicarVocal(palabra) {
        let resultado = '';
        let vocalesResaltadas = 0;
        const maxVocales = Math.ceil(palabra.length * this.configuracion.intensidad);

        for (let i = 0; i < palabra.length; i++) {
            const char = palabra[i];

            if (/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(char) && this.VOCALES.includes(char)) {
                if (vocalesResaltadas < maxVocales) {
                    resultado += this._generarEtiquetaResaltado(char);
                    vocalesResaltadas++;
                } else {
                    resultado += this._escaparHtml(char);
                }
            } else {
                resultado += this._escaparHtml(char);
            }
        }

        return resultado;
    }

    /**
     * Estrategia: resaltar primera sílaba (aproximación)
     * @private
     */
    _aplicarSilabas(palabra) {
        const soloLetras = palabra.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, '');
        if (soloLetras.length === 0) return this._escaparHtml(palabra);

        const indicePrimeraSilaba = this._encontrarFinPrimeraSilaba(soloLetras);
        let contadorLetras = 0;
        let resultado = '';

        for (let i = 0; i < palabra.length; i++) {
            const char = palabra[i];
            if (/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(char)) {
                if (contadorLetras <= indicePrimeraSilaba) {
                    resultado += this._generarEtiquetaResaltado(char);
                } else {
                    resultado += this._escaparHtml(char);
                }
                contadorLetras++;
            } else {
                resultado += this._escaparHtml(char);
            }
        }

        return resultado;
    }

    /**
     * Encuentra el índice aproximado del fin de la primera sílaba
     * @private
     */
    _encontrarFinPrimeraSilaba(palabra) {
        if (palabra.length <= 2) return palabra.length - 1;

        let encontroVocal = false;

        for (let i = 0; i < palabra.length; i++) {
            const esVocal = this.VOCALES.includes(palabra[i]);

            if (esVocal) {
                encontroVocal = true;
            } else if (encontroVocal) {
                // Consonante después de vocal = fin de sílaba (aproximado)
                return Math.max(0, i - 1);
            }
        }

        return Math.min(Math.ceil(palabra.length * this.configuracion.intensidad), palabra.length - 1);
    }

    /**
     * Calcula cuántas letras resaltar según longitud e intensidad
     * @private
     */
    _calcularCantidadResaltar(longitudPalabra) {
        if (longitudPalabra <= 1) return 1;
        if (longitudPalabra <= 3) return 1;

        const cantidad = Math.ceil(longitudPalabra * this.configuracion.intensidad);
        return Math.max(1, Math.min(cantidad, longitudPalabra - 1));
    }

    /**
     * Escapa caracteres HTML
     * @private
     */
    _escaparHtml(texto) {
        const mapa = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return texto.replace(/[&<>"']/g, c => mapa[c]);
    }

    /**
     * Registra un observador para cambios
     * @param {Function} callback
     */
    alCambiar(callback) {
        this.observadores.push(callback);
    }

    /**
     * Notifica a los observadores
     * @private
     */
    _notificarCambio() {
        for (const observador of this.observadores) {
            observador(this.configuracion);
        }
    }

    /**
     * Guarda la configuración en localStorage
     * @private
     */
    _guardarConfiguracion() {
        try {
            localStorage.setItem('lectorEpub_bionica', JSON.stringify(this.configuracion));
        } catch (e) {
            console.warn('No se pudo guardar configuración biónica:', e);
        }
    }

    /**
     * Carga la configuración guardada
     * @private
     */
    _cargarConfiguracion() {
        try {
            const guardada = localStorage.getItem('lectorEpub_bionica');
            if (guardada) {
                this.configuracion = { ...this.configuracion, ...JSON.parse(guardada) };
            }
        } catch (e) {
            console.warn('No se pudo cargar configuración biónica:', e);
        }
    }
}
