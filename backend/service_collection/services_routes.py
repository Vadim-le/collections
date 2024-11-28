from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from .database import db  
import base64
import os

collection_route = APIRouter()

def get_db():
    return db.get_connection()  # Возвращаем соединение

#TODO ACCEPTED
@collection_route.get("/api/service", tags=["Коллекция сервисов"])
async def get_services(db=Depends(get_db)):
    cursor = None
    try:
        connection = db
        cursor = connection.cursor()
        services_query = """
            SELECT service.*, service_categories.name AS category_name
            FROM services.service
            LEFT JOIN services.service_categories AS service_categories ON service.category_id = service_categories.id
        """
        cursor.execute(services_query)
        services_result = cursor.fetchall()

        services_with_images = []
        for service in services_result:
            # Предполагаем, что service возвращает словарь с данными
            image_path = f"./collections_logos/{service['logo']}"
            if os.path.exists(image_path):
                with open(image_path, "rb") as image_file:
                    image = base64.b64encode(image_file.read()).decode("utf-8")
                    services_with_images.append({
                        **service,
                        "image": f"data:image/jpeg;base64,{image}"
                    })
            else:
                # Если изображение не найдено, добавляем объект без поля image
                services_with_images.append({
                    **service,
                    "image": None  # Или можно указать путь к изображению по умолчанию
                })

        return JSONResponse(content=services_with_images, media_type="application/json")
    except Exception as err:
        print(f"Error executing query: {err}")
        raise HTTPException(status_code=500, detail="Ошибка выполнения запроса к базе данных")
    finally:
        if cursor is not None:
            cursor.close() 

#TODO ACCEPTED
@collection_route.get('/api/services/{service_name}', tags=["Коллекция сервисов"])
async def get_service(service_name: str, db=Depends(get_db)):
    """
    Получает информацию о сервисе по его имени.
    
    Параметры:
    - service_name: Имя сервиса, для которого нужно получить информацию.

    Возвращает:
    - JSON-ответ с информацией о сервисе, включая его описание, точки обслуживания и логотип.
    """
    cursor = None
    try:
        # Получаем соединение и создаем курсор
        connection = db
        cursor = connection.cursor()

        # Запрос для получения информации о сервисе
        service_info_query = 'SELECT id, description, logo FROM services.service WHERE name = %s'
        cursor.execute(service_info_query, (service_name,))
        service_info = cursor.fetchone()

        # Проверяем, существует ли сервис
        if service_info is None:
            raise HTTPException(status_code=404, detail="Сервис не найден")

        service_id = service_info['id']
        service_description = service_info['description']
        service_logo = service_info['logo']

        # Запрос для получения точек обслуживания сервиса
        service_points_query = 'SELECT uri, description, id FROM services.service_points WHERE service_id = %s'
        cursor.execute(service_points_query, (service_id,))
        service_points = cursor.fetchall()

        # Получаем параметры для каждой точки обслуживания
        service_parameters = []
        for point in service_points:
            parameters_query = '''
                SELECT sp.id, sp.name, sp.description, sp.required, ct.type 
                FROM services.service_parameters sp 
                LEFT JOIN components.type ct ON sp.type_id = ct.id 
                WHERE sp.service_point_id = %s
            '''
            cursor.execute(parameters_query, (point['id'],))
            parameters = cursor.fetchall()
            
            # Формируем параметры с именами полей
            formatted_parameters = []
            for param in parameters:
                formatted_parameters.append({
                    'id': param['id'],
                    'name': param['name'],
                    'description': param['description'],
                    'required': param['required'],
                    'type': param['type']
                })
            
            service_parameters.append({
                **point,
                'parameters': formatted_parameters
            })

        # Читаем логотип сервиса из файловой системы
        image_path = f"./collections_logos/{service_logo}"
        if os.path.exists(image_path):
            with open(image_path, "rb") as image_file:
                image = base64.b64encode(image_file.read()).decode("utf-8")
        else:
            image = None  # Если изображение не найдено, устанавливаем значение None

        # Формируем ответ
        return JSONResponse(content={
            'serviceName': service_name,
            'serviceDescription': service_description,
            'servicePoints': service_parameters,
            'serviceLogo': f"data:image/jpeg;base64,{image}" if image else None
        })
    except Exception as err:
        print(f"Error executing query: {err}")
        raise HTTPException(status_code=500, detail="Ошибка выполнения запроса к базе данных")
    finally:
        if cursor is not None:
            cursor.close()

#TODO ACCEPTED
@collection_route.post('/api/services/{service_name}/endpoints', tags=["Коллекция сервисов"])
async def add_service_endpoint(service_name: str, endpoint_data: dict, db=Depends(get_db)):
    """
    Добавляет новый endpoint для указанного сервиса.
    """
    cursor = None
    try:
        # Получаем соединение и создаем курсор
        connection = db
        cursor = connection.cursor()

        # Извлекаем данные из endpoint_data
        uri = endpoint_data.get("uri")
        description = endpoint_data.get("description")
        parameters = endpoint_data.get("parameters")

        # Проверяем, что все необходимые поля присутствуют
        if not uri or not description or not isinstance(parameters, list):
            raise HTTPException(status_code=400, detail="Неверные данные запроса")

        print(f"Received request to add endpoint for service '{service_name}' with URI '{uri}' and description '{description}'.")

        # Запрос для получения ID сервиса по его имени
        service_info_query = 'SELECT id FROM services.service WHERE name = %s'
        cursor.execute(service_info_query, (service_name,))
        service_info = cursor.fetchone()

        # Проверяем, существует ли сервис
        if service_info is None:
            raise HTTPException(status_code=404, detail="Сервис не найден")

        service_id = service_info['id']
        print(f"Service ID for '{service_name}' is {service_id}.")

        # Вставляем новую точку обслуживания
        insert_endpoint_query = 'INSERT INTO services.service_points (service_id, uri, description) VALUES (%s, %s, %s) RETURNING id'
        cursor.execute(insert_endpoint_query, (service_id, uri, description))
        service_point_id = cursor.fetchone()['id']
        print(f"Inserted service point with ID: {service_point_id}.")

        # Вставляем параметры для новой точки обслуживания
        insert_parameter_query = 'INSERT INTO services.service_parameters (service_point_id, name, description, required, type_id) VALUES (%s, %s, %s, %s, %s)'
        for parameter in parameters:
            # Проверяем, что все необходимые поля присутствуют
            if 'name' not in parameter or 'type' not in parameter:
                raise HTTPException(status_code=400, detail="Неверные данные параметра")

            print(f"Inserting parameter: {parameter['name']} of type '{parameter['type']}'.")

            # Получаем ID типа параметра
            type_id_query = 'SELECT id FROM components.type WHERE type = %s'
            cursor.execute(type_id_query, (parameter['type'],))
            type_result = cursor.fetchone()

            if type_result is None:
                raise HTTPException(status_code=400, detail=f"Тип '{parameter['type']}' не найден")

            type_id = type_result['id']
            print(f"Type ID for '{parameter['type']}' is {type_id}.")

            # Вставляем параметр
            cursor.execute(insert_parameter_query, (service_point_id, parameter['name'], parameter.get('description', ''), parameter.get('required', False), type_id))
            print(f"Inserted parameter '{parameter['name']}'.")

        # Фиксируем изменения
        connection.commit()

        # Получаем обновленные точки обслуживания
        updated_service_points_query = 'SELECT uri, description, id FROM services.service_points WHERE service_id = %s'
        cursor.execute(updated_service_points_query, (service_id,))
        updated_service_points = cursor.fetchall()

        # Получаем параметры для каждой обновленной точки обслуживания
        updated_service_parameters = []
        for point in updated_service_points:
            parameters_query = '''
                SELECT sp.name, sp.description, sp.required, ct.type 
                FROM services.service_parameters sp 
                JOIN components.type ct ON sp.type_id = ct.id 
                WHERE sp.service_point_id = %s
            '''
            cursor.execute(parameters_query, (point['id'],))
            parameters = cursor.fetchall()
            # Формируем список параметров с нужными полями
            formatted_parameters = [
                {
                    'name': param['name'],
                    'description': param['description'],
                    'required': param['required'],
                    'type': param['type']
                }
                for param in parameters
            ]
            updated_service_parameters.append({
                **point,
                'parameters': formatted_parameters
            })

        print("Successfully added endpoint and parameters.")
        return JSONResponse(content=updated_service_parameters, status_code=201)

    except Exception as err:
        print(f"Error adding endpoint: {err}")
        raise HTTPException(status_code=500, detail="Ошибка добавления нового endpoint")
    
    finally:
        if cursor is not None:
            cursor.close()

#TODO ACCEPTED            
@collection_route.get('/api/parameter-types', tags=["Коллекция сервисов"])
async def get_parameter_types(db=Depends(get_db)):
    """
    Получает список типов параметров из базы данных.
    """
    cursor = None
    try:
        connection = db  # Используем экземпляр db, который является объектом Database
        cursor = connection.cursor()  # Создаем курсор из соединения

        # Запрос для получения типов параметров
        parameter_types_query = 'SELECT id, type FROM components.type'
        cursor.execute(parameter_types_query)  # Выполнение запроса
        parameter_types_result = cursor.fetchall()  # Получение всех результатов

        # Преобразование результата в список словарей
        parameter_types = [{"id": row['id'], "type": row['type']} for row in parameter_types_result]

        return JSONResponse(content=parameter_types, media_type="application/json")  # Отправка списка типов параметров клиенту
    except Exception as err:
        print(f"Error fetching parameter types: {err}")  # Вывод сообщения об ошибке
        raise HTTPException(status_code=500, detail="Ошибка получения типов параметров")  # Отправка сообщения об ошибке клиенту
    finally:
        if cursor is not None:
            cursor.close()
   
#TODO ACCEPTED         
@collection_route.put('/api/service-points/{service_point_id}/parameters', tags=["Коллекция сервисов"])
async def update_service_point_parameters(
    service_point_id: int,
    request: Request,
    db=Depends(get_db)
):
    # Получаем параметры из тела запроса
    data = await request.json()
    uri = data.get('uri')
    description = data.get('description')
    parameters = data.get('parameters')

    # Проверяем, что все обязательные поля присутствуют
    if uri is None or description is None:
        raise HTTPException(status_code=400, detail="Field 'uri' and 'description' are required.")

    if parameters is None:
        raise HTTPException(status_code=400, detail="Field 'parameters' is required.")

    cursor = db.cursor()
    try:
        # Обновляем название и описание точки обслуживания
        update_service_point_query = '''
            UPDATE services.service_points
            SET uri = %s, description = %s
            WHERE id = %s
        '''
        cursor.execute(update_service_point_query, (uri, description, service_point_id))

        # Обновляем существующие параметры и добавляем новые параметры
        for param in parameters:
            param_id = param.get('id')
            name = param.get('name')
            description = param.get('description')
            required = param.get('required')
            type_name = param.get('type')

            # Получаем id типа на основе его имени
            cursor.execute('SELECT id FROM components.type WHERE type = %s', (type_name,))
            type_result = cursor.fetchone()

            if type_result is None:
                raise HTTPException(status_code=400, detail=f"Type '{type_name}' not found")

            type_id = type_result[0]

            if param_id is not None:  # Обновляем существующий параметр
                update_query = '''
                    UPDATE services.service_parameters
                    SET name = %s, description = %s, required = %s, type_id = %s
                    WHERE id = %s
                '''
                cursor.execute(update_query, (name, description, required, type_id, param_id))
            else:  # Добавляем новый параметр
                insert_query = '''
                    INSERT INTO services.service_parameters (service_point_id, name, description, required, type_id)
                    VALUES (%s, %s, %s, %s, %s)
                '''
                cursor.execute(insert_query, (service_point_id, name, description, required, type_id))

        # Фиксируем изменения
        db.commit()

        # Извлекаем обновленные данные о сервисной точке и ее параметрах
        cursor.execute('SELECT uri, description FROM services.service_points WHERE id = %s', (service_point_id,))
        service_point = cursor.fetchone()

        cursor.execute('SELECT id, name, description, required, type_id FROM services.service_parameters WHERE service_point_id = %s', (service_point_id,))
        parameters = cursor.fetchall()

        # Формируем ответ
        response_data = {
            "service_point": {
                "id": service_point_id,
                "uri": service_point[0],
                "description": service_point[1],
            },
            "parameters": [
                {
                    "id": param[0],
                    "name": param[1],
                    "description": param[2],
                    "required": param[3],
                    "type_id": param[4],
                } for param in parameters
            ]
        }

        return JSONResponse(content=response_data, status_code=200)

    except Exception as error:
        print(f"Error updating service point and parameters: {error}")
        db.rollback()  # Откатываем изменения в случае ошибки
        raise HTTPException(status_code=500, detail="Error updating service point and parameters")
    finally:
        cursor.close()
   
#TODO ACCEPTED           
# Обработчик маршрута для удаления параметра точки обслуживания
@collection_route.delete('/api/service-points/{point_id}/parameters/{param_id}', tags=["Коллекция сервисов"])
async def delete_parameter(point_id: int, param_id: int, db=Depends(get_db)):
    """
    Удаляет параметр точки обслуживания по её ID.
    
    Параметры:
    - point_id: ID точки обслуживания.
    - param_id: ID параметра для удаления.
    """
    cursor = None
    try:
        connection = db  # Используем экземпляр db, который является объектом Database
        cursor = connection.cursor()  # Создаем курсор из соединения

        # Запрос для удаления параметра
        delete_query = '''
            DELETE FROM services.service_parameters
            WHERE service_point_id = %s AND id = %s
        '''
        cursor.execute(delete_query, (point_id, param_id))

        # Подтверждение транзакции
        connection.commit()

        return JSONResponse(content={"message": "Parameter deleted successfully"}, status_code=200)
    except Exception as error:
        print(f"Error deleting parameter: {error}")
        if connection:
            connection.rollback()  # Откат изменений в случае ошибки
        raise HTTPException(status_code=500, detail="Error deleting parameter")
    finally:
        if cursor is not None:
            cursor.close() 

#TODO ACCEPTED  
# Обработчик маршрута для удаления точки обслуживания
@collection_route.delete('/api/service-points/{point_id}', tags=["Коллекция сервисов"])
async def delete_service_point(point_id: int, db=Depends(get_db)):
    """
    Удаляет точку обслуживания по её ID и возвращает обновленный список точек обслуживания.
    
    Параметры:
    - point_id: ID точки обслуживания для удаления.
    """
    cursor = None
    print(f"Attempting to delete service point with ID: {point_id}")
    try:
        connection = db  # Используем экземпляр db, который является объектом Database
        cursor = connection.cursor()  # Создаем курсор из соединения

        # Запрос для удаления точки обслуживания
        delete_endpoint_query = '''
            DELETE FROM services.service_points
            WHERE id = %s
        '''
        cursor.execute(delete_endpoint_query, (point_id,))

        # Подтверждение транзакции
        connection.commit()

        # Получаем обновленный список точек обслуживания после удаления
        updated_endpoints_query = '''
            SELECT uri, description, id FROM services.service_points
        '''
        cursor.execute(updated_endpoints_query)
        updated_endpoints = cursor.fetchall()  # Получаем все обновленные результаты

        return JSONResponse(content=updated_endpoints, status_code=200)  # Отправляем обновленный список точек обслуживания клиенту
    except Exception as error:
        print(f"Error deleting service point: {error}")
        if connection:
            connection.rollback()  # Откат изменений в случае ошибки
        raise HTTPException(status_code=500, detail="Error deleting service point")
    finally:
        if cursor is not None:
            cursor.close()  # Закрытие курсора, если он был создан

#TODO ACCEPTED 
# Обработчик маршрута для получения категорий
@collection_route.get('/api/categories', tags=["Коллекция сервисов"])
async def get_categories(db=Depends(get_db)):
    """
    Получает список категорий из базы данных.
    """
    cursor = None
    try:
        connection = db  # Используем экземпляр db, который является объектом Database
        cursor = connection.cursor()  # Создаем курсор из соединения

        # Запрос для получения категорий
        categories_query = 'SELECT * FROM services.service_categories'
        cursor.execute(categories_query)  # Выполнение запроса
        categories_result = cursor.fetchall()  # Получение всех результатов

        return JSONResponse(content=categories_result, media_type="application/json")  # Отправка списка категорий клиенту
    except Exception as err:
        print(f"Error executing query: {err}")  # Вывод сообщения об ошибке
        raise HTTPException(status_code=500, detail="Ошибка выполнения запроса к базе данных")  # Отправка сообщения об ошибке клиенту
    finally:
        if cursor is not None:
            cursor.close()
     
#TODO ACCEPTED        
# Обработчик маршрута для обновления сервиса
@collection_route.put('/api/service-update/{service_name}', tags=["Коллекция сервисов"])
async def update_service(
    service_name: str,
    request: Request,
    db=Depends(get_db)
):
    print(service_name)
    """
    Обновляет сервис по его имени.
    
    Параметры:
    - service_name: Имя сервиса для обновления.
    - request: Объект запроса для извлечения данных из тела.
    
    Ожидаемые поля в теле запроса:
    - service_display_name (str): Новое имя сервиса. Если не указано, имя не изменится.
    - service_description (str): Новое описание сервиса. Если не указано, описание не изменится.
    """
    # Извлечение данных из тела запроса
    body = await request.json()
    service_display_name = body.get("service_display_name")
    service_description = body.get("service_description")

    # Проверка на наличие обязательных полей
    if service_display_name is None and service_description is None:
        raise HTTPException(status_code=400, detail="At least one of 'service_display_name' or 'service_description' must be provided.")

    cursor = None
    try:
        connection = db
        cursor = connection.cursor()

        # Запрос для обновления сервиса
        update_query = '''
            UPDATE services.service
            SET name = %s, description = %s
            WHERE name = %s
            RETURNING *
        '''
        values = (
            service_display_name if service_display_name is not None else service_name,
            service_description,
            service_name
        )

        cursor.execute(update_query, values)
        updated_service = cursor.fetchone()
        print(updated_service)

        if updated_service is None:
            raise HTTPException(status_code=404, detail='No service found to update.')
        response = {
            "name": updated_service[3],
        }

        connection.commit()

        return JSONResponse(content=response, status_code=200)
    except Exception as error:
        print(f"Error updating service: {error}")
        if connection:
            connection.rollback()  # Откат изменений в случае ошибки
        raise HTTPException(status_code=500, detail='Failed to update service')
    finally:
        if cursor is not None:
            cursor.close()  # Закрытие курсора, если он был создан

#TODO ACCEPTED 
# Обработчик маршрута для удаления сервиса
@collection_route.delete('/api/service-delete/{service_name}', tags=["Коллекция сервисов"])
async def delete_service(service_name: str, db=Depends(get_db)):
    """
    Удаляет сервис по его имени.
    
    Параметры:
    - service_name: Имя сервиса для удаления.
    """
    cursor = None
    try:
        delete_query = '''
            DELETE FROM services.service
            WHERE name = %s
            RETURNING *
        '''
        connection = db
        cursor = connection.cursor()
        cursor.execute(delete_query, (service_name,))
        deleted_service = cursor.fetchone()

        if deleted_service is None:
            raise HTTPException(status_code=404, detail='No service found to delete.')

        # Подтверждение транзакции
        connection.commit()

        return JSONResponse(content={"message": "Service deleted successfully"}, status_code=200)
    except Exception as error:
        print(f"Error deleting service: {error}")
        if connection:
            connection.rollback()  # Откат изменений в случае ошибки
        raise HTTPException(status_code=500, detail='Failed to delete service')
    finally:
        if cursor is not None:
            cursor.close()
            
#TODO ACCEPTED 
@collection_route.post('/api/services', tags=["Коллекция сервисов"])
async def add_service(
    uri: str = Form(...),
    name: str = Form(...),
    categoryId: int = Form(...),
    description: str = Form(...),
    image: UploadFile = File(None),
    db=Depends(get_db)
):
    print(f"Received data: uri={uri}, name={name}, categoryId={categoryId}, description={description}, image={image.filename if image else None}")
    cursor = None
    try:
        cursor = db.cursor()

        # Проверяем, существует ли сервис с таким именем
        check_query = 'SELECT * FROM services.service WHERE name = %s'
        cursor.execute(check_query, (name,))
        check_result = cursor.fetchone()

        if check_result:
            return JSONResponse(content={'detail': 'Сервис с таким названием уже существует'}, status_code=409)

        api_source = 'manual'
        token = 'no'
        
        # Создаем папку images, если она не существует
        if not os.path.exists("collections_logos"):
            os.makedirs("collections_logos")
            print("Папка 'collections_logos' была создана.")

        # Обработка логотипа
        if image:
            print(f"Получено изображение: {image.filename}, размер: {image.size} байт")
            
            # Извлекаем расширение файла
            file_extension = os.path.splitext(image.filename)[1]  # Получаем расширение, например, .jpg
            logo_file_name = f"{name}{file_extension}"  # Создаем новое имя файла
            image_path = os.path.join("collections_logos", logo_file_name)

            # Читаем содержимое файла
            content = await image.read()
            if not content:
                return JSONResponse(status_code=400, content={'detail': 'Пустое содержимое файла'})

            print(f"Чтение содержимого файла: {len(content)} байт.")

            try:
                with open(image_path, "wb") as image_file:
                    image_file.write(content)
                    print(f"Изображение сохранено по пути: {image_path}")
            except Exception as e:
                return JSONResponse(status_code=500, content={'detail': 'Ошибка при сохранении изображения'})

        else:
            logo_file_name = "default.jpg"
            print("Изображение не передано, используется 'default.jpg'.")
        
        # Вставляем новый сервис
        insert_query = '''
            INSERT INTO services.service (uri, token, name, category_id, logo, description, api_source)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        '''
        cursor.execute(insert_query, (uri, token, name, categoryId, logo_file_name, description, api_source))
        
        # Подтверждение транзакции
        db.commit()  
        print("Сервис добавлен в базу данных.")

        return JSONResponse(content={'message': f'Service {name} added successfully.'}, status_code=201)

    except Exception as error:
        print('Error inserting service:', error)
        raise HTTPException(status_code=500, detail='Error adding service')
    
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception as cursor_close_error:
                print(f"Ошибка при закрытии курсора: {cursor_close_error}")