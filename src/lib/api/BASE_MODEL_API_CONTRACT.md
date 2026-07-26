# Base Model API Contract

The React app integrates with **python-base-model-service-fastapi**. Set `VITE_BASE_MODEL_API_URL` in `.env` (default: `http://localhost:8502`).

## Base URL

- Default: `http://localhost:8502`
- All routes are under `/v1/base-models`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/base-models?project_id=...&page=1&page_size=10` | List base models by project (paginated) |
| GET | `/v1/base-models/{id}` | Get one base model (master only) |
| GET | `/v1/base-models/{id}/detail` | Get full detail (master + source-specific: Hugging Face / Ollama / Scratch / Upload) |
| POST | `/v1/base-models` | Create base model (body: BaseModelCreate) |
| PUT | `/v1/base-models/{id}` | Update base model (body: BaseModelUpdate) |
| DELETE | `/v1/base-models/{id}` | Delete base model (204 No Content) |

## List response

```json
{
  "base_models": [{ "id", "project_id", "name", "description", "source_id", "source_code", "source_name", "architecture_id", "created_by", "created_date", "created_from", "updated_by", "updated_date", "updated_from" }],
  "total": 0,
  "page": 1,
  "page_size": 10
}
```

## Create body (BaseModelCreate)

- `project_id` (string, required)
- `name` (string, required, max 150)
- `description` (string, optional)
- `source_id` (string, required) — use lookup IDs: huggingface, scratch, ollama, upload
- `architecture_id` (string, optional)
- `task_ids`, `framework_ids`, `license_ids` (arrays of lookup IDs, optional)
- One of: `huggingface`, `ollama`, `scratch`, `upload` (detail object) according to source

Detail shapes:

- **huggingface**: `{ hf_repo_id, hf_revision? }`
- **ollama**: `{ ollama_model_name, ollama_host_url, ollama_host_type: "local" | "cloud" }`
- **scratch**: `{ scratch_input_format?, scratch_init_method? }`
- **upload**: `{ upload_file_name, upload_file_path, upload_file_size_bytes, upload_checksum?, upload_mime_type? }`

Lookup IDs used by the frontend are defined in `baseModelApi.ts` (SOURCE_IDS, TASK_IDS, FRAMEWORK_IDS, LICENSE_IDS, ARCHITECTURE_IDS) and must match backend seed data.
