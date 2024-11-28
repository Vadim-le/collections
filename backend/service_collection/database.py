from psycopg2 import connect, sql
from psycopg2.extras import DictCursor
from typing import Dict

# Данные для подключения к базе данных
db_config: Dict[str, str] = {
    "host": "localhost",
    "user": "postgres",
    "password": "",
    "db_name": "",
    "port": ""
}

class Database:
    def __init__(self):
        self.connection = None

    def connect(self):
        try:
            self.connection = connect(
                host=db_config["host"],
                user=db_config["user"],
                password=db_config["password"],
                dbname=db_config["db_name"],
                port=db_config["port"],
                cursor_factory=DictCursor
            )
            print("Подключение к базе данных успешно!")
        except Exception as e:
            print(f"Ошибка подключения к базе данных: {e}")

    def get_connection(self):
        if not self.connection:
            self.connect()
        return self.connection

    def close(self):
        if self.connection:
            self.connection.close()
            print("Подключение к базе данных закрыто!")

db = Database()