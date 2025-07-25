/**
 * CALCULATIONS.JS - FUNCIONES DE CÁLCULO PURAS
 * =============================================
 * 
 * Funciones de cálculo sin duplicados
 * Validación integrada en cada función
 * Corrección de función calcularFatorAgrupamento duplicada
 */

// ===================================================================
// FUNCIONES DE CÁLCULO DE CORRIENTE
// ===================================================================

/**
 * Calcula la corriente de proyecto según el tipo de carga
 */
function calcularCorrenteProyeto(parametros) {
    // Validación de entrada
    if (!parametros.potencia || parametros.potencia <= 0) {
        throw new Error('Potencia debe ser mayor que 0');
    }
    if (!parametros.tension || parametros.tension <= 0) {
        throw new Error('Tensión debe ser mayor que 0');
    }
    if (!parametros.factorPotencia || parametros.factorPotencia < 0.1 || parametros.factorPotencia > 1.0) {
        throw new Error('Factor de potencia debe estar entre 0.1 y 1.0');
    }

    const { potencia, tension, factorPotencia, tipoSistema, rendimiento = 1.0 } = parametros;
    let corriente = 0;

    try {
        switch (tipoSistema) {
            case 'monofasico':
                corriente = potencia / (tension * factorPotencia * rendimiento);
                break;
            case 'bifasico':
                corriente = potencia / (tension * factorPotencia * rendimiento);
                break;
            case 'trifasico':
                corriente = potencia / (Math.sqrt(3) * tension * factorPotencia * rendimiento);
                break;
            default:
                throw new Error('Tipo de sistema no válido');
        }

        if (corriente <= 0 || !isFinite(corriente)) {
            throw new Error('Resultado de corriente inválido');
        }

        return Math.round(corriente * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
        throw new Error(`Error en cálculo de corriente: ${error.message}`);
    }
}

/**
 * Calcula la corriente corregida aplicando factores de corrección
 */
function calcularCorrenteCorregida(parametros) {
    // Validación de entrada
    if (!parametros.corrienteProyeto || parametros.corrienteProyeto <= 0) {
        throw new Error('Corriente de proyecto debe ser mayor que 0');
    }
    if (!parametros.factorTemperatura || parametros.factorTemperatura <= 0) {
        throw new Error('Factor de temperatura debe ser mayor que 0');
    }
    if (!parametros.factorAgrupamento || parametros.factorAgrupamento <= 0) {
        throw new Error('Factor de agrupamiento debe ser mayor que 0');
    }

    const { corrienteProyeto, factorTemperatura, factorAgrupamento } = parametros;

    try {
        const corrienteCorregida = corrienteProyeto / (factorTemperatura * factorAgrupamento);
        
        if (corrienteCorregida <= 0 || !isFinite(corrienteCorregida)) {
            throw new Error('Resultado de corriente corregida inválido');
        }

        return Math.round(corrienteCorregida * 100) / 100;
    } catch (error) {
        throw new Error(`Error en cálculo de corriente corregida: ${error.message}`);
    }
}

// ===================================================================
// FUNCIONES DE FACTORES DE CORRECCIÓN
// ===================================================================

/**
 * Calcula el factor de temperatura según material, temperatura y método
 * CORREGIDA: Función unificada sin duplicados
 */
function calcularFatorTemperatura(parametros) {
    // Validación de entrada
    if (!parametros.material) {
        throw new Error('Material del conductor es requerido');
    }
    if (!parametros.temperatura || parametros.temperatura < -10 || parametros.temperatura > 80) {
        throw new Error('Temperatura debe estar entre -10°C y 80°C');
    }
    if (!parametros.metodo) {
        throw new Error('Método de instalación es requerido');
    }

    const { material, temperatura, metodo } = parametros;

    try {
        // Determinar si es método enterrado
        const metodosEnterrados = ['D', 'F', 'G', 'H', 'I'];
        const esEnterrado = metodosEnterrados.includes(metodo);
        
        // Obtener factor de temperatura usando función auxiliar
        const factor = obtenerFactorTemperatura(material, temperatura, esEnterrado);
        
        if (factor === 0) {
            throw new Error(`Temperatura ${temperatura}°C excede límite para material ${material}`);
        }

        return factor;
    } catch (error) {
        throw new Error(`Error en cálculo de factor de temperatura: ${error.message}`);
    }
}

/**
 * Calcula el factor de agrupamiento según método y número de circuitos
 * CORREGIDA: Eliminada función duplicada, mantenida solo versión correcta
 */
function calcularFatorAgrupamento(metodo, numeroCircuitos) {
    // Validación de entrada
    if (!metodo) {
        throw new Error('Método de instalación es requerido');
    }
    if (!numeroCircuitos || numeroCircuitos < 1 || numeroCircuitos > 50) {
        throw new Error('Número de circuitos debe estar entre 1 y 50');
    }

    try {
        // Usar función auxiliar para obtener factor
        const factor = obtenerFactorAgrupamento(metodo, numeroCircuitos);
        
        if (factor <= 0 || factor > 1) {
            throw new Error('Factor de agrupamiento fuera de rango válido');
        }

        return factor;
    } catch (error) {
        throw new Error(`Error en cálculo de factor de agrupamiento: ${error.message}`);
    }
}

// ===================================================================
// FUNCIONES DE DIMENSIONAMIENTO
// ===================================================================

/**
 * Selecciona la sección mínima del conductor
 */
function seleccionarSeccionMinima(parametros) {
    // Validación de entrada
    if (!parametros.corrienteCorregida || parametros.corrienteCorregida <= 0) {
        throw new Error('Corriente corregida debe ser mayor que 0');
    }
    if (!parametros.material) {
        throw new Error('Material del conductor es requerido');
    }
    if (!parametros.metodo) {
        throw new Error('Método de instalación es requerido');
    }

    const { corrienteCorregida, material, metodo } = parametros;

    try {
        // Obtener secciones disponibles ordenadas
        const secciones = tabelasNBR.seccionesNominales.slice().sort((a, b) => a - b);
        
        for (const seccion of secciones) {
            try {
                const ampacidad = obtenerAmpacidadBase(material, metodo, seccion);
                if (ampacidad >= corrienteCorregida) {
                    return {
                        seccion: seccion,
                        ampacidad: ampacidad,
                        margemSeguranca: ((ampacidad - corrienteCorregida) / corrienteCorregida * 100).toFixed(1)
                    };
                }
            } catch (e) {
                // Continuar si la sección no está disponible para este material/método
                continue;
            }
        }
        
        throw new Error(`No se encontró sección adecuada para corriente ${corrienteCorregida}A`);
    } catch (error) {
        throw new Error(`Error en selección de sección: ${error.message}`);
    }
}

/**
 * Verifica criterio de caída de tensión
 */
function verificarCaidaTension(parametros) {
    // Validación de entrada
    if (!parametros.corriente || parametros.corriente <= 0) {
        throw new Error('Corriente debe ser mayor que 0');
    }
    if (!parametros.longitud || parametros.longitud <= 0) {
        throw new Error('Longitud debe ser mayor que 0');
    }
    if (!parametros.seccion || parametros.seccion <= 0) {
        throw new Error('Sección debe ser mayor que 0');
    }
    if (!parametros.tension || parametros.tension <= 0) {
        throw new Error('Tensión debe ser mayor que 0');
    }
    if (!parametros.materialCondutor) {
        throw new Error('Material del conductor es requerido');
    }

    const { corriente, longitud, seccion, tension, materialCondutor, factorPotencia = 0.8, tipoSistema = 'trifasico' } = parametros;

    try {
        // Obtener resistencia del conductor
        const resistencia = obtenerResistencia(materialCondutor, seccion);
        
        // Calcular caída de tensión según tipo de sistema
        let caidaTension = 0;
        
        switch (tipoSistema) {
            case 'monofasico':
                caidaTension = 2 * corriente * longitud * resistencia / 1000; // Factor 2 por ida y vuelta
                break;
            case 'bifasico':
                caidaTension = 2 * corriente * longitud * resistencia / 1000;
                break;
            case 'trifasico':
                caidaTension = Math.sqrt(3) * corriente * longitud * resistencia / 1000;
                break;
            default:
                throw new Error('Tipo de sistema no válido');
        }

        const porcentajeCaida = (caidaTension / tension) * 100;
        
        // Límites según NBR 5410
        const limitePorcentaje = tension > 1000 ? 1.0 : 4.0; // 1% para AT, 4% para BT
        const cumpleCriterio = porcentajeCaida <= limitePorcentaje;

        return {
            caidaTension: Math.round(caidaTension * 100) / 100,
            porcentajeCaida: Math.round(porcentajeCaida * 100) / 100,
            limite: limitePorcentaje,
            cumpleCriterio: cumpleCriterio,
            resistencia: resistencia
        };
    } catch (error) {
        throw new Error(`Error en verificación de caída de tensión: ${error.message}`);
    }
}

/**
 * Verifica criterio de cortocircuito
 */
function verificarCortocircuito(parametros) {
    // Validación de entrada
    if (!parametros.corrienteCortocircuito || parametros.corrienteCortocircuito <= 0) {
        throw new Error('Corriente de cortocircuito debe ser mayor que 0');
    }
    if (!parametros.seccion || parametros.seccion <= 0) {
        throw new Error('Sección debe ser mayor que 0');
    }
    if (!parametros.tiempoAtuacao || parametros.tiempoAtuacao <= 0) {
        throw new Error('Tiempo de actuación debe ser mayor que 0');
    }
    if (!parametros.materialCondutor) {
        throw new Error('Material del conductor es requerido');
    }

    const { corrienteCortocircuito, seccion, tiempoAtuacao, materialCondutor } = parametros;

    try {
        // Constantes para cálculo de cortocircuito
        const k = materialCondutor.toLowerCase() === 'aluminio' ? 74 : 115; // Constante según material
        
        // Calcular sección mínima requerida para cortocircuito
        const seccionMinima = (corrienteCortocircuito * Math.sqrt(tiempoAtuacao)) / k;
        
        const cumpleCriterio = seccion >= seccionMinima;

        return {
            seccionMinima: Math.round(seccionMinima * 100) / 100,
            seccionEscolhida: seccion,
            cumpleCriterio: cumpleCriterio,
            margemSeguranca: cumpleCriterio ? ((seccion - seccionMinima) / seccionMinima * 100).toFixed(1) : 0
        };
    } catch (error) {
        throw new Error(`Error en verificación de cortocircuito: ${error.message}`);
    }
}

// ===================================================================
// FUNCIONES DE CÁLCULO COMPLETO
// ===================================================================

/**
 * Realiza el dimensionamiento completo del conductor
 */
function dimensionarCondutor(parametros) {
    // Validación de parámetros principales
    if (!parametros) {
        throw new Error('Parámetros son requeridos');
    }

    try {
        const resultados = {};

        // 1. Calcular corriente de proyecto
        resultados.corrienteProyeto = calcularCorrenteProyeto({
            potencia: parametros.potencia,
            tension: parametros.tension,
            factorPotencia: parametros.factorPotencia,
            tipoSistema: parametros.tipoSistema,
            rendimiento: parametros.rendimiento
        });

        // 2. Calcular factores de corrección
        resultados.factorTemperatura = calcularFatorTemperatura({
            material: parametros.material,
            temperatura: parametros.temperatura,
            metodo: parametros.metodo
        });

        resultados.factorAgrupamento = calcularFatorAgrupamento(
            parametros.metodo,
            parametros.numeroCircuitos
        );

        // 3. Calcular corriente corregida
        resultados.corrienteCorregida = calcularCorrenteCorregida({
            corrienteProyeto: resultados.corrienteProyeto,
            factorTemperatura: resultados.factorTemperatura,
            factorAgrupamento: resultados.factorAgrupamento
        });

        // 4. Seleccionar sección mínima
        resultados.seccionMinima = seleccionarSeccionMinima({
            corrienteCorregida: resultados.corrienteCorregida,
            material: parametros.material,
            metodo: parametros.metodo
        });

        // 5. Verificar caída de tensión (si se proporcionan datos)
        if (parametros.longitud && parametros.materialCondutor) {
            resultados.caidaTension = verificarCaidaTension({
                corriente: resultados.corrienteProyeto,
                longitud: parametros.longitud,
                seccion: resultados.seccionMinima.seccion,
                tension: parametros.tension,
                materialCondutor: parametros.materialCondutor,
                factorPotencia: parametros.factorPotencia,
                tipoSistema: parametros.tipoSistema
            });
        }

        // 6. Verificar cortocircuito (si se proporcionan datos)
        if (parametros.corrienteCortocircuito && parametros.tiempoAtuacao) {
            resultados.cortocircuito = verificarCortocircuito({
                corrienteCortocircuito: parametros.corrienteCortocircuito,
                seccion: resultados.seccionMinima.seccion,
                tiempoAtuacao: parametros.tiempoAtuacao,
                materialCondutor: parametros.materialCondutor
            });
        }

        // 7. Agregar timestamp para control de obsolescencia
        resultados.timestamp = Date.now();
        resultados.parametrosUtilizados = { ...parametros };

        return resultados;
    } catch (error) {
        throw new Error(`Error en dimensionamiento completo: ${error.message}`);
    }
}

// ===================================================================
// FUNCIONES AUXILIARES DE CÁLCULO
// ===================================================================

/**
 * Convierte potencia entre diferentes unidades
 */
function convertirPotencia(valor, unidadOrigen, unidadDestino) {
    const factores = {
        'W': 1,
        'kW': 1000,
        'MW': 1000000,
        'CV': 735.5,
        'HP': 745.7
    };

    if (!factores[unidadOrigen] || !factores[unidadDestino]) {
        throw new Error('Unidad de potencia no válida');
    }

    const valorEnWatts = valor * factores[unidadOrigen];
    return valorEnWatts / factores[unidadDestino];
}

/**
 * Calcula la impedancia del conductor
 */
function calcularImpedancia(parametros) {
    const { resistencia, reactancia = 0 } = parametros;
    
    if (!resistencia || resistencia < 0) {
        throw new Error('Resistencia debe ser mayor o igual a 0');
    }

    return Math.sqrt(resistencia * resistencia + reactancia * reactancia);
}

/**
 * Calcula la potencia perdida en el conductor
 */
function calcularPerdidas(parametros) {
    const { corriente, resistencia, longitud, numeroFases = 3 } = parametros;
    
    if (!corriente || corriente <= 0) {
        throw new Error('Corriente debe ser mayor que 0');
    }
    if (!resistencia || resistencia < 0) {
        throw new Error('Resistencia debe ser mayor o igual a 0');
    }
    if (!longitud || longitud <= 0) {
        throw new Error('Longitud debe ser mayor que 0');
    }

    // Pérdidas = I² × R × L × número de fases / 1000 (para convertir a kW)
    const perdidas = Math.pow(corriente, 2) * resistencia * longitud * numeroFases / 1000;
    
    return Math.round(perdidas * 1000) / 1000; // Redondear a 3 decimales
}

/**
 * Valida que todos los criterios de dimensionamiento se cumplan
 */
function validarDimensionamiento(resultados) {
    const errores = [];
    const advertencias = [];

    // Verificar que la corriente corregida sea válida
    if (!resultados.corrienteCorregida || resultados.corrienteCorregida <= 0) {
        errores.push('Corriente corregida inválida');
    }

    // Verificar sección mínima
    if (!resultados.seccionMinima || !resultados.seccionMinima.seccion) {
        errores.push('No se pudo determinar sección mínima');
    }

    // Verificar caída de tensión si está disponible
    if (resultados.caidaTension && !resultados.caidaTension.cumpleCriterio) {
        errores.push(`Caída de tensión excesiva: ${resultados.caidaTension.porcentajeCaida}%`);
    }

    // Verificar cortocircuito si está disponible
    if (resultados.cortocircuito && !resultados.cortocircuito.cumpleCriterio) {
        errores.push('Sección insuficiente para corriente de cortocircuito');
    }

    // Advertencias para factores de corrección muy bajos
    if (resultados.factorTemperatura && resultados.factorTemperatura < 0.7) {
        advertencias.push('Factor de temperatura muy bajo, considerar cambio de material');
    }

    if (resultados.factorAgrupamento && resultados.factorAgrupamento < 0.5) {
        advertencias.push('Factor de agrupamiento muy bajo, considerar separar circuitos');
    }

    return {
        valido: errores.length === 0,
        errores: errores,
        advertencias: advertencias
    };
}


// ===================================================================
// EXPORTAR FUNCIONES GLOBALES
// ===================================================================

// Hacer las funciones disponibles globalmente
window.calcularCorrenteProyeto = calcularCorrenteProyeto;
window.calcularCorrenteCorregida = calcularCorrenteCorregida;
window.calcularFatorTemperatura = calcularFatorTemperatura;
window.calcularFatorAgrupamento = calcularFatorAgrupamento;
window.seleccionarSeccionMinima = seleccionarSeccionMinima;
window.verificarCaidaTension = verificarCaidaTension;
window.verificarCortocircuito = verificarCortocircuito;
window.dimensionarCondutor = dimensionarCondutor;
window.convertirPotencia = convertirPotencia;
window.calcularImpedancia = calcularImpedancia;
window.calcularPerdidas = calcularPerdidas;
window.validarDimensionamiento = validarDimensionamiento;

