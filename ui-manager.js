/**
 * UI-MANAGER.JS - GESTOR DE INTERFAZ Y ESTADO
 * ===========================================
 * 
 * Manejo de interfaz y estado de la aplicación
 * Función de reset completo
 * Actualización automática de resistencia
 * Sistema de timestamps para detectar datos obsoletos
 */

// ===================================================================
// SISTEMA DE ESTADO GLOBAL
// ===================================================================

const appState = {
    calculos: {},
    parametros: {},
    timestamps: {},
    pestanaActiva: 'proyecto',
    datosObsoletos: false,
    ultimaValidacion: null
};

// ===================================================================
// GESTIÓN DE PESTAÑAS
// ===================================================================

/**
 * Cambia entre pestañas de la aplicación
 */
function switchTab(tabName) {
    try {
        // Ocultar todas las pestañas
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
            tab.style.display = 'none';
        });

        // Remover clase active de todos los botones de pestaña
        const allTabButtons = document.querySelectorAll('.tab');
        allTabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Mostrar la pestaña seleccionada
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Activar el botón de la pestaña
        const selectedButton = document.querySelector(`.tab[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }

        // Actualizar estado
        appState.pestanaActiva = tabName;

        // Actualizar indicadores de estado de pestañas
        actualizarIndicadoresPestanas();

        // Verificar si hay datos obsoletos al cambiar de pestaña
        verificarDatosObsoletos();

    } catch (error) {
        console.error('Error cambiando pestaña:', error);
        mostrarError('Error al cambiar de pestaña');
    }
}

/**
 * Actualiza los indicadores visuales de estado de las pestañas
 */
function actualizarIndicadoresPestanas() {
    try {
        const pestanas = ['proyecto', 'caida-tension', 'cortocircuito', 'resultados'];
        
        pestanas.forEach(pestana => {
            const botonPestana = document.querySelector(`.tab[data-tab="${pestana}"]`);
            if (!botonPestana) return;

            // Remover clases de estado previas
            botonPestana.classList.remove('status-obsoleto', 'status-actualizado', 'status-pendiente');

            // Determinar estado según datos y cálculos
            let estado = 'pendiente';
            
            if (appState.calculos[pestana] && appState.timestamps[pestana]) {
                const tiempoCalculo = appState.timestamps[pestana];
                const tiempoParametros = appState.timestamps.parametros || 0;
                
                if (tiempoCalculo >= tiempoParametros) {
                    estado = 'actualizado';
                } else {
                    estado = 'obsoleto';
                }
            }

            botonPestana.classList.add(`status-${estado}`);
        });

    } catch (error) {
        console.error('Error actualizando indicadores de pestañas:', error);
    }
}

// ===================================================================
// GESTIÓN DE FORMULARIOS Y CAMPOS
// ===================================================================

/**
 * Actualización automática de resistencia cuando cambia la sección o material
 * CORREGIDA: Función que faltaba en el código original
 */
function onSeccionChange() {
    try {
        const seccionElement = document.getElementById('secao-cabo');
        const materialElement = document.getElementById('material-condutor');
        const resistenciaElement = document.getElementById('resistencia-condutor');

        if (!seccionElement || !materialElement || !resistenciaElement) {
            return; // Elementos no encontrados, salir silenciosamente
        }

        const seccion = parseFloat(seccionElement.value);
        const material = materialElement.value;

        if (seccion && material) {
            try {
                const resistencia = obtenerResistencia(material, seccion);
                resistenciaElement.value = resistencia.toFixed(4);
                
                // Marcar que los parámetros han cambiado
                marcarParametrosCambiados('caida-tension');
                
            } catch (error) {
                console.warn('No se pudo obtener resistencia para:', material, seccion);
                resistenciaElement.value = '';
            }
        } else {
            resistenciaElement.value = '';
        }

    } catch (error) {
        console.error('Error en actualización de resistencia:', error);
    }
}

/**
 * Maneja cambios en los campos de entrada
 */
function onInputChange(elemento, pestana) {
    try {
        // Marcar que los parámetros han cambiado
        marcarParametrosCambiados(pestana);

        // Limpiar mensajes de error del campo específico
        limpiarErroresCampo(elemento);

        // Validación en tiempo real para campos críticos
        if (elemento.id === 'potencia' || elemento.id === 'tension' || elemento.id === 'factor-potencia') {
            validarCampoTiempoReal(elemento);
        }

    } catch (error) {
        console.error('Error manejando cambio de entrada:', error);
    }
}

/**
 * Valida un campo en tiempo real
 */
function validarCampoTiempoReal(elemento) {
    try {
        const valor = elemento.value;
        let esValido = true;
        let mensaje = '';

        switch (elemento.id) {
            case 'potencia':
                const potencia = parseFloat(valor);
                if (isNaN(potencia) || potencia <= 0) {
                    esValido = false;
                    mensaje = 'Potencia debe ser mayor que 0';
                } else if (potencia > 10000000) {
                    esValido = false;
                    mensaje = 'Potencia debe ser menor que 10MW';
                }
                break;

            case 'tension':
                const tension = parseFloat(valor);
                if (isNaN(tension) || tension <= 0) {
                    esValido = false;
                    mensaje = 'Tensión debe ser mayor que 0';
                }
                break;

            case 'factor-potencia':
                const fp = parseFloat(valor);
                if (isNaN(fp) || fp < 0.3 || fp > 1.0) {
                    esValido = false;
                    mensaje = 'Factor de potencia debe estar entre 0.3 y 1.0';
                }
                break;
        }

        // Mostrar/ocultar indicador de error
        mostrarErrorCampo(elemento, esValido ? null : mensaje);

    } catch (error) {
        console.error('Error en validación en tiempo real:', error);
    }
}

/**
 * Muestra error en un campo específico
 */
function mostrarErrorCampo(elemento, mensaje) {
    try {
        // Remover indicador de error previo
        limpiarErroresCampo(elemento);

        if (mensaje) {
            // Agregar clase de error
            elemento.classList.add('campo-error');

            // Crear indicador de error
            const indicadorError = document.createElement('div');
            indicadorError.className = 'error-campo';
            indicadorError.textContent = mensaje;
            indicadorError.id = `error-${elemento.id}`;

            // Insertar después del elemento
            elemento.parentNode.insertBefore(indicadorError, elemento.nextSibling);
        } else {
            // Remover clase de error
            elemento.classList.remove('campo-error');
        }

    } catch (error) {
        console.error('Error mostrando error de campo:', error);
    }
}

/**
 * Limpia errores de un campo específico
 */
function limpiarErroresCampo(elemento) {
    try {
        elemento.classList.remove('campo-error');
        const errorExistente = document.getElementById(`error-${elemento.id}`);
        if (errorExistente) {
            errorExistente.remove();
        }
    } catch (error) {
        console.error('Error limpiando errores de campo:', error);
    }
}

// ===================================================================
// SISTEMA DE RESET COMPLETO
// ===================================================================

/**
 * Resetea completamente la calculadora
 * IMPLEMENTADA: Función completa según especificaciones del prompt
 */
function resetearCalculadora() {
    try {
        // Confirmar acción con el usuario
        if (!confirm('¿Está seguro de que desea resetear completamente la calculadora? Se perderán todos los datos ingresados.')) {
            return;
        }

        // 1. Limpiar estado de la aplicación
        appState.calculos = {};
        appState.parametros = {};
        appState.timestamps = {};
        appState.datosObsoletos = false;
        appState.ultimaValidacion = null;

        // 2. Limpiar todos los formularios
        const formularios = document.querySelectorAll('form');
        formularios.forEach(form => {
            form.reset();
        });

        // 3. Limpiar campos individuales que no estén en formularios
        const campos = document.querySelectorAll('input, select, textarea');
        campos.forEach(campo => {
            if (campo.type === 'checkbox' || campo.type === 'radio') {
                campo.checked = false;
            } else {
                campo.value = '';
            }
            
            // Limpiar errores de campo
            limpiarErroresCampo(campo);
        });

        // 4. Limpiar todos los resultados
        const elementosResultado = document.querySelectorAll('.result-value, .resultado-valor, .valor-calculado');
        elementosResultado.forEach(elemento => {
            elemento.textContent = '--';
            elemento.innerHTML = '--';
        });

        // 5. Limpiar tablas de resultados
        const tablasResultados = document.querySelectorAll('.tabla-resultados tbody');
        tablasResultados.forEach(tbody => {
            tbody.innerHTML = '';
        });

        // 6. Limpiar mensajes de error y advertencia
        limpiarMensajes();

        // 7. Resetear valores por defecto
        establecerValoresPorDefecto();

        // 8. Regresar a la primera pestaña
        switchTab('proyecto');

        // 9. Actualizar indicadores de pestañas
        actualizarIndicadoresPestanas();

        // 10. Mostrar mensaje de confirmación
        mostrarMensaje('Calculadora reseteada correctamente', 'exito');

        console.log('Calculadora reseteada completamente');

    } catch (error) {
        console.error('Error reseteando calculadora:', error);
        mostrarError('Error al resetear la calculadora');
    }
}

/**
 * Establece valores por defecto en campos específicos
 */
function establecerValoresPorDefecto() {
    try {
        // Valores por defecto según especificaciones
        const valoresPorDefecto = {
            'factor-potencia': '0.8',
            'tipo-sistema': 'trifasico',
            'material-isolamento': 'PVC',
            'metodo-instalacao': 'B1',
            'temperatura-ambiente': '40',
            'numero-circuitos': '1',
            'rendimiento': '1.0',
            'material-condutor': 'cobre'
        };

        Object.entries(valoresPorDefecto).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.value = valor;
            }
        });

    } catch (error) {
        console.error('Error estableciendo valores por defecto:', error);
    }
}

// ===================================================================
// GESTIÓN DE MENSAJES Y NOTIFICACIONES
// ===================================================================

/**
 * Muestra un mensaje al usuario
 */
function mostrarMensaje(mensaje, tipo = 'info', duracion = 5000) {
    try {
        // Crear elemento de mensaje
        const elementoMensaje = document.createElement('div');
        elementoMensaje.className = `mensaje mensaje-${tipo}`;
        elementoMensaje.innerHTML = `
            <span class="mensaje-texto">${mensaje}</span>
            <button class="mensaje-cerrar" onclick="this.parentElement.remove()">×</button>
        `;

        // Agregar al contenedor de mensajes
        let contenedorMensajes = document.getElementById('contenedor-mensajes');
        if (!contenedorMensajes) {
            contenedorMensajes = document.createElement('div');
            contenedorMensajes.id = 'contenedor-mensajes';
            contenedorMensajes.className = 'contenedor-mensajes';
            document.body.appendChild(contenedorMensajes);
        }

        contenedorMensajes.appendChild(elementoMensaje);

        // Auto-remover después de la duración especificada
        if (duracion > 0) {
            setTimeout(() => {
                if (elementoMensaje.parentNode) {
                    elementoMensaje.remove();
                }
            }, duracion);
        }

    } catch (error) {
        console.error('Error mostrando mensaje:', error);
        // Fallback a alert si falla el sistema de mensajes
        alert(mensaje);
    }
}

/**
 * Muestra un error al usuario
 */
function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'error', 8000);
}

/**
 * Muestra una advertencia al usuario
 */
function mostrarAdvertencia(mensaje) {
    mostrarMensaje(mensaje, 'advertencia', 6000);
}

/**
 * Muestra un mensaje de éxito al usuario
 */
function mostrarExito(mensaje) {
    mostrarMensaje(mensaje, 'exito', 4000);
}

/**
 * Limpia todos los mensajes
 */
function limpiarMensajes() {
    try {
        const contenedorMensajes = document.getElementById('contenedor-mensajes');
        if (contenedorMensajes) {
            contenedorMensajes.innerHTML = '';
        }

        // Limpiar también errores de campos
        const erroresCampo = document.querySelectorAll('.error-campo');
        erroresCampo.forEach(error => error.remove());

        const camposError = document.querySelectorAll('.campo-error');
        camposError.forEach(campo => campo.classList.remove('campo-error'));

    } catch (error) {
        console.error('Error limpiando mensajes:', error);
    }
}

// ===================================================================
// SISTEMA DE TIMESTAMPS Y OBSOLESCENCIA
// ===================================================================

/**
 * Marca que los parámetros han cambiado
 */
function marcarParametrosCambiados(pestana) {
    try {
        appState.timestamps.parametros = Date.now();
        appState.datosObsoletos = true;

        // Marcar pestañas específicas como obsoletas
        if (pestana) {
            delete appState.timestamps[pestana];
        }

        // Actualizar indicadores visuales
        actualizarIndicadoresPestanas();

    } catch (error) {
        console.error('Error marcando parámetros cambiados:', error);
    }
}

/**
 * Verifica si hay datos obsoletos
 */
function verificarDatosObsoletos() {
    try {
        const tiempoParametros = appState.timestamps.parametros || 0;
        let hayObsoletos = false;

        // Verificar cada pestaña con cálculos
        Object.keys(appState.calculos).forEach(pestana => {
            const tiempoCalculo = appState.timestamps[pestana] || 0;
            if (tiempoCalculo < tiempoParametros) {
                hayObsoletos = true;
            }
        });

        appState.datosObsoletos = hayObsoletos;

        // Mostrar advertencia si hay datos obsoletos
        if (hayObsoletos) {
            mostrarAdvertencia('Algunos cálculos pueden estar desactualizados. Recalcule para obtener resultados actuales.');
        }

        return hayObsoletos;

    } catch (error) {
        console.error('Error verificando datos obsoletos:', error);
        return false;
    }
}

/**
 * Marca un cálculo como actualizado
 */
function marcarCalculoActualizado(pestana) {
    try {
        appState.timestamps[pestana] = Date.now();
        actualizarIndicadoresPestanas();
    } catch (error) {
        console.error('Error marcando cálculo actualizado:', error);
    }
}

// ===================================================================
// FUNCIONES DE UTILIDAD DE UI
// ===================================================================

/**
 * Actualiza un elemento de resultado en la interfaz
 */
function actualizarElementoResultado(id, valor, unidad = '') {
    try {
        const elemento = document.getElementById(id);
        if (elemento) {
            const valorFormateado = typeof valor === 'number' ? valor.toFixed(2) : valor;
            elemento.textContent = `${valorFormateado} ${unidad}`.trim();
        }
    } catch (error) {
        console.error(`Error actualizando elemento ${id}:`, error);
    }
}

/**
 * Habilita o deshabilita un grupo de elementos
 */
function toggleElementos(selector, habilitar) {
    try {
        const elementos = document.querySelectorAll(selector);
        elementos.forEach(elemento => {
            elemento.disabled = !habilitar;
            if (habilitar) {
                elemento.classList.remove('deshabilitado');
            } else {
                elemento.classList.add('deshabilitado');
            }
        });
    } catch (error) {
        console.error('Error habilitando/deshabilitando elementos:', error);
    }
}

/**
 * Muestra/oculta un elemento con animación
 */
function toggleElemento(id, mostrar) {
    try {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (mostrar) {
                elemento.style.display = 'block';
                elemento.classList.add('fade-in');
            } else {
                elemento.classList.add('fade-out');
                setTimeout(() => {
                    elemento.style.display = 'none';
                    elemento.classList.remove('fade-out');
                }, 300);
            }
        }
    } catch (error) {
        console.error(`Error mostrando/ocultando elemento ${id}:`, error);
    }
}

/**
 * Obtiene todos los datos de los formularios
 */
function obtenerDatosFormularios() {
    try {
        const datos = {
            proyecto: {},
            caidaTension: {},
            cortocircuito: {}
        };

        // Obtener datos de proyecto
        const camposProyecto = [
            'potencia', 'tension', 'factor-potencia', 'tipo-sistema',
            'material-isolamento', 'metodo-instalacao', 'temperatura-ambiente',
            'numero-circuitos', 'rendimiento'
        ];

        camposProyecto.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                datos.proyecto[campo.replace('-', '_')] = elemento.value;
            }
        });

        // Obtener datos de caída de tensión
        const camposCaida = [
            // IDs existentes en el formulario de Caída de Tensión
            'longitud-cabo',
            'material-condutor',
            'secao-cabo'
        ];

        camposCaida.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                datos.caidaTension[campo.replace('-', '_')] = elemento.value;
            }
        });

        // Obtener datos de cortocircuito
        const camposCorto = [
            'corriente-cortocircuito',
            'tempo-atuacao',
            // Usamos los mismos campos de sección y material que en el resto de formularios
            'material-condutor',
            'secao-cabo'
        ];

        camposCorto.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                datos.cortocircuito[campo.replace('-', '_')] = elemento.value;
            }
        });

        return datos;

    } catch (error) {
        console.error('Error obteniendo datos de formularios:', error);
        return null;
    }
}

// ===================================================================
// MANEJO DE BOTONES DE CÁLCULO
// ===================================================================

function handleCalcularProyecto() {
    try {
        limpiarMensajes();

        const potencia = parseFloat(document.getElementById('potencia').value);
        const unidadPotencia = document.getElementById('unidad-potencia').value;
        const potenciaW = convertirPotencia(potencia, unidadPotencia, 'W');
        const tension = parseFloat(document.getElementById('tension').value);
        const factorPotencia = parseFloat(document.getElementById('factor-potencia').value);
        const tipoSistema = document.getElementById('tipo-sistema').value;
        const rendimiento = parseFloat(document.getElementById('rendimiento').value);
        const material = document.getElementById('material-isolamento').value;
        const metodo = document.getElementById('metodo-instalacao').value;
        const temperatura = parseFloat(document.getElementById('temperatura-ambiente').value);
        const numeroCircuitos = parseInt(document.getElementById('numero-circuitos').value);

        const validacion = validarParametrosBasicos({
            potencia: potenciaW,
            tension,
            factorPotencia,
            tipoSistema,
            material,
            metodo,
            temperatura,
            numeroCircuitos,
            rendimiento
        });

        if (!validacion.valido) {
            mostrarError(formatearErrores(validacion.errores, validacion.advertencias));
            return;
        }

        const corrienteProyecto = calcularCorrenteProyeto({
            potencia: potenciaW,
            tension,
            factorPotencia,
            tipoSistema,
            rendimiento
        });

        const factorTemp = calcularFatorTemperatura({
            material,
            temperatura,
            metodo
        });

        const factorAgr = calcularFatorAgrupamento(metodo, numeroCircuitos);

        const corrienteCorrigida = calcularCorrenteCorregida({
            corrienteProyeto: corrienteProyecto,
            factorTemperatura: factorTemp,
            factorAgrupamento: factorAgr
        });

        const seccionMinima = seleccionarSeccionMinima({
            corrienteCorregida: corrienteCorrigida,
            material,
            metodo
        });

        actualizarElementoResultado('resultado-corriente-projeto', corrienteProyecto, 'A');
        actualizarElementoResultado('resultado-factor-temperatura', factorTemp);
        actualizarElementoResultado('resultado-factor-agrupamento', factorAgr);
        actualizarElementoResultado('resultado-corriente-corregida', corrienteCorrigida, 'A');
        actualizarElementoResultado('resultado-seccion-minima', seccionMinima.seccion, 'mm²');
        actualizarElementoResultado('resultado-ampacidad', seccionMinima.ampacidad, 'A');

        appState.calculos['proyecto'] = {
            corrienteProyecto,
            factorTemp,
            factorAgr,
            corrienteCorrigida,
            seccionMinima
        };

        marcarCalculoActualizado('proyecto');
        mostrarExito('Proyecto calculado');
    } catch (error) {
        mostrarError(error.message);
    }
}

function handleCalcularCaida() {
    try {
        limpiarMensajes();

        const corriente = parseFloat(document.getElementById('corriente-caida').value);
        const longitud = parseFloat(document.getElementById('longitud-cabo').value);
        const seccion = parseFloat(document.getElementById('secao-cabo').value);
        const materialCondutor = document.getElementById('material-condutor').value;
        const tension = parseFloat(document.getElementById('tension').value);
        const factorPotencia = parseFloat(document.getElementById('factor-potencia').value);
        const tipoSistema = document.getElementById('tipo-sistema').value;

        const resultados = verificarCaidaTension({
            corriente,
            longitud,
            seccion,
            tension,
            materialCondutor,
            factorPotencia,
            tipoSistema
        });

        actualizarElementoResultado('resultado-caida-tension', resultados.caidaTension, 'V');
        actualizarElementoResultado('resultado-porcentaje-caida', resultados.porcentajeCaida, '%');
        actualizarElementoResultado('resultado-limite-caida', resultados.limite, '%');
        actualizarElementoResultado('resultado-cumple-caida', resultados.cumpleCriterio ? 'Sí' : 'No');

        appState.calculos['caida-tension'] = resultados;
        marcarCalculoActualizado('caida-tension');
        mostrarExito('Cálculo de caída realizado');
    } catch (error) {
        mostrarError(error.message);
    }
}

function handleCalcularCortocircuito() {
    try {
        limpiarMensajes();

        const corrienteCortocircuito = parseFloat(document.getElementById('corriente-cortocircuito').value);
        const tiempoAtuacao = parseFloat(document.getElementById('tempo-atuacao').value);
        const seccion = parseFloat(document.getElementById('secao-cabo').value);
        const materialCondutor = document.getElementById('material-condutor').value;

        const resultados = verificarCortocircuito({
            corrienteCortocircuito,
            seccion,
            tiempoAtuacao,
            materialCondutor
        });

        actualizarElementoResultado('resultado-seccion-minima-cc', resultados.seccionMinima, 'mm²');
        actualizarElementoResultado('resultado-seccion-escolhida-cc', resultados.seccionEscolhida, 'mm²');
        actualizarElementoResultado('resultado-cumple-cc', resultados.cumpleCriterio ? 'Sí' : 'No');

        appState.calculos['cortocircuito'] = resultados;
        marcarCalculoActualizado('cortocircuito');
        mostrarExito('Cálculo de cortocircuito realizado');
    } catch (error) {
        mostrarError(error.message);
    }
}

function handleDimensionarCompleto() {
    try {
        limpiarMensajes();

        const potencia = parseFloat(document.getElementById('potencia').value);
        const unidadPotencia = document.getElementById('unidad-potencia').value;
        const potenciaW = convertirPotencia(potencia, unidadPotencia, 'W');
        const tension = parseFloat(document.getElementById('tension').value);
        const factorPotencia = parseFloat(document.getElementById('factor-potencia').value);
        const tipoSistema = document.getElementById('tipo-sistema').value;
        const rendimiento = parseFloat(document.getElementById('rendimiento').value);
        const material = document.getElementById('material-isolamento').value;
        const metodo = document.getElementById('metodo-instalacao').value;
        const temperatura = parseFloat(document.getElementById('temperatura-ambiente').value);
        const numeroCircuitos = parseInt(document.getElementById('numero-circuitos').value);
        const longitud = parseFloat(document.getElementById('longitud-cabo').value);
        const materialCondutor = document.getElementById('material-condutor').value;
        const corrienteCortocircuito = parseFloat(document.getElementById('corriente-cortocircuito').value);
        const tiempoAtuacao = parseFloat(document.getElementById('tempo-atuacao').value);

        const resultados = dimensionarCondutor({
            potencia: potenciaW,
            tension,
            factorPotencia,
            tipoSistema,
            rendimiento,
            material,
            metodo,
            temperatura,
            numeroCircuitos,
            longitud,
            materialCondutor,
            corrienteCortocircuito,
            tiempoAtuacao
        });

        let html = `
            <p><strong>Corriente de Proyecto:</strong> ${resultados.corrienteProyeto} A</p>
            <p><strong>Corriente Corregida:</strong> ${resultados.corrienteCorregida} A</p>
            <p><strong>Sección Mínima:</strong> ${resultados.seccionMinima.seccion} mm²</p>
            <p><strong>Ampacidad:</strong> ${resultados.seccionMinima.ampacidad} A</p>
        `;

        if (resultados.caidaTension) {
            html += `<p><strong>Caída de Tensión:</strong> ${resultados.caidaTension.caidaTension} V (${resultados.caidaTension.porcentajeCaida}% - límite ${resultados.caidaTension.limite}%)</p>`;
        }

        if (resultados.cortocircuito) {
            html += `<p><strong>Cortocircuito:</strong> Sección mínima ${resultados.cortocircuito.seccionMinima} mm² - ${resultados.cortocircuito.cumpleCriterio ? 'Cumple' : 'No cumple'}</p>`;
        }

        const contResumen = document.getElementById('contenido-resumen');
        if (contResumen) {
            contResumen.innerHTML = html;
        }

        const resumenFinal = document.getElementById('resumen-final');
        if (resumenFinal) {
            resumenFinal.classList.remove('hidden');
        }

        appState.calculos['resultados'] = resultados;
        marcarCalculoActualizado('resultados');
        mostrarExito('Dimensionamiento completo realizado');
        switchTab('resultados');
    } catch (error) {
        mostrarError(error.message);
    }
}


// ===================================================================
// EXPORTAR FUNCIONES Y VARIABLES GLOBALES
// ===================================================================

// Hacer las funciones y variables disponibles globalmente
window.appState = appState;
window.switchTab = switchTab;
window.actualizarIndicadoresPestanas = actualizarIndicadoresPestanas;
window.onSeccionChange = onSeccionChange;
window.onInputChange = onInputChange;
window.validarCampoTiempoReal = validarCampoTiempoReal;
window.mostrarErrorCampo = mostrarErrorCampo;
window.limpiarErroresCampo = limpiarErroresCampo;
window.resetearCalculadora = resetearCalculadora;
window.establecerValoresPorDefecto = establecerValoresPorDefecto;
window.mostrarMensaje = mostrarMensaje;
window.mostrarError = mostrarError;
window.mostrarAdvertencia = mostrarAdvertencia;
window.mostrarExito = mostrarExito;
window.limpiarMensajes = limpiarMensajes;
window.marcarParametrosCambiados = marcarParametrosCambiados;
window.verificarDatosObsoletos = verificarDatosObsoletos;
window.marcarCalculoActualizado = marcarCalculoActualizado;
window.actualizarElementoResultado = actualizarElementoResultado;
window.toggleElementos = toggleElementos;
window.toggleElemento = toggleElemento;
window.obtenerDatosFormularios = obtenerDatosFormularios;

// Inicializar manejadores de pestañas al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tabs-container .tab');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    const btnProyecto = document.getElementById('btn-calcular-projeto');
    if (btnProyecto) {
        btnProyecto.addEventListener('click', handleCalcularProyecto);
    }

    const btnCaida = document.getElementById('btn-calcular-caida');
    if (btnCaida) {
        btnCaida.addEventListener('click', handleCalcularCaida);
    }

    const btnCorto = document.getElementById('btn-calcular-cortocircuito');
    if (btnCorto) {
        btnCorto.addEventListener('click', handleCalcularCortocircuito);
    }

    const btnCompleto = document.getElementById('btn-dimensionar-completo');
    if (btnCompleto) {
        btnCompleto.addEventListener('click', handleDimensionarCompleto);
    }

    // Mostrar la pestaña inicial
    switchTab(appState.pestanaActiva);
});

