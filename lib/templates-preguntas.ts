/**
 * Templates de Preguntas por Categoría de Empleo en Guatemala
 * Cada template contiene preguntas predefinidas que el reclutador puede usar o personalizar
 */

export interface PreguntaTemplate {
  numero: number;
  pregunta: string;
  tipo: 'abierta' | 'video' | 'multiple';
  criterio: string;
  opciones?: string[];
  respuesta_correcta?: number;
}

export interface TemplateCategoria {
  id: string;
  nombre: string;
  descripcion: string;
  pre_entrevista: PreguntaTemplate[];
  prueba_tecnica: PreguntaTemplate[];
  preguntas_video: PreguntaTemplate[];
}

export const TEMPLATES_PREGUNTAS: Record<string, TemplateCategoria> = {
  // ============ TECNOLOGÍA ============
  'it-programador': {
    id: 'it-programador',
    nombre: 'IT / Programador',
    descripcion: 'Para desarrolladores, programadores y especialistas en tecnología',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia con lenguajes de programación? Menciona los principales que dominas.',
        tipo: 'abierta',
        criterio: 'Validar experiencia técnica y dominio de lenguajes'
      },
      {
        numero: 2,
        pregunta: '¿Has trabajado con metodologías ágiles? Describe tu experiencia con Scrum o Kanban.',
        tipo: 'abierta',
        criterio: 'Evaluar conocimiento de metodologías modernas'
      },
      {
        numero: 3,
        pregunta: '¿Cuál ha sido tu mayor desafío técnico en un proyecto? ¿Cómo lo resolviste?',
        tipo: 'abierta',
        criterio: 'Analizar capacidad de resolución de problemas'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es la complejidad temporal de una búsqueda binaria?',
        tipo: 'multiple',
        criterio: 'Conocimiento fundamental de algoritmos',
        opciones: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué es el control de versiones y cuál es su importancia?',
        tipo: 'multiple',
        criterio: 'Entender herramientas esenciales de desarrollo',
        opciones: ['Sistema de copias de seguridad', 'Historial de cambios en el código', 'Compilador de código', 'Antivirus'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Qué es una API REST?',
        tipo: 'multiple',
        criterio: 'Conocimiento de arquitectura web moderna',
        opciones: ['Un tipo de base de datos', 'Interfaz de programación para aplicaciones', 'Lenguaje de programación', 'Sistema operativo'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Cuál es la principal ventaja de usar un framework como React o Angular?',
        tipo: 'multiple',
        criterio: 'Entender ventajas de frameworks modernos',
        opciones: ['Aumenta la velocidad del servidor', 'Facilita la construcción de interfaces reutilizables', 'Elimina errores de código', 'Reduce el tamaño de la base de datos'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Qué significa SOLID en programación?',
        tipo: 'multiple',
        criterio: 'Conocimiento de principios de código limpio',
        opciones: ['Estado del servidor', 'Principios de diseño orientado a objetos', 'Tipo de base de datos', 'Protocolo de internet'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu proyecto más importante? ¿Cuál fue tu rol y qué tecnologías usaste?',
        tipo: 'video',
        criterio: 'Evaluar capacidad de comunicación técnica y liderazgo'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas los errores en producción? Cuéntanos un ejemplo real.',
        tipo: 'video',
        criterio: 'Analizar mentalidad sobre calidad y responsabilidad'
      }
    ]
  },

  'it-devops': {
    id: 'it-devops',
    nombre: 'IT / DevOps & Cloud',
    descripcion: 'Para especialistas en infraestructura, cloud y DevOps',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia con plataformas cloud? (AWS, Google Cloud, Azure)',
        tipo: 'abierta',
        criterio: 'Validar experiencia en infraestructura cloud'
      },
      {
        numero: 2,
        pregunta: '¿Qué herramientas de CI/CD has utilizado? ¿Cómo las implementaste?',
        tipo: 'abierta',
        criterio: 'Evaluar conocimiento de automatización'
      },
      {
        numero: 3,
        pregunta: '¿Cuál fue tu mayor logro en optimizar infraestructura o reducir costos?',
        tipo: 'abierta',
        criterio: 'Analizar impacto en proyectos anteriores'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es la principal ventaja de Docker?',
        tipo: 'multiple',
        criterio: 'Conocimiento de containerización',
        opciones: ['Comprime archivos', 'Aísla aplicaciones en contenedores consistentes', 'Elimina bugs', 'Aumenta RAM'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué es Kubernetes?',
        tipo: 'multiple',
        criterio: 'Orquestación de contenedores',
        opciones: ['Base de datos NoSQL', 'Orquestador de contenedores', 'Lenguaje de programación', 'Servidor web'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la diferencia entre IaaS y PaaS?',
        tipo: 'multiple',
        criterio: 'Entender modelos de cloud',
        opciones: ['No hay diferencia', 'IaaS es infraestructura, PaaS es plataforma', 'IaaS es más caro', 'PaaS no usa internet'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué es un contenedor Docker?',
        tipo: 'multiple',
        criterio: 'Conceptos fundamentales',
        opciones: ['Un servidor físico', 'Una imagen ejecutable con aplicación y dependencias', 'Una carpeta comprimida', 'Un tipo de base de datos'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es la principal diferencia entre monolítico y microservicios?',
        tipo: 'multiple',
        criterio: 'Arquitectura de sistemas',
        opciones: ['Microservicios es una moda', 'Microservicios divide la app en servicios independientes', 'Monolítico es mejor', 'No hay diferencia'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre la infraestructura más compleja que has manejado?',
        tipo: 'video',
        criterio: 'Evaluar experiencia y visión de arquitectura'
      },
      {
        numero: 2,
        pregunta: '¿Cómo preveniste un incidente crítico en producción?',
        tipo: 'video',
        criterio: 'Evaluar capacidad de anticipación y resolución'
      }
    ]
  },

  // ============ VENTAS Y COMERCIAL ============
  'ventas-ejecutivo': {
    id: 'ventas-ejecutivo',
    nombre: 'Ventas / Ejecutivo Comercial',
    descripcion: 'Para ejecutivos de ventas, representantes comerciales',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál ha sido tu mayor logro en ventas? Menciona cifras si es posible.',
        tipo: 'abierta',
        criterio: 'Validar track record de resultados'
      },
      {
        numero: 2,
        pregunta: '¿Cómo prospectas nuevos clientes? Describe tu estrategia.',
        tipo: 'abierta',
        criterio: 'Evaluar iniciativa y metodología de prospección'
      },
      {
        numero: 3,
        pregunta: '¿Cómo manejas un cliente difícil o una objeción importante?',
        tipo: 'abierta',
        criterio: 'Analizar capacidad de negociación y empatía'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es el ciclo de ventas típico?',
        tipo: 'multiple',
        criterio: 'Conocimiento de proceso de ventas',
        opciones: ['Prospección → Presentación → Cierre → Seguimiento', 'Cierre → Prospección', 'Solo presentación', 'No existe ciclo'],
        respuesta_correcta: 0
      },
      {
        numero: 2,
        pregunta: '¿Qué es CRM y para qué sirve?',
        tipo: 'multiple',
        criterio: 'Herramientas de gestión comercial',
        opciones: ['Es un software para gestionar relaciones con clientes', 'Es un correo electrónico', 'Es una red social', 'No existe'],
        respuesta_correcta: 0
      },
      {
        numero: 3,
        pregunta: '¿Cuál es el principal objetivo de la prospección?',
        tipo: 'multiple',
        criterio: 'Metodología de ventas',
        opciones: ['Identificar y contactar clientes potenciales', 'Cerrar ventas', 'Hacer amigos', 'Publicar en redes'],
        respuesta_correcta: 0
      },
      {
        numero: 4,
        pregunta: '¿Qué significa "close rate" o tasa de cierre?',
        tipo: 'multiple',
        criterio: 'Métricas comerciales',
        opciones: ['Número de clientes perdidos', 'Porcentaje de prospectos convertidos en ventas', 'Dinero ganado', 'Llamadas realizadas'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es la mejor estrategia ante una objeción de precio?',
        tipo: 'multiple',
        criterio: 'Técnicas de negociación',
        opciones: ['Bajar el precio inmediatamente', 'Mostrar valor agregado y ROI', 'Insultar al cliente', 'Ignorar la objeción'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu cliente más difícil y cómo lo convenciste?',
        tipo: 'video',
        criterio: 'Evaluar capacidad de persuasión y empatía'
      },
      {
        numero: 2,
        pregunta: '¿Cómo te mantienes motivado cuando hay rechazos constantes?',
        tipo: 'video',
        criterio: 'Evaluar resiliencia y mentalidad'
      }
    ]
  },

  'ventas-retail': {
    id: 'ventas-retail',
    nombre: 'Ventas / Retail & Tiendas',
    descripcion: 'Para vendedores en tiendas, supermercados, retail',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en atención al cliente y ventas?',
        tipo: 'abierta',
        criterio: 'Validar experiencia en retail'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas a un cliente enojado o insatisfecho?',
        tipo: 'abierta',
        criterio: 'Evaluar empatía y resolución de conflictos'
      },
      {
        numero: 3,
        pregunta: '¿Qué haces para aumentar las ventas en tu puesto?',
        tipo: 'abierta',
        criterio: 'Analizar iniciativa y creatividad'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es el principal objetivo del merchandising?',
        tipo: 'multiple',
        criterio: 'Conocimiento de retail',
        opciones: ['Decorar la tienda', 'Posicionar productos para maximizar ventas', 'Limpiar', 'Abrir cajas'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué harías si se agota el producto más vendido?',
        tipo: 'multiple',
        criterio: 'Solución de problemas',
        opciones: ['Nada, esperar a que llegue', 'Informar al gerente e intentar vender alternativas', 'Cerrar la tienda', 'Decir que no hay'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la importancia de la higiene en retail?',
        tipo: 'multiple',
        criterio: 'Estándares de calidad',
        opciones: ['No es importante', 'Fundamental para la experiencia del cliente', 'Solo en alimentos', 'No afecta ventas'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Cómo identifica un buen vendedor a un cliente potencial?',
        tipo: 'multiple',
        criterio: 'Técnicas de venta',
        opciones: ['Por la ropa que usa', 'Por su lenguaje corporal e interés en productos', 'Todos son iguales', 'Por la edad'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Qué es "upselling"?',
        tipo: 'multiple',
        criterio: 'Técnicas comerciales',
        opciones: ['Engañar al cliente', 'Ofrecer productos de mayor valor o complementarios', 'Bajar precios', 'Cerrar tiendas'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un cliente satisfecho que volvió por ti?',
        tipo: 'video',
        criterio: 'Evaluar empatía y fidelización'
      },
      {
        numero: 2,
        pregunta: '¿Cómo mantendrías la motivación trabajando en una tienda?',
        tipo: 'video',
        criterio: 'Evaluar pasión por retail'
      }
    ]
  },

  // ============ RECURSOS HUMANOS ============
  'rrhh-especialista': {
    id: 'rrhh-especialista',
    nombre: 'RRHH / Especialista en RR.HH.',
    descripcion: 'Para especialistas en recursos humanos, reclutamiento y selección',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en procesos de selección y reclutamiento?',
        tipo: 'abierta',
        criterio: 'Validar experiencia en RR.HH.'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas un conflicto entre empleados?',
        tipo: 'abierta',
        criterio: 'Evaluar capacidad de mediación'
      },
      {
        numero: 3,
        pregunta: '¿Cuál ha sido tu mayor logro en gestión de personal?',
        tipo: 'abierta',
        criterio: 'Analizar impacto en clima organizacional'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuáles son las leyes laborales fundamentales en Guatemala?',
        tipo: 'multiple',
        criterio: 'Conocimiento legal',
        opciones: ['No hay leyes', 'Código de Trabajo, beneficios mínimos, no discriminación', 'Inventadas', 'No es importante'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué es el perfil de puesto?',
        tipo: 'multiple',
        criterio: 'Herramientas de RR.HH.',
        opciones: ['La foto del empleado', 'Documento que describe responsabilidades y competencias', 'El salario', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es el objetivo de una evaluación de desempeño?',
        tipo: 'multiple',
        criterio: 'Gestión del talento',
        opciones: ['Despedir gente', 'Medir resultados y áreas de mejora', 'Solo formalidad', 'Aumentar estrés'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué es la compensación integral?',
        tipo: 'multiple',
        criterio: 'Estrategia salarial',
        opciones: ['Solo dinero', 'Salario + beneficios + bienestar', 'Sin beneficios', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cómo se calcula la indemnización por despido en Guatemala?',
        tipo: 'multiple',
        criterio: 'Conocimiento legal laboral',
        opciones: ['No existe', 'Depende del contrato y causa', 'Inventada', 'Siempre igual'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un proceso de selección que dirigiste? ¿Cuáles fueron los resultados?',
        tipo: 'video',
        criterio: 'Evaluar experiencia y resultados'
      },
      {
        numero: 2,
        pregunta: '¿Cómo motivarías a un equipo desmotivado?',
        tipo: 'video',
        criterio: 'Evaluar liderazgo y empatía'
      }
    ]
  },

  // ============ ADMINISTRACIÓN ============
  'administrativo-asistente': {
    id: 'administrativo-asistente',
    nombre: 'Administrativo / Asistente Administrativo',
    descripcion: 'Para asistentes administrativos, recepcionistas, administrativos',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en funciones administrativas?',
        tipo: 'abierta',
        criterio: 'Validar experiencia'
      },
      {
        numero: 2,
        pregunta: '¿Cómo organizas tu tiempo cuando tienes múltiples tareas?',
        tipo: 'abierta',
        criterio: 'Evaluar gestión de prioridades'
      },
      {
        numero: 3,
        pregunta: '¿Cuál es tu relación con los programas de Office?',
        tipo: 'abierta',
        criterio: 'Analizar dominio de herramientas'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es el propósito de un archivo administrativo?',
        tipo: 'multiple',
        criterio: 'Gestión documental',
        opciones: ['Decoración', 'Organizar y resguardar documentos', 'Guardar secretos', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué haces si llega un cliente enojado a recepción?',
        tipo: 'multiple',
        criterio: 'Atención al cliente',
        opciones: ['Lo ignoras', 'Lo escuchas, empatizas y resuelves', 'Lo gritas', 'Lo sacas'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la importancia de la confidencialidad en administración?',
        tipo: 'multiple',
        criterio: 'Ética profesional',
        opciones: ['No existe', 'Fundamental para la confianza de la empresa', 'Solo moda', 'No afecta'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué es un archivo electrónico?',
        tipo: 'multiple',
        criterio: 'Transformación digital',
        opciones: ['Un archivo físico', 'Documentos guardados digitalmente en sistemas', 'Solo para computadoras viejas', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es tu herramienta favorita de Microsoft Office?',
        tipo: 'multiple',
        criterio: 'Dominio de herramientas',
        opciones: ['Word para documentos', 'Excel para datos', 'Outlook para correos', 'Todas las anteriores'],
        respuesta_correcta: 3
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un proyecto administrativo que completaste exitosamente?',
        tipo: 'video',
        criterio: 'Evaluar capacidad de ejecución'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas el estrés en una oficina ocupada?',
        tipo: 'video',
        criterio: 'Evaluar resiliencia'
      }
    ]
  },

  // ============ SERVICIO AL CLIENTE ============
  'servicio-cliente': {
    id: 'servicio-cliente',
    nombre: 'Servicio al Cliente / Call Center',
    descripcion: 'Para agentes de servicio al cliente, call center, soporte',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en servicio al cliente?',
        tipo: 'abierta',
        criterio: 'Validar experiencia'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas un cliente furioso o frustrante?',
        tipo: 'abierta',
        criterio: 'Evaluar manejo emocional'
      },
      {
        numero: 3,
        pregunta: '¿Cuál fue tu caso más difícil y cómo lo resolviste?',
        tipo: 'abierta',
        criterio: 'Analizar resolución de problemas'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es la primera regla de atención al cliente?',
        tipo: 'multiple',
        criterio: 'Principios fundamentales',
        opciones: ['El cliente nunca tiene razón', 'Escuchar y entender al cliente', 'Solo vender', 'No hablar mucho'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué significa "empatía" en servicio al cliente?',
        tipo: 'multiple',
        criterio: 'Habilidades blandas',
        opciones: ['Estar de acuerdo siempre', 'Entender y sentir el problema del cliente', 'Ser amable falsamente', 'Nada'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es el tiempo de respuesta ideal a una consulta?',
        tipo: 'multiple',
        criterio: 'Estándares de servicio',
        opciones: ['Nunca', 'Lo antes posible', 'Un mes', 'No importa'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué harías si no sabes la respuesta a una pregunta del cliente?',
        tipo: 'multiple',
        criterio: 'Manejo de situaciones',
        opciones: ['Inventar una respuesta', 'Admitir que no sabes e investigar', 'Decir que es imposible', 'Cuelgar'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es la importancia de documentar interacciones con clientes?',
        tipo: 'multiple',
        criterio: 'Gestión del conocimiento',
        opciones: ['No es importante', 'Fundamental para continuidad y calidad', 'Solo papeleo', 'Pierde tiempo'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un cliente que parecía imposible de satisfacer y cómo lo lograste?',
        tipo: 'video',
        criterio: 'Evaluar capacidad de negociación'
      },
      {
        numero: 2,
        pregunta: '¿Por qué es importante para ti trabajar en servicio al cliente?',
        tipo: 'video',
        criterio: 'Evaluar motivación y vocación'
      }
    ]
  },

  // ============ FINANZAS ============
  'contabilidad-contador': {
    id: 'contabilidad-contador',
    nombre: 'Contabilidad / Contador',
    descripcion: 'Para contadores, contables, especialistas en contabilidad',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en contabilidad? ¿Qué sistemas has usado?',
        tipo: 'abierta',
        criterio: 'Validar experiencia técnica'
      },
      {
        numero: 2,
        pregunta: '¿Cuál ha sido tu mayor desafío en un cierre contable?',
        tipo: 'abierta',
        criterio: 'Evaluar resolución de problemas complejos'
      },
      {
        numero: 3,
        pregunta: '¿Qué conoces sobre obligaciones fiscales en Guatemala?',
        tipo: 'abierta',
        criterio: 'Analizar conocimiento legal'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es la ecuación contable fundamental?',
        tipo: 'multiple',
        criterio: 'Conocimiento básico',
        opciones: ['Activo = Pasivo + Capital', 'Ingresos - Gastos = Utilidad', 'Dinero = Dinero', 'No existe'],
        respuesta_correcta: 0
      },
      {
        numero: 2,
        pregunta: '¿Qué es un diario contable?',
        tipo: 'multiple',
        criterio: 'Conceptos fundamentales',
        opciones: ['Un cuaderno personal', 'Registro inicial de todas las transacciones', 'Un informe mensual', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la diferencia entre activos y pasivos?',
        tipo: 'multiple',
        criterio: 'Estructura del balance',
        opciones: ['No hay diferencia', 'Activos son recursos, pasivos son obligaciones', 'Son iguales', 'No importa'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué es la conciliación bancaria?',
        tipo: 'multiple',
        criterio: 'Procesos contables',
        opciones: ['Abrir una cuenta', 'Comparar registros con el banco', 'Cerrar la cuenta', 'Depositar dinero'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es la importancia del cumplimiento fiscal?',
        tipo: 'multiple',
        criterio: 'Ética y legalidad',
        opciones: ['No es importante', 'Fundamental para evitar sanciones', 'Solo para grandes empresas', 'Caro'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un cierre contable complejo que manejaste?',
        tipo: 'video',
        criterio: 'Evaluar experiencia y competencia'
      },
      {
        numero: 2,
        pregunta: '¿Cómo te mantienes actualizado en normativas fiscales?',
        tipo: 'video',
        criterio: 'Evaluar actitud hacia el aprendizaje'
      }
    ]
  },

  // ============ LOGÍSTICA ============
  'logistica-conductor': {
    id: 'logistica-conductor',
    nombre: 'Logística / Conductor',
    descripcion: 'Para conductores, repartidores, especialistas en logística',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia como conductor? ¿Qué licencia tienes?',
        tipo: 'abierta',
        criterio: 'Validar experiencia y documentación'
      },
      {
        numero: 2,
        pregunta: '¿Cómo garantizas la seguridad en la conducción?',
        tipo: 'abierta',
        criterio: 'Evaluar conciencia sobre seguridad'
      },
      {
        numero: 3,
        pregunta: '¿Cuál ha sido tu mayor desafío en entregas o logística?',
        tipo: 'abierta',
        criterio: 'Analizar resolución de problemas'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es el límite de velocidad en zona urbana en Guatemala?',
        tipo: 'multiple',
        criterio: 'Conocimiento de normativas',
        opciones: ['Sin límite', '40 km/h', '100 km/h', 'Varía según zona'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué harías si pierdes los frenos en una bajada?',
        tipo: 'multiple',
        criterio: 'Manejo de emergencias',
        opciones: ['Saltar del vehículo', 'Usar cambios bajos y buscar zona plana', 'Acelerar', 'Rendirse'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la distancia mínima de seguridad entre vehículos?',
        tipo: 'multiple',
        criterio: 'Seguridad vial',
        opciones: ['1 metro', 'Depende de la velocidad', '10 metros', 'No importa'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué documentos debe llevar un conductor siempre?',
        tipo: 'multiple',
        criterio: 'Normativa vial',
        opciones: ['Ninguno', 'Licencia, SOAT, papeles del vehículo', 'Solo licencia', 'Inventados'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es el procedimiento ante un accidente vial?',
        tipo: 'multiple',
        criterio: 'Protocolo',
        opciones: ['Irse del lugar', 'Llamar policía, documentar, dar datos', 'No hacer nada', 'Inventar historias'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu experiencia en manejo defensivo?',
        tipo: 'video',
        criterio: 'Evaluar actitud hacia seguridad'
      },
      {
        numero: 2,
        pregunta: '¿Cómo priorizas la puntualidad y la seguridad?',
        tipo: 'video',
        criterio: 'Evaluar valores profesionales'
      }
    ]
  },

  // ============ CONSTRUCCIÓN ============
  'construccion-obrero': {
    id: 'construccion-obrero',
    nombre: 'Construcción / Obrero',
    descripcion: 'Para obreros, maestros de obra, especialistas en construcción',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en construcción? ¿Qué tipos de proyectos has realizado?',
        tipo: 'abierta',
        criterio: 'Validar experiencia'
      },
      {
        numero: 2,
        pregunta: '¿Cómo garantizas la seguridad en un sitio de construcción?',
        tipo: 'abierta',
        criterio: 'Evaluar conciencia sobre seguridad'
      },
      {
        numero: 3,
        pregunta: '¿Cuál es tu herramienta favorita y cómo la usas?',
        tipo: 'abierta',
        criterio: 'Analizar dominio técnico'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuáles son los EPP obligatorios en construcción?',
        tipo: 'multiple',
        criterio: 'Seguridad ocupacional',
        opciones: ['Ninguno', 'Casco, chaleco, botas, guantes', 'Solo casco', 'Opcional'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué es el concreto y para qué sirve?',
        tipo: 'multiple',
        criterio: 'Conocimiento de materiales',
        opciones: ['Un tipo de pintura', 'Material cementicio para estructuras', 'Herramienta', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la diferencia entre mortero y concreto?',
        tipo: 'multiple',
        criterio: 'Materiales de construcción',
        opciones: ['Igual', 'Mortero es para juntas, concreto es para estructuras', 'Inventada', 'No importa'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué es un andamio y cuál es su propósito?',
        tipo: 'multiple',
        criterio: 'Seguridad en altura',
        opciones: ['Decoración', 'Estructura temporal para acceso seguro', 'Grúa', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es el procedimiento ante un accidente en construcción?',
        tipo: 'multiple',
        criterio: 'Protocolo de emergencia',
        opciones: ['Seguir trabajando', 'Parar trabajo, asistir lesionado, reportar', 'Ignorar', 'Irse'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu proyecto más importante en construcción?',
        tipo: 'video',
        criterio: 'Evaluar experiencia y orgullo profesional'
      },
      {
        numero: 2,
        pregunta: '¿Cómo trabajas en equipo en un sitio de obra?',
        tipo: 'video',
        criterio: 'Evaluar capacidad de colaboración'
      }
    ]
  },

  // ============ DEPORTES ============
  'deportes-entrenador': {
    id: 'deportes-entrenador',
    nombre: 'Deportes / Entrenador de Fútbol',
    descripcion: 'Para entrenadores de fútbol, coaches y especialistas deportivos',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia como entrenador? ¿Qué equipos has dirigido?',
        tipo: 'abierta',
        criterio: 'Validar trayectoria profesional'
      },
      {
        numero: 2,
        pregunta: '¿Cuál es tu filosofía de entrenamiento y táctica favorita?',
        tipo: 'abierta',
        criterio: 'Evaluar visión técnica'
      },
      {
        numero: 3,
        pregunta: '¿Cómo motivarías a un equipo en dificultades?',
        tipo: 'abierta',
        criterio: 'Analizar liderazgo'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es la duración de un partido de fútbol?',
        tipo: 'multiple',
        criterio: 'Conocimiento básico',
        opciones: ['60 minutos', '2 x 45 minutos', '90 minutos continuos', 'Variable'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Cuántos jugadores máximo puede tener en cancha un equipo?',
        tipo: 'multiple',
        criterio: 'Reglas del fútbol',
        opciones: ['9', '11', '13', '15'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Qué significa "fuera de lugar" en fútbol?',
        tipo: 'multiple',
        criterio: 'Reglas de juego',
        opciones: ['Cuando el jugador no está en su puesto', 'Ventaja del atacante en zona prohibida', 'No existe', 'Falta menor'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Cuáles son los elementos clave en un buen entrenamiento?',
        tipo: 'multiple',
        criterio: 'Metodología de entrenamientos',
        opciones: ['Solo correr', 'Técnica, táctica, físico, mental', 'Jugar partidos', 'Descanso solo'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es la importancia de la prevención de lesiones?',
        tipo: 'multiple',
        criterio: 'Cuidado del talento',
        opciones: ['No es importante', 'Fundamental para mantener plantilla sana', 'Costo innecesario', 'Para principiantes'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu mayor logro como entrenador?',
        tipo: 'video',
        criterio: 'Evaluar experiencia y resultados'
      },
      {
        numero: 2,
        pregunta: '¿Cómo identificas y desarrollas talento joven?',
        tipo: 'video',
        criterio: 'Evaluar ojo técnico y mentoría'
      }
    ]
  },

  // ============ EDUCACIÓN ============
  'educacion-docente': {
    id: 'educacion-docente',
    nombre: 'Educación / Docente',
    descripcion: 'Para maestros, profesores y especialistas en educación',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia como docente? ¿Qué grados/materias enseñas?',
        tipo: 'abierta',
        criterio: 'Validar experiencia educativa'
      },
      {
        numero: 2,
        pregunta: '¿Cuál es tu método de enseñanza favorito?',
        tipo: 'abierta',
        criterio: 'Evaluar pedagogía'
      },
      {
        numero: 3,
        pregunta: '¿Cómo manejas estudiantes con dificultades de aprendizaje?',
        tipo: 'abierta',
        criterio: 'Analizar empatía e inclusión'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es el principal objetivo de la educación?',
        tipo: 'multiple',
        criterio: 'Filosofía educativa',
        opciones: ['Solo dar notas', 'Desarrollar competencias y ciudadanos responsables', 'Cubrir contenido', 'Castigar'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué es un plan de clase?',
        tipo: 'multiple',
        criterio: 'Herramientas pedagógicas',
        opciones: ['Listado de temas', 'Documento que organiza objetivos, metodología y evaluación', 'Horario', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la importancia de la evaluación formativa?',
        tipo: 'multiple',
        criterio: 'Evaluación educativa',
        opciones: ['No tiene importancia', 'Medir progreso y ajustar enseñanza', 'Solo calificar', 'Castigar mal desempeño'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué es la educación inclusiva?',
        tipo: 'multiple',
        criterio: 'Educación moderna',
        opciones: ['Educación cara', 'Garantizar acceso y calidad para todos', 'Solo para ricos', 'No existe'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cómo integras tecnología en tu enseñanza?',
        tipo: 'multiple',
        criterio: 'Adaptación a era digital',
        opciones: ['No la uso', 'Como herramienta complementaria en lecciones', 'Solo juegos', 'Reemplaza todo'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un estudiante difícil que transformaste?',
        tipo: 'video',
        criterio: 'Evaluar vocación y impacto'
      },
      {
        numero: 2,
        pregunta: '¿Por qué elegiste la educación como carrera?',
        tipo: 'video',
        criterio: 'Evaluar pasión por enseñar'
      }
    ]
  },

  // ============ SALUD ============
  'salud-enfermero': {
    id: 'salud-enfermero',
    nombre: 'Salud / Enfermero',
    descripcion: 'Para enfermeros, técnicos de salud y especialistas médicos',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia en salud? ¿En qué áreas has trabajado?',
        tipo: 'abierta',
        criterio: 'Validar experiencia clínica'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas situaciones de emergencia o estrés?',
        tipo: 'abierta',
        criterio: 'Evaluar capacidad bajo presión'
      },
      {
        numero: 3,
        pregunta: '¿Cuál es tu compromiso con la ética y confidencialidad médica?',
        tipo: 'abierta',
        criterio: 'Analizar valores profesionales'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es el rango normal de presión arterial?',
        tipo: 'multiple',
        criterio: 'Conocimiento médico básico',
        opciones: ['100/60 máximo', '120/80 aproximadamente', '200/100 normal', 'Variable'],
        respuesta_correcta: 1
      },
      {
        numero: 2,
        pregunta: '¿Qué es el protocolo de bioseguridad?',
        tipo: 'multiple',
        criterio: 'Normas de seguridad',
        opciones: ['No existe', 'Medidas para prevenir contagios y accidentes', 'Opcional', 'Caro'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la importancia de la higiene en hospitales?',
        tipo: 'multiple',
        criterio: 'Prevención de infecciones',
        opciones: ['No es importante', 'Fundamental para evitar infecciones', 'Solo en quirófano', 'Costo innecesario'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Qué significa empatía en enfermería?',
        tipo: 'multiple',
        criterio: 'Habilidades blandas',
        opciones: ['Lástima al paciente', 'Entender y sentir necesidades del paciente', 'Ser amable falsamente', 'No importa'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es el protocolo ante una reacción alérgica?',
        tipo: 'multiple',
        criterio: 'Manejo de emergencias',
        opciones: ['Ignorar', 'Detener medicamento, avisar doctor, monitorear', 'Inyectar más', 'Esperar'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre un paciente que marcó tu vida?',
        tipo: 'video',
        criterio: 'Evaluar vocación y empatía'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejas el estrés emocional en enfermería?',
        tipo: 'video',
        criterio: 'Evaluar autocuidado profesional'
      }
    ]
  },

  // ============ HOGAR ============
  'hogar-ninerabebe': {
    id: 'hogar-ninerabebe',
    nombre: 'Hogar / Niñera/Cuidado de Bebés',
    descripcion: 'Para niñeras, cuidadores de bebés y especialistas en cuidado infantil',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia cuidando bebés/niños? ¿Qué edades?',
        tipo: 'abierta',
        criterio: 'Validar experiencia'
      },
      {
        numero: 2,
        pregunta: '¿Cómo manejabas situaciones de emergencia o enfermedad?',
        tipo: 'abierta',
        criterio: 'Evaluar responsabilidad'
      },
      {
        numero: 3,
        pregunta: '¿Cuál es tu filosofía de cuidado y educación infantil?',
        tipo: 'abierta',
        criterio: 'Analizar valores'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuántas horas debe dormir un bebé de 6 meses?',
        tipo: 'multiple',
        criterio: 'Desarrollo infantil',
        opciones: ['2-3 horas', '8-10 horas', '14-17 horas', 'No importa'],
        respuesta_correcta: 2
      },
      {
        numero: 2,
        pregunta: '¿Cuál es el procedimiento correcto para cambiar un pañal?',
        tipo: 'multiple',
        criterio: 'Higiene infantil',
        opciones: ['Cualquier forma', 'Limpiar, secar, aplicar crema, colocar nuevo', 'Rápido sin cuidado', 'No importa'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Qué harías si el bebé tiene fiebre?',
        tipo: 'multiple',
        criterio: 'Manejo de emergencias',
        opciones: ['Nada', 'Avisar a padres, medir temperatura, monitorear', 'Medicar', 'Ignorar'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Cuál es la importancia del juego en desarrollo infantil?',
        tipo: 'multiple',
        criterio: 'Desarrollo cognitivo',
        opciones: ['No tiene importancia', 'Fundamental para aprendizaje y desarrollo', 'Solo diversión', 'Pérdida de tiempo'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cómo manejas disciplina con niños pequeños?',
        tipo: 'multiple',
        criterio: 'Educación positiva',
        opciones: ['Gritar y pelear', 'Establecer límites con paciencia', 'Castigos severos', 'Sin límites'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu experiencia más memorable cuidando niños?',
        tipo: 'video',
        criterio: 'Evaluar experiencia y dedicación'
      },
      {
        numero: 2,
        pregunta: '¿Por qué te apasiona el cuidado infantil?',
        tipo: 'video',
        criterio: 'Evaluar vocación y paciencia'
      }
    ]
  },

  // ============ GASTRONOMÍA ============
  'gastronomia-cocinero': {
    id: 'gastronomia-cocinero',
    nombre: 'Gastronomía / Cocinero',
    descripcion: 'Para cocineros, chef, especialistas en gastronomía',
    pre_entrevista: [
      {
        numero: 1,
        pregunta: '¿Cuál es tu experiencia como cocinero? ¿Qué tipo de cocina dominas?',
        tipo: 'abierta',
        criterio: 'Validar experiencia culinaria'
      },
      {
        numero: 2,
        pregunta: '¿Cuál es tu plato insignia o especialidad?',
        tipo: 'abierta',
        criterio: 'Evaluar creatividad y dominio'
      },
      {
        numero: 3,
        pregunta: '¿Cómo manejas la presión en cocina durante horas pico?',
        tipo: 'abierta',
        criterio: 'Analizar manejo de estrés'
      }
    ],
    prueba_tecnica: [
      {
        numero: 1,
        pregunta: '¿Cuál es la temperatura interna segura para pollo cocido?',
        tipo: 'multiple',
        criterio: 'Seguridad alimentaria',
        opciones: ['40°C', '65°C', '75°C', 'No importa'],
        respuesta_correcta: 2
      },
      {
        numero: 2,
        pregunta: '¿Qué significa "mise en place" en cocina?',
        tipo: 'multiple',
        criterio: 'Terminología profesional',
        opciones: ['Plato especial', 'Preparación previa de ingredientes', 'Tipo de salsa', 'Herramienta'],
        respuesta_correcta: 1
      },
      {
        numero: 3,
        pregunta: '¿Cuál es la importancia de la higiene en cocina?',
        tipo: 'multiple',
        criterio: 'Normas de seguridad',
        opciones: ['No es importante', 'Fundamental para evitar contaminación', 'Solo limpiar al final', 'Caro'],
        respuesta_correcta: 1
      },
      {
        numero: 4,
        pregunta: '¿Cómo identificas un alimento en descomposición?',
        tipo: 'multiple',
        criterio: 'Control de calidad',
        opciones: ['Por apariencia', 'Olor, color, textura anormales', 'Probarlo', 'Nunca se descompone'],
        respuesta_correcta: 1
      },
      {
        numero: 5,
        pregunta: '¿Cuál es la diferencia entre cocción lenta y rápida?',
        tipo: 'multiple',
        criterio: 'Técnicas culinarias',
        opciones: ['No hay diferencia', 'Lenta = sabor profundo, Rápida = conserva texturas', 'Igual resultado', 'No importa'],
        respuesta_correcta: 1
      }
    ],
    preguntas_video: [
      {
        numero: 1,
        pregunta: '¿Cuéntanos sobre tu plato más desafiante de preparar?',
        tipo: 'video',
        criterio: 'Evaluar tecnicismo y pasión'
      },
      {
        numero: 2,
        pregunta: '¿Cuál es tu inspiración culinaria?',
        tipo: 'video',
        criterio: 'Evaluar creatividad e influencias'
      }
    ]
  }
};

export function getTemplatesByCategoria(categoriaId: string): TemplateCategoria | undefined {
  return TEMPLATES_PREGUNTAS[categoriaId];
}

export function getAllCategorias(): TemplateCategoria[] {
  return Object.values(TEMPLATES_PREGUNTAS);
}

export function getCategoriasGrupo(grupo: string): TemplateCategoria[] {
  const grupos: Record<string, string[]> = {
    tecnologia: ['it-programador', 'it-devops'],
    ventas: ['ventas-ejecutivo', 'ventas-retail'],
    administrativo: ['administrativo-asistente', 'rrhh-especialista'],
    servicio: ['servicio-cliente'],
    finanzas: ['contabilidad-contador'],
    logistica: ['logistica-conductor'],
    construccion: ['construccion-obrero'],
    deportes: ['deportes-entrenador'],
    educacion: ['educacion-docente'],
    salud: ['salud-enfermero'],
    hogar: ['hogar-ninerabebe'],
    gastronomia: ['gastronomia-cocinero']
  };

  return (grupos[grupo] || []).map(id => TEMPLATES_PREGUNTAS[id]).filter(Boolean);
}
