from fastapi import FastAPI
from service_collection.services_routes import collection_route
from service_collection.services_auth_routes import collection_auth_route
from service_collection.components_routes import components_route
app = FastAPI()

# Подключаем маршруты
app.include_router(collection_route)
app.include_router(collection_auth_route)
app.include_router(components_route)