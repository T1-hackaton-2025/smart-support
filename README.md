## Быстрый старт

### 1. Настройка переменных окружения

#### Backend (.env)

Создайте файл backend/.env:

```env
# SciBox API Configuration
SCIBOX_API_KEY=your-scibox-api-key-here
OPENAI_API_KEY=your-scibox-api-key-here
SCIBOX_BASE_URL=https://api.scibox.com/v1
SCIBOX_CHAT_MODEL=Qwen2.5-72B-Instruct-AWQ
SCIBOX_EMBEDDING_MODEL=bge-m3

# Database Configuration (для Docker)
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_USERNAME=myuser
DATABASE_PASSWORD=ChangeMe
DATABASE_NAME=api

# Application Configuration
PORT=3000
NODE_ENV=production
```


> Важно: OPENAI_API_KEY должен быть таким же как SCIBOX_API_KEY, так как используется OpenAI-совместимый API от SciBox.

#### Frontend (.env)

Создайте файл frontend/.env:

```env
VITE_BACKEND_URL=http://localhost:3000
```


### 2. Запуск с Docker


# Запустить все сервисы (база данных, backend, frontend)
docker compose up --build

# Или в фоновом режиме
docker compose up --build -d


Приложение будет доступно по адресам:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL (pgvector): localhost:5432



## Архитектура

- **Сервисы**
  - **Backend**: NestJS-приложение (`smart-support/backend`), REST API, работа с векторной БД и RAG.
  - **Frontend**: SPA (`smart-support/frontend`), UI для отправки вопросов и ответов.
  - **PostgreSQL + pgvector**: хранилище документов и векторов для поиска.

- **Модули Backend**
  - **AppModule**: корневой модуль, подключает конфигурацию и доменные модули.
  - **DatabaseModule**: подключение к PostgreSQL (TypeORM), подготовка таблиц и векторного стора.
  - **AIModule**: инкапсулирует `SciBoxService` (api для подключения к чат-модели и эмбеддинг-модели).
  - **RagModule**: `RagService` — нормализация запроса, преобразование в standalone, векторный поиск и маппинг результатов.
  - **SupportModule**: `SupportController` и `SupportService` — REST endpoints `/support/*`, отдача предложений и прием финальных ответов.


