import { DOCS_URL } from '@/lib/constants'

// Original storage constants
export enum URL_EXPIRY_DURATION {
  WEEK = 60 * 60 * 24 * 7,
  MONTH = 60 * 60 * 24 * 30,
  YEAR = 60 * 60 * 24 * 365,
}

export enum STORAGE_VIEWS {
  COLUMNS = 'COLUMNS',
  LIST = 'LIST',
}

export enum STORAGE_SORT_BY {
  NAME = 'name',
  UPDATED_AT = 'updated_at',
  CREATED_AT = 'created_at',
  LAST_ACCESSED_AT = 'last_accessed_at',
}

export enum STORAGE_BUCKET_SORT {
  ALPHABETICAL = 'alphabetical',
  CREATED_AT = 'created_at',
}

export enum STORAGE_SORT_BY_ORDER {
  ASC = 'asc',
  DESC = 'desc',
}

export enum STORAGE_ROW_TYPES {
  BUCKET = 'BUCKET',
  FILE = 'FILE',
  FOLDER = 'FOLDER',
}

export enum STORAGE_ROW_STATUS {
  READY = 'READY',
  LOADING = 'LOADING',
  EDITING = 'EDITING',
}

export const STORAGE_CLIENT_LIBRARY_MAPPINGS = {
  upload: ['INSERT'],
  download: ['SELECT'],
  list: ['SELECT'],
  update: ['SELECT', 'UPDATE'],
  move: ['SELECT', 'UPDATE'],
  copy: ['SELECT', 'INSERT'],
  remove: ['SELECT', 'DELETE'],
  createSignedUrl: ['SELECT'],
  createSignedUrls: ['SELECT'],
  getPublicUrl: [],
}

export const BUCKET_TYPES = {
  files: {
    displayName: 'Arquivos',
    singularName: 'arquivo',
    article: 'um',
    description: 'Armazenamento geral para a maioria dos conteúdos digitais',
    valueProp: 'Guarde imagens, vídeos, documentos e qualquer outro tipo de arquivo.',
    docsUrl: `${DOCS_URL}/guides/storage/buckets/fundamentals`,
  },
  analytics: {
    displayName: 'Analytics',
    singularName: 'analytics',
    article: 'um',
    description: 'Armazenamento projetado para cargas de trabalho analíticas',
    valueProp: 'Armazene grandes conjuntos de dados para análise e relatórios.',
    docsUrl: `${DOCS_URL}/guides/storage/analytics/introduction`,
  },
  vectors: {
    displayName: 'Vetores',
    singularName: 'vetor',
    article: 'um',
    description: 'Armazenamento projetado para dados vetoriais',
    valueProp: 'Armazene, indexe e consulte seus vetores em escala.',
    docsUrl: `${DOCS_URL}/guides/storage/vector/introduction`,
  },
}
export const BUCKET_TYPE_KEYS = Object.keys(BUCKET_TYPES) as Array<keyof typeof BUCKET_TYPES>
export const DEFAULT_BUCKET_TYPE: keyof typeof BUCKET_TYPES = 'files'

export const PUBLIC_BUCKET_TOOLTIP = 'Os objetos deste volume são legíveis por qualquer pessoa com a URL.'
