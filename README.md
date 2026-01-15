# Lector EPUB/MOBI

Lector de libros digitales en JavaScript puro para navegador. Compatible con servidores Apache.

## Formatos Soportados

- EPUB
- MOBI
- AZW / AZW3

## Uso

1. Abre `index.html` en tu navegador o despliégalo en Apache
2. Arrastra un archivo o haz clic en "Abrir archivo"
3. Lee con scroll continuo

## Funcionalidades

- Lectura con scroll vertical continuo
- Índice de capítulos navegable
- Barra de progreso de lectura
- Guardado automático de progreso
- Personalización de tipografía (tamaño, fuente, altura de línea)
- Temas: Claro, Sepia, Oscuro, Noche

---

## Lectura Biónica

Técnica que resalta partes de las palabras para mejorar la velocidad y comprensión lectora.

### Modos Disponibles

| Modo | Ejemplo | Descripción |
|------|---------|-------------|
| Inicio | **lec**tura | Resalta el inicio de cada palabra |
| Inicio + Medio | **lec**tu**r**a | Resalta inicio y parte media |
| Consonantes | **l**e**ct**u**r**a | Resalta las consonantes |
| Vocales | l**e**ct**u**r**a** | Resalta las vocales |
| Sílabas | **lec**tura | Resalta la primera sílaba |

### Intensidad

- **Suave (30%)** - Resaltado mínimo
- **Media (50%)** - Balance estándar
- **Fuerte (70%)** - Resaltado máximo

### Color del Resaltado

Colores predefinidos: Negro (heredar), Rojo, Azul, Verde, Morado, Naranja

También puedes elegir un color personalizado.

### Cómo Activar

1. Abre un libro
2. Clic en el icono de configuración (engranaje)
3. En "Lectura Biónica", selecciona un modo
4. Ajusta intensidad y color según preferencia

---

## Requisitos

- Navegador moderno con soporte ES6 Modules
- Conexión a internet (para cargar JSZip desde CDN)

## Estructura

```
open-epub/
├── index.html
├── css/
│   └── estilos.css
└── js/
    ├── aplicacion.js
    ├── analizadores/
    ├── controladores/
    └── servicios/
```

## Licencia

MIT
