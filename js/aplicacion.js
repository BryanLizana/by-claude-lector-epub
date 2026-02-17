/**
 * Clase principal de la aplicación (Fachada / Mediator)
 * Coordina la interacción entre los diferentes módulos
 * Sigue ISP: interfaces específicas para cada responsabilidad
 */
class AplicacionLector {
    constructor() {
        this.gestorArchivos = new GestorArchivos();
        this.controladorEstilos = new ControladorEstilos();
        this.controladorBionica = new ControladorLecturaBionica();
        this.controladorVisor = null;
        this.panelAbierto = false;

        this._inicializarElementos();
        this._configurarEventos();
        this._aplicarEstilosIniciales();
    }

    /**
     * Inicializa referencias a elementos del DOM
     * @private
     */
    _inicializarElementos() {
        this.elementos = {
            pantallaBienvenida: document.getElementById('pantalla-bienvenida'),
            contenedorVisor: document.getElementById('contenedor-visor'),
            zonaDrop: document.getElementById('zona-drop'),
            selectorArchivo: document.getElementById('selector-archivo'),
            btnAbrir: document.getElementById('btn-abrir'),
            btnExportar: document.getElementById('btn-exportar'),
            btnIndice: document.getElementById('btn-indice'),
            btnConfiguracion: document.getElementById('btn-configuracion'),
            panelLateral: document.getElementById('panel-lateral'),
            overlay: document.getElementById('overlay'),
            pantallaCarga: document.getElementById('pantalla-carga'),
            mensajeError: document.getElementById('mensaje-error'),
            infoLibro: document.getElementById('info-libro'),
            barraProgreso: document.getElementById('barra-progreso'),
            progresoRelleno: document.getElementById('progreso-relleno'),
            estilosLector: document.getElementById('estilos-lector'),
            listaCapitulos: document.getElementById('lista-capitulos'),
            controlTamano: document.getElementById('control-tamano'),
            controlFuente: document.getElementById('control-fuente'),
            controlAlturaLinea: document.getElementById('control-altura-linea'),
            controlAncho: document.getElementById('control-ancho'),
            valorTamano: document.getElementById('valor-tamano'),
            valorAlturaLinea: document.getElementById('valor-altura-linea'),
            valorAncho: document.getElementById('valor-ancho'),
            selectorTemas: document.getElementById('selector-temas'),
            btnRestablecer: document.getElementById('btn-restablecer'),
            controlModoBionica: document.getElementById('control-modo-bionica'),
            selectorIntensidad: document.getElementById('selector-intensidad'),
            textoEjemploBionica: document.getElementById('texto-ejemplo-bionica'),
            grupoIntensidadBionica: document.getElementById('grupo-intensidad-bionica'),
            grupoColorBionica: document.getElementById('grupo-color-bionica'),
            coloresPredefinidos: document.getElementById('colores-predefinidos'),
            colorBionicaPersonalizado: document.getElementById('color-bionica-personalizado')
        };
    }

    /**
     * Configura los eventos de la interfaz
     * @private
     */
    _configurarEventos() {
        this._configurarEventosArchivo();
        this._configurarEventosPanel();
        this._configurarEventosEstilos();
        this._configurarEventosBionica();
        this._configurarEventosScroll();
        this._configurarEventosExportar();
    }

    /**
     * Eventos relacionados con carga de archivos
     * @private
     */
    _configurarEventosArchivo() {
        const { zonaDrop, selectorArchivo, btnAbrir } = this.elementos;

        btnAbrir.addEventListener('click', () => selectorArchivo.click());
        zonaDrop.addEventListener('click', () => selectorArchivo.click());

        selectorArchivo.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this._procesarArchivo(e.target.files[0]);
            }
        });

        zonaDrop.addEventListener('dragover', (e) => {
            e.preventDefault();
            zonaDrop.classList.add('activa');
        });

        zonaDrop.addEventListener('dragleave', () => {
            zonaDrop.classList.remove('activa');
        });

        zonaDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            zonaDrop.classList.remove('activa');

            if (e.dataTransfer.files.length > 0) {
                this._procesarArchivo(e.dataTransfer.files[0]);
            }
        });
    }

    /**
     * Eventos del panel lateral
     * @private
     */
    _configurarEventosPanel() {
        const { btnIndice, btnConfiguracion, overlay } = this.elementos;

        btnIndice.addEventListener('click', () => this._togglePanel());
        btnConfiguracion.addEventListener('click', () => this._togglePanel());
        overlay.addEventListener('click', () => this._cerrarPanel());
    }

    /**
     * Eventos de controles de estilo
     * @private
     */
    _configurarEventosEstilos() {
        const {
            controlTamano, controlFuente, controlAlturaLinea,
            controlAncho, selectorTemas, btnRestablecer
        } = this.elementos;

        this._poblarSelectorFuentes();

        controlTamano.addEventListener('input', (e) => {
            this.controladorEstilos.cambiarTamanoFuente(parseInt(e.target.value));
        });

        controlFuente.addEventListener('change', (e) => {
            this.controladorEstilos.cambiarFamiliaFuente(e.target.value);
        });

        controlAlturaLinea.addEventListener('input', (e) => {
            this.controladorEstilos.cambiarAlturaLinea(parseFloat(e.target.value));
        });

        controlAncho.addEventListener('input', (e) => {
            this.controladorEstilos.cambiarAnchoMaximo(parseInt(e.target.value));
        });

        selectorTemas.addEventListener('click', (e) => {
            const opcion = e.target.closest('.tema-opcion');
            if (opcion) {
                const tema = opcion.dataset.tema;
                this.controladorEstilos.cambiarTema(tema);
                this._actualizarSelectorTemas(tema);
            }
        });

        btnRestablecer.addEventListener('click', () => {
            this.controladorEstilos.restablecerConfiguracion();
            this._sincronizarControles();
        });

        this.controladorEstilos.alCambiar((config, css) => {
            this._aplicarCss(css);
            this._sincronizarControles();
        });
    }

    /**
     * Eventos de controles de lectura biónica
     * @private
     */
    _configurarEventosBionica() {
        const { controlModoBionica, selectorIntensidad, coloresPredefinidos, colorBionicaPersonalizado } = this.elementos;

        this._poblarSelectorModosBionica();
        this._actualizarEjemploBionica();

        controlModoBionica.addEventListener('change', (e) => {
            this.controladorBionica.cambiarModo(e.target.value);
            this._actualizarVisibilidadControlesBionica();
            this._actualizarEjemploBionica();

            if (this.controladorVisor) {
                this.controladorVisor.actualizarLecturaBionica();
            }
        });

        selectorIntensidad.addEventListener('click', (e) => {
            const boton = e.target.closest('.intensidad-opcion');
            if (boton) {
                const intensidad = parseFloat(boton.dataset.intensidad);
                this.controladorBionica.cambiarIntensidad(intensidad);
                this._actualizarSelectorIntensidad(intensidad);
                this._actualizarEjemploBionica();

                if (this.controladorVisor) {
                    this.controladorVisor.actualizarLecturaBionica();
                }
            }
        });

        coloresPredefinidos.addEventListener('click', (e) => {
            const boton = e.target.closest('.color-opcion');
            if (boton) {
                const color = boton.dataset.color;
                this.controladorBionica.cambiarColor(color);
                this._actualizarSelectorColor(color);
                this._actualizarEjemploBionica();

                if (this.controladorVisor) {
                    this.controladorVisor.actualizarLecturaBionica();
                }
            }
        });

        colorBionicaPersonalizado.addEventListener('input', (e) => {
            const color = e.target.value;
            this.controladorBionica.cambiarColor(color);
            this._actualizarSelectorColor(color);
            this._actualizarEjemploBionica();

            if (this.controladorVisor) {
                this.controladorVisor.actualizarLecturaBionica();
            }
        });

        this.controladorBionica.alCambiar(() => {
            this._actualizarEjemploBionica();
        });

        this._actualizarVisibilidadControlesBionica();
        this._sincronizarControlesBionica();
    }

    /**
     * Puebla el selector de modos de lectura biónica
     * @private
     */
    _poblarSelectorModosBionica() {
        const modos = this.controladorBionica.obtenerModosDisponibles();
        const configActual = this.controladorBionica.obtenerConfiguracion();

        this.elementos.controlModoBionica.innerHTML = modos.map(m => `
            <option value="${m.valor}" ${m.valor === configActual.modo ? 'selected' : ''}>
                ${m.nombre} - ${m.descripcion}
            </option>
        `).join('');
    }

    /**
     * Actualiza la visibilidad de los controles de biónica
     * @private
     */
    _actualizarVisibilidadControlesBionica() {
        const { grupoIntensidadBionica, grupoColorBionica } = this.elementos;
        const activo = this.controladorBionica.estaActivo();
        grupoIntensidadBionica.style.display = activo ? 'block' : 'none';
        grupoColorBionica.style.display = activo ? 'block' : 'none';
    }

    /**
     * Actualiza el selector de intensidad
     * @private
     */
    _actualizarSelectorIntensidad(intensidadActiva) {
        const botones = this.elementos.selectorIntensidad.querySelectorAll('.intensidad-opcion');
        botones.forEach(boton => {
            const intensidad = parseFloat(boton.dataset.intensidad);
            boton.classList.toggle('activo', intensidad === intensidadActiva);
        });
    }

    /**
     * Actualiza el selector de color
     * @private
     */
    _actualizarSelectorColor(colorActivo) {
        const botones = this.elementos.coloresPredefinidos.querySelectorAll('.color-opcion');
        let encontrado = false;

        botones.forEach(boton => {
            const color = boton.dataset.color;
            const esActivo = color === colorActivo;
            boton.classList.toggle('activo', esActivo);
            if (esActivo) encontrado = true;
        });

        if (!encontrado && colorActivo !== 'inherit') {
            this.elementos.colorBionicaPersonalizado.value = colorActivo;
        }
    }

    /**
     * Actualiza el ejemplo de lectura biónica
     * @private
     */
    _actualizarEjemploBionica() {
        const { textoEjemploBionica } = this.elementos;
        const textoOriginal = 'La lectura biónica mejora la velocidad de lectura resaltando partes clave de las palabras.';

        if (this.controladorBionica.estaActivo()) {
            textoEjemploBionica.innerHTML = this.controladorBionica.aplicar(textoOriginal);
        } else {
            textoEjemploBionica.textContent = textoOriginal;
        }
    }

    /**
     * Sincroniza los controles de lectura biónica
     * @private
     */
    _sincronizarControlesBionica() {
        const config = this.controladorBionica.obtenerConfiguracion();
        this.elementos.controlModoBionica.value = config.modo;
        this._actualizarSelectorIntensidad(config.intensidad);
        this._actualizarSelectorColor(config.color);
        this._actualizarVisibilidadControlesBionica();
    }

    /**
     * Eventos de scroll para progreso y capítulo actual
     * @private
     */
    _configurarEventosScroll() {
        let ultimoScroll = 0;

        window.addEventListener('scroll', () => {
            const ahora = Date.now();
            if (ahora - ultimoScroll < 50) return;
            ultimoScroll = ahora;

            this._actualizarProgreso();

            if (this.controladorVisor) {
                const nuevoCapitulo = this.controladorVisor.actualizarCapituloActual(window.scrollY);
                if (nuevoCapitulo !== null) {
                    this._actualizarCapituloActivo(nuevoCapitulo);
                }
            }
        });
    }

    /**
     * Procesa un archivo seleccionado
     * @private
     */
    async _procesarArchivo(archivo) {
        this._mostrarCarga(true);

        try {
            const libro = await this.gestorArchivos.cargarArchivo(archivo);
            this._mostrarVisor(libro);
        } catch (error) {
            this._mostrarError(error.message);
        } finally {
            this._mostrarCarga(false);
        }
    }

    /**
     * Muestra el visor con el libro cargado
     * @private
     */
    _mostrarVisor(libro) {
        const { pantallaBienvenida, contenedorVisor, btnExportar, btnIndice, btnConfiguracion, barraProgreso, infoLibro } = this.elementos;

        pantallaBienvenida.classList.add('oculto');
        contenedorVisor.classList.remove('oculto');
        btnExportar.classList.remove('oculto');
        btnIndice.classList.remove('oculto');
        btnConfiguracion.classList.remove('oculto');
        barraProgreso.classList.remove('oculto');

        this.controladorVisor = new ControladorVisor(contenedorVisor);
        this.controladorVisor.establecerControladorBionica(this.controladorBionica);
        this.controladorVisor.cargarLibro(libro);

        infoLibro.textContent = `${libro.titulo} — ${libro.autor}`;

        this._generarIndiceCapitulos();
        this._aplicarCss(this.controladorEstilos.generarCss());
    }

    /**
     * Genera la lista de capítulos en el panel
     * @private
     */
    _generarIndiceCapitulos() {
        const { listaCapitulos } = this.elementos;
        const capitulos = this.controladorVisor.obtenerIndiceCapitulos();

        listaCapitulos.innerHTML = capitulos.map((cap, indice) => `
            <li data-indice="${indice}" ${indice === 0 ? 'class="activo"' : ''}>
                ${this._escaparHtml(cap.titulo)}
            </li>
        `).join('');

        listaCapitulos.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                const indice = parseInt(li.dataset.indice);
                this.controladorVisor.irACapitulo(indice);
                this._actualizarCapituloActivo(indice);
                this._cerrarPanel();
            }
        });
    }

    /**
     * Actualiza el capítulo activo en el índice
     * @private
     */
    _actualizarCapituloActivo(indice) {
        const items = this.elementos.listaCapitulos.querySelectorAll('li');
        items.forEach((item, i) => {
            item.classList.toggle('activo', i === indice);
        });
    }

    /**
     * Actualiza la barra de progreso
     * @private
     */
    _actualizarProgreso() {
        const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
        const porcentaje = scrollTotal > 0 ? (window.scrollY / scrollTotal) * 100 : 0;
        this.elementos.progresoRelleno.style.width = `${Math.min(100, porcentaje)}%`;
    }

    /**
     * Aplica estilos iniciales
     * @private
     */
    _aplicarEstilosIniciales() {
        const config = this.controladorEstilos.obtenerConfiguracion();
        this._sincronizarControles();
        this._actualizarSelectorTemas(config.tema);
    }

    /**
     * Sincroniza los controles con la configuración actual
     * @private
     */
    _sincronizarControles() {
        const config = this.controladorEstilos.obtenerConfiguracion();
        const { controlTamano, controlFuente, controlAlturaLinea, controlAncho,
            valorTamano, valorAlturaLinea, valorAncho } = this.elementos;

        controlTamano.value = config.tamanoFuente;
        valorTamano.textContent = `${config.tamanoFuente}px`;

        controlFuente.value = config.familiaFuente;

        controlAlturaLinea.value = config.alturaLinea;
        valorAlturaLinea.textContent = config.alturaLinea.toFixed(1);

        controlAncho.value = config.anchoMaximo;
        valorAncho.textContent = `${config.anchoMaximo}px`;

        this._actualizarSelectorTemas(config.tema);
    }

    /**
     * Puebla el selector de fuentes
     * @private
     */
    _poblarSelectorFuentes() {
        const fuentes = this.controladorEstilos.obtenerFuentesDisponibles();
        const config = this.controladorEstilos.obtenerConfiguracion();

        this.elementos.controlFuente.innerHTML = fuentes.map(f => `
            <option value="${f.valor}" ${f.valor === config.familiaFuente ? 'selected' : ''}>
                ${f.nombre}
            </option>
        `).join('');
    }

    /**
     * Actualiza el selector de temas
     * @private
     */
    _actualizarSelectorTemas(temaActivo) {
        const opciones = this.elementos.selectorTemas.querySelectorAll('.tema-opcion');
        opciones.forEach(opcion => {
            opcion.classList.toggle('activo', opcion.dataset.tema === temaActivo);
        });
    }

    /**
     * Aplica CSS al documento
     * @private
     */
    _aplicarCss(css) {
        this.elementos.estilosLector.textContent = css;
    }

    /**
     * Alterna el panel lateral
     * @private
     */
    _togglePanel() {
        this.panelAbierto = !this.panelAbierto;
        this.elementos.panelLateral.classList.toggle('abierto', this.panelAbierto);
        this.elementos.overlay.classList.toggle('visible', this.panelAbierto);
    }

    /**
     * Cierra el panel lateral
     * @private
     */
    _cerrarPanel() {
        this.panelAbierto = false;
        this.elementos.panelLateral.classList.remove('abierto');
        this.elementos.overlay.classList.remove('visible');
    }

    /**
     * Muestra/oculta pantalla de carga
     * @private
     */
    _mostrarCarga(visible) {
        this.elementos.pantallaCarga.classList.toggle('visible', visible);
    }

    /**
     * Muestra un mensaje de error
     * @private
     */
    _mostrarError(mensaje) {
        const { mensajeError } = this.elementos;
        mensajeError.textContent = mensaje;
        mensajeError.classList.add('visible');

        setTimeout(() => {
            mensajeError.classList.remove('visible');
        }, 5000);
    }

    /**
     * Configura el evento del botón de exportar
     * @private
     */
    _configurarEventosExportar() {
        this.elementos.btnExportar.addEventListener('click', () => this._exportarConBionica());
    }

    /**
     * Exporta el libro actual con lectura biónica como EPUB
     * @private
     */
    async _exportarConBionica() {
        if (!this.controladorVisor || !this.controladorVisor.libroActual) return;

        this._mostrarCarga(true);

        try {
            const exportador = new ExportadorEpub();
            await exportador.exportar(this.controladorVisor.libroActual, this.controladorBionica);
        } catch (error) {
            this._mostrarError('Error al exportar: ' + error.message);
        } finally {
            this._mostrarCarga(false);
        }
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.aplicacionLector = new AplicacionLector();
});
