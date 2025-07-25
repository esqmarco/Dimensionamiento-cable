/**
 * VALIDATIONS.JS - SISTEMA DE VALIDACIÓN ROBUSTO
 * ===============================================
 * 
 * Sistema completo de validación de entradas
 * Validación cruzada entre pestañas
 * Manejo robusto de errores
 */

// ===================================================================
// VALIDACIONES BÁSICAS DE PARÁMETROS
// ===================================================================

/**
 * Valida los parámetros básicos del proyecto
 */
function validarParametrosBasicos(params) {
    const errores = [];
    const advertencias = [];

    try {
        // Validar potencia
        if (!params.potencia || isNaN(params.potencia)) {
            errores.push('Potencia es requerida y debe ser numérica');
        } else {
            const potencia = parseFloat(params.potencia);
            if (potencia <= 0) {
                errores.push('Potencia debe ser mayor que 0');
            } else if (potencia > 10000000) { // 10 MW
                errores.push('Potencia debe ser menor que 10MW');
            } else if (potencia < 1) {
                advertencias.push('Potencia muy baja, verificar unidades');
            }
        }

        // Validar tensión
        if (!params.tension || isNaN(params.tension)) {
            errores.push('Tensión es requerida y debe ser numérica');
        } else {
            const tension = parseFloat(params.tension);
            const tensionesValidas = tabelasNBR.tensionesNominales;
            if (!tensionesValidas.includes(tension)) {
                advertencias.push(`Tensión ${tension}V no es estándar. Valores recomendados: ${tensionesValidas.join(', ')}`);
            }
        }

        // Validar factor de potencia
        if (!params.factorPotencia || isNaN(params.factorPotencia)) {
            errores.push('Factor de potencia es requerido y debe ser numérico');
        } else {
            const fp = parseFloat(params.factorPotencia);
            if (fp < 0.3 || fp > 1.0) {
                errores.push('Factor de potencia debe estar entre 0.3 y 1.0');
            } else if (fp < 0.7) {
                advertencias.push('Factor de potencia bajo, considerar corrección');
            }
        }

        // Validar tipo de sistema
        const tiposValidos = ['monofasico', 'bifasico', 'trifasico'];
        if (!params.tipoSistema || !tiposValidos.includes(params.tipoSistema)) {
            errores.push(`Tipo de sistema debe ser uno de: ${tiposValidos.join(', ')}`);
        }

        // Validar material del aislamiento
        const materialesValidos = Object.keys(tabelasNBR.ampacidades);
        if (!params.material || !materialesValidos.includes(params.material)) {
            errores.push(`Material debe ser uno de: ${materialesValidos.join(', ')}`);
        }

        // Validar método de instalación
        const metodosValidos = Object.keys(metodosInstalacion);
        if (!params.metodo || !metodosValidos.includes(params.metodo)) {
            errores.push(`Método debe ser uno de: ${metodosValidos.join(', ')}`);
        }

        // Validar temperatura ambiente
        if (params.temperatura !== undefined && params.temperatura !== '') {
            const temp = parseFloat(params.temperatura);
            if (isNaN(temp)) {
                errores.push('Temperatura debe ser numérica');
            } else if (temp < -10 || temp > 80) {
                errores.push('Temperatura debe estar entre -10°C y 80°C');
            } else if (temp > 60) {
                advertencias.push('Temperatura muy alta, verificar condiciones de instalación');
            }
        }

        // Validar número de circuitos agrupados
        if (params.numeroCircuitos !== undefined && params.numeroCircuitos !== '') {
            const circuitos = parseInt(params.numeroCircuitos);
            if (isNaN(circuitos)) {
                errores.push('Número de circuitos debe ser numérico entero');
            } else if (circuitos < 1 || circuitos > 50) {
                errores.push('Número de circuitos debe estar entre 1 y 50');
            } else if (circuitos > 20) {
                advertencias.push('Muchos circuitos agrupados, considerar separar');
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores,
            advertencias: advertencias
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error en validación básica: ${error.message}`],
            advertencias: []
        };
    }
}

/**
 * Valida los parámetros de caída de tensión
 */
function validarParametrosCaidaTension(params) {
    const errores = [];
    const advertencias = [];

    try {
        // Validar longitud del circuito
        if (!params.longitud || isNaN(params.longitud)) {
            errores.push('Longitud del circuito es requerida y debe ser numérica');
        } else {
            const longitud = parseFloat(params.longitud);
            if (longitud <= 0) {
                errores.push('Longitud debe ser mayor que 0');
            } else if (longitud > 10000) { // 10 km
                errores.push('Longitud debe ser menor que 10 km');
            } else if (longitud > 1000) {
                advertencias.push('Longitud muy grande, verificar factibilidad');
            }
        }

        // Validar material del conductor
        const materialesValidos = ['cobre', 'aluminio'];
        if (!params.materialCondutor || !materialesValidos.includes(params.materialCondutor.toLowerCase())) {
            errores.push(`Material del conductor debe ser: ${materialesValidos.join(' o ')}`);
        }

        // Validar sección del conductor
        if (params.secaoCabo !== undefined && params.secaoCabo !== '') {
            const seccion = parseFloat(params.secaoCabo);
            if (isNaN(seccion)) {
                errores.push('Sección del conductor debe ser numérica');
            } else if (!tabelasNBR.seccionesNominales.includes(seccion)) {
                errores.push(`Sección debe ser una de las nominales: ${tabelasNBR.seccionesNominales.join(', ')}`);
            }
        }

        // Validar resistencia del conductor
        if (params.resistenciaCondutor !== undefined && params.resistenciaCondutor !== '') {
            const resistencia = parseFloat(params.resistenciaCondutor);
            if (isNaN(resistencia)) {
                errores.push('Resistencia del conductor debe ser numérica');
            } else if (resistencia < 0) {
                errores.push('Resistencia no puede ser negativa');
            } else if (resistencia > 100) {
                advertencias.push('Resistencia muy alta, verificar datos');
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores,
            advertencias: advertencias
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error en validación de caída de tensión: ${error.message}`],
            advertencias: []
        };
    }
}

/**
 * Valida los parámetros de cortocircuito
 */
function validarParametrosCortocircuito(params) {
    const errores = [];
    const advertencias = [];

    try {
        // Validar corriente de cortocircuito
        if (params.corrienteCortocircuito !== undefined && params.corrienteCortocircuito !== '') {
            const icc = parseFloat(params.corrienteCortocircuito);
            if (isNaN(icc)) {
                errores.push('Corriente de cortocircuito debe ser numérica');
            } else if (icc <= 0) {
                errores.push('Corriente de cortocircuito debe ser mayor que 0');
            } else if (icc > 100000) { // 100 kA
                errores.push('Corriente de cortocircuito debe ser menor que 100 kA');
            } else if (icc < 100) {
                advertencias.push('Corriente de cortocircuito muy baja, verificar cálculo');
            }
        }

        // Validar tiempo de actuación
        if (params.tempoAtuacao !== undefined && params.tempoAtuacao !== '') {
            const tempo = parseFloat(params.tempoAtuacao);
            if (isNaN(tempo)) {
                errores.push('Tiempo de actuación debe ser numérico');
            } else if (tempo <= 0) {
                errores.push('Tiempo de actuación debe ser mayor que 0');
            } else if (tempo > 10) {
                errores.push('Tiempo de actuación debe ser menor que 10 segundos');
            } else if (tempo > 5) {
                advertencias.push('Tiempo de actuación muy alto, verificar protección');
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores,
            advertencias: advertencias
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error en validación de cortocircuito: ${error.message}`],
            advertencias: []
        };
    }
}

// ===================================================================
// VALIDACIÓN CRUZADA ENTRE PESTAÑAS
// ===================================================================

/**
 * Valida la consistencia de datos entre todas las pestañas
 */
function validarConsistenciaGlobal(datosCompletos) {
    const errores = [];
    const advertencias = [];

    try {
        const { proyecto, caidaTension, cortocircuito } = datosCompletos;

        // Verificar que los datos básicos estén presentes
        if (!proyecto) {
            errores.push('Datos de proyecto son requeridos');
            return { valido: false, errores, advertencias };
        }

        // Validar consistencia de tensión entre pestañas
        if (caidaTension && caidaTension.tension && 
            parseFloat(caidaTension.tension) !== parseFloat(proyecto.tension)) {
            errores.push('Tensión inconsistente entre pestaña Proyecto y Caída de Tensión');
        }

        if (cortocircuito && cortocircuito.tension && 
            parseFloat(cortocircuito.tension) !== parseFloat(proyecto.tension)) {
            errores.push('Tensión inconsistente entre pestaña Proyecto y Cortocircuito');
        }

        // Validar consistencia de material conductor
        if (caidaTension && caidaTension.materialCondutor && cortocircuito && cortocircuito.materialCondutor) {
            if (caidaTension.materialCondutor !== cortocircuito.materialCondutor) {
                advertencias.push('Material del conductor diferente entre pestañas de verificación');
            }
        }

        // Validar consistencia de sección
        if (caidaTension && caidaTension.secaoCabo && cortocircuito && cortocircuito.secaoCabo) {
            if (parseFloat(caidaTension.secaoCabo) !== parseFloat(cortocircuito.secaoCabo)) {
                advertencias.push('Sección del conductor diferente entre pestañas de verificación');
            }
        }

        // Verificar compatibilidad material-método
        if (proyecto.material && proyecto.metodo) {
            const ampacidadesDisponibles = tabelasNBR.ampacidades[proyecto.material];
            if (ampacidadesDisponibles && !ampacidadesDisponibles[proyecto.metodo]) {
                errores.push(`Método ${proyecto.metodo} no disponible para material ${proyecto.material}`);
            }
        }

        // Verificar límites de temperatura según material
        if (proyecto.material && proyecto.temperatura !== undefined && proyecto.temperatura !== '') {
            const temp = parseFloat(proyecto.temperatura);
            const limitesMaterial = {
                'PVC': 70,
                'EPR_90': 90,
                'EPR_105': 105,
                'HEPR': 90
            };
            
            const limite = limitesMaterial[proyecto.material];
            if (limite && temp > limite) {
                errores.push(`Temperatura ${temp}°C excede límite de ${limite}°C para material ${proyecto.material}`);
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores,
            advertencias: advertencias
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error en validación cruzada: ${error.message}`],
            advertencias: []
        };
    }
}

// ===================================================================
// VALIDACIONES ESPECÍFICAS DE CAMPOS
// ===================================================================

/**
 * Valida un campo numérico con rango específico
 */
function validarCampoNumerico(valor, nombre, opciones = {}) {
    const errores = [];
    const advertencias = [];

    try {
        const { min, max, entero = false, requerido = true, advertenciaMin, advertenciaMax } = opciones;

        // Verificar si es requerido
        if (requerido && (valor === undefined || valor === null || valor === '')) {
            errores.push(`${nombre} es requerido`);
            return { valido: false, errores, advertencias };
        }

        // Si no es requerido y está vacío, es válido
        if (!requerido && (valor === undefined || valor === null || valor === '')) {
            return { valido: true, errores, advertencias };
        }

        // Convertir a número
        const numero = entero ? parseInt(valor) : parseFloat(valor);
        
        if (isNaN(numero)) {
            errores.push(`${nombre} debe ser ${entero ? 'un número entero' : 'numérico'}`);
            return { valido: false, errores, advertencias };
        }

        // Verificar rango
        if (min !== undefined && numero < min) {
            errores.push(`${nombre} debe ser mayor o igual a ${min}`);
        }

        if (max !== undefined && numero > max) {
            errores.push(`${nombre} debe ser menor o igual a ${max}`);
        }

        // Advertencias de rango
        if (advertenciaMin !== undefined && numero < advertenciaMin) {
            advertencias.push(`${nombre} es muy bajo (${numero}), valor recomendado mínimo: ${advertenciaMin}`);
        }

        if (advertenciaMax !== undefined && numero > advertenciaMax) {
            advertencias.push(`${nombre} es muy alto (${numero}), valor recomendado máximo: ${advertenciaMax}`);
        }

        return {
            valido: errores.length === 0,
            errores: errores,
            advertencias: advertencias,
            valor: numero
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error validando ${nombre}: ${error.message}`],
            advertencias: []
        };
    }
}

/**
 * Valida un campo de selección con opciones predefinidas
 */
function validarCampoSeleccion(valor, nombre, opcionesValidas, requerido = true) {
    const errores = [];
    const advertencias = [];

    try {
        // Verificar si es requerido
        if (requerido && (valor === undefined || valor === null || valor === '')) {
            errores.push(`${nombre} es requerido`);
            return { valido: false, errores, advertencias };
        }

        // Si no es requerido y está vacío, es válido
        if (!requerido && (valor === undefined || valor === null || valor === '')) {
            return { valido: true, errores, advertencias };
        }

        // Verificar que esté en las opciones válidas
        if (!opcionesValidas.includes(valor)) {
            errores.push(`${nombre} debe ser uno de: ${opcionesValidas.join(', ')}`);
        }

        return {
            valido: errores.length === 0,
            errores: errores,
            advertencias: advertencias
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error validando ${nombre}: ${error.message}`],
            advertencias: []
        };
    }
}

// ===================================================================
// FUNCIONES DE VALIDACIÓN COMPLETA
// ===================================================================

/**
 * Valida todos los datos de entrada de la calculadora
 */
function validarDatosCompletos(datos) {
    const resultados = {
        valido: true,
        errores: [],
        advertencias: [],
        detalles: {}
    };

    try {
        // Validar parámetros básicos
        if (datos.proyecto) {
            const validacionBasica = validarParametrosBasicos(datos.proyecto);
            resultados.detalles.proyecto = validacionBasica;
            
            if (!validacionBasica.valido) {
                resultados.valido = false;
                resultados.errores.push(...validacionBasica.errores);
            }
            resultados.advertencias.push(...validacionBasica.advertencias);
        }

        // Validar caída de tensión
        if (datos.caidaTension) {
            const validacionCaida = validarParametrosCaidaTension(datos.caidaTension);
            resultados.detalles.caidaTension = validacionCaida;
            
            if (!validacionCaida.valido) {
                resultados.valido = false;
                resultados.errores.push(...validacionCaida.errores);
            }
            resultados.advertencias.push(...validacionCaida.advertencias);
        }

        // Validar cortocircuito
        if (datos.cortocircuito) {
            const validacionCorto = validarParametrosCortocircuito(datos.cortocircuito);
            resultados.detalles.cortocircuito = validacionCorto;
            
            if (!validacionCorto.valido) {
                resultados.valido = false;
                resultados.errores.push(...validacionCorto.errores);
            }
            resultados.advertencias.push(...validacionCorto.advertencias);
        }

        // Validar consistencia global
        const validacionGlobal = validarConsistenciaGlobal(datos);
        resultados.detalles.global = validacionGlobal;
        
        if (!validacionGlobal.valido) {
            resultados.valido = false;
            resultados.errores.push(...validacionGlobal.errores);
        }
        resultados.advertencias.push(...validacionGlobal.advertencias);

        return resultados;

    } catch (error) {
        return {
            valido: false,
            errores: [`Error en validación completa: ${error.message}`],
            advertencias: [],
            detalles: {}
        };
    }
}

/**
 * Sanitiza y normaliza los datos de entrada
 */
function sanitizarDatos(datos) {
    const datosSanitizados = {};

    try {
        // Sanitizar datos de proyecto
        if (datos.proyecto) {
            datosSanitizados.proyecto = {
                potencia: parseFloat(datos.proyecto.potencia) || 0,
                tension: parseFloat(datos.proyecto.tension) || 0,
                factorPotencia: parseFloat(datos.proyecto.factorPotencia) || 0.8,
                tipoSistema: datos.proyecto.tipoSistema || 'trifasico',
                material: datos.proyecto.material || 'PVC',
                metodo: datos.proyecto.metodo || 'B1',
                temperatura: parseFloat(datos.proyecto.temperatura) || 40,
                numeroCircuitos: parseInt(datos.proyecto.numeroCircuitos) || 1,
                rendimiento: parseFloat(datos.proyecto.rendimiento) || 1.0
            };
        }

        // Sanitizar datos de caída de tensión
        if (datos.caidaTension) {
            datosSanitizados.caidaTension = {
                longitud: parseFloat(datos.caidaTension.longitud) || 0,
                materialCondutor: datos.caidaTension.materialCondutor || 'cobre',
                secaoCabo: parseFloat(datos.caidaTension.secaoCabo) || 0,
                resistenciaCondutor: parseFloat(datos.caidaTension.resistenciaCondutor) || 0
            };
        }

        // Sanitizar datos de cortocircuito
        if (datos.cortocircuito) {
            datosSanitizados.cortocircuito = {
                corrienteCortocircuito: parseFloat(datos.cortocircuito.corrienteCortocircuito) || 0,
                tempoAtuacao: parseFloat(datos.cortocircuito.tempoAtuacao) || 0,
                materialCondutor: datos.cortocircuito.materialCondutor || 'cobre',
                secaoCabo: parseFloat(datos.cortocircuito.secaoCabo) || 0
            };
        }

        return datosSanitizados;

    } catch (error) {
        throw new Error(`Error sanitizando datos: ${error.message}`);
    }
}

// ===================================================================
// FUNCIONES DE MANEJO DE ERRORES
// ===================================================================

/**
 * Formatea errores para mostrar al usuario
 */
function formatearErrores(errores, advertencias = []) {
    let mensaje = '';

    if (errores.length > 0) {
        mensaje += '❌ ERRORES:\n';
        errores.forEach((error, index) => {
            mensaje += `${index + 1}. ${error}\n`;
        });
    }

    if (advertencias.length > 0) {
        if (mensaje) mensaje += '\n';
        mensaje += '⚠️ ADVERTENCIAS:\n';
        advertencias.forEach((advertencia, index) => {
            mensaje += `${index + 1}. ${advertencia}\n`;
        });
    }

    return mensaje;
}

/**
 * Maneja errores de cálculo de forma segura
 */
function manejarErrorCalculo(error, contexto = '') {
    console.error(`Error en cálculo ${contexto}:`, error);
    
    const mensajeUsuario = error.message || 'Error desconocido en el cálculo';
    
    return {
        exito: false,
        error: mensajeUsuario,
        contexto: contexto,
        timestamp: Date.now()
    };
}

/**
 * Valida que los resultados de cálculo sean coherentes
 */
function validarResultadosCalculo(resultados) {
    const errores = [];

    try {
        // Verificar que los valores numéricos sean válidos
        if (resultados.corrienteProyeto !== undefined) {
            if (!isFinite(resultados.corrienteProyeto) || resultados.corrienteProyeto <= 0) {
                errores.push('Corriente de proyecto inválida');
            }
        }

        if (resultados.corrienteCorregida !== undefined) {
            if (!isFinite(resultados.corrienteCorregida) || resultados.corrienteCorregida <= 0) {
                errores.push('Corriente corregida inválida');
            }
        }

        if (resultados.factorTemperatura !== undefined) {
            if (!isFinite(resultados.factorTemperatura) || resultados.factorTemperatura <= 0 || resultados.factorTemperatura > 2) {
                errores.push('Factor de temperatura fuera de rango válido');
            }
        }

        if (resultados.factorAgrupamento !== undefined) {
            if (!isFinite(resultados.factorAgrupamento) || resultados.factorAgrupamento <= 0 || resultados.factorAgrupamento > 1) {
                errores.push('Factor de agrupamiento fuera de rango válido');
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };

    } catch (error) {
        return {
            valido: false,
            errores: [`Error validando resultados: ${error.message}`]
        };
    }
}


// ===================================================================
// EXPORTAR FUNCIONES GLOBALES
// ===================================================================

// Hacer las funciones disponibles globalmente
window.validarParametrosBasicos = validarParametrosBasicos;
window.validarParametrosCaidaTension = validarParametrosCaidaTension;
window.validarParametrosCortocircuito = validarParametrosCortocircuito;
window.validarConsistenciaGlobal = validarConsistenciaGlobal;
window.validarCampoNumerico = validarCampoNumerico;
window.validarCampoSeleccion = validarCampoSeleccion;
window.validarDatosCompletos = validarDatosCompletos;
window.sanitizarDatos = sanitizarDatos;
window.formatearErrores = formatearErrores;
window.manejarErrorCalculo = manejarErrorCalculo;
window.validarResultadosCalculo = validarResultadosCalculo;

