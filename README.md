
# ДЗ 6. Каталог книг

Приложение для просмотра и добавления книг через REST API.

API: `http://localhost:3000/books`

## Запуск

Требуются Node.js 22.12, npm и Live Server для VS Code.

Backend:

```bash
cd backend
npm ci
npm run dev
```

Frontend:

Откройте `frontend/index.html` через Live Server в VS Code.

## Возможности

- Получение книг через GET.
- Отображение карточек книг.
- Добавление книг через POST.
- Обработка загрузки, пустого списка и ошибок.
- Повторная загрузка книг.
