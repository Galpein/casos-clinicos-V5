-- ============================================================================
--  AtlasCases · esquema v1
--
--  Un caso clínico se lee y se escribe siempre entero, así que el documento
--  vive en jsonb y sólo se extraen a columnas los campos por los que se
--  filtra, se ordena o se cuenta. Es el mismo reparto que ya hace el dominio:
--  Clinical Case (documento) + Library Index (derivado, para buscar).
-- ============================================================================

create table if not exists cases (
  case_id            text primary key,
  author_id          text        not null,
  title              text        not null default '',
  status             text        not null,
  status_color       text        not null,

  -- Regla de Enrique: en cuanto un caso alcanza "documentación esencial"
  -- entra en la biblioteca y ya no sale, aunque el autor lo borre de su
  -- pantalla. Por eso son dos banderas y no un DELETE.
  in_library         boolean     not null default false,
  deleted_by_author  boolean     not null default false,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  doc                jsonb       not null,
  index_doc          jsonb
);

create index if not exists cases_author_idx   on cases (author_id) where deleted_by_author = false;
create index if not exists cases_library_idx  on cases (in_library) where in_library = true;
create index if not exists cases_updated_idx  on cases (updated_at desc);
create index if not exists cases_index_gin    on cases using gin (index_doc);
