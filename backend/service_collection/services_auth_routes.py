from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .database import db
from pydantic import BaseModel

collection_auth_route = APIRouter()

class AuthService(BaseModel):
    serviceName: str
    token: str
    paramName: str
    auth_id: int
    userID: int

def get_db():
    return db.get_connection()  # Возвращаем соединение
    
@collection_auth_route.post('/api/create-auth-service')
async def create_auth_service(
    serviceName: str,
    token: str,
    paramName: str,
    auth_id: int,
    userID: int,
    db=Depends(get_db)
):
    cursor = None
    try:
        cursor = db.cursor()        # Проверяем, существует ли сервис с таким именем
        check_query = 'SELECT * FROM services.service WHERE name = %s'
        cursor.execute(check_query, (serviceName,))
        check_result = cursor.fetchone()

        if not check_result:
            return JSONResponse(content={'detail': 'Сервиса с таким именем не существует'}, status_code=404)

        service_id = check_result['id']
        
        # Вставляем новый сервис
        insert_query = '''
            INSERT INTO services.default_auth ("token", service_id, type_id, user_id, "param_name")
            VALUES (%s, %s, %s, %s, %s)
        '''
        cursor.execute(insert_query, (token, service_id, auth_id, userID, paramName))
        
        # Подтверждение транзакции
        db.commit()  
        print("Авторизация добавлена в базу данных.")
        
        return JSONResponse(content={'message': f'Authorisation of {serviceName} added successfully.'}, status_code=201)

    except Exception as error:
        print('Error inserting service:', error)
        
        raise HTTPException(status_code=500, detail='Error adding authorisation')
    
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception as cursor_close_error:
                print(f"Ошибка при закрытии курсора: {cursor_close_error}")



@collection_auth_route.post('/api/create-oauth-service')
async def create_oauth_service(
    serviceName: str,
    clientId: str,
    clientSecret: str,
    clientUrl: str,
    authorizationContentType: str,
    authorizationUrl: str,
    scope: str,
    userID: int,
    db=Depends(get_db)
):
    cursor = None
    try:
        cursor = db.cursor()

        # Проверяем, существует ли сервис с таким именем
        check_query = 'SELECT * FROM services.service WHERE name = %s'
        cursor.execute(check_query, (serviceName,))
        check_result = cursor.fetchone()

        if not check_result:
            return JSONResponse(content={'detail': 'Сервиса с таким именем не существует'}, status_code=404)

        service_id = check_result['id']
        

        # Вставляем данные в таблицу OAuth
        insert_query = '''
            INSERT INTO services.oauth_auth (client_id,service_id , client_secret, client_url, authorization_url, authorization_content_type, scope, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        '''
        cursor.execute(insert_query, (clientId,service_id , clientSecret, clientUrl, authorizationUrl, authorizationContentType, scope, userID))

        db.commit()  
        print("Авторизация добавлена в базу данных.")

        return JSONResponse(content={'message': f'Authorisation of {serviceName} added successfully.'}, status_code=201)

    except Exception as error:
        print('Error inserting service:', error)
        raise HTTPException(status_code=500, detail='Error adding authorisation')
    
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception as cursor_close_error:
                print(f"Ошибка при закрытии курсора: {cursor_close_error}")

