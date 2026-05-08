# Crypt Terminal v5.1 – Enhanced Edition

**Sistema de cifrado personalizado con estética hacker, secuencia de arranque simulada y funciones avanzadas.**

## 🚀 Características

- 🔐 **Cifrado simétrico personalizado** – Cada carácter tiene un valor fijo definido en el código (no editable por el usuario final).
- 📟 **Pantalla de acceso estilo terminal** con botón "INGRESAR AL SISTEMA SMS" y una secuencia de arranque de 80 líneas (simulación de carga de módulos, comprobaciones de seguridad, etc.).
- 🎨 **Diseño hacker** con efectos visuales: lluvia de caracteres Matrix (canvas), scanlines, glitch, ruido, parpadeo de pantalla.
- 🔊 **Sonidos retro** (opcional, desactivado por defecto) que acompañan las acciones (beeps al cifrar, descifrar, copiar, etc.).
- 📊 **Barra de progreso** animada durante las operaciones de cifrado/descifrado.
- 🕵️ **Detección automática** de texto cifrado en el área de entrada, con sugerencia visual.
- 📋 **Historial de operaciones** (últimas 10) con carga rápida de entradas anteriores.
- ⬇️ **Exportación** del resultado a un archivo `.txt`.
- ⌨️ **Atajos de teclado** para todas las funciones principales.
- 🔄 **Swap** rápido entre campos de entrada y salida.
- 📖 **Tabla de mapeo fija** visible (colapsable) que muestra los valores de cada carácter.
- 📱 **Totalmente responsive** (escritorio, tablet, móvil).

## 🧩 Estructura del proyecto

```
crypt-terminal/
├── index.html      # Estructura principal
├── styles.css      # Estilos visuales (tema hacker)
├── script.js       # Lógica de cifrado, boot, historial, sonido...
├── README.md       # Este documento
└── LICENSE         # Términos de uso
```

### Atajos de teclado

| Combinación | Acción |
|------------|--------|
| Ctrl + Enter | Cifrar |
| Ctrl + Shift + D | Descifrar |
| Ctrl + Shift + C | Copiar output |
| Ctrl + Shift + S | Intercambiar input/output |
| Ctrl + Shift + X | Limpiar todo |
| Ctrl + Shift + E | Exportar a .txt |

## 🔐 Mapeo de caracteres

Los valores de sustitución están definidos en la variable `FIXED_MAPPING` dentro de `script.js`.  
Cada letra, número o símbolo se reemplaza por el código asignado.  
La coma (`,`) se convierte en `=`, el punto (`.`) en `x`.  
Las palabras se separan con ` | ` y las letras de cada palabra con `;`.

## 📄 Licencia

Este proyecto se distribuye bajo una **licencia propietaria restrictiva**.  
Consulta el archivo `LICENSE` para más detalles.  
**No está permitido clonar, distribuir, modificar ni utilizar el código fuente sin autorización expresa del autor.**


© 2025 Crypt Terminal. Todos los derechos reservados.
