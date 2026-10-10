import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tab, AppState, Hypothesis, AnalysisSetup, FiveWhysAnalysis, PokaYokeSolution, ACPPlan, ActionStep, A3ReportData, ObservationValue, CostInputs, FiveWhyStep, CostBreakdown, GembaDiagnostic, EfficacyProtocol, EfficacyStep } from './types';
import { callGemini, promptTemplates, schemas } from './services/geminiService';
import { 
  ClipboardDocumentCheckIcon, 
  ShieldCheckIcon, 
  MagnifyingGlassIcon, 
  WrenchScrewdriverIcon, 
  ArrowPathIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  QueueListIcon,
  BeakerIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  BookmarkSquareIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  CogIcon,
  CloudArrowDownIcon,
  CheckBadgeIcon,
  ChartPieIcon,
  DocumentIcon,
  PrinterIcon,
  ScaleIcon,
  CheckIcon,
  PlusCircleIcon,
  LightBulbIcon,
  TrashIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TruckIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  ReceiptPercentIcon,
  InboxStackIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  Square2StackIcon,
  CheckBadgeIcon as CheckBadgeIconSolid,
  StarIcon,
  BoltIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  BookOpenIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CameraIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Shared file text reader
export const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (extension === 'pdf') {
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => (item as any).str).join(' ') + '\n';
      }
      return text;
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_txt(worksheet) + '\n';
      });
      return text;
    } else {
      const decoder = new TextDecoder();
      return decoder.decode(arrayBuffer);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    try {
      return await file.text();
    } catch (innerError) {
      console.error('Fallback text extraction failed:', innerError);
      return '';
    }
  }
};

const translations = {
  es: {
    suiteName: "Kit ACR-8D Pro",
    suiteSubtitle: "MdEO Suite",
    scientificMethod: "Metodología Científica",
    aiConnected: "IA Conectada",
    wcmActive: "Suite WCM Activa",
    setup: "D0: Configuración",
    d1d2: "D1/D2: Definición",
    d3: "D3: Corrección",
    d4: "D4: Causa Raíz",
    d5: "D5: Gestión ACP",
    d6: "D6: Poka-Yoke",
    d7: "D7: Estándares",
    d8: "D8: Reporte A3",
    projectMgmt: "Gestión de Proyecto",
    save: "Guardar",
    load: "Cargar",
    csvReport: "Excel / CSV Reporte",
    pdfFullReport: "PDF Reporte Evidencia Documental",
    pdfEfficacyReport: "PDF Reporte Validación de Eficacia",
    docReport: "Reporte Full .doc",
    startDate: "Fecha de Inicio",
    caseName: "Nombre del Caso",
    responsible: "Responsable",
    caseType: "Tipo de Caso",
    impacts: "Impactos de la Desviación",
    standards: "Normas de Auditoría, Estándar, Autoridades y Entes de Control (Selección Múltiple)",
    otherStandardLabel: "Especifique Otros",
    otherImpactLabel: "Especifique Otros Impactos",
    initAnalysis: "Iniciar Análisis Disciplinas 8D",
    phenomenology: "Fenomenología",
    techAnalysis: "Análisis Técnico del Problema",
    defProblem: "Definición del Problema",
    finImpact: "Impacto Financiero",
    fieldInput: "Ingreso de Datos de Campo",
    uploadFile: "Cargar Documento/Archivo",
    aiAgentProblemDef: "Agente IA para definición del problema",
    aiAgentBanner: "Utiliza la asistencia de la IA (Gem) para robustecer el análisis. Con esta funcionalidad puedes adicionar toda clase de documentos, datos, evidencias reales y directas del proceso, sin comprometer la confidencialidad",
    fileTypes: "Soporta PDF, Word, Excel, Markdown, TXT",
    extractingText: "Extrayendo texto...",
    fieldPlaceholder: "Describa el fallo con PPM, Tolerancias, Ubicación...",
    runIA: "Ejecutar 5W2H IA",
    run5WhysIA: "EJECUTAR 5 PORQUES",
    fieldReport: "Reporte Estructurado de Campo (Editable)",
    waitingAnalysis: "Esperando análisis...",
    costQuality: "Impacto Financiero y Costo de Calidad",
    selectCurrency: "Seleccionar Moneda",
    estimateCosts: "Estimar Impacto Financiero",
    totalLoss: "Pérdida Estimada Total (Editable)",
    correctiveActionPlan: "Plan de Corrección",
    correctiveActionSub: "Aplicación Inmediata",
    correctiveActionTitle: "Correcciones Inmediatas",
    selectCorrectiveAction: "Seleccionar Corrección",
    generateCorrectiveActions: "IA: Generar Correcciones",
    implementationPlan: "Plan de Implementación",
    generateImplementationPlan: "IA: Generar Plan de Implementación",
    implementationDate: "Fecha de Implementación",
    actionSelected: "Acción Seleccionada:",
    edit: "Editar",
    preview: "Vista Pro",
    createProtocol: "IA: Generar Correcciones",
    protocolTitle: "Corrección",
    forensicAnalysis: "Análisis Forense de Proceso",
    ishikawaTitle: "Brainstorming Estructurado (6M Ishikawa)",
    genIshikawa: "Generar Ishikawa IA",
    selectedHyp: "Hipótesis fijadas:",
    gembaConfirm: "Confirmar en Gemba walk",
    floorValidation: "Validación en Piso (GEMBA)",
    csvChecklist: "CSV Checklist",
    createChecklist: "Crear Checklist IA",
    confirmed: "Confirmed",
    expValidation: "Validación Experimental",
    expPlanTitle: "Engineering Experimental Plan",
    genExpReport: "IA: Reporte de Validación",
    finalCauses: "Confirmar Causas Finales",
    classifyCauses: "Clasificar Causas",
    unifiedFailure: "Modo de Falla Unificado",
    synthFailure: "IA: Sintetizar Falla",
    genActions: "IA: Generar Acciones",
    pursuitWhys: "Persecución de la Causa Raíz (5 Porqués)",
    systemicRoot: "Causa Raíz Sistémica Final",
    rootCauseTitle: "Causa Raíz",
    confirmedCausesTitle: "Causas Confirmadas",
    causesAndActionsTitle: "Causas y Acciones",
    advanceACP: "Avanzar a Gestión ACP (D5)",
    eliminateRoot: "Eliminación Definitiva de la Causa Raíz",
    materializePlans: "Materializar Planes IA",
    primary: "Causa raíz principal",
    secondary: "Secundario",
    action: "Acción",
    term: "Plazo",
    fix: "Fijar",
    preventionDesign: "Prevención de Errores por Diseño",
    proposeSolutions: "IA: Proponer Soluciones",
    expectedBenefit: "Beneficio Esperado",
    viewGuide: "Ver Guía Técnica",
    execReportA3: "Reporte Ejecutivo A3",
    genManagerial: "Resumen Gerencial de Mejora Continua",
    consolidateA3: "IA: Consolidar A3",
    financialJust: "Justificación Financiera (IA)",
    riskEval: "Evaluación de Riesgos y Residuos",
    futureStd: "Estandarización y Futuro",
    closureCycle: "Cierre del Ciclo",
    genStd: "IA: Generar Estándar",
    deploy: "IA: Desplegar",
    certification: "Certificación Técnica",
    createExam: "IA: Crear Examen",
    grade: "Calificar",
    approved: "Aprobado",
    notApproved: "No Aprobado",
    standardPOE: "Estandarización (POE)",
    yokotenTab: "Despliegue (Yoko-Ten)",
    certTab: "Certificación",
    efficacyValidation: "Validación de Eficacia",
    efficacyValidationPlan: "Plan de Validación de Eficacia",
    efficacyVerification: "Verificación de la Eficacia",
    effective: "Eficaz",
    actionId: "ID de la Acción",
    efficacyTitle: "Protocolos de Validación de Eficacia",
    genEfficacy: "Generar Protocolos de Eficacia",
    genGuide: "Guía IA",
    verificationMethod: "Método de Verificación de Campo",
    kpi: "Indicador de Éxito (KPI)",
    auditFrequency: "Frecuencia de Auditoría de Eficacia",
    contingencyPlan: "Plan de Contingencia Técnica",
    executionResponsible: "Nombre Responsable de Ejecución",
    executionDate: "Fecha de Ejecución",
    verificationResponsible: "Responsable de Verificación",
    verificationDate: "Fecha de Verificación",
    auditFinding: "Hallazgo de auditoría (No conformidades)",
    foodSafetyComplaints: "Quejas de Inocuidad",
    improvementOpportunity: "Oportunidad de mejora",
    auditDateBanner: "Para Hallazgos de Auditoria es la fecha en que recibió la solicitud del plan de acción",
    caseNameBanner: "Para Quejas o Hallazgos de Auditoria se debe colocar el numero del caso y un nombre corto que lo identifique, ej: 4235 Mal hábito en lavado de manos, 617888 Faltante de crema",
    caseTypeBanner: "Desviación de proceso es cualquier evento, suceso, queja o situación diferente a un hallazgo de auditoria",
    processDeviation: "Desviación de proceso",
    quickSolution: "Solución Rápida (SR)",
    what: "QUÉ (WHAT)",
    who: "QUIÉN (WHO)",
    where: "DÓNDE (WHERE)",
    when: "CUÁNDO (WHEN)",
    how: "CÓMO (HOW)",
    how_many: "CUÁNTO/CUÁNTOS (HOW MANY)",
    why_is_it_a_problem: "POR QUÉ ES UN PROBLEMA",
    affected_clauses: "AFFECTED CLAUSES",
    financialJustTitle: "Justificación Financiera",
    riskEvalTitle: "Evaluación de Riesgos",
    finalCausesTitle: "Confirmar Causas Finales",
    standardizationTitle: "Estandarización y Futuro",
    actionsTitle: "Acciones de Mejora Definitivas",
    generationDate: "Fecha de Generación",
    typeLabel: "Tipo",
    successLoad: "Proyecto cargado exitosamente.",
    errorLoad: "Error al cargar el archivo.",
    confirmDelete: "¿Está seguro de que desea eliminar este elemento?",
    selectHypAlert: "Seleccione al menos una hipótesis.",
    noChecklistAlert: "No hay checklists generados.",
    noExpPlanAlert: "No hay plan experimental generado.",
    noGembaConfirmAlert: "No hay causas confirmadas en GEMBA.",
    noConfirmedAlert: "No hay causas confirmadas.",
    actionsMaterialized: "Acciones materializadas.",
    rcaRequired: "Se requiere análisis de causa raíz.",
    unknownCause: "Causa Desconocida",
    floorCause: "Causa de Piso",
    failureModeDefault: "Falla Técnica No Determinada",
    implement: "Implementar",
    confirmedImpl: "Implementation Confirmed",
    downloadACP: "Descargar Plan ACP (Sheets)",
    fullReport: "Reporte Final - Evidencia Documental",
    consultFullA3: "Consultar reporte completo en sección D8",
    ishikawaSummary: "Ishikawa 6M (Causas Fijadas)",
    expSummary: "Resumen Plan Experimental",
    pcaSummary: "Acciones Correctivas Permanentes",
    yokotenSummary: "Resumen Despliegue Horizontal",
    resExecutivePOE: "Documento de Estandarización POE Completo",
    resExecutiveYokoten: "Informe de Despliegue Horizontal Completo",
    poeSummaryTitle: "Resumen POE (Objetivo y Alcance)",
    yokotenSummaryTitle: "Resumen Despliegue (Contramedidas, Plan y Cierre)",
    fullScreen: "Pantalla Completa",
    tutorial: "Guía de Usuario",
    tutorialTitle: "Manual de Operación: ACR-8D Pro Kit",
    tutorialSubtitle: "Domina la Metodología Científica 8D",
    close: "Cerrar",
    next: "Siguiente",
    prev: "Anterior",
    tutD0Title: "D0: Configuración",
    tutD0Content: "El cimiento del análisis. En esta etapa:\n1. **Fecha de Inicio**: Define cuándo se detectó o reportó el evento. Haz clic en el calendario para seleccionar la fecha exacta.\n2. **Nombre del Caso**: Usa un código y descripción corta (ej: '4235 Falla en empaque'). Haz clic en el icono ❓ para ver ejemplos detallados según el tipo de caso.\n3. **Responsable**: Escribe el nombre completo del líder del equipo investigador que coordinará las disciplinas.\n4. **Tipo de Caso**: Selecciona si es una Queja, Hallazgo de Auditoría o Desviación de Proceso. Esta selección es crítica ya que adapta los impactos y normas a evaluar.\n5. **Impactos/Normas**: Marca todas las casillas que apliquen. Si una norma no está listada, usa 'Otros' para especificarla manualmente.\n6. **Botón 'Iniciar Análisis'**: Una vez completados los campos obligatorios, haz clic para desbloquear el flujo completo de las 8 Disciplinas.\n7. **Botón 'Guardar'**: Almacena los datos actuales en la memoria local de tu navegador. Útil para no perder progreso si cierras la pestaña.\n8. **Botón 'Cargar'**: Recupera la última sesión guardada localmente.\n9. **Botón 'Exportar JSON'**: Genera y descarga el archivo maestro de la investigación (.json). Es el único respaldo que garantiza la portabilidad total de los datos a otros equipos.\n10. **Botón 'Excel/CSV Reporte'**: Descarga una tabla resumen en formato CSV con la información básica de configuración del caso para reportes administrativos rápidos.",
    tutD0Pro: "La calidad del análisis depende de la precisión inicial. Un nombre de caso estandarizado facilita la trazabilidad en bases de datos históricas. Recuerda exportar tu JSON al finalizar cada sesión importante.",
    tutD1D2Title: "D1/D2: Definición (El Diagnóstico)",
    tutD1D2Content: "Define el problema con rigor científico para evitar soluciones superficiales:\n1. **Fenomenología**: Describe el fallo de forma cruda y objetiva. ¿Qué se rompió? ¿Qué no funcionó? Usa el cuadro de texto para redactar con detalle.\n2. **Botón 'Subir Archivo'**: Haz clic para cargar fotos, PDFs o documentos de soporte. La IA analizará el contenido y extraerá datos relevantes para la investigación automáticamente.\n3. **Botón 'Ejecutar IA 5W2H'**: La IA procesará tu descripción y la organizará en las 7 dimensiones (Qué, Quién, Dónde, Cuándo, Cómo, Cuántos, Por qué). Revisa el reporte generado.\n4. **Interacción 5W2H**: Puedes hacer clic en cualquier celda del reporte generado para corregir o ampliar la información manualmente. Los cambios se guardan al instante.\n5. **Pestaña 'Impacto Financiero'**: Cambia a esta vista para cuantificar el costo de la no-calidad.\n6. **Calculadora de Costos**: Ingresa valores en campos como desperdicio, horas hombre o multas. Selecciona tu moneda local (COP, USD, CRC) en el menú desplegable.\n7. **Botón 'Estimar Impacto'**: La IA calculará la pérdida total y generará un desglose por categorías (Tangibles e Intangibles) con descripciones de impacto.\n8. **Botón 'Fijar' (Icono Pin)**: Asegúrate de que la descripción final esté fijada (pin azul) para que se consolide correctamente en el reporte ejecutivo A3.",
    tutD1D2Pro: "Un problema bien definido está 50% resuelto. Si el 5W2H muestra vacíos de información, es una señal clara de que el equipo debe volver al Gemba (lugar de los hechos) a recolectar más evidencia.",
    tutD3Title: "D3: Corrección (Acción Inmediata)",
    tutD3Content: "El objetivo es proteger al cliente y detener la 'hemorragia' de inmediato:\n1. **Botón 'IA: Generar Correcciones'**: La IA sugerirá acciones de contención basadas en la fenomenología definida en D1/D2. Aparecerán en tarjetas interactivas.\n2. **Selección de Acción**: Revisa las opciones y haz clic en la tarjeta de la acción que el equipo considere más efectiva. Se marcará con un borde azul.\n3. **Botón 'IA: Generar Plan de Implementación'**: Una vez seleccionada la acción, haz clic para que la IA detalle los pasos técnicos, responsables y plazos para ejecutarla.\n4. **Botón 'Fijar' (Icono Pin)**: Es obligatorio hacer clic en el pin azul para que esta acción de contención aparezca en el reporte final A3.\n5. **Edición Directa**: Puedes modificar el texto de la acción, el responsable y la fecha de compromiso haciendo clic directamente sobre los campos en la tabla del plan.\n6. **Botón 'Borrar Todo / Reiniciar'**: Si las sugerencias no son adecuadas o deseas empezar de cero, usa este botón para limpiar la sección por completo.",
    tutD3Pro: "La contención no soluciona la raíz, solo detiene el síntoma. Debe ser implementada en menos de 24-48 horas. Asegúrate de que el personal operativo entienda que es una medida temporal.",
    tutD4Title: "D4: Causa Raíz (La Investigación)",
    tutD4Content: "Investigación técnica profunda para encontrar el 'por qué' sistémico:\n1. **Botón 'Generar Ishikawa IA'**: Crea un diagrama de espina de pescado automático bajo las 6M. Haz clic en los textos de las causas para editarlas.\n2. **Selección de Hipótesis (Botón '+')**: Haz clic en el icono '+' en las causas que el equipo sospeche que son reales para 'Fijarlas' en la lista de validación.\n3. **Botón 'Crear Checklist IA'**: Genera una guía de preguntas para ir al Gemba y verificar físicamente si las hipótesis fijadas son verdaderas o falsas.\n4. **Botón 'IA: Reporte de Validación'**: Documenta los resultados de tus pruebas experimentales. La IA te ayudará a redactar el informe técnico de experimentos.\n5. **Botón 'Confirmar' (Icono Check)**: Haz clic en el check verde de las causas que fueron demostradas mediante hechos y datos en el Gemba o experimentos.\n6. **Sección 5 Porqués**: Para cada causa confirmada, haz clic en 'Generar 5 Porqués'. La IA te guiará desde la causa física hasta la falla del sistema (raíz sistémica).\n7. **Interacción**: Todos los diagramas y textos son editables. Haz clic sobre cualquier nodo o campo para ajustar la redacción técnica.",
    tutD4Pro: "No te detengas en la 'falla humana'. Sigue preguntando hasta encontrar la deficiencia en el proceso, la política o el estándar que permitió que el humano fallara. Esa es la verdadera raíz sistémica.",
    tutD5Title: "D5: Gestión ACP (Solución Definitiva)",
    tutD5Content: "Diseña e implementa cambios que eliminen la causa raíz para siempre:\n1. **Botón 'Materializar Planes IA'**: Genera Acciones Correctivas Permanentes (ACP) que ataquen directamente la raíz sistémica hallada en D4.\n2. **Configuración de ACP**: Define si la acción es Primaria (ataca la raíz) o Secundaria (refuerza el sistema). Asigna responsables y fechas claras en la tabla.\n3. **Botón 'Fijar' (Icono Pin)**: Haz clic en el pin azul de cada acción que el equipo decida implementar para que se incluya en el reporte A3.\n4. **Botón 'Descargar ACP'**: Exporta el plan de acción completo a un archivo Excel para facilitar el seguimiento administrativo fuera de la herramienta.\n5. **Botón 'Ir a Implementación'**: Pasa al paso 2 donde la IA generará guías técnicas detalladas (chispas) de cómo ejecutar cada acción fijada.\n6. **Botón 'IA: Generar Guía' (Icono Chispas)**: En la tabla de implementación, haz clic para obtener el paso a paso técnico de ejecución de la acción.\n7. **Interacción**: Puedes editar el texto de las acciones, los métodos de verificación y las evidencias esperadas directamente en las celdas de la tabla.",
    tutD5Pro: "Una ACP robusta debe ser técnica o administrativa, no conductual. Si la solución es 're-entrenar', es probable que el problema vuelva. Busca Poka-Yokes o cambios en el diseño del proceso.",
    tutD6Title: "D6: Poka-Yoke (Prevención)",
    tutD6Content: "Blindaje total contra el error mediante dispositivos físicos o lógicos:\n1. **Botón 'IA: Proponer Soluciones'**: La IA sugerirá mecanismos anti-error (Poka-Yokes) específicos para tu problema detectado.\n2. **Botón 'Ver Guía Técnica'**: Despliega una ventana con el detalle constructivo, diagramas o configuración del Poka-Yoke propuesto.\n3. **Botón 'Descargar Guía PDF'**: Genera una ficha técnica profesional en PDF para entregar a los equipos de ingeniería, mantenimiento o IT.\n4. **Botón 'Confirmar'**: Marca los Poka-Yokes que el equipo se compromete a instalar. Se resaltarán en verde.\n5. **Interacción**: Puedes ajustar el nombre de la solución, el costo estimado y describir el beneficio esperado para justificar la inversión ante la gerencia.",
    tutD6Pro: "El mejor Poka-Yoke es el de 'Prevención' (hace imposible el error), seguido por el de 'Detección' (detiene el proceso si ocurre el error). Siempre apunta al nivel más alto de blindaje.",
    tutD7Title: "D7: Estándares (El Cierre)",
    tutD7Content: "Asegura que el conocimiento se mantenga y se multiplique en la organización:\n1. **Pestaña 'Estándar POE'**: Haz clic en 'IA: Generar Estándar' para crear el borrador del Procedimiento Operativo Estándar basado en las soluciones de D5/D6.\n2. **Pestaña 'Yoko-Ten'**: Haz clic en 'IA: Desplegar' para identificar otros procesos, máquinas o plantas donde se pueda aplicar esta misma solución (Despliegue Horizontal).\n3. **Pestaña 'Certificación'**: Haz clic en 'IA: Crear Examen' para generar una evaluación de 5 preguntas que valide si el personal comprendió el nuevo estándar.\n4. **Botón 'Calificar'**: Tras aplicar el examen, ingresa los resultados y haz clic para evaluar. Se requiere un puntaje de 4/5 para considerar al operario certificado.\n5. **Interacción**: El POE y el Yoko-Ten son borradores editables. Haz clic en los campos de texto para ajustar la redacción técnica antes de la publicación oficial.",
    tutD7Pro: "El Yoko-Ten es la herramienta más potente para la mejora continua global. No permitas que una buena solución se quede encerrada en un solo equipo; compártela y multiplica el ahorro.",
    tutD8Title: "D8: Reporte A3 (Consolidación)",
    tutD8Content: "Consolida toda la investigación en un documento ejecutivo de alto impacto:\n1. **Botón 'IA: Consolidar A3'**: La IA leerá todos los pasos anteriores y redactará un resumen ejecutivo coherente, profesional y orientado a resultados.\n2. **Botón 'Editar'**: Habilita la edición de los cuadros del A3 para que puedas pulir los textos, corregir redacción o añadir detalles específicos.\n3. **Botón 'Vista Previa'**: Cambia a un modo de visualización limpia para ver cómo quedará el documento final antes de exportar.\n4. **Botón 'PDF'**: Descarga el reporte A3 con diseño industrial profesional, listo para ser presentado en comités de gerencia, juntas directivas o auditorías externas.\n5. **Sección 'Verificación de Eficacia'**: Esta sección se alimenta automáticamente de los datos ingresados en el módulo de validación final (D8/Eficacia).\n6. **Interacción**: En el modo edición, puedes ajustar el tamaño de los textos y la distribución de la información para asegurar que la 'historia' del problema sea clara.",
    tutD8Pro: "Un buen A3 debe poder leerse en 5 minutos y dar una visión clara de la causa raíz y la efectividad de las soluciones. Es tu carta de presentación como investigador experto.",
    tutEfficacyTitle: "Validación de Eficacia",
    tutEfficacyContent: "La prueba final de que el problema ha sido erradicado:\n1. **Botón 'Generar Protocolos'**: La IA definirá un plan de auditoría específico para verificar que las ACP de D5 realmente están funcionando en el tiempo.\n2. **Botón 'IA: Generar Guía' (Icono Chispas)**: Haz clic en el icono de chispas en la tabla para obtener instrucciones detalladas de cómo realizar la auditoría de verificación en campo.\n3. **Selector 'Eficaz (SÍ/NO)'**: Tras realizar la verificación física en el proceso, marca el resultado final. Si seleccionas 'NO', el sistema te sugerirá reiniciar el análisis.\n4. **Botón 'Reiniciar'**: Si la solución falló, usa este botón para limpiar las etapas necesarias y volver a investigar la verdadera causa raíz sistémica.\n5. **Interacción**: Puedes editar los KPIs (indicadores), los métodos de verificación y las frecuencias sugeridas para que coincidan con tus sistemas de gestión internos.",
    tutEfficacyPro: "No confundas 'cumplir la acción' con 'ser eficaz'. La eficacia se mide en los indicadores: si el defecto desapareció o bajó al nivel esperado, entonces la solución fue eficaz.",

    tutDataContent: "La herramienta guarda tu progreso automáticamente en el almacenamiento local del navegador. El botón 'Exportar JSON' descarga un archivo que puedes compartir por correo o guardar como respaldo oficial. 'Cargar JSON' te permite retomar investigaciones previas o revisar casos antiguos en cualquier momento.",
    tutDataPro: "Exporta siempre al finalizar el día o al completar un hito. Los archivos JSON son ligeros y garantizan que nunca pierdas tu investigación por limpieza de caché o cambio de equipo.",
    tutRulesTitle: "Reglas de Oro",
    tutRulesContent: "1. La IA es un copiloto experto, tú eres el capitán: revisa y edita siempre los textos generados.\n2. Debes hacer clic en 'Fijar' (Pin azul) en los elementos clave para que viajen a los reportes finales.\n3. Los iconos ❓ contienen tips técnicos, definiciones y guías de uso rápido.\n4. Usa los botones de 'IA' como base creativa, pero valida siempre la realidad en el Gemba (piso).\n5. Exporta tu archivo JSON periódicamente para evitar pérdida de datos.",
    tutRulesPro: "Sigue el orden lógico D0 -> D8. Saltarse pasos debilita el rigor científico del análisis y puede llevar a soluciones superficiales que no eliminan el problema de raíz.",
    impactsBanner: "Selecciona todos los impactos que genera la desviación para que la IA priorice el análisis de riesgos.",
    financialBanner: "Ingresa los valores estimados de pérdida. Esto ayuda a calcular el Retorno de Inversión (ROI) de las acciones correctivas.",
    ishikawaBanner: "Usa las 6M (Mano de obra, Maquinaria, Métodos, Materiales, Medio Ambiente, Medición) para no dejar fuera ninguna hipótesis.",
    fiveWhysBanner: "Pregunta '¿Por qué?' hasta llegar a la causa raíz sistémica (procesos, políticas) y no solo a la causa física.",
    yokotenBanner: "El Despliegue Horizontal busca prevenir que el mismo error ocurra en procesos o equipos similares en toda la planta.",
    d3Banner: "El Plan de Contención busca detener el efecto del problema de inmediato. Es una medida temporal mientras se encuentra la causa raíz. Generalmente se aplica para un hallazgo de auditoria o un evento inesperado que pone en riesgo a las personas, el proceso y el producto",
    d5Banner: "Las Acciones Correctivas Permanentes (ACP) atacan la causa raíz sistémica para asegurar que el problema no vuelva a ocurrir nunca más.",
    d6Banner: "La Prevención se enfoca en rediseñar el proceso o equipo (Poka-Yoke) para que sea imposible cometer el error humano o técnico.",
    d7Banner: "La Estandarización asegura que el nuevo conocimiento se documente en POEs y se comparta con otras áreas (Yoko-Ten).",
    d8Banner: "El Reporte A3 es el resumen ejecutivo final. Consolida toda la investigación en una sola página para la toma de decisiones gerenciales.",
    d1d2Banner: "El 5W2H es una herramienta para describir el problema de forma completa: Qué, Quién, Dónde, Cuándo, Cómo, Cuántos y Por qué. Utiliza la opción de Agente IA para profundizar mas, mientras mas información suministres, mejor y más detallada será la descripción del fenómeno y el análisis de causas, reduciendo las alucinaciones.",
    fieldInputBanner: "Ingresa la información de forma manual en la ventana inferior o ingresa documentos y archivos. Se recomienda ingresar un documento resumen, luego del análisis obtenido con la opción de Agente IA",
    d4ChecklistBanner: "El Checklist de validación en Gemba permite confirmar o descartar las hipótesis del Ishikawa mediante observación directa.",
    d4ExpBanner: "El Plan Experimental se usa cuando la causa no es evidente y requiere pruebas controladas para ser demostrada.",
    d7PoeBanner: "El Estándar POE asegura que la solución se mantenga en el tiempo y sea la base para el entrenamiento del personal.",
    d7QuizBanner: "La Certificación mediante exámenes asegura que el personal ha comprendido y adoptado el nuevo estándar.",
    responsibleBanner: "Coloca el nombre del líder de la investigación o el responsable del seguimiento del caso.",
    standardsBanner: "Selecciona las normas o estándares afectados por el hallazgo de auditoría para que la IA use el lenguaje técnico adecuado.",
    d5RootCauseBanner: "Esta es la causa raíz sistémica identificada en D4. Las acciones correctivas deben atacar esta falla del sistema.",
    efficacyPlanBanner: "Define el plan de verificación para asegurar que las acciones implementadas realmente eliminaron el problema.",
    warningTitle: "Uso seguro de la Inteligencia Artificial (IA)",
    warningSubtitle: "Recordatorio sobre el uso responsable de la Inteligencia Artificial (IA)",
    warningBody: "Al utilizar esta herramienta, para proteger los datos y la información confidencial, no se debe mencionar el nombre de las compañías, sus marcas, fórmulas y cualquier otra información sensible que puedan comprometer los intereses de la organización.\n\nAsegúrate de cumplir nuestra Política para el Uso e Implementación Seguros de la Inteligencia Artificial (IA).",
    warningFooter: "\"LA SEGURIDAD DE LA INFORMACIÓN ES UN COMPROMISO Y RESPONSABILIDAD DE TODOS\"",
    accept: "ACEPTO",
    decline: "NO ACEPTO",
    resetSection: "Borrar Todo / Reiniciar",
    confirmReset: "Confirmar Borrado",
    selected: "Seleccionado",
    cancel: "Cancelar"
  },
  en: {
    suiteName: "ACR-8D Pro Kit",
    suiteSubtitle: "MdEO Suite",
    scientificMethod: "Scientific Methodology",
    aiConnected: "AI Connected",
    wcmActive: "WCM Suite Active",
    setup: "D0: Setup",
    d1d2: "D1/D2: Definition",
    d3: "D3: Correction",
    d4: "D4: Root Cause",
    d5: "D5: PCA Management",
    d6: "D6: Poka-Yoke",
    d7: "D7: Standards",
    d8: "D8: A3 Report",
    projectMgmt: "Project Management",
    save: "Save",
    load: "Load",
    csvReport: "Excel / CSV Report",
    pdfFullReport: "Full Documentary Evidence PDF Report",
    pdfEfficacyReport: "Efficacy Validation PDF Report",
    docReport: "Full .doc Report",
    startDate: "Start Date",
    caseName: "Case Name",
    responsible: "Responsible",
    caseType: "Case Type",
    impacts: "Deviation Impacts",
    standards: "Audit Standards, Standard, Authorities and Control Entities (Multiple Selection)",
    otherStandardLabel: "Specify Other",
    otherImpactLabel: "Specify Other Impacts",
    initAnalysis: "Start 8D Analysis",
    phenomenology: "Phenomenology",
    techAnalysis: "Technical Problem Analysis",
    defProblem: "Problem Definition",
    finImpact: "Financial Impact",
    fieldInput: "Field Data Input",
    uploadFile: "Upload Document/File",
    aiAgentProblemDef: "AI Agent for Problem Definition",
    aiAgentBanner: "Use AI assistance (Gem) to strengthen the analysis. With this feature you can add all kinds of documents, data, real and direct process evidence, without compromising confidentiality",
    fileTypes: "Supports PDF, Word, Excel, Markdown, TXT",
    extractingText: "Extracting text...",
    fieldPlaceholder: "Describe the failure with PPM, Tolerances, Location...",
    runIA: "Run AI 5W2H",
    run5WhysIA: "RUN 5 WHYS",
    fieldReport: "Structured Field Report (Editable)",
    waitingAnalysis: "Waiting for analysis...",
    costQuality: "Financial Impact & Cost of Quality",
    selectCurrency: "Select Currency",
    estimateCosts: "Estimate Financial Impact",
    totalLoss: "Total Estimated Loss (Editable)",
    correctiveActionPlan: "Correction Plan",
    correctiveActionSub: "Immediate Application",
    correctiveActionTitle: "Immediate Corrections",
    selectCorrectiveAction: "Select Correction",
    generateCorrectiveActions: "AI: Generate Corrections",
    implementationPlan: "Implementation Plan",
    generateImplementationPlan: "AI: Generate Implementation Plan",
    implementationDate: "Implementation Date",
    actionSelected: "Selected Action:",
    edit: "Edit",
    preview: "Pro View",
    createProtocol: "AI: Generate Corrections",
    protocolTitle: "Correction",
    forensicAnalysis: "Process Forensic Analysis",
    ishikawaTitle: "Structured Brainstorming (6M Ishikawa)",
    genIshikawa: "Generate AI Ishikawa",
    selectedHyp: "Fixed Hypotheses:",
    gembaConfirm: "Confirm in Gemba walk",
    floorValidation: "Floor Validation (GEMBA)",
    csvChecklist: "CSV Checklist",
    createChecklist: "Create AI Checklist",
    confirmed: "Confirmed",
    expValidation: "Experimental Validation",
    expPlanTitle: "Engineering Experimental Plan",
    genExpReport: "AI: Validation Report",
    finalCauses: "Confirm Final Causes",
    classifyCauses: "Classify Causes",
    unifiedFailure: "Unified Failure Mode",
    synthFailure: "AI: Synthesize Failure",
    genActions: "AI: Generate Actions",
    pursuitWhys: "Root Cause Pursuit (5 Whys)",
    systemicRoot: "Final Systemic Root Cause",
    rootCauseTitle: "Root Cause",
    confirmedCausesTitle: "Confirmed Causes",
    causesAndActionsTitle: "Causes and Actions",
    advanceACP: "Advance to PCA (D5)",
    eliminateRoot: "Definitive Root Cause Elimination",
    materializePlans: "Materialize AI Plans",
    primary: "Main Root Cause",
    secondary: "Secondary",
    action: "Action",
    term: "Timeframe",
    fix: "Fix",
    preventionDesign: "Error Prevention by Design",
    proposeSolutions: "AI: Propose Solutions",
    expectedBenefit: "Expected Benefit",
    viewGuide: "View Technical Guide",
    execReportA3: "A3 Executive Report",
    genManagerial: "Management CI Summary",
    consolidateA3: "AI: Consolidate A3",
    financialJust: "Financial Justification (AI)",
    riskEval: "Risk & Residue Assessment",
    futureStd: "Standardization & Future",
    closureCycle: "Closing the Cycle",
    genStd: "AI: Generate Standard",
    deploy: "IA: Deploy",
    certification: "Technical Certification",
    createExam: "IA: Create Exam",
    grade: "Grade",
    approved: "Approved",
    notApproved: "No Approved",
    standardPOE: "Standardization (SOP)",
    yokotenTab: "Horizontal (Yoko-Ten)",
    certTab: "Certification",
    efficacyValidation: "Efficacy Validation",
    efficacyValidationPlan: "Efficacy Validation Plan",
    efficacyVerification: "Efficacy Verification",
    effective: "Effective",
    actionId: "Action ID",
    efficacyTitle: "Efficacy Validation Protocols",
    genEfficacy: "Generate Efficacy Protocols",
    genGuide: "AI Guide",
    verificationMethod: "Field Verification Method",
    kpi: "Success Indicator (KPI)",
    auditFrequency: "Efficacy Audit Frequency",
    contingencyPlan: "Technical Contingency Plan",
    executionResponsible: "Execution Responsible",
    executionDate: "Execution Date",
    verificationResponsible: "Verification Responsible",
    verificationDate: "Verification Date",
    auditFinding: "Audit Finding (Non-conformities)",
    foodSafetyComplaints: "Food Safety Complaints",
    improvementOpportunity: "Improvement Opportunity",
    auditDateBanner: "For Audit Findings, it is the date you received the action plan request",
    caseNameBanner: "For Complaints or Audit Findings, include the case number and a short identifying name, e.g., 4235 Poor hand washing habit, 617888 Missing cream",
    caseTypeBanner: "Process deviation is any event, occurrence, complaint, or situation other than an audit finding",
    processDeviation: "Process Deviation",
    quickSolution: "Quick Solution (SR)",
    what: "WHAT",
    who: "WHO",
    where: "WHERE",
    when: "WHEN",
    how: "HOW",
    how_many: "HOW MANY",
    why_is_it_a_problem: "WHY IS IT A PROBLEM",
    affected_clauses: "AFFECTED CLAUSES",
    financialJustTitle: "Financial Justification",
    riskEvalTitle: "Risk Assessment",
    finalCausesTitle: "Confirm Final Causes",
    standardizationTitle: "Standardization & Future",
    actionsTitle: "Definitive Improvement Actions",
    generationDate: "Generation Date",
    typeLabel: "Type",
    successLoad: "Project loaded successfully.",
    errorLoad: "Error loading file.",
    confirmDelete: "Are you sure you want to delete this item?",
    selectHypAlert: "Select at least one hypothesis.",
    noChecklistAlert: "No checklists generated.",
    noExpPlanAlert: "No experimental plan generated.",
    noGembaConfirmAlert: "No causes confirmed in GEMBA.",
    noConfirmedAlert: "No causes confirmed.",
    actionsMaterialized: "Actions materialized.",
    rcaRequired: "RCA required.",
    unknownCause: "Unknown Cause",
    floorCause: "Floor Cause",
    failureModeNotDetermined: "Failure Mode Not Determined",
    implement: "Implement",
    confirmedImpl: "Implementation Confirmed",
    downloadACP: "Download PCA Plan (Sheets)",
    fullReport: "Final Report - Documentary Evidence",
    consultFullA3: "See full report in section D8",
    ishikawaSummary: "Ishikawa 6M (Fixed Causes)",
    expSummary: "Experimental Plan Summary",
    pcaSummary: "Permanent Corrective Actions",
    yokotenSummary: "Horizontal Deployment Summary",
    resExecutivePOE: "Complete SOP Standardization Document",
    resExecutiveYokoten: "Complete Horizontal Deployment Report",
    poeSummaryTitle: "SOP Summary (Objective & Scope)",
    yokotenSummaryTitle: "Deployment Summary (Countermeasures, Plan & Closure)",
    fullScreen: "Full Screen",
    tutorial: "User Guide",
    tutorialTitle: "Operation Manual: ACR-8D Pro Kit",
    tutorialSubtitle: "Master the 8D Scientific Methodology",
    close: "Close",
    next: "Next",
    prev: "Previous",
    proTip: "Technical Pro-Tip",
    operationPro: "Pro Operation",
    methodology: "Methodology",
    stepByStep: "Step by Step",
    dataMgmt: "Data Management",
    evidenceMgmt: "Evidence Management",
    tutD0Title: "D0: Configuración",
    tutD0Content: "The foundation of the analysis. In this stage:\n1. **Start Date**: Define when the event was detected or reported. Click on the calendar to select the exact date.\n2. **Case Name**: Use a code and short description (e.g., '4235 Packaging Failure'). Click the ❓ icon for detailed examples based on case type.\n3. **Responsible**: Enter the full name of the lead investigator coordinating the disciplines.\n4. **Case Type**: Select whether it's a Complaint, Audit Finding, or Process Deviation. This selection is critical as it adapts the impacts and standards to be evaluated.\n5. **Impacts/Standards**: Check all applicable boxes. If a standard isn't listed, use 'Others' to specify it manually.\n6. **'Start Analysis' Button**: Once mandatory fields are complete, click to unlock the full 8D flow.\n7. **'Save' Button**: Stores current data in your browser's local storage. Useful for not losing progress if you close the tab.\n8. **'Load' Button**: Recovers the last locally saved session.\n9. **'Export JSON' Button**: Generates and downloads the investigation master file (.json). It's the only backup that guarantees total data portability.\n10. **'Excel/CSV Report' Button**: Downloads a summary table in CSV format with basic case configuration for quick administrative reports.",
    tutD0Pro: "Analysis quality depends on initial precision. A standardized case name facilitates traceability in historical databases. Remember to export your JSON at the end of every important session.",
    tutD1D2Title: "D1/D2: Definition (The Diagnosis)",
    tutD1D2Content: "Define the problem with scientific rigor to avoid superficial solutions:\n1. **Phenomenology**: Describe the failure raw and objectively. What broke? What didn't work? Use the text box to write in detail.\n2. **'Upload File' Button**: Click to upload photos, PDFs, or support documents. AI will analyze content and extract relevant data automatically.\n3. **'Run AI 5W2H' Button**: AI will process your description and organize it into the 7 dimensions (What, Who, Where, When, How, How Many, Why). Review the generated report.\n4. **5W2H Interaction**: You can click any cell in the generated report to correct or expand information manually. Changes are saved instantly.\n5. **'Financial Impact' Tab**: Switch to this view to quantify the cost of non-quality.\n6. **Cost Calculator**: Enter values in fields like waste, man-hours, or fines. Select your local currency (COP, USD, CRC) from the dropdown.\n7. **'Estimate Impact' Button**: AI will calculate total loss and generate a breakdown by categories (Tangible and Intangible) with impact descriptions.\n8. **'Fix' Button (Pin Icon)**: Ensure the final description is fixed (blue pin) so it consolidates correctly in the A3 executive report.",
    tutD1D2Pro: "A well-defined problem is 50% solved. If the 5W2H shows information gaps, it's a clear signal that the team must return to the Gemba (place of events) to collect more evidence.",
    tutD3Title: "D3: Correction (Immediate Action)",
    tutD3Content: "The goal is to protect the customer and stop the 'bleeding' immediately:\n1. **'AI: Generate Corrections' Button**: AI will suggest containment actions based on the phenomenology defined in D1/D2. They will appear in interactive cards.\n2. **Action Selection**: Review options and click the card of the action the team considers most effective. It will be marked with a blue border.\n3. **'AI: Generate Implementation Plan' Button**: Once an action is selected, click for AI to detail technical steps, responsibles, and deadlines for execution.\n4. **'Fix' Button (Pin Icon)**: It's mandatory to click the blue pin so this containment action appears in the final A3 report.\n5. **Direct Editing**: You can modify action text, responsible, and commitment date by clicking directly on the fields in the plan table.\n6. **'Delete All / Reset' Button**: If suggestions aren't suitable or you want to start over, use this button to clear the section completely.",
    tutD3Pro: "Containment doesn't solve the root, only stops the symptom. It must be implemented in less than 24-48 hours. Ensure operational staff understand it's a temporary measure.",
    tutD4Title: "D4: Root Cause (The Investigation)",
    tutD4Content: "Deep technical investigation to find the systemic 'why':\n1. **'Generate AI Ishikawa' Button**: Creates an automatic fishbone diagram under the 6Ms. Click on cause texts to edit them.\n2. **Hypothesis Selection ('+' Button)**: Click the '+' icon on causes the team suspects are real to 'Fix' them in the validation list.\n3. **'Create AI Checklist' Button**: Generates a question guide to go to the Gemba and physically verify if fixed hypotheses are true or false.\n4. **'AI: Validation Report' Button**: Document your experimental test results. AI will help you write the technical experiment report.\n5. **'Confirm' Button (Check Icon)**: Click the green check on causes that were proven through facts and data at the Gemba or experiments.\n6. **5 Whys Section**: For each confirmed cause, click 'Run 5 Whys'. AI will guide you from physical cause to system failure (systemic root).\n7. **Interaction**: All diagrams and texts are editable. Click on any node or field to adjust technical wording.",
    tutD4Pro: "Don't stop at 'human error'. Keep asking until you find the deficiency in the process, policy, or standard that allowed the human to fail. That is the true systemic root.",
    tutD5Title: "D5: PCA Management (Definitive Solution)",
    tutD5Content: "Design and implement changes that eliminate the root cause forever:\n1. **'Materialize AI Plans' Button**: Generates Permanent Corrective Actions (PCA) that directly attack the systemic root found in D4.\n2. **PCA Configuration**: Define if the action is Primary (attacks root) or Secondary (reinforces system). Assign responsibles and clear dates in the table.\n3. **'Fix' Button (Pin Icon)**: Click the blue pin for each action the team decides to implement so it's included in the A3 report.\n4. **'Download PCA' Button**: Exports the full action plan to an Excel file for easy administrative tracking outside the tool.\n5. **'Go to Implementation' Button**: Move to step 2 where AI will generate detailed technical guides (sparks) on how to execute each fixed action.\n6. **'AI: Generate Guide' Button (Spark Icon)**: In the implementation table, click to get the technical step-by-step for action execution.\n7. **Interaction**: You can edit action text, verification methods, and expected evidence directly in the table cells.",
    tutD5Pro: "A robust PCA must be technical or administrative, not behavioral. If the solution is 're-training', the problem will likely return. Look for Poka-Yokes or process design changes.",
    tutD6Title: "D6: Poka-Yoke (Prevention)",
    tutD6Content: "Total error-proofing through physical or logical devices:\n1. **'AI: Propose Solutions' Button**: AI will suggest anti-error mechanisms (Poka-Yokes) specific to your detected problem.\n2. **'View Technical Guide' Button**: Displays a window with construction details, diagrams, or configuration of the proposed Poka-Yoke.\n3. **'Download PDF Guide' Button**: Generates a professional technical sheet in PDF to deliver to engineering, maintenance, or IT teams.\n4. **'Confirm' Button**: Mark Poka-Yokes the team commits to install. They will be highlighted in green.\n5. **Interaction**: You can adjust solution name, estimated cost, and describe expected benefit to justify investment to management.",
    tutD6Pro: "The best Poka-Yoke is 'Prevention' (makes error impossible), followed by 'Detection' (stops process if error occurs). Always aim for the highest level of proofing.",
    tutD7Title: "D7: Standards (The Closure)",
    tutD7Content: "Ensure knowledge is maintained and multiplied in the organization:\n1. **'SOP Standard' Tab**: Click 'AI: Generate Standard' to create the Standard Operating Procedure draft based on D5/D6 solutions.\n2. **'Yoko-Ten' Tab**: Click 'AI: Deploy' to identify other processes, machines, or plants where this same solution can be applied (Horizontal Deployment).\n3. **'Certification' Tab**: Click 'AI: Create Exam' to generate a 5-question evaluation to validate if staff understood the new standard.\n4. **'Grade' Button**: After applying the exam, enter results and click to evaluate. A score of 4/5 is required for operator certification.\n5. **Interaction**: SOP and Yoko-Ten are editable drafts. Click on text fields to adjust technical wording before official publication.",
    tutD7Pro: "Yoko-Ten is the most powerful tool for global continuous improvement. Don't let a good solution stay locked in one team; share it and multiply the savings.",
    tutD8Title: "D8: A3 Report (Consolidation)",
    tutD8Content: "Consolidate all research into a high-impact executive document:\n1. **'AI: Consolidate A3' Button**: AI will read all previous steps and write a coherent, professional, and results-oriented executive summary.\n2. **'Edit' Button**: Enables editing of A3 boxes so you can polish texts, correct wording, or add specific details.\n3. **'Preview' Button**: Switches to a clean view mode to see how the final document will look before exporting.\n4. **'PDF' Button**: Downloads the A3 report with professional industrial design, ready for presentation in management committees or external audits.\n5. **'Efficacy Validation' Section**: This section is automatically populated from data entered in the final validation module (D8/Efficacy).\n6. **Interaction**: In edit mode, you can adjust text size and information distribution to ensure the problem 'story' is clear.",
    tutD8Pro: "A good A3 should be readable in 5 minutes and give a clear view of root cause and solution effectiveness. It's your calling card as an expert investigator.",
    tutEfficacyTitle: "Efficacy Validation",
    tutEfficacyContent: "The final proof that the problem has been eradicated:\n1. **'Generate Protocols' Button**: AI will define a specific audit plan to verify that D5 PCAs are actually working over time.\n2. **'AI: Generate Guide' Button (Spark Icon)**: Click the spark icon in the table to get detailed instructions on how to perform the field verification audit.\n3. **'Efficacy (YES/NO)' Selector**: After physical verification in the process, mark the final result. If you select 'NO', the system will suggest restarting the analysis.\n4. **'Reset' Button**: If the solution failed, use this button to clear necessary stages and re-investigate the true systemic root cause.\n5. **Interaction**: You can edit KPIs, verification methods, and suggested frequencies to match your internal management systems.",
    tutEfficacyPro: "Don't confuse 'completing the action' with 'being effective'. Efficacy is measured in indicators: if the defect disappeared or dropped to the expected level, then the solution was effective.",
    tutDataContent: "The tool saves your progress automatically in the browser's local storage. The 'Export JSON' button downloads a file you can share by email or keep as an official backup. 'Load JSON' allows you to resume previous research or review old cases at any time.",
    tutDataPro: "Always export at the end of the day or upon completing a milestone. JSON files are lightweight and ensure you never lose your research due to cache clearing or equipment change.",
    tutRulesTitle: "Golden Rules",
    tutRulesContent: "1. AI is an expert co-pilot, you are the captain: always review and edit generated texts. 2. You MUST click 'Fix' on key elements to travel to final reports. 3. ❓ icons contain deep technical tips and definitions. 4. Use 'AI' buttons as a creative base, but always validate reality at the Gemba (floor).",
    tutRulesPro: "Follow the logical order D0 -> D8. Skipping steps weakens the scientific rigor of the analysis and can lead to superficial solutions that don't eliminate the root problem.",
    impactsBanner: "Select all impacts generated by the deviation so the AI prioritizes risk analysis.",
    financialBanner: "Enter estimated loss values. This helps calculate the Return on Investment (ROI) of corrective actions.",
    ishikawaBanner: "Use the 6Ms (Manpower, Machinery, Methods, Materials, Environment, Measurement) to ensure no hypothesis is left out.",
    fiveWhysBanner: "Ask 'Why?' until you reach the systemic root cause (processes, policies) and not just the physical cause.",
    yokotenBanner: "Horizontal Deployment seeks to prevent the same error from occurring in similar processes or equipment throughout the plant.",
    d3Banner: "The Containment Plan seeks to stop the effect of the problem immediately. It is a temporary measure while the root cause is found.",
    d5Banner: "Permanent Corrective Actions (PCA) attack the systemic root cause to ensure the problem never happens again.",
    d6Banner: "Prevention focuses on redesigning the process or equipment (Poka-Yoke) so that human or technical error is impossible.",
    d7Banner: "Standardization ensures that new knowledge is documented in SOPs and shared with other areas (Yoko-Ten).",
    d8Banner: "The A3 Report is the final executive summary. It consolidates all research into a single page for management decision-making.",
    d1d2Banner: "The 5W2H is a tool to fully describe the problem: What, Who, Where, When, How, How Many, and Why. Use the AI Agent option to delve deeper; the more information you provide, the better and more detailed the description of the phenomenon and the cause analysis will be, reducing hallucinations.",
    fieldInputBanner: "Enter the information manually in the window below or upload documents and files. It is recommended to enter a summary document after the analysis obtained using the AI Agent option.",
    d4ChecklistBanner: "The Gemba validation checklist allows confirming or discarding Ishikawa hypotheses through direct observation.",
    d4ExpBanner: "The Experimental Plan is used when the cause is not obvious and requires controlled tests to be demonstrated.",
    d7PoeBanner: "The SOP Standard ensures that the solution is maintained over time and serves as the basis for personnel training.",
    d7QuizBanner: "Certification through exams ensures that personnel have understood and adopted the new standard.",
    warningTitle: "Safe use of Artificial Intelligence (AI)",
    warningSubtitle: "Reminder on the responsible use of Artificial Intelligence (AI)",
    warningBody: "When using this tool, to protect data and confidential information, you must not mention the names of companies, their brands, formulas, and any other sensitive information that could compromise the interests of the organization.\n\nMake sure to comply with our Policy for the Safe Use and Implementation of Artificial Intelligence (AI).",
    warningFooter: "\"INFORMATION SECURITY IS EVERYONE'S COMMITMENT AND RESPONSIBILITY\"",
    accept: "I ACCEPT",
    decline: "I DO NOT ACCEPT",
    resetSection: "Delete All / Reset",
    confirmReset: "Confirm Reset",
    selected: "Selected",
    cancel: "Cancel"
  }
};

const handleDownloadPDF = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const content = element.innerHTML;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; -webkit-print-color-adjust: exact; }
          .official-document { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
          .no-print { display: none !important; }
          h1, h2, h3 { page-break-after: avoid; }
          .page-break { page-break-before: always; }
          div { page-break-inside: auto; }
          .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; background: #f8fafc; margin-bottom: 1.5rem; padding: 1.5rem; }
        </style>
      </head>
      <body>
        <div class="max-w-full">
          ${content}
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const formatCurrencyInput = (value: string, currency: string) => {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";
  const amount = parseInt(numericValue, 10);
  if (isNaN(amount)) return "";
  let locale = 'es-CO';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'CRC') locale = 'es-CR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const renderStyledMarkdown = (text: string) => {
  if (!text) return null;
  
  let contentToProcess = text.trim();

  contentToProcess = contentToProcess.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

  if (contentToProcess.startsWith('"') && contentToProcess.endsWith('"')) {
    contentToProcess = contentToProcess.substring(1, contentToProcess.length - 1);
  }

  try {
    const isPossiblyJson = (contentToProcess.startsWith('{') && contentToProcess.endsWith('}')) || (contentToProcess.startsWith('[') && contentToProcess.endsWith(']'));
    if (isPossiblyJson) {
      const parsed = JSON.parse(contentToProcess);
      if (typeof parsed === 'object' && parsed !== null) {
        const flattenToMarkdown = (obj: any, depth = 0): string => {
          let output = "";
          if (Array.isArray(obj)) {
            obj.forEach((item) => {
              output += flattenToMarkdown(item, depth);
            });
          } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (typeof value === 'object' && value !== null) {
                if (depth === 0 && Object.keys(obj).length === 1) {
                  output += flattenToMarkdown(value, depth);
                } else {
                  output += `\n**${formattedKey}**\n${flattenToMarkdown(value, depth + 1)}\n`;
                }
              } else {
                output += `\n**${formattedKey}:** ${value}\n`;
              }
            });
          } else {
            output += String(obj) + "\n";
          }
          return output;
        };
        contentToProcess = flattenToMarkdown(parsed);
      }
    }
  } catch (e) {}

  contentToProcess = contentToProcess.replace(/([0-9]+\.\s)/g, '\n$1');
  contentToProcess = contentToProcess.replace(/(•\s)/g, '\n$1');

  const lines = contentToProcess.split('\n').filter(l => l.trim() !== "");
  
  const headerKeywords = [
    "REPORTE EXPERIMENTAL", "MECANISMO DE FALLA", "OBJETIVO DEL EXPERIMENTO", 
    "VARIABLES", "EQUIPOS", "PROCEDIMIENTO", "CRITERIO DE CONFIRMACIÓN",
    "PROTOCOL DE CONTENCIÓN", "RESUMEN EJECUTIVO", "EVALUACIÓN DE RIESGOS",
    "EXPERIMENTAL REPORT", "FAILURE MECHANISM", "EXPERIMENTAL OBJECTIVE",
    "CONTAINMENT PROTOCOL", "EXECUTIVE SUMMARY", "RISK ASSESSMENT",
    "CRITERIO DE CONFIRMACIÓN FINAL", "PROCEDIMIENTO PASO A PASO",
    "PROCEDIMIENTO OPERATIVO ESTÁNDAR", "STANDARD OPERATING PROCEDURE",
    "DESPLIEGUE HORIZONTAL", "HORIZONTAL DEPLOYMENT", "LECCIÓN APRENDIDA",
    "CONTRAMEDIDAS", "VALIDACIÓN Y CIERRE", "OBJETIVO", "ALCANCE",
    "RESPONSABILIDADES", "DEFINICIONES", "SEGURIDAD", "CALIDAD"
  ];

  return lines.map((line, i) => {
    const trimmedLine = line.trim();
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = line.split(boldRegex);
    
    const hasBold = parts.length >= 3;
    const boldText = hasBold ? parts[1].toUpperCase() : "";
    
    const isMainHeader = hasBold && (
        (parts[0].trim() === "" && parts[2].trim() === "") || 
        headerKeywords.some(k => boldText.includes(k))
    );
    
    const isKeyLabel = trimmedLine.startsWith('**') && trimmedLine.includes(':**');

    if (isMainHeader && !isKeyLabel) {
        const trailingText = parts.slice(2).join('').trim().replace(/^[:\s-]+/, '');
        
        return (
            <div key={i} className="animate-slide-in">
                <div className="mb-4 mt-8 bg-slate-100 border-l-8 border-slate-900 px-6 py-4 rounded-r-2xl shadow-sm">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest leading-none">
                        {parts[1]}
                    </span>
                </div>
                {trailingText !== "" && (
                    <div className="mb-3 text-slate-700 leading-relaxed text-sm antialiased pl-6 font-medium">
                        {trailingText}
                    </div>
                )}
            </div>
        );
    }

    const content = parts.map((part, index) => {
      if (index % 2 === 1) {
        const cleanPart = part.replace(/:$/, '');
        return (
          <strong key={index} className="text-slate-900 font-extrabold tracking-tight bg-slate-50 px-1 rounded">
            {cleanPart}{part.endsWith(':') ? ':' : ''}
          </strong>
        );
      }
      return part;
    });

    return (
      <div key={i} className={`mb-3 text-slate-700 leading-relaxed text-sm antialiased ${trimmedLine.startsWith('•') || /^[0-9]+\./.test(trimmedLine) ? 'pl-6 relative' : ''}`}>
        {trimmedLine.startsWith('•') && <span className="absolute left-1 text-slate-400 font-black">•</span>}
        {content}
      </div>
    );
  });
};

const auditStandards = [
  "ISO9001", "ISO14001", "ISO45001", "ISO19011", "ISO50001", 
  "BASC", "SMETA", "FSSC22000", "SQF", "HACCP", "FSMA", "FSVP",
  "INVIMA", "SENASA", "FDA", "DSHS", "Otros"
];

const deviationImpacts = {
  es: [
    "SST", "Calidad", "Inocuidad", "Ambiental", "Seguridad física", 
    "Seguridad Comercial", "Quejas", "hallazgos internos", "Productividad", 
    "Costo de conversión", "Mano de obra", "Recorte", "Sobrepeso", 
    "Materia prima", "Material de empaque", "Logística y Distribución", "Clientes", "Otros"
  ],
  en: [
    "HSE", "Quality", "Food Safety", "Environment", "Physical Security",
    "Commercial Security", "Complaints", "Internal Findings", "Productivity",
    "Conversion Cost", "Labor", "Trim", "Overweight",
    "Raw Material", "Packaging Material", "Logistics & Distribution", "Clients", "Others"
  ]
};

const foodSafetyImpacts = {
  es: [
    "Peligro físico", "Peligro químico", "Peligro biológico", "Otros"
  ],
  en: [
    "Physical hazard", "Chemical hazard", "Biological hazard", "Others"
  ]
};

const mCategoriesLocal = {
  es: ["Mano de Obra", "Maquinaria", "Materiales", "Métodos", "Medición", "Medio Ambiente"],
  en: ["Manpower", "Machinery", "Materials", "Methods", "Measurement", "Environment"]
};

const DEFAULT_COST_INPUTS: CostInputs = {
  manoDeObra: "",
  materiaPrima: "",
  materialEmpaque: "",
  recorte: "",
  desperdicio: "",
  productoTerminado: "",
  logisticos: "",
  ensayosPruebas: "",
  otros: "",
  maquinariaEquipos: "",
  infraestructura: "",
  lucroCesante: ""
};

const INITIAL_STATE: AppState = {
  language: 'es',
  setup: {
    startDate: (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
    caseName: "",
    responsible: "",
    type: "Desviación de proceso",
    impact: ["Calidad"],
    standards: [],
    otherStandard: "",
    otherImpact: ""
  },
  d2: { fieldDataInput: "", images: [], phenomenon: "", analysis: "" },
  costs: { 
    currency: 'COP',
    totalLoss: "", 
    breakdown: [],
    inputs: DEFAULT_COST_INPUTS
  },
  d3: {
    correctiveActions: [],
    selectedCorrectiveActionIds: [],
    implementationPlan: "",
    isNotApplicable: false
  },
  d4: { 
    step: 1,
    hypotheses: [], 
    selectedHypotheses: [], 
    gembaDiagnostics: [], 
    observationChecks: {},
    provenCauses: [], 
    finalCause: "", 
    fiveWhysHistory: [], 
    verificationPlan: "",
    experimentalConfirmedCauses: [],
    primaryCauseId: null,
    secondaryActions: {},
    syntheticCause: null,
    fixedRootCauseIds: [],
    gembaConclusions: ""
  },
  d5_d6: { 
    pokaYokes: [], 
    acpPlans: [], 
    implementationPlan: "",
    step: 1,
    implementationSuggestions: {}
  },
  d7: { a3Report: undefined },
  d8: { poe: "", yokoTen: "", quiz: [] },
  efficacy: { protocols: [], verificationGuides: {} }
};

const ResetButton = ({ onReset, t }: any) => {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-2 animate-slide-in">
        <button onClick={() => { onReset(); setConfirm(false); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
          {t('confirmReset')}
        </button>
        <button onClick={() => setConfirm(false)} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
          {t('cancel')}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)} className="p-2 text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 group" title={t('resetSection')}>
      <TrashIcon className="w-4 h-4" />
      <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">{t('resetSection')}</span>
    </button>
  );
};

const AutoExpandingTextarea = ({ value, onChange, className, placeholder, disabled, style, onClick }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      onClick={onClick}
      className={`${className} overflow-hidden resize-none w-full block`}
      style={{ ...style, minHeight: '1.5rem' }}
    />
  );
};

const TutorialModal = ({ isOpen, onClose, t, step, setStep }: any) => {
  if (!isOpen) return null;

  const steps = [
    { title: t('tutRulesTitle'), content: t('tutRulesContent'), icon: StarIcon, color: 'bg-amber-500', pro: t('tutRulesPro'), points: [t('scientificMethod'), t('aiConnected'), t('wcmActive')] },
    { title: t('tutD0Title'), content: t('tutD0Content'), icon: AdjustmentsHorizontalIcon, color: 'bg-blue-500', pro: t('tutD0Pro'), points: [t('startDate'), t('caseName'), t('caseType')] },
    { title: t('tutD1D2Title'), content: t('tutD1D2Content'), icon: MagnifyingGlassIcon, color: 'bg-indigo-500', pro: t('tutD1D2Pro'), points: [t('phenomenology'), t('finImpact'), '5W2H'] },
    { title: t('tutD3Title'), content: t('tutD3Content'), icon: ShieldCheckIcon, color: 'bg-slate-700', pro: t('tutD3Pro'), points: [t('correctiveActionTitle'), t('implementationPlan'), t('fix')] },
    { title: t('tutD4Title'), content: t('tutD4Content'), icon: ClipboardDocumentCheckIcon, color: 'bg-rose-500', pro: t('tutD4Pro'), points: [t('ishikawaTitle'), t('floorValidation'), t('pursuitWhys')] },
    { title: t('tutD5Title'), content: t('tutD5Content'), icon: WrenchScrewdriverIcon, color: 'bg-emerald-500', pro: t('tutD5Pro'), points: [t('eliminateRoot'), t('materializePlans'), t('responsible')] },
    { title: t('tutD6Title'), content: t('tutD6Content'), icon: LightBulbIcon, color: 'bg-orange-500', pro: t('tutD6Pro'), points: [t('preventionDesign'), t('viewGuide'), 'Poka-Yoke'] },
    { title: t('tutD7Title'), content: t('tutD7Content'), icon: ArrowPathIcon, color: 'bg-cyan-500', pro: t('tutD7Pro'), points: [t('standardPOE'), t('yokotenTab'), t('certification')] },
    { title: t('tutD8Title'), content: t('tutD8Content'), icon: CheckBadgeIcon, color: 'bg-violet-500', pro: t('tutD8Pro'), points: [t('execReportA3'), t('fullReport'), 'PDF Export'] },
    { title: t('tutEfficacyTitle'), content: t('tutEfficacyContent'), icon: ShieldCheckIcon, color: 'bg-emerald-600', pro: t('tutEfficacyPro'), points: [t('verificationMethod'), t('kpi'), t('auditFrequency')] },
    { title: t('dataMgmt'), content: t('tutDataContent'), icon: CloudArrowDownIcon, color: 'bg-slate-900', pro: t('tutDataPro'), points: [t('save'), t('load'), t('resetSection')] }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[600px] animate-scale-up">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-6">
            <div className={`p-3 rounded-xl shadow-lg ${current.color}`}><current.icon className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{t('tutorialTitle')}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('tutorialSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 custom-scroll">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">{t('methodology')}</div>
              <h3 className="text-xl font-black text-slate-900 leading-none tracking-tighter">{current.title}</h3>
              <p className="text-base font-medium text-slate-600 leading-relaxed">{current.content}</p>
            </div>
            <div className={`rounded-[2rem] p-6 border transition-all duration-500 ${current.color.replace('bg-', 'bg-opacity-5 border-').replace('500', '100').replace('700', '100').replace('900', '100')} space-y-4`}>
              <div className="flex items-center gap-3 mb-1">
                <SparklesIcon className={`w-5 h-5 ${current.color.replace('bg-', 'text-')}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${current.color.replace('bg-', 'text-')}`}>{t('operationPro')}</span>
              </div>
              <div className="space-y-3">
                {current.points.map((point: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 flex-shrink-0">{idx + 1}</div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-wider">{point}</p>
                  </div>
                ))}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <div className={`p-1.5 rounded-lg shadow-md ${current.color}`}><LightBulbIcon className="w-5 h-5 text-white" /></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('proTip')}</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{current.pro}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-10 bg-blue-600' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex gap-4">
            <button 
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${step === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-100'}`}
            >
              <ChevronLeftIcon className="w-6 h-6" /> {t('prev')}
            </button>
            <button 
              onClick={() => step === steps.length - 1 ? onClose() : setStep(step + 1)}
              className="flex items-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-[0.95]"
            >
              {step === steps.length - 1 ? t('close') : t('next')} <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WarningModal = ({ onAccept, onDecline, t, lang, onToggleLanguage }: any) => {
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);

  const handleDecline = () => {
    setShowDeclineMessage(true);
    onDecline(); // This still calls the parent's decline if needed, but we'll show the message here
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-scale-up border-4 border-amber-500 relative my-auto max-h-[95vh]">
        {/* Language Toggle in Modal */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <button 
            onClick={onToggleLanguage}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-white/30 transition-all flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="w-3 h-3" />
            {lang === 'es' ? 'English' : 'Español'}
          </button>
        </div>

        <div className="p-6 md:p-10 bg-amber-500 text-white flex flex-col items-center text-center gap-3 md:gap-4 flex-shrink-0">
          <div className="p-3 md:p-4 bg-white/20 rounded-full backdrop-blur-md">
            <ExclamationTriangleIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter leading-none mb-1 md:mb-2">{t('warningTitle')}</h2>
            <p className="text-[9px] md:text-xs font-bold text-amber-100 uppercase tracking-widest">{t('warningSubtitle')}</p>
          </div>
        </div>
        
        <div className="p-6 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <div className="prose prose-slate max-w-none">
            <p className="text-base md:text-lg font-medium text-slate-700 leading-relaxed text-center mb-6 md:mb-8 whitespace-pre-wrap">
              {t('warningBody')}
            </p>
            
            {showDeclineMessage && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-center animate-bounce">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  {lang === 'es' ? "Debe aceptar los términos para utilizar la herramienta." : "You must accept the terms to use the tool."}
                </p>
              </div>
            )}

            <div className="p-4 md:p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center">
              <p className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                {t('warningFooter')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center flex-shrink-0">
          <button 
            onClick={handleDecline}
            className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 bg-white text-slate-400 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 hover:bg-slate-100 transition-all"
          >
            {t('decline')}
          </button>
          <button 
            onClick={onAccept}
            className="w-full sm:w-auto px-12 py-3 md:px-16 md:py-4 bg-emerald-600 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 active:scale-[0.95] transition-all"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SETUP);
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [banner, setBanner] = useState<{ title: string; content: string } | null>(null);

  const handleAcceptWarning = () => {
    setWarningAccepted(true);
  };

  const handleDeclineWarning = () => {
    // No longer using alert, handled inside WarningModal
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const lang = state?.language || 'es';
  const t = (key: string): string => {
    const dict = (translations as any)[lang] || translations.es;
    return dict[key] || (translations.es as any)[key] || key;
  };

  const handleGeminiCall = async (
    key: string, 
    system: string, 
    user: string, 
    temp = 0.4, 
    schema?: any,
    callback?: (data: any) => void
  ) => {
    setLoading(key);
    let finalSystem = system;

    if (state.setup.type === 'Hallazgo de Auditoría, ACPM' && (state.setup.standards || []).length > 0) {
      const standardsList = state.setup.standards.join(', ');
      const audText = lang === 'es' 
        ? `Adicionalmente a tu rol principal, actúa como un Auditor y Consultor experto certificado en las siguientes normas o regulaciones: ${standardsList}. Tu análisis debe ser coherente con los requisitos, el lenguaje y el marco normativo de cada una de estas entidades o estándares.`
        : `Additionally to your primary role, act as a certified expert Auditor and Consultant for the following standards or regulations: ${standardsList}. Your analysis must be consistent with the requirements, language, and regulatory framework of each of these entities or standards.`;
      finalSystem = `${audText} ${finalSystem}`;
    }

    if ((state.setup.type === 'Desviación de proceso' || state.setup.type === 'Solución Rápida (SR)') && state.setup.impact && (state.setup.impact || []).length > 0) {
      const impactsList = state.setup.impact.join(', ');
      const impText = lang === 'es'
        ? `Adicionalmente, actúa como un consultor experto senior multidisciplinario especializado en los siguientes impactos: ${impactsList}. Considera profundamente las repercusiones críticas, legales, operativas y financieras que cada uno de estos tipos de impacto conlleva para la organización.`
        : `Additionally, act as a multidisciplinary senior expert consultant specialized in the following impacts: ${impactsList}. Deeply consider the critical, legal, operational, and financial repercussions each of these impacts entails for the organization.`;
      finalSystem = `${impText} ${finalSystem}`;
    }

    try {
      const data = await callGemini(finalSystem, user, temp, schema);
      if (callback) callback(data);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      alert(`${t('waitingAnalysis')} Error: ${error?.message || 'Error'}`);
    } finally {
      setLoading(null);
    }
  };

  const getProblemContext = () => {
    const { phenomenon, fiveW2H } = state.d2;
    if (!phenomenon && (!fiveW2H || !fiveW2H.what)) return "";
    
    let context = lang === 'es' ? "\n\nCONTEXTO DEL PROBLEMA DEFINIDO (D2):\n" : "\n\nDEFINED PROBLEM CONTEXT (D2):\n";
    context += `${lang === 'es' ? 'FENÓMENO' : 'PHENOMENON'}: ${phenomenon}\n\n`;
    context += `${lang === 'es' ? 'ANÁLISIS 5W2H' : '5W2H ANALYSIS'}:\n`;
    if (fiveW2H) {
      context += `- ${lang === 'es' ? 'QUÉ' : 'WHAT'}: ${fiveW2H.what}\n`;
      context += `- ${lang === 'es' ? 'QUIÉN' : 'WHO'}: ${fiveW2H.who}\n`;
      context += `- ${lang === 'es' ? 'DÓNDE' : 'WHERE'}: ${fiveW2H.where}\n`;
      context += `- ${lang === 'es' ? 'CUÁNDO' : 'WHEN'}: ${fiveW2H.when}\n`;
      context += `- ${lang === 'es' ? 'CÓMO' : 'HOW'}: ${fiveW2H.how}\n`;
      context += `- ${lang === 'es' ? 'CUÁNTO' : 'HOW MANY'}: ${fiveW2H.how_many}\n`;
      context += `- ${lang === 'es' ? 'POR QUÉ' : 'WHY'}: ${fiveW2H.why_is_it_a_problem}\n`;
    }
    return context;
  };

  const exportProject = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const caseSafeName = state.setup.caseName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'Proyecto_Sin_Nombre';
    const exportFileDefaultName = `Proyecto_8D_${caseSafeName}_${(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json.setup && json.d2 && json.d4) {
            const migratedState: AppState = {
              ...INITIAL_STATE,
              ...json,
              efficacy: {
                ...INITIAL_STATE.efficacy,
                ...(json.efficacy || {})
              },
              costs: {
                ...INITIAL_STATE.costs,
                ...json.costs,
                inputs: { ...DEFAULT_COST_INPUTS, ...(json.costs?.inputs || {}) },
                breakdown: json.costs?.breakdown || []
              },
              d4: {
                ...INITIAL_STATE.d4,
                ...json.d4,
                hypotheses: json.d4?.hypotheses || [],
                selectedHypotheses: json.d4?.selectedHypotheses || [],
                gembaDiagnostics: json.d4?.gembaDiagnostics || [],
                observationChecks: json.d4?.observationChecks || {},
                experimentalConfirmedCauses: json.d4?.experimentalConfirmedCauses || [],
                primaryCauseId: json.d4?.primaryCauseId || null,
                secondaryActions: json.d4?.secondaryActions || {},
                syntheticCause: json.d4?.syntheticCause || null,
                fiveWhysHistory: (json.d4?.fiveWhysHistory || []).map((h: any) => ({ 
                  ...h, 
                  id: h.id || `5w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
                }))
              },
              d5_d6: {
                ...INITIAL_STATE.d5_d6,
                ...json.d5_d6,
                acpPlans: json.d5_d6?.acpPlans || [],
                pokaYokes: json.d5_d6?.pokaYokes || []
              },
              d7: {
                a3Report: json.d7?.a3Report || json.d5_d6?.a3Report
              },
              d8: {
                poe: json.d8?.poe || json.d7?.poe || "",
                yokoTen: json.d8?.yokoTen || json.d7?.yokoTen || "",
                quiz: json.d8?.quiz || json.d7?.quiz || []
              }
            };
            setState(migratedState);
            alert(t('successLoad'));
          } else {
            throw new Error("Invalid structure.");
          }
        } catch (error) {
          alert(t('errorLoad'));
        }
      };
    }
  };

  const handleDownloadPDF = (elementId: string, title: string) => {
    const printElement = document.getElementById(elementId);
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - ${state.setup.caseName || 'Reporte'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                .page-break { page-break-before: always; }
                body { padding: 0; margin: 0; }
              }
              body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
              .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 1.5rem; background-color: #ffffff; margin-bottom: 1.5rem; }
            </style>
          </head>
          <body class="p-8 bg-white text-slate-900">
            ${printElement.innerHTML}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 600);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const toggleLanguage = () => {
    setState(prev => ({ ...prev, language: prev.language === 'es' ? 'en' : 'es' }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const exportToCSV = () => {
    const data: any[][] = [
      ["REPORTE ESTRUCTURADO 8D - ANÁLISIS DE CAUSA RAÍZ"],
      ["Generado el:", new Date().toLocaleString()],
      [],
      ["DISCIPLINA", "SECCIÓN", "CAMPO", "VALOR"]
    ];

    // D0 Setup
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('startDate'), state.setup.startDate]);
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('caseName'), state.setup.caseName]);
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('responsible'), state.setup.responsible]);
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('caseType'), state.setup.type]);
    data.push(["D0: CONFIGURACIÓN", "REQUISITOS", `${t('impacts')}/${t('standards')}`, (state.setup.impact || state.setup.standards || []).join(' | ')]);

    // D1/D2 Definition
    data.push(["D1/D2: DEFINICIÓN", "FENOMENOLOGÍA", t('phenomenology'), state.d2.phenomenon]);
    if (state.d2.fiveW2H) {
      Object.entries(state.d2.fiveW2H).forEach(([k, v]) => {
        data.push(["D1/D2: DEFINICIÓN", "5W2H", k.toUpperCase(), String(v)]);
      });
    }

    // Financial
    data.push(["D1/D2: DEFINICIÓN", "IMPACTO FINANCIERO", "PÉRDIDA TOTAL", `${state.costs.totalLoss} ${state.costs.currency}`]);
    (state.costs.breakdown || []).forEach(b => {
      data.push(["D1/D2: DEFINICIÓN", "DETALLE COSTOS", b.category, `${b.estimated_value} | ${b.impact_description}`]);
    });

    // D3 Correction
    if (state.d3.isNotApplicable) {
      data.push(["D3: CORRECCIÓN", "NO APLICA", "DETALLE", "No aplica para este caso"]);
    } else {
      const selectedActions = state.d3.selectedCorrectiveActionIds.length > 0 
        ? state.d3.correctiveActions.filter(a => state.d3.selectedCorrectiveActionIds.includes(a.id)) 
        : [];
      
      if (selectedActions.length > 0) {
        selectedActions.forEach((action, idx) => {
          data.push([`D3: CORRECCIÓN (${idx + 1})`, "ACCIÓN SELECCIONADA", "DESCRIPCIÓN", action.action]);
          data.push([`D3: CORRECCIÓN (${idx + 1})`, "ACCIÓN SELECCIONADA", "RESPONSABLE", action.responsible]);
          data.push([`D3: CORRECCIÓN (${idx + 1})`, "ACCIÓN SELECCIONADA", "FECHA", action.implementationDate]);
        });
      } else {
        data.push(["D3: CORRECCIÓN", "ACCIÓN SELECCIONADA", "DESCRIPCIÓN", '']);
        data.push(["D3: CORRECCIÓN", "ACCIÓN SELECCIONADA", "RESPONSABLE", '']);
        data.push(["D3: CORRECCIÓN", "ACCIÓN SELECCIONADA", "FECHA", '']);
      }
      data.push(["D3: CORRECCIÓN", "PLAN DE IMPLEMENTACIÓN", "DETALLE", state.d3.implementationPlan]);
    }

    // D4 RCA
    data.push(["D4: CAUSA RAÍZ", "ISHIKAWA", t('ishikawaSummary'), state.d4.hypotheses.filter(h => state.d4.selectedHypotheses.includes(h.id)).map(h => `[${h.category}] ${h.text}`).join(' | ')]);
    data.push(["D4: CAUSA RAÍZ", "PLAN EXPERIMENTAL", t('expSummary'), state.d4.verificationPlan]);
    data.push(["D4: CAUSA RAÍZ", "CAUSAS CONFIRMADAS", "LISTADO", state.d4.experimentalConfirmedCauses.map(id => state.d4.gembaDiagnostics.find(d => d.hypothesisId === id)?.cause || id).join(' | ')]);
    data.push(["D4: CAUSA RAÍZ", "MODO DE FALLA", t('unifiedFailure'), state.d4.syntheticCause?.text || state.d4.finalCause]);

    (state.d4.fiveWhysHistory || []).forEach((h, idx) => {
      data.push(["D4: CAUSA RAÍZ", "5 PORQUÉS", `ANÁLISIS ${idx+1}`, h.systemicRootCause]);
    });

    // D5 ACP
    (state.d5_d6.acpPlans || []).forEach(p => {
      p.actions.filter(a => a.isFixed).forEach(a => {
        data.push(["D5: GESTIÓN ACP", "ACCIONES FIJADAS", p.title, `${a.action} | RESP: ${a.responsible} | PLAZO: ${a.timeframe}`]);
      });
    });

    // D6 Poka-Yoke
    (state.d5_d6.pokaYokes || []).forEach(py => {
      data.push(["D6: POKA-YOKE", "DISPOSITIVO", py.type, `${py.description} | BENEFICIO: ${py.benefit}`]);
    });

    // Efficacy
    (state.efficacy.protocols || []).forEach((p, idx) => {
      data.push(["VALIDACIÓN EFICACIA", `PROTOCOLO ${idx+1}`, p.action, `${p.verificationMethod} | KPI: ${p.kpi} | FREQ: ${p.auditFrequency}`]);
    });

    // D7 A3
    if (state.d7.a3Report) {
      data.push(["D7: ESTÁNDARES", "RESUMEN A3", "JUSTIFICACIÓN FINANCIERA", state.d7.a3Report.financialJustification]);
      data.push(["D7: ESTÁNDARES", "RESUMEN A3", "EVALUACIÓN DE RIESGOS", state.d7.a3Report.risks]);
    }

    // D8 Standards
    data.push(["D8: REPORTE A3", "POE", "RESUMEN", state.d8.poe]);
    data.push(["D8: REPORTE A3", "YOKOTEN", "DESPLIEGUE", state.d8.yokoTen]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte 8D");
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 80 }];
    XLSX.writeFile(wb, `Reporte_Full_8D_${state.setup.caseName || 'Proyecto'}.xlsx`);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-200">
      {!warningAccepted && (
        <WarningModal 
          onAccept={handleAcceptWarning} 
          onDecline={handleDeclineWarning} 
          t={t} 
          lang={lang}
          onToggleLanguage={toggleLanguage}
        />
      )}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm">
        <div className="py-3 px-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-900 rounded-lg shadow-md"><BuildingOffice2Icon className="w-5 h-5 text-white" /></div>
            <div className="leading-tight">
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none mb-0.5">{t('suiteName')}</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('suiteSubtitle')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow py-2 px-2.5 space-y-0.5 overflow-y-auto custom-scroll">
          {[
            { id: Tab.SETUP, label: t('setup'), icon: AdjustmentsHorizontalIcon },
            { id: Tab.D1_D2, label: t('d1d2'), icon: MagnifyingGlassIcon },
            { id: Tab.D3, label: t('d3'), icon: ShieldCheckIcon },
            { id: Tab.D4, label: t('d4'), icon: ClipboardDocumentCheckIcon },
            { id: Tab.D5, label: t('d5'), icon: WrenchScrewdriverIcon },
            { id: Tab.D6, label: t('d6'), icon: LightBulbIcon },
            { id: Tab.D7, label: t('d7'), icon: ArrowPathIcon },
            { id: Tab.D8, label: t('d8'), icon: CheckBadgeIcon },
            { id: Tab.EFFICACY, label: t('efficacyValidation'), icon: ShieldCheckIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wider text-left ${
                activeTab === item.id ? 'sidebar-item-active shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left leading-tight truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <button onClick={() => setShowTutorial(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-100 border border-blue-100">
            <BookOpenIcon className="w-3.5 h-3.5" /> {t('tutorial')}
          </button>
          <button onClick={toggleLanguage} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]">
             {lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          </button>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pt-0.5 px-1">{t('projectMgmt')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={exportProject} className="flex items-center justify-center gap-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.95]"><ArrowDownTrayIcon className="w-3.5 h-3.5 text-blue-600" /> {t('save')}</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.95]"><ArrowUpTrayIcon className="w-3.5 h-3.5 text-orange-600" /> {t('load')}</button>
            <input type="file" ref={fileInputRef} onChange={importProject} accept=".json" className="hidden" />
          </div>
          <button onClick={exportToCSV} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 border border-slate-200 active:scale-[0.98]">
            <CloudArrowDownIcon className="w-3.5 h-3.5" /> {t('csvReport')}
          </button>
          <button onClick={() => handleDownloadPDF('full-report-print', t('fullReport'))} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm active:scale-[0.98]">
            <DocumentIcon className="w-3.5 h-3.5" /> {t('pdfFullReport')}
          </button>
          <button onClick={() => handleDownloadPDF('efficacy-report-print', t('pdfEfficacyReport'))} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-sm active:scale-[0.98]">
            <CheckBadgeIconSolid className="w-3.5 h-3.5" /> {t('pdfEfficacyReport')}
          </button>
          <button onClick={() => handleDownloadPDF('improvement-report-print', 'PDF REPORTE OPORTUNIDAD DE MEJORA')} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-sm active:scale-[0.98]">
            <SparklesIcon className="w-3.5 h-3.5" /> PDF REPORTE OPORTUNIDAD DE MEJORA
          </button>
        </div>
      </aside>
      <main className="flex-grow flex flex-col min-w-0" id="main-content-scroll">
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-10 bg-white border-b border-slate-200">
           <div className="flex items-center gap-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('scientificMethod')}</span><div className="h-4 w-px bg-slate-200"></div><span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{t('aiConnected')}</span></div>
           <div className="flex items-center gap-4">
             <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title={t('fullScreen')}>
                {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" /> : <ArrowsPointingOutIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />}
             </button>
             <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> {t('wcmActive')}</div>
           </div>
        </header>
        <div className="flex-grow overflow-y-auto p-12 custom-scroll bg-slate-200/40">
          <div className="max-w-7xl mx-auto">
            {activeTab === Tab.SETUP && <SetupSection state={state} setState={setState} setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D1_D2 && <D1D2Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} getProblemContext={getProblemContext} loading={loading} setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D3 && <D3Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} getProblemContext={getProblemContext} loading={loading} setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D4 && <D4Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} getProblemContext={getProblemContext} loading={loading} setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D5 && <D5Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} getProblemContext={getProblemContext} loading={loading} setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D6 && <D6Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} getProblemContext={getProblemContext} loading={loading} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D7 && <D8Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} loading={loading} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D8 && <D7Section state={state} setState={setState} handleGeminiCall={handleGeminiCall} loading={loading} t={t} setBanner={setBanner} />}
            {activeTab === Tab.EFFICACY && <EfficacySection state={state} setState={setState} handleGeminiCall={handleGeminiCall} loading={loading} t={t} setBanner={setBanner} />}
          </div>
        </div>
        <div id="full-report-print" className="hidden"><FullReportTemplate state={state} t={t} /></div>
        <div id="efficacy-report-print" className="hidden"><EfficacyReportTemplate state={state} t={t} /></div>
        <div id="improvement-report-print" className="hidden"><ImprovementReportTemplate state={state} t={t} /></div>
        <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          t={t} 
          step={tutorialStep} 
          setStep={setTutorialStep} 
        />
        {banner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl ${
              banner.title?.toLowerCase().includes('d4') || 
              banner.title?.toLowerCase().includes('análisis forense') || 
              banner.title?.toLowerCase().includes('analisis forense') || 
              banner.title?.toLowerCase().includes('causa raíz') || 
              banner.title?.toLowerCase().includes('causa raiz') || 
              banner.title?.toLowerCase().includes('d0') || 
              banner.title?.toLowerCase().includes('configuración') || 
              banner.title?.toLowerCase().includes('configuracion')
                ? 'max-w-[1272px] max-h-[770px]' 
                : 'max-w-2xl max-h-[500px]'
            } w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col`}>
              <div className="bg-amber-500 p-4 flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">{banner.title}</h3>
                  <p className="text-xs font-bold text-amber-100 uppercase tracking-widest">{t('tutorialSubtitle')}</p>
                </div>
              </div>
              <div className="p-8 overflow-y-auto custom-scroll">
                <p className="text-slate-600 font-medium leading-relaxed text-base mb-6">
                  {banner.content}
                </p>
                <button 
                  onClick={() => setBanner(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-[0.95]"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FullReportTemplate = ({ state, t }: { state: AppState, t: any }) => {
  const mCategories = (mCategoriesLocal as any)[state.language] || mCategoriesLocal.es;

  // Pre-calculate all fixed actions to get global index for Audit Findings
  const allFixedActions = state.d5_d6.acpPlans.flatMap(p => p.actions.filter(a => a.isFixed));
  const caseNumberMatch = state.setup.caseName.match(/\d+/);
  const caseId = caseNumberMatch ? caseNumberMatch[0] : "";

  const extractSpecificSections = (text: string, sectionKeywords: string[]) => {
    if (!text) return "";
    const lines = text.split('\n');
    let result = "";
    let isCapturing = false;

    for (const line of lines) {
      const upperLine = line.toUpperCase();
      if (line.includes('**')) {
        const isTargetHeader = sectionKeywords.some(kw => upperLine.includes(kw.toUpperCase()));
        if (isTargetHeader) {
          isCapturing = true;
        } else {
          isCapturing = false;
        }
      }
      
      if (isCapturing) {
        result += line + '\n';
      }
    }
    return result.trim();
  };

  return (
    <div className="official-document p-10 space-y-8 bg-white text-slate-900">
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{t('fullReport')}</h1>
          <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{state.setup.caseName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('responsible')}: {state.setup.responsible}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('startDate')}: {(() => { if (!state.setup.startDate) return ""; const [y, m, d] = state.setup.startDate.split('-'); return `${d}-${m}-${y}`; })()}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{state.language === 'es' ? 'FECHA FINAL' : 'END DATE'}: {(() => { const now = new Date(); return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`; })()}</p>
        </div>
      </div>
      
      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-4">D0: {state.language === 'es' ? 'CONFIGURACIÓN' : 'CONFIGURATION'}</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('caseType')}</label>
            <p className="font-bold text-sm">{state.setup.type}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('impacts')} / {t('standards')}</label>
            <p className="font-bold text-sm">
              {(() => {
                const items = [...(state.setup.impact || []), ...(state.setup.standards || [])];
                return items.map(item => {
                  if ((item === 'Otros' || item === 'Others') && state.setup.otherImpact) return `${item} (${state.setup.otherImpact})`;
                  if ((item === 'Otros' || item === 'Others') && state.setup.otherStandard) return `${item} (${state.setup.otherStandard})`;
                  return item;
                }).join(', ');
              })()}
            </p>
          </div>
        </div>
      </div>

      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-4">{t('d1d2')}</h2>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-100">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">{t('phenomenology')}</label>
            <p className="text-sm italic">"{state.d2.phenomenon}"</p>
          </div>
          {state.d2.fiveW2H && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(state.d2.fiveW2H).map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-lg">
                  <label className="text-[9px] font-black text-slate-400 uppercase block border-b border-slate-100 mb-1">{t(k) || k}</label>
                  <p className="text-[11px] font-bold text-slate-700">{String(v)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="industrial-card page-break">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('d3')}</h2>
        <div className="space-y-6">
          {state.d3.isNotApplicable ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border border-slate-200 rounded-2xl">
              {state.language === 'es' ? 'No aplica para este caso' : 'Not applicable for this case'}
            </div>
          ) : state.d3.selectedCorrectiveActionIds.length > 0 ? (
            state.d3.correctiveActions.filter(a => state.d3.selectedCorrectiveActionIds.includes(a.id)).map((action) => (
              <div key={action.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('actionSelected')}</h3>
                <p className="text-sm font-bold text-slate-800 mb-4 italic">
                  "{action.action}"
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t('responsible')}</label>
                    <p className="text-xs font-bold text-slate-700">{action.responsible}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t('implementationDate')}</label>
                    <p className="text-xs font-bold text-slate-700">{action.implementationDate}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center opacity-30 italic text-sm">
              {t('waitingAnalysis')}
            </div>
          )}
        </div>
      </div>

      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('d4')}</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <QueueListIcon className="w-4 h-4"/> {t('ishikawaSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {mCategories.map(cat => {
                const fixed = state.d4.hypotheses.filter(h => h.category === cat && state.d4.selectedHypotheses.includes(h.id));
                if (fixed.length === 0) return null;
                return (
                  <div key={cat} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <label className="text-[9px] font-black text-slate-400 uppercase border-b border-slate-100 block mb-2">{cat}</label>
                    <ul className="list-disc pl-4 text-[11px] font-bold text-slate-600 space-y-1">
                      {fixed.map(h => <li key={h.id}>{h.text}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-slate-50 text-slate-900 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-4">{t('systemicRoot')} (5 Whys)</h4>
            <div className="space-y-6">
              {state.d4.fiveWhysHistory.map((h) => (
                <div key={h.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex gap-3 mb-4">
                    <span className="text-blue-600 font-black uppercase text-xs">Raíz:</span>
                    <span className="text-sm font-bold uppercase tracking-tight">{h.systemicRootCause}</span>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                    {h.whys.map((w, idx) => (
                      <div key={idx} className="text-[11px]">
                        <span className="text-slate-400 font-black mr-2">{idx + 1}.</span>
                        <span className="text-slate-500 italic mr-2">{w.step}</span>
                        <span className="text-slate-800 font-bold">{w.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="industrial-card page-break">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('d5')}</h2>
        <div className="space-y-8">
          {state.d5_d6.acpPlans.map((plan, pIdx) => (
            <div key={pIdx} className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${plan.type === 'primary' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {plan.type === 'primary' ? t('primary') : t('secondary')}
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{plan.rootCause}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {plan.actions.filter(a => a.isFixed).map((a, aIdx) => (
                  <div key={aIdx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                          {a.actionId ? `ACCION ${a.actionId}` : 'Acción'}
                        </label>
                        <p className="text-xs font-bold text-slate-800">{a.action}</p>
                      </div>
                      <div className="text-right">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                        <span className="text-[9px] font-black text-slate-600 uppercase">{a.type || 'ACP'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{state.language === 'es' ? '¿Cuál será la evidencia de la implementación?' : 'Implementation Evidence'}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.evidenceHow}</p>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{state.language === 'es' ? '¿Cómo se verificará la implementación?' : 'Implementation Verification'}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.verificationHow}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('implementationDate')}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.timeframe}</p>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('responsible')}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.responsible}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale"><div className="flex items-center gap-2"><BuildingOffice2Icon className="w-5 h-5"/><span className="text-[10px] font-black uppercase tracking-widest">{t('suiteName')}</span></div><p className="text-[9px] font-bold uppercase">{t('scientificMethod')}</p></div>
    </div>
  );
};

const ImprovementReportTemplate = ({ state, t }: { state: AppState, t: any }) => {
  return (
    <div id="improvement-report-content" className="official-document p-10 space-y-8 bg-white text-slate-900 font-sans max-w-[1000px] mx-auto">
      <div className="flex justify-between items-start border-b-4 border-orange-500 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-orange-600">
            {state.language === 'es' ? 'REPORTE OPORTUNIDAD DE MEJORA' : 'IMPROVEMENT OPPORTUNITY REPORT'}
          </h1>
          <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{state.setup.caseName || (state.language === 'es' ? 'Oportunidad de Mejora' : 'Improvement Opportunity')}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('responsible')}: {state.setup.responsible}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('startDate')}: {(() => { if (!state.setup.startDate) return ""; const [y, m, d] = state.setup.startDate.split('-'); return `${d}-${m}-${y}`; })()}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{state.language === 'es' ? 'FECHA EMISIÓN' : 'ISSUE DATE'}: {(() => { const now = new Date(); return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`; })()}</p>
        </div>
      </div>
      
      {/* FASE D0: CONFIGURACIÓN */}
      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-orange-200 text-orange-700 pb-3 mb-4">
          D0: {state.language === 'es' ? 'CONFIGURACIÓN DE LA OPORTUNIDAD DE MEJORA' : 'IMPROVEMENT CONFIGURATION'}
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('caseType')}</label>
            <p className="font-bold text-sm text-slate-800">{state.setup.type}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('impacts')} / {t('standards')}</label>
            <p className="font-bold text-sm text-slate-800">
              {(() => {
                const items = [...(state.setup.impact || []), ...(state.setup.standards || [])];
                return items.map(item => {
                  if ((item === 'Otros' || item === 'Others') && state.setup.otherImpact) return `${item} (${state.setup.otherImpact})`;
                  if ((item === 'Otros' || item === 'Others') && state.setup.otherStandard) return `${item} (${state.setup.otherStandard})`;
                  return item;
                }).join(', ');
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* FASE D1: OPORTUNIDAD DE MEJORA / FENOMENOLOGÍA */}
      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-orange-200 text-orange-700 pb-3 mb-4">
          D1: {state.language === 'es' ? 'DESCRIPCIÓN DE LA OPORTUNIDAD DE MEJORA' : 'IMPROVEMENT OPPORTUNITY DESCRIPTION'}
        </h2>
        <div className="space-y-6">
          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block">
              {state.language === 'es' ? 'OPORTUNIDAD DE MEJORA / FENÓMENO' : 'IMPROVEMENT OPPORTUNITY / PHENOMENON'}
            </label>
            <p className="text-sm font-bold text-slate-800 italic leading-relaxed">
              "{state.d2.phenomenon || state.d2.fieldDataInput || state.setup.caseName}"
            </p>
          </div>
          {state.d2.fiveW2H && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                {state.language === 'es' ? 'ANÁLISIS ESTRUCTURADO 5W2H' : 'STRUCTURED 5W2H ANALYSIS'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(state.d2.fiveW2H).map(([k, v]) => (
                  <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 uppercase block border-b border-slate-100 mb-1">{t(k) || k}</label>
                    <p className="text-[11px] font-bold text-slate-700">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FASE D5: GESTIÓN ACP - PLAN DE ACCIONES DE MEJORA */}
      <div className="industrial-card page-break">
        <h2 className="text-xl font-black uppercase border-b-2 border-orange-200 text-orange-700 pb-3 mb-6">
          D5: {state.language === 'es' ? 'GESTIÓN ACP - PLAN DE ACCIONES DE MEJORA' : 'ACP MANAGEMENT - IMPROVEMENT ACTION PLAN'}
        </h2>
        <div className="space-y-8">
          {state.d5_d6.acpPlans.length === 0 ? (
            <p className="text-sm italic text-slate-400">
              {state.language === 'es' ? 'No se han generado acciones de mejora aún.' : 'No improvement actions generated yet.'}
            </p>
          ) : (
            state.d5_d6.acpPlans.map((plan, pIdx) => (
              <div key={pIdx} className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-orange-500 text-white">
                    {state.language === 'es' ? 'Plan de Mejora' : 'Improvement Plan'}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{plan.rootCause}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    const fixedActions = plan.actions.filter(a => a.isFixed);
                    if (fixedActions.length === 0) {
                      return (
                        <p className="text-xs italic text-slate-400 p-4">
                          {state.language === 'es' ? 'No hay acciones fijadas en este plan.' : 'No fixed actions in this plan.'}
                        </p>
                      );
                    }
                    return fixedActions.map((a, aIdx) => (
                      <div key={aIdx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-1">
                              {a.actionId ? `ACCIÓN ${a.actionId}` : `Acción ${aIdx + 1}`}
                            </label>
                            <p className="text-xs font-bold text-slate-800">{a.action}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black px-2 py-1 rounded uppercase bg-emerald-100 text-emerald-800">
                              {state.language === 'es' ? 'Fijada' : 'Fixed'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              {state.language === 'es' ? '¿Cuál será la evidencia de la implementación?' : 'Implementation Evidence'}
                            </label>
                            <p className="text-[10px] font-bold text-slate-600">{a.evidenceHow || '-'}</p>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              {state.language === 'es' ? '¿Cómo se verificará la implementación?' : 'Implementation Verification'}
                            </label>
                            <p className="text-[10px] font-bold text-slate-600">{a.verificationHow || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('implementationDate')}</label>
                            <p className="text-[10px] font-bold text-slate-600">{a.timeframe || '-'}</p>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('responsible')}</label>
                            <p className="text-[10px] font-bold text-slate-600">{a.responsible || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale"><div className="flex items-center gap-2"><BuildingOffice2Icon className="w-5 h-5"/><span className="text-[10px] font-black uppercase tracking-widest">{t('suiteName')}</span></div><p className="text-[9px] font-bold uppercase">{state.language === 'es' ? 'Reporte Oportunidad de Mejora (D0, D1, D5)' : 'Improvement Opportunity Report (D0, D1, D5)'}</p></div>
    </div>
  );
};

const EfficacyReportTemplate = ({ state, t }: { state: AppState, t: any }) => {
  return (
    <div id="efficacy-report-content" className="p-12 bg-white text-slate-900 font-sans max-w-[1000px] mx-auto">
      <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{t('pdfEfficacyReport')}</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('scientificMethod')} • {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-4 py-2 inline-block">
            <span className="text-[10px] font-black uppercase tracking-widest">ID: {state.setup.caseName || 'UNSET'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-12">
        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('setup')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('caseName')}</label>
              <p className="font-bold text-sm uppercase">{state.setup.caseName}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('responsible')}</label>
              <p className="font-bold text-sm uppercase">{state.setup.responsible}</p>
            </div>
          </div>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('phenomenology')}</h2>
          <p className="text-sm font-bold text-slate-700 leading-relaxed">{state.d2.phenomenon}</p>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('rootCauses')}</h2>
          <div className="space-y-4">
            {state.d4.fiveWhysHistory.map((h, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border-l-4 border-slate-900">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Causa Raíz Sistémica {idx + 1}</p>
                <p className="text-sm font-bold text-slate-800">{h.systemicRootCause}</p>
              </div>
            ))}
            {state.d4.fiveWhysHistory.length === 0 && (
              <p className="text-sm italic text-slate-400">No se han identificado causas raíz sistémicas aún.</p>
            )}
          </div>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('efficacyValidationPlan')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[8%]">{t('actionId')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[18%]">{t('action')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationMethod')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('kpi')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('auditFrequency')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[14%]">{t('contingencyPlan')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionResponsible')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.efficacy.protocols.map((p, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words whitespace-pre-line leading-tight">{p.id}</td>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words">{p.action}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.verificationMethod}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.kpi}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.auditFrequency}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.contingencyPlan}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.executionResponsible}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.executionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('efficacyVerification')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('actionId')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[40%]">{t('action')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationResponsible')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('verificationDate')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('effective')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.efficacy.protocols.map((p, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words whitespace-pre-line leading-tight">{p.id}</td>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words">{p.action}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.verificationResponsible}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.verificationDate}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words font-black">{p.isEffective || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale">
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="w-5 h-5"/>
          <span className="text-[10px] font-black uppercase tracking-widest">{t('suiteName')}</span>
        </div>
        <p className="text-[9px] font-bold uppercase">{t('scientificMethod')}</p>
      </div>
    </div>
  );
};

const SetupSection = ({ state, setState, setActiveTab, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      setup: INITIAL_STATE.setup
    }));
  };

  const handleChange = (field: keyof AnalysisSetup, value: any) => { 
    if (field === 'type') {
      if (value === 'Quejas de Inocuidad') {
        const validFoodSafety = ((foodSafetyImpacts as any)[state.language] || foodSafetyImpacts.es);
        const currentImpacts = state.setup.impact || [];
        const filtered = currentImpacts.filter((i: string) => validFoodSafety.includes(i));
        const newImpacts = filtered.length > 0 ? filtered : [validFoodSafety[0]];
        setState((prev: any) => ({
          ...prev,
          setup: {
            ...prev.setup,
            type: value,
            impact: newImpacts
          }
        }));
        return;
      } else if (state.setup.type === 'Quejas de Inocuidad' && value !== 'Quejas de Inocuidad') {
        const validDev = ((deviationImpacts as any)[state.language] || deviationImpacts.es);
        const currentImpacts = state.setup.impact || [];
        const filtered = currentImpacts.filter((i: string) => validDev.includes(i));
        const newImpacts = filtered.length > 0 ? filtered : [validDev[1] || validDev[0]];
        setState((prev: any) => ({
          ...prev,
          setup: {
            ...prev.setup,
            type: value,
            impact: newImpacts
          }
        }));
        return;
      }
    }
    setState((prev: any) => ({ ...prev, setup: { ...prev.setup, [field]: value } })); 
  };
  const toggleStandard = (std: string) => { const current = state.setup.standards || []; const next = current.includes(std) ? current.filter((s: string) => s !== std) : [...current, std]; handleChange('standards', next); };
  const toggleImpact = (impact: string) => { const current = state.setup.impact || []; const next = current.includes(impact) ? current.filter((i: string) => i !== impact) : [...current, impact]; handleChange('impact', next); };
  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <AdjustmentsHorizontalIcon className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-0.5 flex items-center gap-2">
              {t('setup')}
              <button onClick={() => setBanner({ title: t('setup'), content: t('tutD0Content') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{t('projectMgmt')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="industrial-card rounded-[2rem] p-8 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4" /> {t('startDate')}</div>
              <button onClick={() => setBanner({ title: t('startDate'), content: t('auditDateBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <input type="date" value={state.setup.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><BookmarkSquareIcon className="w-4 h-4" /> {t('caseName')}</div>
              <button onClick={() => setBanner({ title: t('caseName'), content: t('caseNameBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <input type="text" placeholder={state.language === 'es' ? "Ej: Fallo en sellado..." : "Ex: Sealing failure..."} value={state.setup.caseName} onChange={(e) => handleChange('caseName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><IdentificationIcon className="w-4 h-4" /> {t('responsible')}</div>
              <button onClick={() => setBanner({ title: t('responsible'), content: t('responsibleBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <input type="text" placeholder={state.language === 'es' ? "Analista Líder..." : "Lead Analyst..."} value={state.setup.responsible} onChange={(e) => handleChange('responsible', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4" /> {t('caseType')}
              </div>
              <button onClick={() => setBanner({ title: t('caseType'), content: t('caseTypeBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <select value={state.setup.type} onChange={(e) => handleChange('type', e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all">
              <option value="Desviación de proceso">{t('processDeviation')}</option>
              <option value="Hallazgo de auditoría (No conformidades)">{t('auditFinding')}</option>
              <option value="Quejas de Inocuidad">{t('foodSafetyComplaints')}</option>
              <option value="Oportunidad de mejora">{t('improvementOpportunity')}</option>
              <option value="Solución Rápida (SR)">{t('quickSolution')}</option>
            </select>
          </div>
          {(state.setup.type === 'Desviación de proceso' || state.setup.type === 'Solución Rápida (SR)' || state.setup.type === 'Quejas de Inocuidad') && (
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ChartPieIcon className="w-4 h-4" /> {t('impacts')} (Selección Múltiple)
                <button onClick={() => setBanner({ title: t('impacts'), content: t('impactsBanner') })} className="ml-2 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(
                  state.setup.type === 'Quejas de Inocuidad'
                    ? ((foodSafetyImpacts as any)[state.language] || foodSafetyImpacts.es)
                    : ((deviationImpacts as any)[state.language] || deviationImpacts.es)
                ).map((impact: string) => (
                  <button 
                    key={impact} 
                    onClick={() => toggleImpact(impact)} 
                    className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${state.setup.impact?.includes(impact) ? 'bg-blue-600 border-blue-700 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                  >
                    {impact}
                  </button>
                ))}
              </div>
              {(state.setup.impact?.includes('Otros') || state.setup.impact?.includes('Others')) && (
                <div className="mt-4 animate-slide-in">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('otherImpactLabel')}</label>
                  <input 
                    type="text" 
                    value={state.setup.otherImpact || ""} 
                    onChange={(e) => handleChange('otherImpact', e.target.value)} 
                    placeholder={state.language === 'es' ? "Escriba el nombre..." : "Write the name..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}
          {(state.setup.type === 'Hallazgo de Auditoría, ACPM' || state.setup.type === 'Hallazgo de auditoría (No conformidades)' || state.setup.type === 'Oportunidad de mejora') && (
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4" /> {t('standards')}
                <button onClick={() => setBanner({ title: t('standards'), content: t('standardsBanner') })} className="ml-2 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {auditStandards.map(std => (
                  <button 
                    key={std} 
                    onClick={() => toggleStandard(std)} 
                    className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${state.setup.standards?.includes(std) ? 'bg-orange-600 border-orange-700 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200'}`}
                  >
                    {std}
                  </button>
                ))}
              </div>
              {state.setup.standards?.includes('Otros') && (
                <div className="mt-4 animate-slide-in">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('otherStandardLabel')}</label>
                  <input 
                    type="text" 
                    value={state.setup.otherStandard || ""} 
                    onChange={(e) => handleChange('otherStandard', e.target.value)} 
                    placeholder={state.language === 'es' ? "Escriba el nombre..." : "Write the name..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-600/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setActiveTab(Tab.D1_D2)} disabled={!state.setup.caseName || !state.setup.responsible} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-20 hover:bg-slate-800 transition-all active:scale-[0.95]">{t('initAnalysis')}</button>
      </div>
    </div>
  );
};

const D1D2Section = ({ state, setState, handleGeminiCall, getProblemContext, loading, setActiveTab, t, setBanner }: any) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImprovementOpportunityToD5 = () => {
    const phenomenonText = state.d2.phenomenon || state.d2.fieldDataInput || state.setup.caseName;
    if (!phenomenonText || phenomenonText.trim() === '') {
      alert(state.language === 'es' ? 'Por favor ingrese la descripción del fenómeno en D1 primero.' : 'Please enter the phenomenon description in D1 first.');
      return;
    }

    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caseNumberMatch = state.setup.caseName.match(/^\d+/);
    const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";

    handleGeminiCall(
      'd5Improvement',
      promptTemplates[state.language]?.d4Secondary || "Genera 4 acciones de mejora estructuradas para la oportunidad de mejora presentada.",
      `OPORTUNIDAD DE MEJORA / FENÓMENO: ${phenomenonText}\n\nGenera exactamente 4 acciones concretas de mejora (ACP) para esta Oportunidad de Mejora.${getProblemContext ? getProblemContext() : ''}`,
      0.4,
      schemas.d4Secondary,
      (data: any) => {
        let actionList: string[] = [];
        if (data?.results?.[0]?.actions && Array.isArray(data.results[0].actions)) {
          actionList = data.results[0].actions;
        } else if (Array.isArray(data?.actions)) {
          actionList = data.actions;
        } else if (data?.results && Array.isArray(data.results)) {
          actionList = data.results.flatMap((r: any) => r.actions || []);
        }

        if (!actionList || actionList.length === 0) {
          actionList = [
            state.language === 'es' ? "Implementar estándar o procedimiento estandarizado para la oportunidad de mejora" : "Implement standard or procedure for the improvement opportunity",
            state.language === 'es' ? "Capacitar y sensibilizar al personal involucrado en el nuevo método de trabajo" : "Train personnel on the new working method",
            state.language === 'es' ? "Establecer controles operacionales y listas de chequeo en el punto de trabajo" : "Establish operational controls and checklists at the workstation",
            state.language === 'es' ? "Auditar y verificar en Gemba la efectividad y sostenibilidad de la mejora" : "Audit and verify in Gemba the effectiveness and sustainability of the improvement"
          ];
        }

        const formattedActions: ActionStep[] = actionList.slice(0, 4).map((actText: any, idx: number) => {
          const act = typeof actText === 'string' ? actText : (actText?.action || actText?.text || String(actText));
          return {
            id: `action-improvement-${idx}-${Date.now()}`,
            actionId: caseNumber ? `${caseNumber}-${idx + 1}` : `${idx + 1}`,
            action: act,
            evidenceHow: state.language === 'es' ? "Documento o Registro de implementación del estándar" : "Standard implementation document or record",
            evidenceDate: defaultDate,
            evidenceResponsible: state.setup.responsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            verificationHow: state.language === 'es' ? "Auditoría en Gemba y seguimiento a KPI" : "Gemba audit and KPI follow-up",
            responsible: state.setup.responsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            timeframe: defaultDate,
            isFixed: true
          };
        });

        const newPlan: ACPPlan = {
          id: `acp-improvement-${Date.now()}`,
          rootCause: phenomenonText,
          title: state.language === 'es' ? `Plan de Mejora: ${phenomenonText.substring(0, 40)}...` : `Improvement Plan: ${phenomenonText.substring(0, 40)}...`,
          introduction: state.language === 'es' ? `Acciones de mejora para la oportunidad identificada en D1.` : `Improvement actions for opportunity identified in D1.`,
          actions: formattedActions,
          type: 'primary'
        };

        setState((p: AppState) => ({
          ...p,
          d5_d6: {
            ...(p.d5_d6 || {}),
            step: 1,
            acpPlans: [newPlan]
          }
        }));

        setActiveTab(Tab.D5);
      }
    );
  };

  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d2: INITIAL_STATE.d2,
      costs: INITIAL_STATE.costs
    }));
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      // Read the file as ArrayBuffer once to avoid multiple access permission issues
      const arrayBuffer = await file.arrayBuffer();

      if (extension === 'pdf') {
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => (item as any).str).join(' ') + '\n';
        }
        return text;
      } else if (extension === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          text += XLSX.utils.sheet_to_txt(worksheet) + '\n';
        });
        return text;
      } else {
        // For other files, convert the arrayBuffer back to text
        const decoder = new TextDecoder();
        return decoder.decode(arrayBuffer);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      // Fallback for permission error: try reading as text directly if not already tried
      try {
        return await file.text();
      } catch (innerError) {
        console.error('Fallback text extraction failed:', innerError);
        return '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(extension || '');

      if (isImage) {
        try {
          const base64 = await fileToBase64(file);
          setState((p: AppState) => ({
            ...p,
            d2: { ...p.d2, images: [...(p.d2.images || []), base64] }
          }));
        } catch (err) {
          console.error("Error converting image to base64", err);
        }
      } else {
        const text = await extractTextFromFile(file);
        if (text) {
          setState((p: AppState) => ({
            ...p,
            d2: { ...p.d2, fieldDataInput: (p.d2.fieldDataInput ? p.d2.fieldDataInput + '\n\n' : '') + text }
          }));
        }
      }
    }

    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunD2Analysis = () => {
    const parts: any[] = [{ text: state.d2.fieldDataInput || (state.d2.images && state.d2.images.length > 0 ? "Analyze the provided images to extract the problem description." : "Analyze the provided information.") }];
    
    if (state.d2.images && state.d2.images.length > 0) {
      state.d2.images.forEach((img: string) => {
        const [mimeInfo, base64Data] = img.split(',');
        const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || 'image/png';
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      });
    }

    handleGeminiCall(
      'd2', 
      promptTemplates[state.language].d2, 
      parts, 
      0.2, 
      schemas.d2, 
      (data) => setState((p: any) => ({ 
        ...p, 
        d2: { 
          ...p.d2, 
          phenomenon: data?.phenomenon_description || "", 
          analysis: "", 
          fiveW2H: data?.fiveW2H 
        } 
      }))
    );
  };

  const [activeSubTab, setActiveSubTab] = useState<'definition' | 'financial'>('definition');
  const costFields = [
    { label: state.language === 'es' ? "Mano de Obra" : "Labor", field: "manoDeObra", icon: UserGroupIcon },
    { label: state.language === 'es' ? "Materia Prima" : "Raw Material", field: "materiaPrima", icon: InboxStackIcon },
    { label: state.language === 'es' ? "Mat. Empaque" : "Pkg Material", field: "materialEmpaque", icon: ArchiveBoxIcon },
    { label: state.language === 'es' ? "Recorte/Pérdida" : "Trim/Loss", field: "recorte", icon: ReceiptPercentIcon },
    { label: state.language === 'es' ? "Desperdicio Físico" : "Physical Waste", field: "desperdicio", icon: TrashIcon },
    { label: state.language === 'es' ? "Prod. Terminado" : "Finished Product", field: "productoTerminado", icon: BuildingOffice2Icon },
    { label: state.language === 'es' ? "Maquinaria y Equipos" : "Machinery & Equipment", field: "maquinariaEquipos", icon: CogIcon },
    { label: state.language === 'es' ? "Infraestructura (Obras)" : "Infrastructure (Works)", field: "infraestructura", icon: BuildingLibraryIcon },
    { label: state.language === 'es' ? "Logísticos" : "Logistics", field: "logisticos", icon: TruckIcon },
    { label: state.language === 'es' ? "Ensayos/Pruebas" : "Tests/Trials", field: "ensayosPruebas", icon: BeakerIcon },
    { label: state.language === 'es' ? "Lucro Cesante y Parada" : "Downtime/Lost Profits", field: "lucroCesante", icon: ClockIcon },
    { label: state.language === 'es' ? "Otros Rubros" : "Other Items", field: "otros", icon: BanknotesIcon },
  ];
  const updateCostInput = (field: keyof CostInputs, val: string) => { setState((p: AppState) => ({ ...p, costs: { ...p.costs, inputs: { ...p.costs.inputs, [field]: formatCurrencyInput(val, p.costs.currency) } } })); };
  const updateBreakdownItem = (idx: number, field: keyof CostBreakdown, val: string) => { const nextBreakdown = [...(state.costs.breakdown || [])]; if (nextBreakdown[idx]) { nextBreakdown[idx] = { ...nextBreakdown[idx], [field]: val }; setState((p: AppState) => ({ ...p, costs: { ...p.costs, breakdown: nextBreakdown } })); } };
  const updateCurrency = (currency: 'COP' | 'CRC' | 'USD') => { setState((p: AppState) => ({ ...p, costs: { ...p.costs, currency } })); };
  const handleEstimateCosts = () => {
    const inputs = state.costs?.inputs || DEFAULT_COST_INPUTS;
    const costSummary = Object.entries(inputs).filter(([_, v]) => String(v || "").trim() !== "").map(([k, v]) => `${k}: ${v}`).join(", ");
    if (!state.d2.phenomenon) return alert(t('waitingAnalysis'));
    handleGeminiCall('costs', promptTemplates[state.language].costs, `Datos de costos tangibles del usuario: ${costSummary || "Sin costos tangibles reportados"}. Fenómeno: ${state.d2.phenomenon}. Moneda seleccionada: ${state.costs.currency}.`, 0.3, schemas.costs, (data) => setState((p: any) => ({ ...p, costs: { ...p.costs, totalLoss: data?.total_loss_estimate || "", breakdown: data?.cost_breakdown || [] } })));
  };
  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <MagnifyingGlassIcon className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-0.5">{t('d1d2')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('phenomenology')}
              <button onClick={() => setBanner({ title: t('phenomenology'), content: t('d1d2Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex gap-4 mb-4"><button onClick={() => setActiveSubTab('definition')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeSubTab === 'definition' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>1. {t('defProblem')}</button>        <button 
          onClick={() => setActiveSubTab('financial')} 
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${activeSubTab === 'financial' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}
        >
          2. {t('finImpact')}
          <QuestionMarkCircleIcon 
            className="w-7 h-7 text-emerald-400 cursor-help transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" 
            onClick={(e) => { e.stopPropagation(); setBanner({ title: t('finImpact'), content: t('financialBanner') }); }} 
          />
        </button></div>
      {activeSubTab === 'definition' ? (
        <div className="grid grid-cols-1 gap-10 animate-slide-in">
          <div className="w-full">
            <div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  {t('fieldInput')}
                  <button onClick={() => setBanner({ title: t('fieldInput'), content: t('fieldInputBanner') })} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".pdf,.docx,.xlsx,.xls,.md,.txt,image/*" 
                    multiple
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    {isExtracting ? t('extractingText') : t('uploadFile')}
                  </button>
                  <div className="flex items-center gap-2">
                    <a 
                      href="https://gemini.google.com/gem/1GockJ8pLRBCQeZUBypsA_ujLNCZc1aAW?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      {t('aiAgentProblemDef')}
                    </a>
                    <button 
                      onClick={() => setBanner({ title: t('aiAgentProblemDef'), content: t('aiAgentBanner') })} 
                      className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                      title={t('aiAgentProblemDef')}
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t('fileTypes')} + Images</p>
              
              {state.d2.images && state.d2.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {state.d2.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Upload ${idx}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setState((p: AppState) => ({ ...p, d2: { ...p.d2, images: p.d2.images?.filter((_, i) => i !== idx) } }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <AutoExpandingTextarea value={state.d2.fieldDataInput} onChange={(e: any) => setState((p: any) => ({ ...p, d2: { ...p.d2, fieldDataInput: e.target.value } }))} placeholder={t('fieldPlaceholder')} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all leading-relaxed" />
              <button onClick={handleRunD2Analysis} disabled={loading === 'd2'} className="w-full mt-4 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30">{loading === 'd2' ? '...' : t('runIA')}</button>
            </div>
          </div>
          <div className="w-full h-auto"><div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col"><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  {t('fieldReport')}
                  <button onClick={() => setBanner({ title: t('fieldReport'), content: t('d1d2Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                    <QuestionMarkCircleIcon className="w-7 h-7" />
                  </button>
                </h3>{state.d2.fiveW2H ? (<div className="space-y-6 h-auto"><div className="p-6 bg-blue-600 rounded-[2rem] shadow-xl border-4 border-blue-400 h-auto flex flex-col"><AutoExpandingTextarea value={state.d2.phenomenon} onChange={(e: any) => setState((p: any) => ({ ...p, d2: { ...p.d2, phenomenon: e.target.value } }))} className="bg-transparent text-sm font-bold text-white leading-relaxed outline-none focus:ring-1 focus:ring-blue-300 rounded p-1" placeholder="Description..." /></div><div className="grid grid-cols-1 gap-6 h-auto">{Object.entries(state.d2.fiveW2H).map(([k, v]: [string, any], idx) => (<div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all shadow-sm h-auto flex flex-col"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block border-b border-slate-200 pb-1">{t(k) || k}</label><AutoExpandingTextarea value={v} onChange={(e: any) => { const next5W = { ...(state.d2.fiveW2H || {}), [k]: e.target.value }; setState((p: any) => ({ ...p, d2: { ...p.d2, fiveW2H: next5W } })); }} className="bg-transparent text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-100 rounded p-1" /></div>))}</div></div>) : <div className="text-center py-24 opacity-30"><MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">{t('waitingAnalysis')}</p></div>}</div></div>
        </div>
      ) : (
        <div className="industrial-card rounded-[2rem] p-8 border-l-[8px] border-l-emerald-600 bg-white h-auto flex flex-col animate-slide-in"><div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"><h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3"><BanknotesIcon className="w-6 h-6 text-emerald-600" /> {t('costQuality')} <button onClick={() => setBanner({ title: t('costQuality'), content: t('financialBanner') })} className="ml-1 transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3><div className="flex flex-col gap-1 w-full md:w-auto"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CurrencyDollarIcon className="w-3.5 h-3.5" /> {t('selectCurrency')}</label><select value={state.costs.currency} onChange={(e) => updateCurrency(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-emerald-600/20 outline-none"><option value="COP">Pesos Colombianos (COP)</option><option value="CRC">Colones Costa Rica (CRC)</option><option value="USD">American Dollars (USD)</option></select></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">{costFields.map((field, idx) => (<div key={idx} className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><field.icon className="w-4 h-4 text-emerald-500" /> {field.label}</label><input type="text" value={(state.costs.inputs?.[field.field as keyof CostInputs] || "")} onChange={(e) => updateCostInput(field.field as keyof CostInputs, e.target.value)} placeholder="$ 0" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all mono" /></div>))}</div><div className="flex flex-col lg:flex-row gap-10 items-center border-t border-slate-100 pt-10"><button onClick={handleEstimateCosts} disabled={loading === 'costs'} className="w-full lg:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-[0.95] disabled:opacity-30">{loading === 'costs' ? '...' : t('estimateCosts')}</button><div className="flex-grow space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><ScaleIcon className="w-3.5 h-3.5" /> {t('totalLoss')}</p><input type="text" value={state.costs.totalLoss} onChange={(e) => setState((p: AppState) => ({ ...p, costs: { ...p.costs, totalLoss: e.target.value } }))} className="w-full bg-slate-900 rounded-[2rem] p-8 text-center border-b-4 border-emerald-500 text-4xl font-black text-white mono tracking-tighter outline-none focus:ring-2 focus:ring-emerald-600/50" /></div></div>{state.costs.breakdown && state.costs.breakdown.length > 0 && (<div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">{state.costs.breakdown.map((item, idx) => { const isIntangible = item.category?.toLowerCase().includes('intangible'); const isLegal = item.category?.toLowerCase().match(/legal|sanción|sanction/i); return (<div key={idx} className={`p-6 rounded-3xl border transition-all h-auto flex flex-col ${isIntangible ? 'bg-indigo-50 border-indigo-200 shadow-md ring-4 ring-indigo-50/50' : isLegal ? 'bg-orange-50 border-orange-200' : 'bg-slate-50/50 border-slate-100'}`}><div className="flex items-center gap-3 mb-3">{isIntangible ? <SparklesIcon className="w-5 h-5 text-indigo-600" /> : <ChartBarIcon className="w-5 h-5 text-emerald-500" />}<input type="text" value={item.category} onChange={(e) => updateBreakdownItem(idx, 'category', e.target.value)} className={`text-[10px] font-black uppercase tracking-widest bg-transparent outline-none w-full ${isIntangible ? 'text-indigo-700' : 'text-slate-900'}`} /></div><AutoExpandingTextarea value={item.impact_description} onChange={(e: any) => updateBreakdownItem(idx, 'impact_description', e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 leading-snug mb-4 focus:ring-1 focus:ring-emerald-100 rounded" /><input type="text" value={item.estimated_value} onChange={(e) => updateBreakdownItem(idx, 'estimated_value', e.target.value)} className={`w-full mt-auto bg-white/50 border border-slate-200 rounded-lg p-2 text-sm font-black mono outline-none focus:ring-2 focus:ring-emerald-600/20 ${isIntangible ? 'text-indigo-600' : 'text-slate-900'}`} /></div>); })}</div>)}</div>
      )}

      {state.setup.type === 'Oportunidad de mejora' && (
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleImprovementOpportunityToD5}
            disabled={loading === 'd5Improvement'}
            className="w-full md:w-auto px-8 py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            <SparklesIcon className="w-5 h-5 text-white" />
            {loading === 'd5Improvement' 
              ? '...' 
              : 'Oportunidad de mejora, pasar a D5: GESTION ACP'
            }
          </button>
        </div>
      )}
    </div>
  );
};

const D3Section = ({ state, setState, handleGeminiCall, getProblemContext, loading, setActiveTab, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d3: INITIAL_STATE.d3
    }));
  };

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');

  const handleGenerateActions = () => {
    handleGeminiCall(
      'd3',
      promptTemplates[state.language].d3,
      `Case: ${state.setup.caseName}. Phenomenon: ${state.d2.phenomenon}.${getProblemContext()}`,
      0.3,
      schemas.d3,
      (data) => {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Keep currently selected actions
        const selectedActions = (state.d3.correctiveActions || []).filter((a: any) => 
          (state.d3.selectedCorrectiveActionIds || []).includes(a.id)
        );

        const newActions = (data.actions || []).map((a: any, i: number) => ({
          ...a,
          implementationDate: today,
          id: `ca-${Date.now()}-${i}`
        }));

        setState((p: any) => ({
          ...p,
          d3: {
            ...p.d3,
            correctiveActions: [...selectedActions, ...newActions],
            // selectedCorrectiveActionIds is preserved as it is in the state
            implementationPlan: ""
          }
        }));
      }
    );
  };

  const handleGenerateImplementation = () => {
    const selectedActions = state.d3.correctiveActions.filter((a: any) => state.d3.selectedCorrectiveActionIds.includes(a.id));
    if (selectedActions.length === 0) return;

    const actionsText = selectedActions.map(a => `${state.language === 'es' ? 'Corrección' : 'Correction'}: ${a.action}. Responsable: ${a.responsible}. Fecha: ${a.implementationDate}.`).join("\n");

    handleGeminiCall(
      'd3Impl',
      promptTemplates[state.language].d3Implementation,
      `${actionsText}${getProblemContext()}`,
      0.4,
      null,
      (data) => {
        setState((p: any) => ({
          ...p,
          d3: {
            ...p.d3,
            implementationPlan: data || ""
          }
        }));
        setViewMode('preview');
      }
    );
  };

  const selectedActions = state.d3.correctiveActions.filter((a: any) => state.d3.selectedCorrectiveActionIds.includes(a.id));

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ShieldCheckIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d3')}</h2>
              <button onClick={() => setBanner({ title: t('d3'), content: t('d3Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('correctiveActionSub')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>

      <div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              {t('correctiveActionTitle')}
              <button onClick={() => setBanner({ title: t('correctiveActionTitle'), content: t('d3Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {state.language === 'es' ? 'Acciones inmediatas para contener el problema' : 'Immediate actions to contain the problem'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Opción "No Aplica" */}
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 transition-all select-none">
              <input 
                type="checkbox" 
                checked={!!state.d3.isNotApplicable} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setState((p: any) => ({
                    ...p,
                    d3: {
                      ...p.d3,
                      isNotApplicable: checked,
                      selectedCorrectiveActionIds: checked ? [] : p.d3.selectedCorrectiveActionIds,
                      implementationPlan: checked ? "No aplica para este caso" : p.d3.implementationPlan
                    }
                  }));
                }}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                {state.language === 'es' ? 'No Aplica' : 'Not Applicable'}
              </span>
            </label>

            {!state.d3.isNotApplicable && (
              <button
                onClick={handleGenerateActions}
                disabled={loading === 'd3'}
                className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-[0.95] disabled:opacity-50"
              >
                {loading === 'd3' ? '...' : t('createProtocol')}
              </button>
            )}
          </div>
        </div>

        {state.d3.isNotApplicable ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed">
            <ShieldCheckIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {state.language === 'es' ? 'El paso D3: Corrección ha sido marcado como No Aplica.' : 'Step D3: Correction has been marked as Not Applicable.'}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              {state.language === 'es' ? 'No se registrará información técnica de contención para este caso.' : 'No technical containment info will be recorded for this case.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {state.d3.correctiveActions.map((action: any) => (
            <div
              key={action.id}
              onClick={() => setState((p: any) => {
                const currentIds = p.d3.selectedCorrectiveActionIds || [];
                const nextIds = currentIds.includes(action.id)
                  ? currentIds.filter((id: string) => id !== action.id)
                  : [...currentIds, action.id];
                return { ...p, d3: { ...p.d3, selectedCorrectiveActionIds: nextIds } };
              })}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col h-auto ${
                state.d3.selectedCorrectiveActionIds.includes(action.id)
                  ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100'
                  : 'border-slate-100 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${state.d3.selectedCorrectiveActionIds.includes(action.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                {state.d3.selectedCorrectiveActionIds.includes(action.id) && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg shadow-sm">{t('selected')}</span>
                )}
              </div>
              <AutoExpandingTextarea
                value={action.action}
                onChange={(e: any) => {
                  const nextActions = state.d3.correctiveActions.map((a: any) => a.id === action.id ? { ...a, action: e.target.value } : a);
                  setState((p: any) => ({ ...p, d3: { ...p.d3, correctiveActions: nextActions } }));
                }}
                onClick={(e: any) => e.stopPropagation()}
                className="bg-transparent text-sm font-bold text-slate-700 leading-relaxed outline-none focus:ring-1 focus:ring-blue-100 rounded p-1"
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('responsible')}</label>
                  <input
                    type="text"
                    value={action.responsible}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextActions = state.d3.correctiveActions.map((a: any) => a.id === action.id ? { ...a, responsible: e.target.value } : a);
                      setState((p: any) => ({ ...p, d3: { ...p.d3, correctiveActions: nextActions } }));
                    }}
                    className="w-full bg-white/50 border border-slate-200 rounded-lg p-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('implementationDate')}</label>
                  <input
                    type="date"
                    value={action.implementationDate}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextActions = state.d3.correctiveActions.map((a: any) => a.id === action.id ? { ...a, implementationDate: e.target.value } : a);
                      setState((p: any) => ({ ...p, d3: { ...p.d3, correctiveActions: nextActions } }));
                    }}
                    className="w-full bg-white/50 border border-slate-200 rounded-lg p-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedActions.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
            <button
              onClick={handleGenerateImplementation}
              disabled={loading === 'd3Impl'}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95] disabled:opacity-50"
            >
              {loading === 'd3Impl' ? '...' : t('generateImplementationPlan')}
              <RocketLaunchIcon className="w-5 h-5" />
            </button>
          </div>
        )}
          </>
        )}
      </div>

      {!state.d3.isNotApplicable && state.d3.implementationPlan && (
        <div className="industrial-card rounded-[2rem] overflow-hidden flex flex-col h-auto">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                {t('implementationPlan')}
                <button onClick={() => setBanner({ title: t('implementationPlan'), content: t('d3Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                  <QuestionMarkCircleIcon className="w-7 h-7" />
                </button>
              </h3>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button>
                <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button>
              </div>
            </div>
          </div>
          <div className="p-10 h-auto flex flex-col">
            {viewMode === 'edit' ? (
              <AutoExpandingTextarea
                value={state.d3.implementationPlan}
                onChange={(e: any) => setState((p: any) => ({ ...p, d3: { ...p.d3, implementationPlan: e.target.value } }))}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-sm font-medium mono focus:ring-0 outline-none transition-all leading-relaxed"
              />
            ) : (
              <div className="official-document p-12 rounded-[2rem] border border-slate-200 bg-white relative animate-scale-up h-auto flex flex-col">
                <div className="relative z-10 h-auto">{renderStyledMarkdown(state.d3.implementationPlan)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón inferior para Avanzar a D4 */}
      <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
        <button 
          onClick={() => setActiveTab(Tab.D4)} 
          className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]"
        >
          {state.language === 'es' ? 'Avanzar a D4: Causa Raíz' : 'Advance to D4: Root Cause'}
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const D4Section = ({ state, setState, handleGeminiCall, getProblemContext, loading, setActiveTab, t, setBanner }: any) => {
  const mCategories = (mCategoriesLocal as any)[state.language] || mCategoriesLocal.es;
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [confirmedDeletes, setConfirmedDeletes] = useState<Record<string, boolean>>({});
  const [isExtractingGemba, setIsExtractingGemba] = useState(false);

  const handleGembaConclusionsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtractingGemba(true);
    let extractedText = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await extractTextFromFile(file);
      if (text) {
        extractedText += (extractedText ? '\n\n' : '') + text;
      }
    }

    if (extractedText) {
      setState((p: AppState) => ({
        ...p,
        d4: { 
          ...p.d4, 
          gembaConclusions: (p.d4.gembaConclusions ? p.d4.gembaConclusions + '\n\n' : '') + extractedText 
        }
      }));
    }

    setIsExtractingGemba(false);
    e.target.value = ''; // Reset file input
  };

  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d4: INITIAL_STATE.d4
    }));
  };

  const handleDeleteConfirmedCause = (id: string) => {
    setState((p: AppState) => ({
      ...p,
      d4: {
        ...p.d4,
        experimentalConfirmedCauses: (p.d4.experimentalConfirmedCauses || []).filter(cid => cid !== id)
      }
    }));
  };

  const handleDeleteAllAnalyses = () => {
    setState((p: AppState) => ({
      ...p,
      d4: {
        ...p.d4,
        fiveWhysHistory: [],
        fixedRootCauseIds: [],
        secondaryActions: {}
      }
    }));
  };

  const handleDeleteAnalysis = (idToDelete: string) => {
    if (!idToDelete) return;
    setState((p: AppState) => {
      const nextHistory = (p.d4.fiveWhysHistory || []).filter(item => item.id !== idToDelete);
      const nextFixedIds = (p.d4.fixedRootCauseIds || []).filter(id => id !== idToDelete);
      const nextSecondaryActions = { ...(p.d4.secondaryActions || {}) };
      delete nextSecondaryActions[idToDelete];
      
      return {
        ...p,
        d4: {
          ...p.d4,
          fiveWhysHistory: nextHistory,
          fixedRootCauseIds: nextFixedIds,
          secondaryActions: nextSecondaryActions
        }
      };
    });
  };

  const setStep = (step: number) => {
    setState((p: any) => ({ ...p, d4: { ...p.d4, step } }));
    const container = document.getElementById('main-content-scroll');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const generateIshikawa = () => {
    const existingCauses = (state.d4.hypotheses || [])
      .filter((h: Hypothesis) => (state.d4.selectedHypotheses || []).includes(h.id))
      .map((h: Hypothesis) => `[${h.category}]: ${h.text}`)
      .join("; ");

    const promptSuffix = existingCauses 
      ? `\n\nEXISTING CAUSES (DO NOT REPEAT THESE, GENERATE NEW AND DIFFERENT ONES): ${existingCauses}`
      : "";

    handleGeminiCall(
      'd4Ishikawa', 
      promptTemplates[state.language].d4Ishikawa, 
      `Phenomenon: ${state.d2.phenomenon}${getProblemContext()}${promptSuffix}`, 
      0.4, 
      schemas.d4Ishikawa, 
      (data) => {
        setState((p: any) => {
          const nextHypotheses: Hypothesis[] = [];
          const incomingHypotheses = (data as any)?.hypotheses || [];
          const currentD4 = p.d4 || INITIAL_STATE.d4;
          
          mCategories.forEach((cat: string) => {
            // Keep selected (fixed) hypotheses for this category
            const fixed = (currentD4.hypotheses || []).filter((h: Hypothesis) => 
              h.category === cat && (currentD4.selectedHypotheses || []).includes(h.id)
            );

            // Filter incoming hypotheses for this category
            const iaNew = incomingHypotheses
              .filter((nh: any) => nh && nh.category === cat)
              .map((nh: any, i: number) => ({ 
                id: `h-${Date.now()}-${cat.replace(/\s+/g, '')}-${i}`, 
                category: cat, 
                text: nh.text || "" 
              }));

            const merged = [...fixed];
            
            // Add new ones from AI if they are not duplicates and we have space (up to 4 total)
            for (const newItem of iaNew) {
              if (merged.length < 4) {
                const isDuplicate = merged.some(m => 
                  m.text.trim().toLowerCase() === newItem.text.trim().toLowerCase()
                );
                if (!isDuplicate) {
                  merged.push(newItem);
                }
              }
            }

            // Fill with placeholders if still less than 4
            while (merged.length < 4) {
              merged.push({ 
                id: `h-manual-${Date.now()}-${cat.replace(/\s+/g, '')}-${merged.length}`, 
                category: cat, 
                text: state.language === 'es' ? "Causa potencial adicional..." : "Additional potential cause..." 
              });
            }
            
            nextHypotheses.push(...merged);
          });
          
          return { ...p, d4: { ...currentD4, hypotheses: nextHypotheses, step: 1 } };
        });
      }
    );
  };

  const confirmedGembaHypotheses = useMemo(() => {
    return (state.d4.gembaDiagnostics || []).filter((diag: GembaDiagnostic) => {
      const checks = state.d4.observationChecks[diag.hypothesisId] || [];
      const noCount = checks.filter(v => v === 'no').length;
      return checks.filter(v => v !== null).length > 0 && (noCount / (diag.questions?.length || 1)) >= 0.5;
    });
  }, [state.d4.gembaDiagnostics, state.d4.observationChecks]);

  const experimentallyConfirmedHypotheses = useMemo(() => {
    const experimentalIds = state.d4.experimentalConfirmedCauses || [];
    return confirmedGembaHypotheses.filter(h => experimentalIds.includes(h.hypothesisId));
  }, [confirmedGembaHypotheses, state.d4.experimentalConfirmedCauses]);

  const generateGemba = () => {
    if ((state.d4.selectedHypotheses || []).length === 0) return alert(t('selectHypAlert'));
    const selectedList = (state.d4.hypotheses || []).filter(h => (state.d4.selectedHypotheses || []).includes(h.id));
    const causesText = selectedList.map(h => `ID: ${h.id} - Cause: ${h.text}`).join(", ");
    handleGeminiCall('d4Gemba', promptTemplates[state.language].d4Gemba, `Causes to audit: ${causesText}.${getProblemContext()}`, 0.3, schemas.d4Gemba, (data) => {
      const initialChecks: Record<string, ObservationValue[]> = { ...(state.d4.observationChecks || {}) };
      const incomingDiagnostics = (data as any)?.diagnostics || [];
      const diagnostics = incomingDiagnostics.map((d: any) => {
        const questions = d.questions || [];
        if (!initialChecks[d.hypothesisId]) { initialChecks[d.hypothesisId] = questions.map(() => null); }
        return { hypothesisId: d.hypothesisId || `diag-${Date.now()}`, cause: d.cause || "", questions: questions };
      });
      setState((p: any) => ({ ...p, d4: { ...p.d4, gembaDiagnostics: diagnostics, observationChecks: initialChecks, step: 2 } }));
    });
  };

  const downloadGembaCSV = () => {
    if (!state.d4.gembaDiagnostics || state.d4.gembaDiagnostics.length === 0) return alert(t('noChecklistAlert'));
    const data: any[][] = [
      ["CHECKLIST GEMBA - VALIDACIÓN EN PISO"],
      ["Caso:", state.setup.caseName],
      [],
      ["HIPOTESIS", "CATEGORIA", "PREGUNTA", "RESPUESTA AUDITADA"]
    ];
    state.d4.gembaDiagnostics.forEach(diag => {
      const originalHypothesis = state.d4.hypotheses.find(h => h.id === diag.hypothesisId);
      const checks = state.d4.observationChecks[diag.hypothesisId] || [];
      diag.questions.forEach((q, qIdx) => {
        const checkValue = checks[qIdx] === 'yes' ? 'SI' : checks[qIdx] === 'no' ? 'NO' : 'PENDIENTE';
        data.push([diag.cause, originalHypothesis?.category || 'N/A', q, checkValue]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gemba Checklist");
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 60 }, { wch: 20 }];
    XLSX.writeFile(wb, `Checklist_GEMBA_${state.setup.caseName || 'Proyecto'}.xlsx`);
  };

  const downloadExperimentalPlan = () => {
    if (!state.d4.verificationPlan) return alert(t('noExpPlanAlert'));
    handleDownloadPDF('experimental-preview-container', `Plan_Experimental_${state.setup.caseName}`);
  };

  const generateExperimentalReport = () => {
    if (confirmedGembaHypotheses.length === 0) return alert(t('noGembaConfirmAlert'));
    const causesText = confirmedGembaHypotheses.map(d => `- Cause: ${d.cause}`).join("\n");
    handleGeminiCall('d4Verify', promptTemplates[state.language].d4Verify, `PHENOMENON: ${state.d2.phenomenon}\n\nLIST OF CAUSES:\n${causesText}${getProblemContext()}`, 0.4, null, (data) => {
      setState((p: any) => ({ ...p, d4: { ...p.d4, verificationPlan: data || "" } }));
    });
  };

  const toggleHypothesis = (id: string) => {
    const current = state.d4.selectedHypotheses || [];
    const next = current.includes(id) ? current.filter((t: string) => t !== id) : [...current, id];
    setState((p: any) => ({ ...p, d4: { ...p.d4, selectedHypotheses: next } }));
  };

  const run5Whys = (id: string) => {
    const gembaData = state.d4.gembaDiagnostics?.find(d => d.hypothesisId === id);
    const targetText = id === state.d4.syntheticCause?.id ? state.d4.syntheticCause.text : (gembaData?.cause || "");
    const uniqueExecutionKey = `d4Whys-${id}-${Date.now()}`;
    const gembaConclusionsText = state.d4.gembaConclusions 
      ? `\n\nCONCLUSIONES DEL GEMBA RECOPILADAS (INFORMACIÓN ADICIONAL PARA ENFOCAR EL ANÁLISIS):\n${state.d4.gembaConclusions}` 
      : "";
    handleGeminiCall(uniqueExecutionKey, promptTemplates[state.language].d4Whys, `Confirmed: ${targetText}.${getProblemContext()}${gembaConclusionsText}`, 0.4, schemas.d4Whys, (data) => {
      const newAnalysis: FiveWhysAnalysis = { 
        id: `5w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        targetCause: targetText, 
        whys: (data as any)?.whys || [], 
        systemicRootCause: (data as any)?.causa_raiz_sistemica || "" 
      };
      setState((p: any) => ({ ...p, d4: { ...p.d4, fiveWhysHistory: [...(p.d4.fiveWhysHistory || []), newAnalysis], finalCause: targetText, step: 4 } }));
    });
  };

  const updateWhyAnswer = (analysisId: string, whyIdx: number, val: string) => {
    setState((p: AppState) => {
      const nextHistory = p.d4.fiveWhysHistory.map(analysis => {
        if (analysis.id === analysisId) {
          const nextWhys = [...analysis.whys];
          nextWhys[whyIdx] = { ...nextWhys[whyIdx], answer: val };
          return { ...analysis, whys: nextWhys };
        }
        return analysis;
      });
      return { ...p, d4: { ...p.d4, fiveWhysHistory: nextHistory } };
    });
  };

  const updateWhyStep = (analysisId: string, whyIdx: number, val: string) => {
    setState((p: AppState) => {
      const nextHistory = p.d4.fiveWhysHistory.map(analysis => {
        if (analysis.id === analysisId) {
          const nextWhys = [...analysis.whys];
          nextWhys[whyIdx] = { ...nextWhys[whyIdx], step: val };
          return { ...analysis, whys: nextWhys };
        }
        return analysis;
      });
      return { ...p, d4: { ...p.d4, fiveWhysHistory: nextHistory } };
    });
  };

  const updateSystemicRootCause = (analysisId: string, val: string) => {
    setState((p: AppState) => {
      const nextHistory = p.d4.fiveWhysHistory.map(analysis => {
        if (analysis.id === analysisId) {
          return { ...analysis, systemicRootCause: val };
        }
        return analysis;
      });
      return { ...p, d4: { ...p.d4, fiveWhysHistory: nextHistory } };
    });
  };

  const generateSyntheticCause = () => {
    const fixedIds = state.d4.fixedRootCauseIds || [];
    if (fixedIds.length === 0) return alert(state.language === 'es' ? 'Fije al menos una causa raíz.' : 'Fix at least one root cause.');
    const causesText = fixedIds.map(id => { 
      const analysis = state.d4.fiveWhysHistory?.find(a => a.id === id);
      return analysis?.systemicRootCause || t('unknownCause'); 
    }).join("; ");
    handleGeminiCall('d4CombinedCause', promptTemplates[state.language].d4CombinedCause, `PHENOMENON: ${state.d2.phenomenon}\nROOT CAUSES: ${causesText}${getProblemContext()}`, 0.5, schemas.d4CombinedCause, (data) => {
      setState((p: AppState) => ({ ...p, d4: { ...p.d4, syntheticCause: { id: `synth-${Date.now()}`, text: (data as any)?.synthetic_cause || t('failureModeDefault') } } }));
    });
  };

  const toggleFixedRootCause = (analysisId: string) => {
    setState((p: AppState) => {
      const current = p.d4.fixedRootCauseIds || [];
      const next = current.includes(analysisId) 
        ? current.filter(id => id !== analysisId) 
        : [...current, analysisId];
      return { ...p, d4: { ...p.d4, fixedRootCauseIds: next } };
    });
  };

  const generateAllActions = () => {
    const fixedIds = [...(state.d4.fixedRootCauseIds || [])];
    if (fixedIds.length === 0) return alert(state.language === 'es' ? 'Fije al menos una causa raíz.' : 'Fix at least one root cause.');
    
    const inputPayload = fixedIds.map(id => {
      if (id.startsWith('synth-')) return { id, text: state.d4.syntheticCause?.text };
      const analysis = state.d4.fiveWhysHistory.find(a => a.id === id);
      return { id, text: analysis?.systemicRootCause };
    }).map(item => `hypothesisId: ${item.id} | cause: ${item.text}`).join("\n");
    
    handleGeminiCall('d4Secondary', promptTemplates[state.language].d4Secondary, `PHENOMENON: ${state.d2.phenomenon}\n\nCAUSES LIST:\n${inputPayload}${getProblemContext()}`, 0.4, schemas.d4Secondary, (data) => {
      const actionMap: Record<string, ActionStep[]> = { ...(state.d4.secondaryActions || {}) };
      const results = (data as any)?.results || [];
      results.forEach((r: any) => { 
        if (r && r.hypothesisId) { 
          const matchingId = fixedIds.find(fid => String(fid) === String(r.hypothesisId));
          if (matchingId) { 
            const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            actionMap[matchingId] = (r.actions || []).map((act: string, idx: number) => ({ 
              id: `action-${matchingId}-${idx}-${Date.now()}`,
              action: act, 
              evidenceHow: "",
              evidenceDate: defaultDate,
              evidenceResponsible: state.language === 'es' ? "Líder de Área" : "Area Leader",
              verificationHow: "",
              responsible: state.language === 'es' ? "Líder de Área" : "Area Leader", 
              timeframe: defaultDate, 
              isFixed: false 
            })); 
          } 
        } 
      });
      setState((p: AppState) => ({ ...p, d4: { ...p.d4, secondaryActions: actionMap } }));
      alert(t('actionsMaterialized'));
    });
  };

  return (
    <div className="space-y-10 animate-slide-in">

      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ClipboardDocumentCheckIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d4')}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('forensicAnalysis')}
              <button onClick={() => setBanner({ title: t('forensicAnalysis'), content: t('tutD4Content') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,1)]">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex flex-wrap gap-4 mb-6">{[1, 2, 3, 4, 5].map(s => (<button key={s} onClick={() => setStep(s)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-[0.98] ${state.d4.step === s ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>{s === 1 ? `1. Ishikawa` : s === 2 ? `2. GEMBA` : s === 3 ? `3. 5 Whys` : s === 4 ? `4. ${t('rootCauseTitle')}` : `5. ${t('causesAndActionsTitle')}`}</button>))}</div>
      {state.d4.step === 1 && (<div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col"><div className="flex items-center justify-between mb-8"><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">{t('ishikawaTitle')} <button onClick={() => setBanner({ title: t('ishikawaTitle'), content: t('ishikawaBanner') })} className="transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3><button onClick={generateIshikawa} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-[0.95]">{t('genIshikawa')}</button></div><div className="space-y-12 h-auto">{mCategories.map((cat: string) => { const catHypotheses = (state.d4.hypotheses || []).filter((h: Hypothesis) => h.category === cat); return (<div key={cat} className="space-y-4 h-auto"><div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Square2StackIcon className="w-5 h-5 text-slate-400" /><h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{cat}</h4></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">{catHypotheses.length > 0 ? (catHypotheses.map((h: Hypothesis) => (<div key={h.id} onClick={() => toggleHypothesis(h.id)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between active:scale-[0.98] h-auto ${state.d4.selectedHypotheses?.includes(h.id) ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100' : 'border-slate-50 bg-white hover:border-blue-200'}`}><AutoExpandingTextarea value={h.text} onChange={(e: any) => { const nextH = [...(state.d4.hypotheses || [])]; const found = nextH.find(item => item.id === h.id); if (found) found.text = e.target.value; setState((p: any) => ({ ...p, d4: { ...p.d4, hypotheses: nextH } })); }} onClick={(e: any) => e.stopPropagation()} className="bg-transparent text-base font-bold text-slate-700 leading-snug outline-none focus:ring-1 focus:ring-blue-100 rounded p-1" /><div className="mt-4 flex justify-end">{state.d4.selectedHypotheses?.includes(h.id) ? (<span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg shadow-sm">{t('fix')}</span>) : (<span className="px-2 py-1 bg-slate-100 text-slate-400 text-[8px] font-black uppercase rounded-lg">{t('fix')}</span>)}</div></div>))) : (<div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">{t('waitingAnalysis')}</p></div>)}</div></div>); })}</div>{(state.d4.selectedHypotheses || []).length > 0 && (<div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-blue-600" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('selectedHyp')} <span className="text-blue-600">{state.d4.selectedHypotheses.length}</span></p></div><button onClick={() => setStep(2)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all active:scale-[0.95]">{t('gembaConfirm')}</button></div>)}</div>)}
      {state.d4.step === 2 && (
        <>
          <div className="space-y-12">
            <div className="industrial-card rounded-xl p-4 h-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  {t('floorValidation')}
                  <button onClick={() => setBanner({ title: t('floorValidation'), content: t('d4ChecklistBanner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,1)]">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h3>
                <div className="flex gap-2">
                  <button onClick={downloadGembaCSV} className="px-4 py-1.5 bg-slate-100 text-slate-700 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-[0.95]">
                    <CloudArrowDownIcon className="w-3.5 h-3.5" /> {t('csvChecklist')}
                  </button>
                  <button onClick={generateGemba} disabled={loading === 'd4Gemba'} className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm disabled:opacity-50 active:scale-[0.95]">
                    {loading === 'd4Gemba' ? '...' : t('createChecklist')}
                  </button>
                </div>
              </div>
              <div className="space-y-4 max-w-4xl mx-auto h-auto w-full">
                {(state.d4.gembaDiagnostics || []).map((diag: GembaDiagnostic, dIdx: number) => {
                  const checks = state.d4.observationChecks[diag.hypothesisId] || (diag.questions || []).map(() => null);
                  const noCount = checks.filter(v => v === 'no').length;
                  const isConfirmed = checks.filter(v => v !== null).length > 0 && (noCount / (diag.questions?.length || 1)) >= 0.5;
                  const noPercentage = (noCount / (diag.questions?.length || 1)) * 100;
                  return (
                    <div key={dIdx} className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden animate-slide-in h-auto ${isConfirmed ? 'border-red-500 shadow-lg ring-2 ring-red-50' : 'border-slate-100 shadow-sm'}`}>
                      <div className={`p-2 px-4 border-b flex items-center justify-between ${isConfirmed ? 'bg-red-50/80 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-2 flex-grow pr-4">
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${isConfirmed ? 'bg-red-600 shadow-sm' : 'bg-slate-200'}`}>
                            <ExclamationTriangleIcon className={`w-4 h-4 ${isConfirmed ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="space-y-0">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{state.language === 'es' ? 'Hipótesis' : 'Hypothesis'}</p>
                            <h4 className="text-[10px] font-black text-slate-900 uppercase leading-tight line-clamp-1">{diag.cause}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{state.language === 'es' ? 'Evidencia' : 'Evidence'}</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-700 ${isConfirmed ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${noPercentage}%` }}></div>
                              </div>
                              <span className={`text-[8px] font-black mono ${isConfirmed ? 'text-red-600' : 'text-blue-600'}`}>{noPercentage.toFixed(0)}%</span>
                            </div>
                          </div>
                          {isConfirmed && <div className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[7px] font-black uppercase tracking-tighter shadow-sm border border-red-400">{t('confirmed')}</div>}
                        </div>
                      </div>
                      <div className="p-3 space-y-1.5 h-auto flex flex-col bg-slate-50/20">
                        {(diag.questions || []).map((q, qIdx) => (
                          <div key={qIdx} className="p-1.5 px-3 bg-white rounded-md border border-slate-50 flex items-center gap-2 h-auto shadow-sm">
                            <div className="flex-grow text-[11px] font-bold text-slate-600 leading-tight">{q}</div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  const obsChecks = state.d4.observationChecks || {};
                                  const checksArr = obsChecks[diag.hypothesisId] ? [...obsChecks[diag.hypothesisId]] : [];
                                  checksArr[qIdx] = 'yes';
                                  setState((p: any) => ({ ...p, d4: { ...p.d4, observationChecks: { ...(p.d4.observationChecks || {}), [diag.hypothesisId]: checksArr } } }));
                                }}
                                className={`w-12 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${checks[qIdx] === 'yes' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white text-slate-300 border-slate-50 hover:border-emerald-200 hover:text-emerald-500'}`}
                              >
                                {state.language === 'es' ? 'Sí' : 'Yes'}
                              </button>
                              <button
                                onClick={() => {
                                  const obsChecks = state.d4.observationChecks || {};
                                  const checksArr = obsChecks[diag.hypothesisId] ? [...obsChecks[diag.hypothesisId]] : [];
                                  checksArr[qIdx] = 'no';
                                  setState((p: any) => ({ ...p, d4: { ...p.d4, observationChecks: { ...(p.d4.observationChecks || {}), [diag.hypothesisId]: checksArr } } }));
                                }}
                                className={`w-12 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${checks[qIdx] === 'no' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white text-slate-300 border-slate-50 hover:border-red-200 hover:text-red-500'}`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {confirmedGembaHypotheses.length > 0 && (
            <div className="industrial-card rounded-[2rem] p-8 border-l-[8px] border-l-orange-500 bg-white h-auto flex flex-col"><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-4"><div className="p-3 bg-orange-100 rounded-2xl"><BeakerIcon className="w-6 h-6 text-orange-600" /></div>                  <div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      {t('expValidation')}
                      <button onClick={() => setBanner({ title: t('expValidation'), content: t('d4ExpBanner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,1)]">
                        <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                      </button>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('expPlanTitle')}</p>
                  </div></div><div className="flex items-center gap-4"><button onClick={downloadExperimentalPlan} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-md"><PrinterIcon className="w-4 h-4" /> PDF</button><div className="flex bg-slate-100 p-1 rounded-lg"><button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button><button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button></div><button onClick={generateExperimentalReport} disabled={loading === 'd4Verify'} className="px-6 py-2 bg-orange-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-orange-700 transition-all disabled:opacity-50">{loading === 'd4Verify' ? '...' : t('genExpReport')}</button></div></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto"><div className="lg:col-span-2 h-auto flex flex-col"><div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 h-auto min-h-[500px] flex flex-col">{viewMode === 'edit' ? (<AutoExpandingTextarea value={state.d4.verificationPlan} onChange={(e: any) => setState((p: any) => ({ ...p, d4: { ...p.d4, verificationPlan: e.target.value } }))} className="bg-white border border-slate-200 rounded-2xl p-6 text-sm font-medium leading-relaxed outline-none transition-all mono" placeholder="..." />) : (<div id="experimental-preview-container" className="official-document p-10 rounded-[2rem] border border-slate-200 bg-white relative animate-scale-up h-auto flex flex-col min-h-[450px]"><div className="mb-8 border-b-2 border-slate-900 pb-4 no-print"><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('expPlanTitle')}</h2></div>{state.d4.verificationPlan ? (<div className="relative z-10 h-auto">{renderStyledMarkdown(state.d4.verificationPlan)}</div>) : (<div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50 flex-grow py-20"><DocumentTextIcon className="w-16 h-16" /><p className="text-xs font-black uppercase tracking-widest">{t('waitingAnalysis')}</p></div>)}</div>)}</div></div><div><div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm sticky top-10 h-auto flex flex-col"><h4 className="text-[10px] font-black text-slate-900 uppercase mb-6 tracking-widest flex items-center gap-2"><CheckBadgeIcon className="w-4 h-4 text-orange-600" /> {t('finalCauses')}</h4><div className="space-y-3 h-auto">{(confirmedGembaHypotheses || []).map((diag: GembaDiagnostic) => (<button key={diag.hypothesisId} onClick={() => { const current = state.d4.experimentalConfirmedCauses || []; const next = current.includes(diag.hypothesisId) ? current.filter(c => c !== diag.hypothesisId) : [...current, diag.hypothesisId]; setState((p: any) => ({ ...p, d4: { ...p.d4, experimentalConfirmedCauses: next } })); }} className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group h-auto ${state.d4.experimentalConfirmedCauses?.includes(diag.hypothesisId) ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-50 hover:border-orange-200 bg-white'}`}><span className={`text-xs font-bold ${state.d4.experimentalConfirmedCauses?.includes(diag.hypothesisId) ? 'text-emerald-700' : 'text-slate-600'}`}>{diag.cause}</span>                    {state.d4.experimentalConfirmedCauses?.includes(diag.hypothesisId) ? <CheckBadgeIconSolid className="w-5 h-5 text-emerald-600" /> : <CheckIcon className="w-5 h-5 text-slate-200 group-hover:text-orange-300 transition-colors" />}
                  </button>
                ))}
              </div>
              {(state.d4.experimentalConfirmedCauses || []).length > 0 && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.95]"
                >
                  {t('classifyCauses')} <BoltIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
)}
      {state.d4.step === 3 && (
        <div className="industrial-card rounded-[2rem] p-10 bg-slate-100 text-slate-900 shadow-xl border border-slate-200 relative h-auto flex flex-col">
          {experimentallyConfirmedHypotheses.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              <p className="text-xs font-black uppercase tracking-widest">{state.language === 'es' ? 'No hay causas confirmadas experimentalmente.' : 'No experimentally confirmed causes.'}</p>
            </div>
          ) : (
            <div className="space-y-12 h-auto flex flex-col">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-sm font-black text-blue-700 uppercase tracking-[0.3em] flex items-center gap-2">{t('pursuitWhys')} <button onClick={() => setBanner({ title: t('pursuitWhys'), content: t('fiveWhysBanner') })} className="transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3>
              </div>
              
              {/* Conclusiones del Gemba Section */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative h-auto flex flex-col mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-purple-600" />
                      {state.language === 'es' ? 'Conclusiones del Gemba' : 'Gemba Conclusions'}
                    </h4>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                      {state.language === 'es' 
                        ? 'Sube notas o reportes del Gemba para entrenar y guiar el análisis de los 5 Porqués.' 
                        : 'Upload Gemba notes or reports to train and guide the 5 Whys analysis.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <input 
                      type="file" 
                      id="gemba-conclusions-file-input"
                      onChange={handleGembaConclusionsUpload} 
                      accept=".pdf,.docx,.xlsx,.xls,.md,.txt" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => document.getElementById('gemba-conclusions-file-input')?.click()}
                      disabled={isExtractingGemba}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100 disabled:opacity-50"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                      {isExtractingGemba 
                        ? (state.language === 'es' ? 'Extrayendo...' : 'Extracting...') 
                        : (state.language === 'es' ? 'Cargar Documento' : 'Upload Document')}
                    </button>
                    {state.d4.gembaConclusions && (
                      <button
                        onClick={() => setState((p: any) => ({ ...p, d4: { ...p.d4, gembaConclusions: "" } }))}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                      >
                        {state.language === 'es' ? 'Limpiar' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={state.d4.gembaConclusions || ""}
                  onChange={(e) => setState((p: any) => ({ ...p, d4: { ...p.d4, gembaConclusions: e.target.value } }))}
                  placeholder={state.language === 'es' 
                    ? "Escribe o pega aquí el resumen, las notas, evidencias o conclusiones del Gemba para enriquecer las respuestas de la IA..." 
                    : "Write or paste the Gemba summary, notes, evidence, or conclusions here to enrich the AI answers..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 text-xs font-semibold focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all placeholder-slate-400 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-8">
                {experimentallyConfirmedHypotheses.map((diag: GembaDiagnostic) => {
                  const analysis = (state.d4.fiveWhysHistory || []).find((h: FiveWhysAnalysis) => h.targetCause === diag.cause);
                  const isLoading = loading?.includes(`d4Whys-${diag.hypothesisId}`);
                  
                  return (
                    <div key={diag.hypothesisId} className="animate-scale-up p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm relative h-auto flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest pr-12">
                          {state.language === 'es' ? 'Causa Confirmada' : 'Confirmed Cause'}: 
                          <span className="text-slate-900 ml-2">{diag.cause}</span>
                        </h5>
                        <div className="flex items-center gap-4">
                          {analysis && <CheckCircleIcon className="w-5 h-5 text-emerald-500" />}
                          <button 
                            onClick={() => run5Whys(diag.hypothesisId)} 
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            {isLoading ? '...' : analysis ? (state.language === 'es' ? 'Regenerar' : 'Regenerate') : t('run5WhysIA')}
                          </button>
                          
                          <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                            <input 
                              type="checkbox" 
                              checked={confirmedDeletes[diag.hypothesisId] || false}
                              onChange={(e) => setConfirmedDeletes(prev => ({ ...prev, [diag.hypothesisId]: e.target.checked }))}
                              className="w-4 h-4 accent-red-600 cursor-pointer"
                              title={state.language === 'es' ? 'Confirmar para borrar' : 'Confirm to delete'}
                            />
                            <button 
                              onClick={() => {
                                if (confirmedDeletes[diag.hypothesisId]) {
                                  handleDeleteConfirmedCause(diag.hypothesisId);
                                  setConfirmedDeletes(prev => {
                                    const next = { ...prev };
                                    delete next[diag.hypothesisId];
                                    return next;
                                  });
                                } else {
                                  alert(state.language === 'es' ? 'Marque la casilla para confirmar el borrado.' : 'Check the box to confirm deletion.');
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${confirmedDeletes[diag.hypothesisId] ? 'bg-red-600 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              {state.language === 'es' ? 'Borrar' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(state.d4.fiveWhysHistory || []).length > 0 && (
                <div className="mt-12 flex justify-end pt-8 border-t border-slate-200">
                  <button onClick={() => setStep(4)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]">
                    {state.language === 'es' ? 'Ver Análisis de Causa Raíz' : 'View Root Cause Analysis'} <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {state.d4.step === 4 && (
        <div className="space-y-10 animate-slide-in">
          <div className="industrial-card rounded-[2.5rem] p-10 bg-white border border-slate-100 shadow-xl h-auto flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('rootCauseTitle')}</h3>
                <button onClick={() => setBanner({ title: t('rootCauseTitle'), content: t('fiveWhysBanner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Final Analysis & Root Cause Identification.</p>
              </div>
              {(state.d4.fiveWhysHistory || []).length > 0 && (
                <div className="flex items-center gap-3 bg-red-50 p-3 rounded-2xl border border-red-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={confirmedDeletes['all'] || false}
                      onChange={(e) => setConfirmedDeletes(prev => ({ ...prev, all: e.target.checked }))}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">{state.language === 'es' ? 'Confirmar Todo' : 'Confirm All'}</span>
                  </label>
                  <button 
                    onClick={() => {
                      if (confirmedDeletes['all']) {
                        handleDeleteAllAnalyses();
                        setConfirmedDeletes(prev => ({ ...prev, all: false }));
                      } else {
                        alert(state.language === 'es' ? 'Marque la casilla para confirmar el borrado masivo.' : 'Check the box to confirm mass deletion.');
                      }
                    }}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${confirmedDeletes['all'] ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {state.language === 'es' ? 'Borrar Todo' : 'Delete All'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-12">
              {(state.d4.fiveWhysHistory || []).map((analysis) => {
                const isFixed = state.d4.fixedRootCauseIds?.includes(analysis.id);
                return (
                  <div key={analysis.id} className={`p-8 rounded-[2.5rem] border-2 transition-all h-auto flex flex-col ${isFixed ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{state.language === 'es' ? 'Origen' : 'Origin'}</p>
                        <h4 className="text-sm font-bold text-slate-700 italic">{analysis.targetCause}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleFixedRootCause(analysis.id)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-[0.95] ${isFixed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                        >
                          {isFixed ? (state.language === 'es' ? 'Fijado' : 'Fixed') : t('fix')}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6 mb-10">
                      {(analysis.whys || []).map((w: FiveWhyStep, i: number) => (
                        <div key={i} className="flex gap-6 items-start">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black flex-shrink-0 border border-slate-200">W{i+1}</div>
                          <div className="flex-grow pt-1">
                            <input 
                              type="text"
                              value={w.step} 
                              onChange={(e) => updateWhyStep(analysis.id, i, e.target.value)}
                              className="w-full bg-transparent text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest outline-none focus:ring-1 focus:ring-blue-100 rounded"
                            />
                            <AutoExpandingTextarea 
                              value={w.answer} 
                              onChange={(e: any) => updateWhyAnswer(analysis.id, i, e.target.value)}
                              className="bg-transparent text-sm font-bold text-slate-600 leading-relaxed italic outline-none focus:ring-1 focus:ring-blue-100 rounded w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`p-8 rounded-2xl border-2 transition-all ${isFixed ? 'bg-emerald-600 border-emerald-400 shadow-lg' : 'bg-blue-600 border-blue-400 shadow-md'}`}>
                      <p className={`text-[9px] font-black uppercase mb-2 tracking-[0.3em] ${isFixed ? 'text-emerald-100' : 'text-blue-100'}`}>{t('systemicRoot')}</p>
                      <AutoExpandingTextarea 
                        value={analysis.systemicRootCause} 
                        onChange={(e: any) => updateSystemicRootCause(analysis.id, e.target.value)}
                        className="bg-transparent text-xl font-black text-white uppercase tracking-tight leading-tight outline-none w-full"
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3 bg-red-50 p-3 rounded-2xl border border-red-100">
                        <input 
                          type="checkbox" 
                          checked={confirmedDeletes[analysis.id] || false}
                          onChange={(e) => setConfirmedDeletes(prev => ({ ...prev, [analysis.id]: e.target.checked }))}
                          className="w-5 h-5 accent-red-600 cursor-pointer"
                        />
                        <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">{state.language === 'es' ? 'Confirmar Borrado' : 'Confirm Delete'}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirmedDeletes[analysis.id]) {
                            handleDeleteAnalysis(analysis.id);
                            setConfirmedDeletes(prev => {
                              const next = { ...prev };
                              delete next[analysis.id];
                              return next;
                            });
                          } else {
                            alert(state.language === 'es' ? 'Marque la casilla para confirmar.' : 'Check the box to confirm.');
                          }
                        }}
                        className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${confirmedDeletes[analysis.id] ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        {state.language === 'es' ? 'Eliminar Análisis' : 'Delete Analysis'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {(state.d4.fixedRootCauseIds || []).length > 0 && (
              <div className="mt-12 flex justify-end pt-8 border-t border-slate-200">
                <button onClick={() => setStep(5)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]">
                  {state.language === 'es' ? 'Generar Acciones' : 'Generate Actions'} <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {state.d4.step === 5 && (
        <div className="space-y-10 animate-slide-in">
          <div className="industrial-card rounded-[2.5rem] p-10 bg-white border border-slate-100 shadow-xl h-auto flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('causesAndActionsTitle')}</h3>
                <button onClick={() => setBanner({ title: t('causesAndActionsTitle'), content: t('d5Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Action Materialization for Fixed Root Causes.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={generateAllActions} disabled={loading === 'd4Secondary' || (state.d4.fixedRootCauseIds || []).length === 0} className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-blue-700 disabled:opacity-30 transition-all">{t('genActions')}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">
              {(state.d4.fixedRootCauseIds || []).map((id: string) => {
                const analysis = state.d4.fiveWhysHistory?.find(a => a.id === id);
                if (!analysis) return null;
                const isPrimary = state.d4.primaryCauseId === id;
                const actions = state.d4.secondaryActions?.[id] || [];
                return (
                  <div key={id} className={`p-8 rounded-[2rem] border-2 transition-all h-auto flex flex-col ${isPrimary ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{isPrimary ? <StarIcon className="w-5 h-5" /> : <Square2StackIcon className="w-5 h-5" />}</div>
                      <button onClick={() => setState((p: any) => ({ ...p, d4: { ...p.d4, primaryCauseId: id } }))} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-blue-100'}`}>{isPrimary ? t('primary') : t('fix')}</button>
                    </div>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{state.language === 'es' ? 'Causa Raíz' : 'Root Cause'}</p>
                    <h4 className="text-sm font-bold text-slate-800 leading-relaxed mb-6">{analysis.systemicRootCause}</h4>
                    <div className="space-y-4 mt-auto">
                      <div className="h-px bg-slate-100 w-full mb-4"></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('actionsTitle')}</p>
                      {actions.length > 0 ? (
                        <div className="space-y-2 h-auto">
                          {actions.map((action, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-[11px] font-bold text-slate-600">
                              <AutoExpandingTextarea value={action.action} onChange={(e: any) => { const nextActions = [...(state.d4.secondaryActions[id] || [])]; nextActions[idx] = { ...nextActions[idx], action: e.target.value }; setState((p: any) => ({ ...p, d4: { ...p.d4, secondaryActions: { ...p.d4.secondaryActions, [id]: nextActions } } })); }} className="bg-transparent text-[11px] font-bold text-emerald-800 outline-none w-full" />
                            </div>
                          ))}
                        </div>
                      ) : <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center opacity-40"><p className="text-[9px] font-black uppercase">{t('waitingAnalysis')}</p></div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex justify-end pt-8 border-t border-slate-200">
              <button onClick={() => setActiveTab(Tab.D5)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]">
                {t('advanceACP')} <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const D5Section = ({ state, setState, handleGeminiCall, getProblemContext, loading, setActiveTab, t, setBanner }: any) => {
  const setD5Step = (s: number) => setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, step: s } }));

  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d5_d6: INITIAL_STATE.d5_d6
    }));
  };

  const generateACP = (evt?: any) => {
    const isManualClick = evt !== undefined;
    const d4 = state.d4 || INITIAL_STATE.d4;
    const fixedIds = [...(d4.fixedRootCauseIds || [])];

    if (fixedIds.length === 0) {
      if (isManualClick) {
        alert(state.language === 'es' ? 'Debe fijar al menos una causa raíz en el paso D4.' : 'You must fix at least one root cause in step D4.');
      }
      return;
    }

    // Check if any fixed root causes don't have actions in d4.secondaryActions
    const missingActions = fixedIds.filter(id => {
      const actions = d4.secondaryActions?.[id] || [];
      return actions.length === 0;
    });

    if (missingActions.length > 0 && isManualClick) {
      const inputPayload = fixedIds.map(id => {
        if (id.startsWith('synth-')) return { id, text: d4.syntheticCause?.text || "" };
        const analysis = d4.fiveWhysHistory?.find(a => a.id === id);
        return { id, text: analysis?.systemicRootCause || "" };
      }).map(item => `hypothesisId: ${item.id} | cause: ${item.text}`).join("\n");

      handleGeminiCall('d5Secondary', promptTemplates[state.language].d4Secondary, `PHENOMENON: ${state.d2.phenomenon}\n\nCAUSES LIST:\n${inputPayload}${getProblemContext()}`, 0.4, schemas.d4Secondary, (data: any) => {
        const actionMap: Record<string, ActionStep[]> = { ...(d4.secondaryActions || {}) };
        const results = data?.results || [];
        results.forEach((r: any) => { 
          if (r && r.hypothesisId) { 
            const matchingId = fixedIds.find(fid => String(fid) === String(r.hypothesisId));
            if (matchingId) { 
              const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              actionMap[matchingId] = (r.actions || []).map((act: string, idx: number) => ({ 
                id: `action-${matchingId}-${idx}-${Date.now()}`,
                action: act, 
                evidenceHow: "",
                evidenceDate: defaultDate,
                evidenceResponsible: state.language === 'es' ? "Líder de Área" : "Area Leader",
                verificationHow: "",
                responsible: state.language === 'es' ? "Líder de Área" : "Area Leader", 
                timeframe: defaultDate, 
                isFixed: false 
              })); 
            } 
          } 
        });

        const newPlans: ACPPlan[] = [];
        const caseNumberMatch = state.setup.caseName.match(/^\d+/);
        const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";
        const isAudit = state.setup.type === 'Hallazgo de Auditoría, ACPM';
        let globalActionCounter = 1;

        fixedIds.forEach((id) => {
          const actions = actionMap[id] || [];
          if (actions.length > 0) {
            let rootText = "";
            if (id.startsWith('synth-')) {
              rootText = d4.syntheticCause?.text || "";
            } else {
              const analysis = d4.fiveWhysHistory?.find(a => a.id === id);
              rootText = analysis?.systemicRootCause || "";
            }

            newPlans.push({
              id: `acp-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              rootCause: rootText,
              title: state.language === 'es' ? `Plan ACP: ${rootText.substring(0, 40)}...` : `PCA Plan: ${rootText.substring(0, 40)}...`,
              introduction: state.language === 'es' ? `Acciones para mitigación de falla.` : `Actions for failure mitigation.`,
              actions: actions.map((a, idx) => ({ 
                ...a, 
                id: a.id || `action-${id}-${idx}-${Date.now()}`,
                actionId: isAudit && caseNumber ? `${caseNumber}-${globalActionCounter++}` : undefined,
                evidenceHow: a.evidenceHow || "",
                evidenceDate: a.evidenceDate || (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
                evidenceResponsible: a.evidenceResponsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
                verificationHow: a.verificationHow || "",
                isFixed: a.isFixed || false 
              })),
              type: id === d4.primaryCauseId ? 'primary' : 'secondary'
            });
          }
        });

        setState((p: any) => ({
          ...p,
          d4: { ...p.d4, secondaryActions: actionMap },
          d5_d6: { ...(p.d5_d6 || {}), acpPlans: newPlans }
        }));
        alert(t('actionsMaterialized'));
      });
      return;
    }

    // Offline mapping from existing actions
    const newPlans: ACPPlan[] = [];
    const caseNumberMatch = state.setup.caseName.match(/^\d+/);
    const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";
    const isAudit = state.setup.type === 'Hallazgo de Auditoría, ACPM';
    let globalActionCounter = 1;

    fixedIds.forEach((id) => {
      const secondaryActions = d4.secondaryActions || {};
      const actions = secondaryActions[id] || [];
      if (actions.length > 0) {
        let rootText = "";
        if (id.startsWith('synth-')) {
          rootText = d4.syntheticCause?.text || "";
        } else {
          const analysis = d4.fiveWhysHistory?.find(a => a.id === id);
          rootText = analysis?.systemicRootCause || "";
        }

        newPlans.push({
          id: `acp-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          rootCause: rootText,
          title: state.language === 'es' ? `Plan ACP: ${rootText.substring(0, 40)}...` : `PCA Plan: ${rootText.substring(0, 40)}...`,
          introduction: state.language === 'es' ? `Acciones para mitigación de falla.` : `Actions for failure mitigation.`,
          actions: actions.map((a, idx) => ({ 
            ...a, 
            id: a.id || `action-${id}-${idx}-${Date.now()}`,
            actionId: isAudit && caseNumber ? `${caseNumber}-${globalActionCounter++}` : undefined,
            evidenceHow: a.evidenceHow || "",
            evidenceDate: a.evidenceDate || (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
            evidenceResponsible: a.evidenceResponsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            verificationHow: a.verificationHow || "",
            isFixed: a.isFixed || false 
          })),
          type: id === d4.primaryCauseId ? 'primary' : 'secondary'
        });
      }
    });

    setState((p: any) => ({
      ...p,
      d5_d6: { ...(p.d5_d6 || {}), acpPlans: newPlans }
    }));

    if (isManualClick) {
      if (newPlans.length > 0) {
        alert(t('actionsMaterialized'));
      } else {
        alert(state.language === 'es' ? 'No se encontraron acciones en D4. Por favor genere las acciones en el paso D4 o verifique que existan causas fijadas.' : 'No actions found in D4. Please generate actions in step D4 or verify that fixed causes exist.');
      }
    }
  };

  const refreshImprovementActions = () => {
    if (state.setup.type !== 'Oportunidad de mejora') return;
    const phenomenonText = state.d2.phenomenon || state.d2.fieldDataInput || state.setup.caseName;
    if (!phenomenonText || phenomenonText.trim() === '') {
      alert(state.language === 'es' ? 'No se encontró la descripción del fenómeno u oportunidad de mejora.' : 'No phenomenon or improvement opportunity description found.');
      return;
    }

    const currentPlans = state.d5_d6.acpPlans || [];
    if (currentPlans.length === 0) {
      alert(state.language === 'es' ? 'No hay un plan de acciones generado actualmente.' : 'There is currently no generated action plan.');
      return;
    }

    const primaryPlanIndex = currentPlans.findIndex((p: ACPPlan) => p.type === 'primary') !== -1 
      ? currentPlans.findIndex((p: ACPPlan) => p.type === 'primary') 
      : 0;
    const targetPlan = currentPlans[primaryPlanIndex];
    const existingActions: ActionStep[] = targetPlan.actions || [];

    const fixedActions = existingActions.filter(a => a.isFixed);
    const unfixedCount = Math.max(1, 4 - fixedActions.length);
    const existingActionTexts = existingActions.map(a => a.action).join(" | ");

    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caseNumberMatch = state.setup.caseName.match(/^\d+/);
    const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";

    handleGeminiCall(
      'd5RefreshImprovement',
      promptTemplates[state.language]?.d4Secondary || "Genera acciones de mejora estructuradas para la oportunidad de mejora.",
      `OPORTUNIDAD DE MEJORA / FENÓMENO: ${phenomenonText}\n\nACCIONES EXISTENTES (NO REPETIR): ${existingActionTexts}\n\nGenera exactamente ${unfixedCount} acciones concretas de mejora NUEVAS y DIFERENTES a las existentes.${getProblemContext ? getProblemContext() : ''}`,
      0.5,
      schemas.d4Secondary,
      (data: any) => {
        let actionList: string[] = [];
        if (data?.results?.[0]?.actions && Array.isArray(data.results[0].actions)) {
          actionList = data.results[0].actions;
        } else if (Array.isArray(data?.actions)) {
          actionList = data.actions;
        } else if (data?.results && Array.isArray(data.results)) {
          actionList = data.results.flatMap((r: any) => r.actions || []);
        }

        if (!actionList || actionList.length === 0) {
          actionList = [
            state.language === 'es' ? "Implementar auditorías aleatorias en Gemba para asegurar adherencia al estándar" : "Implement random Gemba audits to ensure standard adherence",
            state.language === 'es' ? "Diseñar e instalar ayudas visuales Poka-Yoke en la estación de trabajo" : "Design and install visual Poka-Yoke aids at the workstation",
            state.language === 'es' ? "Revisar y actualizar la matriz de competencias y matriz de riesgos del área" : "Review and update area competency and risk matrix",
            state.language === 'es' ? "Establecer indicador de gestión semanal para medir el desempeño del proceso" : "Establish weekly management indicator to measure process performance"
          ];
        }

        const newFormattedActions: ActionStep[] = actionList.slice(0, unfixedCount).map((actText: any, idx: number) => {
          const act = typeof actText === 'string' ? actText : (actText?.action || actText?.text || String(actText));
          const actionIdx = fixedActions.length + idx + 1;
          return {
            id: `action-improvement-refresh-${idx}-${Date.now()}`,
            actionId: caseNumber ? `${caseNumber}-${actionIdx}` : `${actionIdx}`,
            action: act,
            evidenceHow: state.language === 'es' ? "Documento o Registro de implementación del estándar" : "Standard implementation document or record",
            evidenceDate: defaultDate,
            evidenceResponsible: state.setup.responsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            verificationHow: state.language === 'es' ? "Auditoría en Gemba y seguimiento a KPI" : "Gemba audit and KPI follow-up",
            responsible: state.setup.responsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            timeframe: defaultDate,
            isFixed: false
          };
        });

        const finalActions: ActionStep[] = [];
        let newIdx = 0;
        existingActions.forEach((a) => {
          if (a.isFixed) {
            finalActions.push(a);
          } else if (newIdx < newFormattedActions.length) {
            finalActions.push(newFormattedActions[newIdx++]);
          }
        });

        while (newIdx < newFormattedActions.length) {
          finalActions.push(newFormattedActions[newIdx++]);
        }

        const nextPlans = [...currentPlans];
        nextPlans[primaryPlanIndex] = {
          ...targetPlan,
          actions: finalActions
        };

        setState((p: AppState) => ({
          ...p,
          d5_d6: {
            ...(p.d5_d6 || {}),
            acpPlans: nextPlans
          }
        }));
      }
    );
  };

  const generateImplementationGuide = (action: ActionStep) => {
    handleGeminiCall(`d5Impl-${action.id}`, promptTemplates[state.language].d5Implementation, `ACTION: ${action.action}\nRESPONSIBLE: ${action.responsible}\nTIMEFRAME: ${action.timeframe}${getProblemContext()}`, 0.4, null, (data) => {
      setState((p: AppState) => ({
        ...p,
        d5_d6: {
          ...p.d5_d6,
          implementationSuggestions: {
            ...(p.d5_d6.implementationSuggestions || {}),
            [action.id]: data
          }
        }
      }));
    });
  };

  useEffect(() => {
    if ((!state.d5_d6.acpPlans || state.d5_d6.acpPlans.length === 0) && state.d4.secondaryActions && Object.keys(state.d4.secondaryActions).length > 0) {
      generateACP();
    }
  }, []);

  const exportACPToCSV = () => {
    if (!state.d5_d6.acpPlans || state.d5_d6.acpPlans.length === 0) return alert(t('waitingAnalysis'));
    const data: any[][] = [
      ["PLAN DE ACCIONES CORRECTIVAS PERMANENTES (ACP)"],
      ["Caso:", state.setup.caseName],
      [],
      ["TIPO", "TITULO", "CAUSA_RAIZ", "ID_ACCION", "ACCION", "EVIDENCIA_IMPLEMENTACION", "VERIFICACION_IMPLEMENTACION", "FECHA", "RESPONSABLE", "ESTADO"]
    ];
    state.d5_d6.acpPlans.forEach(plan => {
      plan.actions.forEach(action => {
        data.push([
          plan.type,
          plan.title,
          plan.rootCause,
          action.actionId || '',
          action.action,
          action.evidenceHow || '',
          action.verificationHow || '',
          action.timeframe,
          action.responsible,
          action.isFixed ? 'FIXED' : 'PENDING'
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan ACP");
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.writeFile(wb, `Plan_ACP_${state.setup.caseName || 'Proyecto'}.xlsx`);
  };

  const fixedActions = (state.d5_d6.acpPlans || []).flatMap((p: ACPPlan) => p.actions || []).filter(a => a.isFixed);

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <WrenchScrewdriverIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d5')}</h2>
              <button onClick={() => setBanner({ title: t('d5'), content: t('d5Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('eliminateRoot')}
              <button onClick={() => setBanner({ title: t('eliminateRoot'), content: t('d5Banner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {[1, 2].map(s => (
          <button 
            key={s} 
            onClick={() => setD5Step(s)} 
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-[0.98] ${state.d5_d6.step === s ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
          >
            {s === 1 ? (state.language === 'es' ? '1. Generar Plan' : '1. Generate Plan') : (state.language === 'es' ? '2. Implementación Plan' : '2. Implementation Plan')}
          </button>
        ))}
      </div>

      {state.d5_d6.step === 1 && (
        <div className="space-y-10">
          <div className="flex flex-wrap justify-end gap-4">
            {state.setup.type === 'Oportunidad de mejora' && (
              <button 
                onClick={refreshImprovementActions} 
                disabled={loading === 'd5RefreshImprovement'}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" /> 
                {loading === 'd5RefreshImprovement' 
                  ? '...' 
                  : (state.language === 'es' ? 'Refrescar / Generar Acciones No Fijadas' : 'Refresh / Generate Unfixed Actions')}
              </button>
            )}
            <button 
              onClick={() => generateACP(true)} 
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" /> {state.language === 'es' ? 'Actualizar Acciones' : 'Update Actions'}
            </button>
            <button onClick={exportACPToCSV} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
              <CloudArrowDownIcon className="w-4 h-4" /> {t('downloadACP')}
            </button>
          </div>
          
          <div className="space-y-12">
            {(state.d5_d6.acpPlans || []).map((plan: ACPPlan, pIdx: number) => (
              <div key={plan.id} className={`industrial-card rounded-[2.5rem] p-10 bg-white border-2 transition-all relative ${plan.type === 'primary' ? 'border-blue-600 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-8 pr-16">
                  <div className="space-y-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${plan.type === 'primary' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {plan.type === 'primary' ? t('primary') : t('secondary')}
                      </div>
                      <div className="h-px bg-slate-100 flex-grow"></div>
                    </div>
                    
                    <AutoExpandingTextarea 
                      value={plan.title} 
                      onChange={(e: any) => { 
                        const nextPlans = [...state.d5_d6.acpPlans]; 
                        nextPlans[pIdx].title = e.target.value; 
                        setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                      }} 
                      className="bg-transparent text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight outline-none w-full border-none p-0 focus:ring-0" 
                    />

                    <div className="p-6 bg-slate-50/80 rounded-[2rem] border border-slate-100/50 shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {state.language === 'es' ? 'Causa Raíz Asociada' : 'Associated Root Cause'}
                        </label>
                        <button onClick={() => setBanner({ title: state.language === 'es' ? 'Causa Raíz Asociada' : 'Associated Root Cause', content: t('d5RootCauseBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
                          <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                        </button>
                      </div>
                      <AutoExpandingTextarea 
                        value={plan.rootCause} 
                        onChange={(e: any) => { 
                          const nextPlans = [...state.d5_d6.acpPlans]; 
                          nextPlans[pIdx].rootCause = e.target.value; 
                          setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                        }} 
                        className="bg-transparent text-sm font-bold text-slate-700 leading-relaxed outline-none w-full border-none p-0 focus:ring-0" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{state.language === 'es' ? 'ID Acción' : 'Action ID'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">{t('action')}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">{state.language === 'es' ? '¿Cuál será la evidencia de la implementación?' : 'What will be the implementation evidence?'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">{state.language === 'es' ? '¿Cómo se verificará la implementación?' : 'How will the implementation be verified?'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{state.language === 'es' ? 'Fecha impl.' : 'Impl. date'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[220px] min-w-[220px]">{state.language === 'es' ? 'Resp. impl.' : 'Impl. resp.'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">{t('fix')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {(plan.actions || []).map((action: ActionStep, aIdx: number) => (
                        <tr key={aIdx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-[10px] font-black text-slate-400 mono">
                            <input 
                              type="text" 
                              value={action.actionId || ''} 
                              onChange={(e) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].actionId = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[10px] font-black text-slate-700 mono outline-none w-full border-none p-0 focus:ring-0" 
                              placeholder="ID"
                            />
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <AutoExpandingTextarea 
                              value={action.action} 
                              onChange={(e: any) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].action = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0" 
                            />
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <AutoExpandingTextarea 
                              value={action.evidenceHow || ''} 
                              onChange={(e: any) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].evidenceHow = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0" 
                              placeholder="..."
                            />
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <AutoExpandingTextarea 
                              value={action.verificationHow || ''} 
                              onChange={(e: any) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].verificationHow = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0" 
                              placeholder="..."
                            />
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500">
                            <input 
                              type="date" 
                              value={action.timeframe} 
                              onChange={(e) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].timeframe = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-full border-none p-0 focus:ring-0 cursor-pointer" 
                            />
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500 w-[220px] min-w-[220px]">
                            <input 
                              type="text" 
                              value={action.responsible} 
                              onChange={(e) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].responsible = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-full border-none p-0 focus:ring-0" 
                            />
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].isFixed = !action.isFixed; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className={`p-2 rounded-lg transition-all ${action.isFixed ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-300 hover:text-blue-600'}`}
                            >
                              {action.isFixed ? <CheckBadgeIconSolid className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
          {fixedActions.length > 0 && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => setD5Step(2)} 
                className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-[0.95]"
              >
                {state.language === 'es' ? 'Ir a Implementación Plan' : 'Go to Implementation Plan'} <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {state.d5_d6.step === 2 && (
        <div className="space-y-10 animate-slide-in">
          {fixedActions.length === 0 ? (
            <div className="industrial-card rounded-[2.5rem] p-20 text-center bg-white border border-slate-200 opacity-50">
              <ExclamationCircleIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {state.language === 'es' ? 'Fija al menos una acción en el paso 1 para generar su guía de implementación.' : 'Fix at least one action in step 1 to generate its implementation guide.'}
              </p>
              <button onClick={() => setD5Step(1)} className="mt-6 px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">
                {state.language === 'es' ? 'Volver al Paso 1' : 'Back to Step 1'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {fixedActions.map((action: ActionStep) => {
                const suggestion = state.d5_d6.implementationSuggestions?.[action.id];
                const isGenerating = loading?.includes(`d5Impl-${action.id}`);
                
                return (
                  <div key={action.id} className="industrial-card rounded-[2.5rem] p-10 bg-white border border-slate-100 shadow-xl h-auto flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                          <BoltIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{action.action}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t('responsible')}: {action.responsible} | {t('implementationDate')}: {action.timeframe}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => generateImplementationGuide(action)}
                        disabled={isGenerating}
                        className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {isGenerating ? '...' : (suggestion ? (state.language === 'es' ? 'Regenerar Guía' : 'Regenerate Guide') : (state.language === 'es' ? 'Generar Guía' : 'Generate Guide'))}
                      </button>
                    </div>
                    
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[200px] h-auto flex flex-col">
                      {suggestion ? (
                        <AutoExpandingTextarea 
                          value={suggestion} 
                          onChange={(e: any) => {
                            setState((p: AppState) => ({
                              ...p,
                              d5_d6: {
                                ...p.d5_d6,
                                implementationSuggestions: {
                                  ...(p.d5_d6.implementationSuggestions || {}),
                                  [action.id]: e.target.value
                                }
                              }
                            }));
                          }}
                          className="bg-transparent text-sm font-medium text-slate-700 leading-relaxed outline-none w-full border-none p-0 focus:ring-0" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50 py-10">
                          <DocumentTextIcon className="w-12 h-12" />
                          <p className="text-[10px] font-black uppercase tracking-widest">{t('waitingAnalysis')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end mt-12">
            <button 
              onClick={() => setActiveTab(Tab.D6)} 
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]"
            >
              {state.language === 'es' ? 'Avanzar a POKA-YOKE' : 'Advance to POKA-YOKE'} <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const D6Section = ({ state, setState, handleGeminiCall, getProblemContext, loading, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d5_d6: {
        ...p.d5_d6,
        pokaYokes: INITIAL_STATE.d5_d6.pokaYokes
      }
    }));
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const generatePokaYokes = () => {
    const history = state.d4.fiveWhysHistory || [];
    if (history.length === 0) return alert(t('rcaRequired'));
    const rootCause = history[history.length - 1].systemicRootCause;
    handleGeminiCall('d5Poka', promptTemplates[state.language].d5Poka, `Root Cause: ${rootCause}${getProblemContext()}`, 0.5, schemas.d5Poka, (data) => {
      setState((p: AppState) => {
        const confirmedPoka = (p.d5_d6.pokaYokes || []).filter(py => py.isConfirmed);
        const newSolutions = (data as any)?.solutions.map((s: any) => ({ 
          ...s, 
          id: `poka-${Date.now()}-${Math.random()}`, 
          isConfirmed: false 
        }));
        return { 
          ...p, 
          d5_d6: { 
            ...(p.d5_d6 || {}), 
            pokaYokes: [...confirmedPoka, ...newSolutions] 
          } 
        };
      });
    });
  };
  const getPokaDetails = (id: string, solution: PokaYokeSolution) => {
    if (solution.details) return setExpandedId(expandedId === id ? null : id);
    handleGeminiCall(`pokaDetail-${id}`, promptTemplates[state.language].pokaDetail, `Solution: ${solution.description}.`, 0.4, null, (data) => {
      setState((p: AppState) => { const nextPoka = (p.d5_d6.pokaYokes || []).map(item => item.id === id ? { ...item, details: (data as string) || "" } : item); return { ...p, d5_d6: { ...p.d5_d6, pokaYokes: nextPoka } }; });
      setExpandedId(id);
    });
  };
  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <LightBulbIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d6')}</h2>
              <button onClick={() => setBanner({ title: t('d6'), content: t('d6Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('preventionDesign')}
              <button onClick={() => setBanner({ title: t('preventionDesign'), content: t('d6Banner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex justify-end gap-4">
        <button 
          onClick={() => {
            const confirmedPokas = (state.d5_d6.pokaYokes || []).filter((p: PokaYokeSolution) => p.isConfirmed && p.details);
            if (confirmedPokas.length === 0) return alert(state.language === 'es' ? 'No hay Poka-Yokes confirmados con guía técnica.' : 'No confirmed Poka-Yokes with technical guide.');
            
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            
            printWindow.document.write(`
              <html>
                <head>
                  <title>Guia_Tecnica_PokaYoke_Completa</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
                  <style>
                    @page { size: A4 landscape; margin: 15mm; }
                    body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; -webkit-print-color-adjust: exact; }
                    .official-document { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
                    .page-break { page-break-before: always; }
                    .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; background: #f8fafc; margin-bottom: 1.5rem; padding: 1.5rem; }
                  </style>
                </head>
                <body>
                  <div class="max-w-4xl mx-auto p-10">
                    <h1 class="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-10 border-b-4 border-slate-900 pb-4">Guía Técnica Poka-Yoke</h1>
                    ${confirmedPokas.map((p: PokaYokeSolution, idx: number) => `
                      <div class="${idx > 0 ? 'page-break mt-10' : ''}">
                        <div class="mb-6">
                          <h2 class="text-2xl font-black text-blue-600 uppercase tracking-tight">${p.description}</h2>
                          <div class="flex gap-2 mt-2">
                            <span class="px-2 py-1 bg-slate-100 text-[10px] font-black uppercase rounded">${p.type}</span>
                            <span class="px-2 py-1 bg-slate-100 text-[10px] font-black uppercase rounded">${p.level}</span>
                          </div>
                        </div>
                        <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                          <p class="text-[10px] font-black text-orange-600 uppercase mb-2 tracking-widest">Beneficio Esperado</p>
                          <p class="text-sm font-bold text-slate-600">${p.benefit}</p>
                        </div>
                        <div class="prose max-w-none">
                          ${p.details ? p.details.split('\n').map(line => `<p class="text-sm text-slate-700 mb-2">${line}</p>`).join('') : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  <script>
                    window.onload = () => {
                      setTimeout(() => {
                        window.print();
                        window.onafterprint = () => window.close();
                      }, 500);
                    };
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }}
          className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-red-700 transition-all flex items-center gap-2 active:scale-[0.95]"
        >
          <PrinterIcon className="w-4 h-4" /> {state.language === 'es' ? 'Descargar Guía Completa PDF' : 'Download Full Guide PDF'}
        </button>
        <button onClick={generatePokaYokes} disabled={loading === 'd5Poka'} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-orange-700 transition-all flex items-center gap-2 active:scale-[0.95]">{loading === 'd5Poka' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BoltIcon className="w-4 h-4" />} {t('proposeSolutions')}</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto">
        {(state.d5_d6.pokaYokes || []).map((poka: PokaYokeSolution) => (
          <div key={poka.id} className={`industrial-card rounded-[2.5rem] p-8 border-2 flex flex-col h-auto transition-all hover:shadow-2xl ${poka.isConfirmed ? 'border-blue-600 shadow-xl' : 'border-slate-100 bg-white'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <LightBulbIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    const nextPoka = (state.d5_d6.pokaYokes || []).map(item => item.id === poka.id ? { ...item, isConfirmed: !item.isConfirmed } : item); 
                    setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, pokaYokes: nextPoka } })); 
                  }} 
                  className={`p-2 rounded-lg transition-all shadow-sm ${poka.isConfirmed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-blue-600'}`}
                >
                  {poka.isConfirmed ? <CheckBadgeIconSolid className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                </button>
                {poka.details && (
                  <button onClick={() => handleDownloadPDF(`poka-print-${poka.id}`, `Guia_PokaYoke_${poka.id}`)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm flex items-center gap-2">
                    <PrinterIcon className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">PDF</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="px-2 py-0.5 bg-orange-600 text-white text-[8px] font-black uppercase rounded-lg w-fit">{poka.type}</div>
              {poka.level && (
                <div className={`px-2 py-0.5 text-white text-[8px] font-black uppercase rounded-lg w-fit ${poka.level.toLowerCase().includes('basic') || poka.level.toLowerCase().includes('básico') ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                  {poka.level}
                </div>
              )}
            </div>

            <h4 className="text-sm font-black text-slate-900 leading-tight mb-4 uppercase tracking-tight min-h-[3rem]">{poka.description}</h4>
            <div className="p-4 bg-slate-50 rounded-2xl mb-6 flex-grow border border-slate-100">
              <p className="text-[9px] font-black text-orange-600 uppercase mb-2 tracking-widest">{t('expectedBenefit')}</p>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">{poka.benefit}</p>
            </div>
            <button onClick={() => getPokaDetails(poka.id, poka)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
              {loading === `pokaDetail-${poka.id}` ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <DocumentTextIcon className="w-3.5 h-3.5" />} 
              {expandedId === poka.id ? '...' : t('viewGuide')}
            </button>
            {expandedId === poka.id && poka.details && (
              <div id={`poka-print-${poka.id}`} className="mt-6 p-8 bg-blue-50/30 border border-blue-100 rounded-2xl shadow-inner animate-scale-up h-auto max-h-[400px] overflow-y-auto custom-scroll">
                {renderStyledMarkdown(poka.details)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const D7Section = ({ state, setState, handleGeminiCall, loading, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d7: INITIAL_STATE.d7
    }));
  };

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');

  const generateA3 = () => {
    const history = state.d4.fiveWhysHistory || [];
    const rootCauses = history.map(h => h.systemicRootCause).join("; ");
    
    // D3 Selected Actions
    const d3Selected = state.d3.correctiveActions.filter(a => state.d3.selectedCorrectiveActionIds.includes(a.id));
    const d3ActionText = state.d3.isNotApplicable
      ? (state.language === 'es' ? 'No aplica para este caso' : 'Not applicable for this case')
      : d3Selected.length > 0 
        ? d3Selected.map(a => `${state.language === 'es' ? 'D3 CORRECCIÓN' : 'D3 CORRECTION'}: ${a.action} | RESP: ${a.responsible} | DATE: ${a.implementationDate}`).join('\n')
        : "None";

    // D5 ACP Actions
    const acpActionsFormatted = (state.d5_d6.acpPlans || []).map(plan => { 
      const fixed = plan.actions.filter(a => a.isFixed); 
      if (fixed.length === 0) return null; 
      return `${plan.type === 'primary' ? 'MASTER' : 'SECONDARY'}: ${plan.rootCause}\n${fixed.map(a => `- [ID: ${a.actionId || 'N/A'}] ${a.action} (RESP: ${a.responsible}, DATE: ${a.timeframe})`).join('\n')}`; 
    }).filter(Boolean).join('\n\n');

    // D6 Poka Yokes
    const pokaYokesFormatted = state.d5_d6.pokaYokes.filter(p => p.isConfirmed).map(p => `- ${p.description} (${p.level})`).join('\n');
    
    // D8 Info
    const poeName = state.d8.poe ? "POE Implementado" : "TBD";
    const yokoTenSummary = state.d8.yokoTen || "TBD";

    // Efficacy Validation Info
    const efficacyFormatted = state.efficacy.protocols.map(p => `- [ID: ${p.id}] Action: ${p.action} | Method: ${p.verificationMethod} | Responsible: ${p.verificationResponsible} | Date: ${p.verificationDate} | Effective: ${p.isEffective ? 'SI' : 'NO'}`).join('\n');

    const fullContext = `
      PHENOMENON: ${state.d2.phenomenon}
      FINANCIAL: ${state.costs.totalLoss}
      RISKS: ${state.d2.analysis}
      CAUSES: ${rootCauses}
      D3_CORRECCION: ${d3ActionText}
      ACP_ACTIONS: ${acpActionsFormatted}
      POKAS: ${pokaYokesFormatted}
      POE_NAME: ${poeName}
      YOKOTEN: ${yokoTenSummary}
      EFFICACY_VALIDATION: ${efficacyFormatted}
      RESPONSIBLE: ${state.setup.responsible}
      DATE: ${new Date().toLocaleDateString()}
    `;
    
    handleGeminiCall('d5A3', promptTemplates[state.language].d5A3, fullContext, 0.4, schemas.d5A3, (data) => setState((p: AppState) => ({ ...p, d7: { a3Report: (data as any) } })));
  };

  const updateA3Field = (field: keyof A3ReportData, val: any) => {
    setState((p: AppState) => {
      if (!p.d7.a3Report) return p;
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, [field]: val } } };
    });
  };

  const updateA3Action = (idx: number, val: string) => {
    setState((p: AppState) => {
      if (!p.d7.a3Report || !p.d7.a3Report.actions) return p;
      const nextActions = [...p.d7.a3Report.actions];
      nextActions[idx] = { ...nextActions[idx], action: val };
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, actions: nextActions } } };
    });
  };

  const updateA3ActionDate = (idx: number, val: string) => {
    setState((p: AppState) => {
      if (!p.d7.a3Report || !p.d7.a3Report.actions) return p;
      const nextActions = [...p.d7.a3Report.actions];
      nextActions[idx] = { ...nextActions[idx], timeframe: val };
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, actions: nextActions } } };
    });
  };

  const updateEfficacyStepField = (idx: number, field: keyof EfficacyStep, val: string) => {
    setState((p: AppState) => {
      if (!p.d7.a3Report || !p.d7.a3Report.efficacySteps) return p;
      const nextSteps = [...p.d7.a3Report.efficacySteps];
      nextSteps[idx] = { ...nextSteps[idx], [field]: val };
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, efficacySteps: nextSteps } } };
    });
  };

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <CheckBadgeIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d8')}</h2>
              <button onClick={() => setBanner({ title: t('d8'), content: t('d8Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('genManagerial')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex justify-between items-center mb-8 gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => setViewMode('edit')} className={`px-5 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'edit' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('edit')}</button>
          <button onClick={() => setViewMode('preview')} className={`px-5 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'preview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('preview')}</button>
        </div>
        <div className="flex gap-4">
          {state.d7.a3Report && <button onClick={() => handleDownloadPDF('a3-print-container', `Reporte_A3_${state.setup.caseName}`)} className="px-6 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-red-700 transition-all flex items-center gap-3 active:scale-[0.95]"><PrinterIcon className="w-5 h-5" /> PDF</button>}
          <button onClick={generateA3} disabled={loading === 'd5A3'} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3">{loading === 'd5A3' ? '...' : t('consolidateA3')}</button>
        </div>
      </div>
      <div id="a3-print-container" className="official-document p-16 rounded-[2.5rem] border border-slate-300 bg-white relative shadow-2xl animate-scale-up h-auto flex flex-col">
        {state.d7.a3Report ? (
          <div className="relative z-10 space-y-12 h-auto flex flex-col">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  {t('execReportA3')}
                  <button onClick={() => setBanner({ title: t('execReportA3'), content: t('d8Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {state.language === 'es' ? 'FECHA DE GENERACIÓN' : 'GENERATION DATE'}:
                  </p>
                  {viewMode === 'edit' ? (
                    <input 
                      type="text" 
                      value={state.d7.a3Report.generationDate} 
                      onChange={(e) => updateA3Field('generationDate', e.target.value)}
                      className="text-[10px] font-black text-slate-600 uppercase bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase">{state.d7.a3Report.generationDate || new Date().toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase">{t('responsible')}:</p>
                  {viewMode === 'edit' ? (
                    <input 
                      type="text" 
                      value={state.d7.a3Report.responsible} 
                      onChange={(e) => updateA3Field('responsible', e.target.value)}
                      className="text-[10px] font-black text-slate-600 uppercase bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none text-right"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase">{state.d7.a3Report.responsible || state.setup.responsible}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-auto">
              {/* LEFT COLUMN: Analysis & Context */}
              <div className="space-y-8 h-auto flex flex-col">
                <div className={`p-8 bg-blue-50 border border-blue-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-blue-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">1. {t('defProblem')}</h3>
                  {viewMode === 'edit' ? (
                    <AutoExpandingTextarea value={state.d7.a3Report.phenomenon} onChange={(e: any) => updateA3Field('phenomenon', e.target.value)} className="bg-white border border-blue-100 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-blue-200" />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{state.d7.a3Report.phenomenon}"</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className={`p-8 bg-amber-50 border border-amber-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-amber-300 ring-offset-2 shadow-inner' : ''}`}>
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-4">2. {t('financialJustTitle')}</h3>
                    {viewMode === 'edit' ? (
                      <AutoExpandingTextarea value={state.d7.a3Report.financialJustification} onChange={(e: any) => updateA3Field('financialJustification', e.target.value)} className="bg-white border border-amber-100 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-amber-200" />
                    ) : (
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{state.d7.a3Report.financialJustification}</p>
                    )}
                  </div>
                  <div className={`p-8 bg-red-50 border border-red-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-red-300 ring-offset-2 shadow-inner' : ''}`}>
                    <h3 className="text-xs font-black text-red-900 uppercase tracking-widest mb-4">3. {t('riskEvalTitle')}</h3>
                    {viewMode === 'edit' ? (
                      <AutoExpandingTextarea value={state.d7.a3Report.risks} onChange={(e: any) => updateA3Field('risks', e.target.value)} className="bg-white border border-red-100 rounded-xl p-4 text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-red-200" />
                    ) : (
                      <div className="text-sm text-slate-700 leading-relaxed">{renderStyledMarkdown(state.d7.a3Report.risks)}</div>
                    )}
                  </div>
                </div>

                <div className={`p-8 bg-emerald-50 border border-emerald-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-emerald-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-4">4. {t('finalCausesTitle')}</h3>
                  {viewMode === 'edit' ? (
                    <AutoExpandingTextarea value={state.d7.a3Report.rootCauses} onChange={(e: any) => updateA3Field('rootCauses', e.target.value)} className="bg-white border border-emerald-100 rounded-xl p-4 text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-emerald-200" />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{state.d7.a3Report.rootCauses}</p>
                  )}
                </div>

                <div className={`p-8 bg-indigo-50 border border-indigo-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-indigo-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4">6. {t('standardizationTitle')}</h3>
                  {viewMode === 'edit' ? (
                    <AutoExpandingTextarea value={state.d7.a3Report.standardization} onChange={(e: any) => updateA3Field('standardization', e.target.value)} className="bg-white border border-indigo-100 rounded-xl p-4 text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-indigo-200" />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{state.d7.a3Report.standardization}</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Execution & Verification */}
              <div className="space-y-8 h-auto flex flex-col">
                <div className={`p-8 bg-white border border-slate-200 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-slate-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">5. {t('actionsTitle')}</h3>
                  <div className="space-y-3">
                    {state.d7.a3Report.actions && state.d7.a3Report.actions.length > 0 ? (
                      state.d7.a3Report.actions.map((a: ActionStep, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-blue-100 text-blue-600"><CheckIcon className="w-3.5 h-3.5" /></div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{a.type || t('action')}</span>
                              <span className="text-[7px] font-black text-slate-600 uppercase bg-slate-200 px-1.5 py-0.5 rounded-full">{a.actionId || '-'}</span>
                              <span className="text-[7px] font-bold text-slate-400 uppercase">{a.responsible}</span>
                              <span className="text-[7px] font-bold text-emerald-600 uppercase ml-auto">
                                {viewMode === 'edit' ? (
                                  <input 
                                    type="text" 
                                    value={a.timeframe} 
                                    onChange={(e) => updateA3ActionDate(idx, e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-1 outline-none w-20"
                                  />
                                ) : (
                                  a.timeframe
                                )}
                              </span>
                            </div>
                            {viewMode === 'edit' ? (
                              <AutoExpandingTextarea value={a.action} onChange={(e: any) => updateA3Action(idx, e.target.value)} className="bg-transparent text-[11px] font-bold text-slate-600 outline-none w-full" />
                            ) : (
                              <span className="text-[11px] font-bold text-slate-600 leading-tight">{a.action}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : <p className="text-[11px] italic text-slate-400">{t('waitingAnalysis')}</p>}
                  </div>
                </div>

                <div className={`p-8 bg-slate-50 border border-slate-200 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-slate-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">7. {state.language === 'es' ? 'Verificación de la eficacia' : 'Efficacy Verification'}</h3>
                  <div className="space-y-3">
                    {state.d7.a3Report.efficacySteps && state.d7.a3Report.efficacySteps.length > 0 ? (
                      state.d7.a3Report.efficacySteps.map((s: EfficacyStep, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-emerald-100 text-emerald-600"><CheckBadgeIcon className="w-3.5 h-3.5" /></div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[7px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded-full">{s.actionId || '-'}</span>
                              <span className="text-[7px] font-bold text-slate-400 uppercase">{s.responsible}</span>
                              <span className="text-[7px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-full">{s.isEffective}</span>
                              <span className="text-[7px] font-bold text-blue-400 uppercase ml-auto">
                                {viewMode === 'edit' ? (
                                  <input 
                                    type="text" 
                                    value={s.date} 
                                    onChange={(e) => updateEfficacyStepField(idx, 'date', e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-1 outline-none w-20 text-slate-600"
                                  />
                                ) : (
                                  s.date
                                )}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {viewMode === 'edit' ? (
                                <>
                                  <AutoExpandingTextarea value={s.action} onChange={(e: any) => updateEfficacyStepField(idx, 'action', e.target.value)} className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full" placeholder="Action" />
                                  <AutoExpandingTextarea value={s.method} onChange={(e: any) => updateEfficacyStepField(idx, 'method', e.target.value)} className="bg-transparent text-[9px] text-slate-400 outline-none w-full" placeholder="Method" />
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Eficaz:</span>
                                    <input 
                                      type="text" 
                                      value={s.isEffective} 
                                      onChange={(e) => updateEfficacyStepField(idx, 'isEffective', e.target.value)}
                                      className="bg-white border border-slate-200 rounded px-1 outline-none text-[8px] w-10 text-slate-600"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-[10px] font-bold text-slate-600 leading-tight">{s.action}</p>
                                  <p className="text-[9px] text-slate-400 leading-tight italic">{s.method}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : <p className="text-[11px] italic text-slate-500">{t('waitingAnalysis')}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-48 text-center opacity-30">
            <p className="text-sm font-black uppercase tracking-[0.4em]">{t('waitingAnalysis')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const D8Section = ({ state, setState, handleGeminiCall, loading, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d8: INITIAL_STATE.d8
    }));
  };

  const [activeSubTab, setActiveSubTab] = useState<'standard' | 'yokoten' | 'quiz'>('standard');
  const [poeViewMode, setPoeViewMode] = useState<'edit' | 'preview'>('preview');
  const [yokoViewMode, setYokoViewMode] = useState<'edit' | 'preview'>('preview');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const generatePOE = () => { 
    const actions = (state.d5_d6.acpPlans || []).flatMap((p: ACPPlan) => p.actions || []).filter(a => a.isFixed).map(a => `[ID: ${a.actionId || 'N/A'}] ${a.action}`).join("; "); 
    handleGeminiCall('d7Poe', promptTemplates[state.language].d7Poe, `ACTIONS: ${actions}`, 0.4, null, (data) => setState((p: AppState) => ({ ...p, d8: { ...(p.d8 || {}), poe: (data as string) || "" } }))); 
  };
  
  const generateYokoTen = () => { 
    const history = state.d4.fiveWhysHistory || []; 
    handleGeminiCall('d7YokoTen', promptTemplates[state.language].d7YokoTen, `PHENOMENON: ${state.d2.phenomenon}\nROOT: ${history.map(h => h.systemicRootCause).join("; ")}`, 0.4, null, (data) => setState((p: AppState) => ({ ...p, d8: { ...(p.d8 || {}), yokoTen: (data as string) || "" } }))); 
  };
  
  const generateQuiz = () => { 
    if (!state.d8.poe) return alert("POE first."); 
    handleGeminiCall('d7Quiz', promptTemplates[state.language].d7Quiz, `POE: ${state.d8.poe}`, 0.3, schemas.d7Quiz, (data) => { 
      setState((p: AppState) => ({ ...p, d8: { ...(p.d8 || {}), quiz: (data as any)?.questions || [] } })); 
      setScore(null); 
      setAnswers({}); 
    }); 
  };

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ArrowPathIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d7')}</h2>
              <button onClick={() => setBanner({ title: t('d7'), content: t('d7Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('closureCycle')}
              <button onClick={() => setBanner({ title: t('closureCycle'), content: t('d7Banner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
            <div className="flex gap-4 mb-4">
        {(['standard', 'yokoten', 'quiz'] as const).map(tabId => (
          <button 
            key={tabId} 
            onClick={() => setActiveSubTab(tabId)} 
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${activeSubTab === tabId ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
          >
            {tabId === 'standard' ? <DocumentTextIcon className="w-4 h-4" /> : tabId === 'yokoten' ? <Square2StackIcon className="w-4 h-4" /> : <CheckBadgeIcon className="w-4 h-4" />}
            {tabId === 'standard' ? t('standardPOE') : tabId === 'yokoten' ? t('yokotenTab') : t('certTab')}
            <QuestionMarkCircleIcon 
              className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] cursor-help transition-all transform hover:scale-125" 
              onClick={(e) => { 
                e.stopPropagation(); 
                setBanner({ 
                  title: tabId === 'standard' ? t('standardPOE') : tabId === 'yokoten' ? t('yokotenTab') : t('certTab'), 
                  content: tabId === 'standard' ? t('d7PoeBanner') : tabId === 'yokoten' ? t('yokotenBanner') : t('d7QuizBanner') 
                }); 
              }} 
            />
          </button>
        ))}
      </div>
      <div className="industrial-card rounded-[2rem] p-10 bg-white h-auto flex flex-col">
        {activeSubTab === 'standard' && (
          <div className="animate-slide-in h-auto flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  {t('protocolTitle')}
                  <button onClick={() => setBanner({ title: t('protocolTitle'), content: t('d7PoeBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setPoeViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${poeViewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button>
                  <button onClick={() => setPoeViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${poeViewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button>
                </div>
              </div>
              <button onClick={generatePOE} disabled={loading === 'd7Poe'} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md flex items-center gap-2">
                {loading === 'd7Poe' ? '...' : t('genStd')}
              </button>
            </div>
            <div className="official-document p-12 rounded-[2rem] border border-slate-200 bg-white min-h-[500px] h-auto flex flex-col">
              {poeViewMode === 'edit' ? (
                <AutoExpandingTextarea 
                  value={state.d8.poe} 
                  onChange={(e: any) => setState((p: AppState) => ({ ...p, d8: { ...p.d8, poe: e.target.value } }))}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-sm font-medium focus:ring-0 outline-none transition-all leading-relaxed"
                  placeholder="Escriba el procedimiento operativo estándar aquí..."
                />
              ) : (
                state.d8.poe ? renderStyledMarkdown(state.d8.poe) : <div className="py-24 text-center opacity-30 italic">{t('waitingAnalysis')}</div>
              )}
            </div>
          </div>
        )}
        {activeSubTab === 'yokoten' && (
          <div className="animate-slide-in h-auto flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">{t('yokotenTab')} <button onClick={() => setBanner({ title: t('yokotenTab'), content: t('yokotenBanner') })} className="transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setYokoViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${yokoViewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button>
                  <button onClick={() => setYokoViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${yokoViewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button>
                </div>
              </div>
              <button onClick={generateYokoTen} disabled={loading === 'd7YokoTen'} className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md flex items-center gap-2">
                {loading === 'd7YokoTen' ? '...' : t('deploy')}
              </button>
            </div>
            <div className="official-document p-12 rounded-[2rem] border border-slate-200 bg-white min-h-[500px] h-auto flex flex-col">
              {yokoViewMode === 'edit' ? (
                <AutoExpandingTextarea 
                  value={state.d8.yokoTen} 
                  onChange={(e: any) => setState((p: AppState) => ({ ...p, d8: { ...p.d8, yokoTen: e.target.value } }))}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-sm font-medium focus:ring-0 outline-none transition-all leading-relaxed"
                  placeholder="Escriba el informe de despliegue horizontal aquí..."
                />
              ) : (
                state.d8.yokoTen ? renderStyledMarkdown(state.d8.yokoTen) : <div className="py-24 text-center opacity-30 italic">{t('waitingAnalysis')}</div>
              )}
            </div>
          </div>
        )}
        {activeSubTab === 'quiz' && (<div className="animate-slide-in h-auto flex flex-col"><div className="flex justify-between items-center mb-8"><h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {t('certification')}
                    <button onClick={() => setBanner({ title: t('certification'), content: t('d7QuizBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                      <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                    </button>
                  </h3><button onClick={generateQuiz} disabled={loading === 'd7Quiz'} className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md flex items-center gap-2">{loading === 'd7Quiz' ? '...' : t('createExam')}</button></div>{state.d8.quiz && state.d8.quiz.length > 0 ? (<div className="space-y-8 h-auto flex flex-col">{state.d8.quiz.map((q: any, i: number) => (<div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-3xl h-auto flex flex-col"><p className="text-[10px] font-black text-slate-400 uppercase mb-4">{state.language === 'es' ? 'Pregunta' : 'Question'} #{i+1}</p><h4 className="text-sm font-bold text-slate-900 mb-6">{q.question_text}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{q.options.map((opt: string, optIdx: number) => (<label key={optIdx} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${answers[i] === optIdx ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700'}`}><input type="radio" name={`q-${i}`} className="hidden" checked={answers[i] === optIdx} onChange={() => setAnswers({ ...answers, [i]: optIdx })} /><span className="text-xs font-bold leading-tight">{opt}</span></label>))}</div></div>))}<div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-6"><button onClick={() => { let correctCount = 0; state.d8.quiz.forEach((q: any, i: number) => { if (answers[i] === q.correct_answer) correctCount++; }); setScore(correctCount); }} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 active:scale-[0.95]">{t('grade')}</button>{score !== null && <div className={`p-8 rounded-full border-4 flex flex-col items-center justify-center aspect-square w-48 shadow-2xl animate-scale-up ${score >= 4 ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-600'}`}><p className="text-5xl font-black mono">{score}/5</p></div>}</div></div>) : <div className="py-24 text-center opacity-30 italic">{t('waitingAnalysis')}</div>}</div>)}
      </div>
    </div>
  );
};

const EfficacySection = ({ state, setState, handleGeminiCall, loading, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      efficacy: INITIAL_STATE.efficacy
    }));
  };

  const generateProtocols = () => {
    const fixedActions = (state.d5_d6.acpPlans || []).flatMap((p: ACPPlan) => p.actions || []).filter((a: any) => a.isFixed);
    if (fixedActions.length === 0) return alert(state.language === 'es' ? "Fije acciones en D5 primero." : "Fix actions in D5 first.");

    const actionsText = fixedActions.map((a: any) => `- [ID: ${a.actionId || 'N/A'}] ${a.action} (Responsable: ${a.responsible})`).join('\n');
    const rootCausesText = (state.d4.fiveWhysHistory || []).map((h: any) => h.systemicRootCause).filter(Boolean).join('; ');
    const allIds = fixedActions.map((a: any) => a.actionId || 'N/A').filter(Boolean).join('\n');
    const today = new Date().toISOString().split('T')[0];
    
    handleGeminiCall('efficacy', promptTemplates[state.language].efficacyValidation, `CAUSAS RAIZ:\n${rootCausesText}\n\nACCIONES GENERADAS EN D5:\n${actionsText}`, 0.4, schemas.efficacyValidation, (data) => {
      let rawProtocols = (data as any).protocols || [];
      if (!Array.isArray(rawProtocols) || rawProtocols.length === 0) {
        rawProtocols = [data];
      }

      const p = rawProtocols[0] || {};
      
      const shortDescFallback = fixedActions.map((a: any) => {
        const words = (a.action || '').trim().split(/\s+/).slice(0, 4).join(' ');
        return `${a.actionId ? `${a.actionId}: ` : ''}${words}`;
      }).join('; ');

      const formatIdsAsStacked = (idStr: string) => {
        if (!idStr) return '';
        return idStr.split(/,\s*|\n+/).map((s: string) => s.trim()).filter(Boolean).join('\n');
      };

      const rawId = (p.id && p.id.length >= 3) ? p.id : allIds;

      let rawKpi = (p.kpi || '').trim();
      if (!rawKpi) {
        rawKpi = state.language === 'es' 
          ? '100% de cumplimiento en verificación de campo (0 reincidencias)' 
          : '100% compliance in field verification (0 recurrences)';
      } else if (!/\d/.test(rawKpi)) {
        rawKpi = `${rawKpi} (Meta: ${state.language === 'es' ? '100% de cumplimiento / 0 reincidencias' : '100% compliance / 0 recurrences'})`;
      }

      const unifiedProtocol: EfficacyProtocol = {
        id: formatIdsAsStacked(rawId),
        action: p.action || shortDescFallback,
        verificationMethod: p.verificationMethod || '',
        kpi: rawKpi,
        auditFrequency: p.auditFrequency || '',
        contingencyPlan: p.contingencyPlan || '',
        executionResponsible: p.executionResponsible || fixedActions[0]?.responsible || state.setup.responsible || '',
        executionDate: p.executionDate || today,
        verificationResponsible: p.verificationResponsible || state.setup.responsible || '',
        verificationDate: p.verificationDate || today,
        isEffective: p.isEffective || 'SI'
      };

      setState((prev: AppState) => ({
        ...prev,
        efficacy: {
          ...prev.efficacy,
          protocols: [unifiedProtocol]
        }
      }));
    });
  };

  const generateGuide = (protocol: EfficacyProtocol) => {
    if (!protocol.verificationMethod) return;
    
    // If already generated, don't call again
    if (state.efficacy.verificationGuides && state.efficacy.verificationGuides[protocol.id]) return;

    handleGeminiCall(`guide-${protocol.id}`, promptTemplates[state.language].verificationGuide, `Método de Verificación: ${protocol.verificationMethod}`, 0.5, null, (data) => {
      setState((prev: AppState) => ({
        ...prev,
        efficacy: {
          ...prev.efficacy,
          verificationGuides: {
            ...(prev.efficacy.verificationGuides || {}),
            [protocol.id]: typeof data === 'string' ? data : (data.text || JSON.stringify(data))
          }
        }
      }));
    });
  };

  const updateProtocol = (idx: number, field: keyof EfficacyProtocol, value: string) => {
    setState((p: AppState) => {
      const nextProtocols = [...p.efficacy.protocols];
      nextProtocols[idx] = { ...nextProtocols[idx], [field]: value };
      return { ...p, efficacy: { protocols: nextProtocols } };
    });
  };

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ShieldCheckIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1 flex items-center gap-2">
              {t('efficacyValidation')}
              <button onClick={() => setBanner({ title: t('efficacyValidation'), content: t('efficacyPlanBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('efficacyTitle')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>

      <div className="flex justify-end mb-6">
        <button 
          onClick={generateProtocols} 
          disabled={loading === 'efficacy'} 
          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" /> {loading === 'efficacy' ? '...' : t('genEfficacy')}
        </button>
      </div>

      <div className="space-y-10">
        <div className="industrial-card rounded-[2rem] p-6 bg-white border border-slate-100 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-600 pl-4">
            <h3 className="text-lg font-black uppercase text-slate-800">{t('efficacyValidationPlan')}</h3>
            <button onClick={() => setBanner({ title: t('efficacyValidationPlan'), content: t('efficacyPlanBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
              <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
            </button>
          </div>
          <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[8%]">{t('actionId')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[18%]">{t('action')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationMethod')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('kpi')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('auditFrequency')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[14%]">{t('contingencyPlan')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionResponsible')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionDate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.efficacy.protocols.length > 0 ? (
                state.efficacy.protocols.map((protocol: EfficacyProtocol, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.id} 
                        onChange={(e: any) => updateProtocol(idx, 'id', e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0 leading-tight whitespace-pre-line"
                      />
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.action} 
                        onChange={(e: any) => updateProtocol(idx, 'action', e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative flex items-center gap-2">
                        <AutoExpandingTextarea 
                          value={protocol.verificationMethod} 
                          onChange={(e: any) => updateProtocol(idx, 'verificationMethod', e.target.value)}
                          className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                        />
                        <button 
                          onClick={() => generateGuide(protocol)}
                          disabled={loading === `guide-${protocol.id}`}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-sm border border-emerald-100 bg-white disabled:opacity-50 flex-shrink-0"
                          title={t('genGuide')}
                        >
                          {loading === `guide-${protocol.id}` ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          ) : (
                            <SparklesIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.kpi} 
                        onChange={(e: any) => updateProtocol(idx, 'kpi', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.auditFrequency} 
                        onChange={(e: any) => updateProtocol(idx, 'auditFrequency', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.contingencyPlan} 
                        onChange={(e: any) => updateProtocol(idx, 'contingencyPlan', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text"
                        value={protocol.executionResponsible} 
                        onChange={(e: any) => updateProtocol(idx, 'executionResponsible', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="date"
                        value={protocol.executionDate} 
                        onChange={(e: any) => updateProtocol(idx, 'executionDate', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center opacity-30 italic text-sm">
                    {t('waitingAnalysis')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Módulo Adicional: Guías Técnicas de Verificación */}
        {state.efficacy.protocols.length > 0 && (
          <div className="space-y-6 animate-fade-in mt-12">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpenIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">
                {state.language === 'es' ? 'Guías Técnicas de Verificación de Campo' : 'Field Verification Technical Guides'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {state.efficacy.protocols.map((protocol: EfficacyProtocol) => (
                <div key={protocol.id} className="industrial-card rounded-[2rem] p-8 bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                    <div>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1 block whitespace-pre-line">ID: {protocol.id}</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{protocol.verificationMethod}</h4>
                    </div>
                    {!state.efficacy.verificationGuides?.[protocol.id] && (
                      <button 
                        onClick={() => generateGuide(protocol)}
                        disabled={loading === `guide-${protocol.id}`}
                        className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                      >
                        {loading === `guide-${protocol.id}` ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                        {t('genGuide')}
                      </button>
                    )}
                  </div>
                  
                  <div className="min-h-[100px]">
                    {state.efficacy.verificationGuides?.[protocol.id] ? (
                      <div className="markdown-body text-sm text-slate-700 leading-relaxed">
                        {renderStyledMarkdown(state.efficacy.verificationGuides[protocol.id])}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        {loading === `guide-${protocol.id}` ? (
                          <div className="flex flex-col items-center gap-3">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('waitingAnalysis')}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                            {state.language === 'es' ? 'Haga clic en el botón de la tabla o arriba para generar la guía' : 'Click the button in the table or above to generate the guide'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="industrial-card rounded-[2rem] p-6 bg-white border border-slate-100 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-black uppercase text-slate-800 mb-6 border-l-4 border-emerald-600 pl-4">{t('efficacyVerification')}</h3>
          <table className="w-full text-left border-collapse min-w-[600px] table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('actionId')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[40%]">{t('action')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationResponsible')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('verificationDate')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('effective')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.efficacy.protocols.length > 0 ? (
                state.efficacy.protocols.map((protocol: EfficacyProtocol, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <p className="text-[10px] font-bold text-slate-700 whitespace-pre-line leading-tight">{protocol.id}</p>
                    </td>
                    <td className="p-2">
                      <p className="text-[10px] font-bold text-slate-600">{protocol.action}</p>
                    </td>
                    <td className="p-2">
                      <input 
                        type="text"
                        value={protocol.verificationResponsible} 
                        onChange={(e: any) => updateProtocol(idx, 'verificationResponsible', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="date"
                        value={protocol.verificationDate} 
                        onChange={(e: any) => updateProtocol(idx, 'verificationDate', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={protocol.isEffective || ''}
                        onChange={(e: any) => updateProtocol(idx, 'isEffective', e.target.value)}
                        className="bg-transparent text-[10px] font-black text-emerald-600 outline-none w-full border-none p-0 focus:ring-0 cursor-pointer"
                      >
                        <option value="">-</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center opacity-30 italic text-sm">
                    {t('waitingAnalysis')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;

