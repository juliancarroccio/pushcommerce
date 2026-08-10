/**
 * Datos de prueba reutilizables.
 * Hash del código master "CATT2024" precalculado.
 */

export const CODIGO_MASTER = 'CATT2024';
export const CODIGO_MASTER_HASH = '280cfbb74b55fca4baa3631bb025bd0c2b7edf87f000827e026569cbad7ccbfe';

/** Código individual de mayorista para tests */
export const CODIGO_MAYO_INDIVIDUAL = 'CATT-TEST01';
/** SHA-256 hex de "CATT-TEST01" — precalculado */
export const CODIGO_MAYO_INDIVIDUAL_HASH = '2b78d3a8b5b8ff02c3eb8f2cd82ff02c34fd12a7a89dc0bb1cd0bfec9e0abd5f';

export const mayoristaSample = {
  nombre: 'Juan Pérez',
  negocio: 'Textil Norte SRL',
  cuit: '20-12345678-9',
  tipo: 'Tienda de ropa',
  telefono: '02932-441234',
  whatsapp: '5492932441234',
  email: 'juan@textilnorte.com.ar',
  provincia: 'Buenos Aires',
  localidad: 'Bahía Blanca',
  direccion: 'San Martín 1234',
  codigoPostal: '8000',
  notas: 'Cliente antiguo, compra mensualmente'
};

export const solicitudPendienteSample = {
  codigo: 'MAY-ABCD',
  creadoEn: { toDate: () => new Date('2026-07-25T12:00:00Z'), seconds: 1785380400 },
  solicitante: {
    nombre: 'María Gómez',
    negocio: 'Boutique Central',
    cuit: '27-98765432-1',
    tipo: 'Tienda de ropa',
    telefono: '11-4555-6666',
    whatsapp: '5491145556666',
    email: 'maria@boutique.com',
    provincia: 'Buenos Aires',
    localidad: 'La Plata',
    direccion: 'Calle 50 nº 700',
    codigoPostal: '1900'
  },
  notas: 'Interesada en línea de camisas',
  estado: 'pendiente',
  respuesta: null
};

export const solicitudAceptadaSample = {
  codigo: 'MAY-WXYZ',
  creadoEn: { toDate: () => new Date('2026-07-20T10:00:00Z'), seconds: 1784952000 },
  solicitante: {
    nombre: 'Carlos Rodríguez',
    negocio: 'Ropa CR',
    telefono: '351-555-1234',
    whatsapp: '5493515551234',
    email: 'carlos@ropacr.com',
    provincia: 'Córdoba',
    localidad: 'Córdoba',
    direccion: 'Av. Colón 500',
    codigoPostal: '5000',
    cuit: '',
    tipo: 'Tienda de ropa'
  },
  notas: '',
  estado: 'aceptada',
  respuesta: {
    codigoMayorista: 'CATT-XYZ789',
    resueltoEn: { toDate: () => new Date('2026-07-21T09:00:00Z'), seconds: 1785034800 }
  }
};

export const solicitudRechazadaSample = {
  codigo: 'MAY-QQQQ',
  creadoEn: { toDate: () => new Date('2026-07-15T08:00:00Z'), seconds: 1784505600 },
  solicitante: {
    nombre: 'Test Rechazado',
    negocio: 'X',
    whatsapp: '5491100000000',
    provincia: 'Buenos Aires',
    localidad: 'Ramos Mejía'
  },
  notas: '',
  estado: 'rechazada',
  respuesta: {
    motivo: 'No trabajamos con esa zona por el momento.',
    resueltoEn: { toDate: () => new Date('2026-07-16T10:00:00Z'), seconds: 1784592000 }
  }
};

export const pedidoPendienteSample = {
  codigo: 'A3F7B',
  creadoEn: { toDate: () => new Date('2026-07-27T14:00:00Z'), seconds: 1785549600 },
  cliente: {
    nombre: 'Ana López',
    negocio: '',
    whatsapp: '',
    email: '',
    cuit: '',
    direccion: 'Av. Corrientes 500',
    provincia: 'Ciudad Autónoma de Buenos Aires',
    localidad: 'Ciudad Autónoma de Buenos Aires',
    codigoPostal: '1043',
    perfil: 'minorista',
    zonaStatus: 'libre',
    localidadPerfil: 'Ciudad Autónoma de Buenos Aires, Ciudad Autónoma de Buenos Aires'
  },
  items: [
    { id: 1, nombre: 'Camisa Oxford Blanca', categoria: 'Camisas', talle: 'M', qty: 2, precio: 22000 }
  ],
  modalidad: 'envio',
  subtotal: 44000,
  envio: 4500,
  total: 48500,
  nota: '',
  estado: 'pendiente'
};

export function pedidoConEstado(estado: string, extra: Record<string, any> = {}) {
  return {
    ...pedidoPendienteSample,
    codigo: 'X' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    estado,
    ...extra
  };
}

/**
 * Réplica reducida de productos.json para mockear la GitHub Contents API
 * que usa portal.html (ghGet/loadRemote). Sin esto, enterApp() en el portal
 * pega a la red real de api.github.com en cada test — ver setup.ts githubData.
 */
export const productosJsonSample = {
  negocio: {
    nombre: 'Cattorini',
    tagline: 'Textil de Las Flores desde 1959',
    whatsapp: '5492244429515',
    provincia: 'Buenos Aires',
    fundacion: 1959
  },
  config: {
    envio: {
      gratis_desde: 80000,
      costo_estandar: 4500,
      transportista: 'Vía Cargo',
      leyenda: 'Enviamos a todo el país por Vía Cargo. Envío gratis en compras superiores a $80.000. Válido para minoristas.'
    },
    mayoristas: {
      codigo_hash: CODIGO_MASTER_HASH,
      minimo_compra: 100000,
      mensaje_bienvenida: 'Ingresá tu código de acceso mayorista.'
    },
    minoristas: {
      bonificacion_zonas_libres: 5,
      mensaje_bonificacion: 'En tu zona no tenemos distribuidor.',
      mensaje_zona_con_mayorista: 'En tu zona contamos con un distribuidor autorizado.'
    },
    pago: { titular: '', banco: '' }
  },
  zonas_mayoristas: [
    { provincia: 'Córdoba', localidad: 'Córdoba', mayorista: 'Ropa CR' }
  ],
  guia_talles: {
    camisas: { unidad: 'cm', medidas: ['Pecho'], tabla: { M: ['96'] } },
    camisas_slim: { unidad: 'cm', medidas: ['Pecho'], tabla: { M: ['90'] } },
    pantalones: { unidad: 'cm', medidas: ['Cintura'], tabla: { '40': ['80'] } }
  },
  horarios: {},
  categorias: [
    {
      id: 'camisas',
      nombre: 'Camisas',
      descripcion: 'Camisas de vestir e industriales.',
      tipo_talle: 'camisas',
      imagen: 'cat-camisas.jpg',
      productos: [
        {
          id: 1,
          nombre: 'Camisa Oxford Blanca',
          descripcion: 'Camisa de vestir clásica.',
          precio_minorista: 22000,
          precio_mayorista: 14500,
          talles_disponibles: ['S', 'M', 'L'],
          disponible: true,
          destacado: true,
          imagenes: ['camisa-oxford-blanca-1.jpg']
        },
        {
          id: 2,
          nombre: 'Camisa Slim Fit Negra',
          descripcion: 'Corte slim, guía de talles propia.',
          precio_minorista: 23000,
          precio_mayorista: 15000,
          talles_disponibles: ['S', 'M', 'L'],
          disponible: true,
          destacado: false,
          fabricacion_propia: false,
          tipo_talle: 'camisas_slim',
          imagenes: ['camisa-slim-negra-1.jpg']
        }
      ]
    },
    {
      id: 'pantalones',
      nombre: 'Pantalones',
      descripcion: 'Pantalones de vestir.',
      tipo_talle: 'pantalones',
      imagen: 'cat-pantalones.jpg',
      productos: [
        {
          id: 4,
          nombre: 'Pantalón de Vestir Negro',
          descripcion: 'Corte recto.',
          precio_minorista: 28000,
          precio_mayorista: 18500,
          talles_disponibles: ['40', '42'],
          disponible: true,
          destacado: true,
          imagenes: ['pantalon-vestir-negro-1.jpg']
        }
      ]
    }
  ],
  textos: {
    hero: { titulo: 'Camisas, pantalones y jeans', subtitulo: 'Desde 1959 en Las Flores.', cta: 'Ver catálogo' },
    fabrica: { titulo: 'Nuestra Producción', texto: 'Más de sesenta años.' },
    local: { titulo: 'Visitá el local', texto: 'Sarmiento y 25 de Mayo.' },
    mayoristas: { titulo: '¿Sos comerciante?', texto: 'Trabajamos con comercios de todo el país.', cta: 'Solicitar cuenta mayorista' },
    confianza: { titulo: 'Trayectoria con historia', texto: 'Más de 60 años.' },
    footer: { texto: 'Cattorini · Las Flores, Buenos Aires.' },
    checkout: { saludo_mayorista: 'Hola! Soy mayorista.', saludo_minorista: 'Hola!' }
  },
  imagenes: { logo: 'logo.jpeg', hero_carousel: [], fabrica_carousel: [], local_carousel: [], og: 'logo.jpeg' },
  seo: { keywords: 'Cattorini', author: 'Cattorini', url_base: 'https://juliancarroccio.github.io/pushcommerce/pages/cattorini' }
};
