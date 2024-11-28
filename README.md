# README

## Backend
При скачивании установить все бибилиотеки, для запуска - uvicorn main:app --reload
### Место размещения
`/var/va/endpoints/pythonenv/services_and_components`
- **collections_logos** - папка для хранения изображений сервисов.

### Настройка CORS
В файле `main.py` нужно разрешить получать запросы с порта 5111:

```python
origins = [
    "http://localhost:3000",
    "http://51.250.4.123:5111",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

В database.py - настроить подключениек бд, ввести данные: host, user, password, db_name, port
Для перезагрузки демона бэкенда: sudo systemctl restart fastapiva.service
Для проверки статуса: sudo systemctl status fastapiva.service

## Frontend
при скачивании - npm install сначала сделать
Место размещения: var/service_collection/serviceCollection
Файл демон: CollectionStart.service

1) Собрать проект: npm run dev
2) Разместить по маршруту: var/service_collection/serviceCollection
3) Файл демона уже создан
Для создания демона:
1. Создайте файл демона: sudo nano /etc/systemd/system/Название.service
Вставьте следующий код в файл: 
```[Unit]
Description=React App
After=network.target

[Service]
Type=simple
WorkingDirectory=/путь/к/react-приложению (build)
ExecStart=/usr/bin/serve -s build -l ПОРТ - сейчас на 5111
Restart=always

[Install]
WantedBy=multi-user.target
   ```
4) Открыть порт в firewall (1 раз) - sudo ufw allow 5111
5) Перезагрузите демон: sudo systemctl daemon-reload
   
   Перезапустите демон: sudo systemctl restart CollectionStart

   Проверьте статус демона: sudo systemctl status CollectionStart
