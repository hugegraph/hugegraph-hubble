export interface FileUploadResult {
  id: string;
  name: string;
  size: string;
  status: string;
  cause: string | null;
}

export interface FileConfig {
  has_header: boolean;
  column_names: string[];
  column_values: string[];
  format: string;
  delimiter: string;
  charset: string;
  date_format: string;
  time_zone: string;
  skipped_line: string;
}

export interface FieldMapping {
  column_name: string;
  mapped_name: string;
}

export interface ValueMapping {
  column_name: string;
  values: {
    column_value: string;
    mapped_value: string;
  }[];
}

export interface NullValues {
  checked: string[];
  customized: string[];
}

// export type NullValues = string[];

export interface VertexMap {
  id?: string;
  label: string;
  id_fields: string[];
  field_mapping: FieldMapping[];
  value_mapping: ValueMapping[];
  null_values: NullValues;
}

export interface EdgeMap {
  id?: string;
  label: string;
  source_fields: string[];
  target_fields: string[];
  field_mapping: FieldMapping[];
  value_mapping: ValueMapping[];
  null_values: NullValues;
}

export interface LoadParameter {
  check_vertex: boolean;
  insert_timeout: number;
  max_parse_errors: number;
  max_insert_errors: number;
  retry_times: number;
  retry_interval: number;
}

export interface FileMapInfo {
  id: number;
  name: string;
  total_lines: number;
  file_setting: FileConfig;
  vertex_mappings: VertexMap[];
  edge_mappings: EdgeMap[];
  load_parameter: LoadParameter;
  last_access_time: string;
}

export interface FileMapResult {
  records: FileMapInfo[];
}

export interface ImportTasks {
  id: number;
  conn_id: number;
  file_id: number;
  vertices: string[];
  edges: string[];
  load_rate: number;
  load_progress: number;
  file_total_lines: number;
  file_read_lines: number;
  status: string;
  duration: string;
}
