# Развёртывание на Replit

## Быстрый старт

### 1. Импортировать репозиторий на Replit
1. Перейти на https://replit.com
2. Нажать "Create" → "Import from GitHub"
3. Вставить URL: `https://github.com/nurgalievberik56-cloud/navi-app`
4. Нажать "Import"

### 2. Настроить переменные окружения
После импорта, перейти в **Secrets** (иконка замка слева) и добавить:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### 3. Установить зависимости
```bash
pnpm install
```

### 4. Запустить приложение
```bash
pnpm run dev
```

Приложение будет доступно по адресу, который выдаст Replit (обычно `https://your-replit-name.replit.dev`)

## Структура проекта

```
navi-app/
├── client/              # React фронтенд
│   ├── public/         # Статические файлы
│   │   └── index-navi.html  # Главная страница
│   └── src/            # React компоненты
├── server/             # Express сервер
│   ├── _core/         # Основной код сервера
│   ├── routers.ts     # tRPC маршруты
│   └── db.ts          # Работа с БД
├── drizzle/           # Миграции БД
├── .replit            # Конфиг Replit
└── replit.nix         # Зависимости Nix
```

## Команды

- `pnpm run dev` - Запустить в режиме разработки
- `pnpm run build` - Собрать для продакшена
- `pnpm test` - Запустить тесты
- `pnpm db:push` - Применить миграции БД

## Возможные проблемы

### Ошибка "React is not defined"
✅ **Решено** - код обёрнут в функцию `initApp()`, которая вызывается после загрузки React

### Ошибка подключения к БД
- Проверить `DATABASE_URL` в Secrets
- Убедиться, что БД доступна из Replit

### Порт уже занят
- Replit автоматически выберет свободный порт
- Приложение будет доступно по URL, который выдаст Replit

## Дополнительно

- **Документация Replit:** https://docs.replit.com
- **GitHub репозиторий:** https://github.com/nurgalievberik56-cloud/navi-app
- **Manus домен:** https://navimarket-mluvnxc7.manus.space
