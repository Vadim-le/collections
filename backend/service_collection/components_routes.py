from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from .database import db  

components_route = APIRouter()

def get_db():
    return db.get_connection()

# Модель для создания компонента
class ComponentCreate(BaseModel):
    name: str = Field(..., example="My Component")
    description: Optional[str] = Field(None, example="Description of the component")

# Модель для ответа
class Component(ComponentCreate):
    id: int

class Parameter(BaseModel):
    id: Optional[int] = None  
    name: str = Field(..., example="param1")
    description: Optional[str] = Field(None, example="Description of the parameter")
    param_type: str = Field(..., example="number")
    position_in_signature: Optional[int] = Field(None, example=1)
    is_multiple_values: Optional[bool] = Field(False, example=False)
    is_return_value: Optional[bool] = Field(False, example=False)
    default: Optional[str] = Field(None, example="default_value")
    path: Optional[str] = Field(None, example="/path/to/parameter")

class Function(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., example="my_function")
    parameters: List[Parameter] = Field(...)

class ComponentDetail(BaseModel):
    componentId: int
    componentName: str
    componentDescription: Optional[str]
    functions: Optional[List[Function]]

#TODO ACCEPTED
@components_route.get("/components", response_model=List[Component], tags=["Коллекция компонентов"])
async def get_components(db_connection=Depends(get_db)):
    """
    Получение списка всех компонентов из базы данных.
    """
    cursor = None
    try:
        cursor = db_connection.cursor() 
        cursor.execute("SELECT id, name, description FROM components.components")
        components = cursor.fetchall() 
        result = [
            {"id": component[0], "name": component[1], "description": component[2]}
            for component in components
        ]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor is not None:
            cursor.close()

#TODO ACCEPTED
@components_route.post("/components", response_model=Component, tags=["Коллекция компонентов"])
async def create_component(component: ComponentCreate, db_connection=Depends(get_db)):
    """
    Создание нового компонента
    """
    cursor = None
    try:
        cursor = db_connection.cursor()
        cursor.execute(
            "INSERT INTO components.components (name, description) VALUES (%s, %s) RETURNING id",
            (component.name, component.description)
        )
        new_id = cursor.fetchone()[0]
        db_connection.commit()
        return Component(id=new_id, name=component.name, description=component.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor is not None:
            cursor.close()

#TODO ACCEPTED
@components_route.put("/components/{component_id}", response_model=Component, tags=["Коллекция компонентов"])
async def update_component(component_id: int, component: ComponentCreate, db_connection=Depends(get_db)):
    """
    Обновление компонента по id
    """
    cursor = None
    try:
        cursor = db_connection.cursor()
        cursor.execute(
            "UPDATE components.components SET name = %s, description = %s WHERE id = %s",
            (component.name, component.description, component_id)
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Component not found")
        db_connection.commit()
        
        return Component(id=component_id, name=component.name, description=component.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor is not None:
            cursor.close()

#TODO ACCEPTED        
@components_route.get("/components/{component_id}", response_model=ComponentDetail, tags=["Коллекция компонентов"])
async def get_component(component_id: int, db_connection=Depends(get_db)):
    """
    Получение компонента со всеми связанными данными по id
    """
    cursor = None
    try:
        cursor = db_connection.cursor()
        component_query = '''
            SELECT id, name, description 
            FROM components.components 
            WHERE id = %s
        '''
        cursor.execute(component_query, (component_id,))
        component_info = cursor.fetchone()

        if component_info is None:
            raise HTTPException(status_code=404, detail="Компонент не найден")

        functions_query = '''
            SELECT id, name 
            FROM components.component_function 
            WHERE id_of_component = %s
        '''
        cursor.execute(functions_query, (component_id,))
        functions = cursor.fetchall()

        functions_with_parameters = []
        for function in functions:
            parameters_query = '''
                SELECT id, name, description, id_type, "position in signature", 
                    "is multiple values", "is return value", "default", path 
                FROM components.component_function_parameter 
                WHERE id_of_component_function = %s
            '''
            cursor.execute(parameters_query, (function['id'],))
            parameters = cursor.fetchall()
            
            parameters_list = []
            for param in parameters:
                if 'id_type' not in param or param['id_type'] is None:
                    raise HTTPException(status_code=500, detail="id_type is required for parameter")
                
                type_query = '''
                    SELECT "type" FROM components."type" WHERE id = %s
                '''
                cursor.execute(type_query, (param['id_type'],))
                type_info = cursor.fetchone()

                if type_info is None:
                    raise HTTPException(status_code=500, detail="Type not found for id_type")

                parameters_list.append(Parameter(
                    id=param['id'],
                    name=param['name'],
                    description=param['description'],
                    param_type=type_info['type'],
                    position_in_signature=param['position in signature'],
                    is_multiple_values=param['is multiple values'],
                    is_return_value=param['is return value'],
                    default=param['default'],
                    path=param['path']
                ))
            
            functions_with_parameters.append(Function(
                id=function['id'],
                name=function['name'],
                parameters=parameters_list
            ))

        return ComponentDetail(
            componentId=component_info['id'],
            componentName=component_info['name'],
            componentDescription=component_info['description'],
            functions=functions_with_parameters
        )
    except Exception as err:
        print(f"Error executing query: {err}")
        raise HTTPException(status_code=500, detail="Ошибка выполнения запроса к базе данных")
    finally:
        if cursor is not None:
            cursor.close()
            
@components_route.post("/components/{component_id}/functions", tags=["Коллекция компонентов"])
async def add_component_function(component_id: int, function_data: Function, db=Depends(get_db)):
    """
    Добавляет новую функцию для указанного компонента и возвращает информацию о добавленной функции.
    """
    cursor = None
    try:
        connection = db
        cursor = connection.cursor()

        function_name = function_data.name
        parameters = function_data.parameters

        print(f"Received request to add function '{function_name}' for component ID '{component_id}'.")

        component_query = 'SELECT id FROM components.components WHERE id = %s'
        cursor.execute(component_query, (component_id,))
        component_info = cursor.fetchone()

        if component_info is None:
            raise HTTPException(status_code=404, detail="Компонент не найден")

        insert_function_query = 'INSERT INTO components.component_function (id_of_component, name) VALUES (%s, %s) RETURNING id'
        cursor.execute(insert_function_query, (component_id, function_name))
        function_id = cursor.fetchone()['id']
        print(f"Inserted function with ID: {function_id}.")

        parameter_ids = {}
        for parameter in parameters:
            type_query = 'SELECT id FROM components.type WHERE type = %s'
            cursor.execute(type_query, (parameter.param_type,))
            type_id = cursor.fetchone()

            if type_id is None:
                raise HTTPException(status_code=404, detail=f"Type '{parameter.param_type}' not found")

            parameter_ids[parameter.name] = type_id['id']

        insert_parameter_query = '''
            INSERT INTO components.component_function_parameter (id_of_component_function, id_type, name, description, "position in signature", "is multiple values", "is return value", "default", path) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        for parameter in parameters:
            print(f"Inserting parameter: {parameter.name} with type id '{parameter_ids[parameter.name]}'.")

            cursor.execute(insert_parameter_query, (
                function_id,
                parameter_ids[parameter.name], 
                parameter.name,
                parameter.description or '',
                parameter.position_in_signature,
                parameter.is_multiple_values,
                parameter.is_return_value,
                parameter.default,
                parameter.path
            ))
            print(f"Inserted parameter '{parameter.name}'.")

        connection.commit()

        functions_with_parameters = []
        
        functions_query = '''
            SELECT id, name 
            FROM components.component_function 
            WHERE id_of_component = %s
        '''
        cursor.execute(functions_query, (component_id,))
        functions = cursor.fetchall()

        for function in functions:
            parameters_query = '''
                SELECT id, name, description, id_type, "position in signature", 
                    "is multiple values", "is return value", "default", path 
                FROM components.component_function_parameter 
                WHERE id_of_component_function = %s
            '''
            cursor.execute(parameters_query, (function['id'],))
            parameters = cursor.fetchall()
            
            parameters_list = []
            for param in parameters:
                if 'id_type' not in param or param['id_type'] is None:
                    raise HTTPException(status_code=500, detail="id_type is required for parameter")
                
                type_query = '''
                    SELECT "type" FROM components."type" WHERE id = %s
                '''
                cursor.execute(type_query, (param['id_type'],))
                type_info = cursor.fetchone()

                if type_info is None:
                    raise HTTPException(status_code=500, detail="Type not found for id_type")

                parameters_list.append(Parameter(
                    id=param['id'],
                    name=param['name'],
                    description=param['description'],
                    param_type=type_info['type'],  # Используем название типа
                    position_in_signature=param['position in signature'],
                    is_multiple_values=param['is multiple values'],
                    is_return_value=param['is return value'],
                    default=param['default'],
                    path=param['path']
                ))
            
            functions_with_parameters.append(Function(
                id=function['id'],
                name=function['name'],
                parameters=parameters_list
            ))

        return functions_with_parameters
    except Exception as e:
        print(f"Error occurred: {e}")
        if cursor:
            connection.rollback()
        raise HTTPException(status_code=500, detail="Ошибка при добавлении функции")
    finally:
        if cursor:
            cursor.close()
            
@components_route.get("/components-types", response_model=List[str], tags=["Коллекция компонентов"])
async def get_component_types(db=Depends(get_db)):
    """
    Возвращает список всех типов компонентов.
    """
    cursor = None
    try:
        connection = db
        cursor = connection.cursor()

        query = 'SELECT "type" FROM components."type"'
        cursor.execute(query)

        types = cursor.fetchall()
        print("Fetched types:", types)

        return [type_[0] for type_ in types]
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при получении типов компонентов")
    finally:
        if cursor:
            cursor.close()
            
@components_route.delete("/parameters/{parameter_id}", tags=["Коллекция компонентов"])
async def delete_parameter(parameter_id: int, db_connection=Depends(get_db)):
    """
    Удаление параметров по id
    """
    cursor = None
    try:
        cursor = db_connection.cursor()
        
        delete_query = '''
            DELETE FROM components.component_function_parameter 
            WHERE id = %s RETURNING id;
        '''
        cursor.execute(delete_query, (parameter_id,))
        deleted_id = cursor.fetchone()

        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Parameter not found")

        return {"message": f"Parameter with id {deleted_id[0]} has been deleted."}  # Возвращаем сообщение об успешном удалении
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor is not None:
            cursor.close()
            
@components_route.delete("/functions/{function_id}", tags=["Коллекция компонентов"])
async def delete_function(function_id: int, db_connection=Depends(get_db)):
    """
    Удаление функции со связанными параметрами по id
    """
    cursor = None
    try:
        cursor = db_connection.cursor()

        delete_function_parameter_query = '''
            DELETE FROM components.component_function_parameter 
            WHERE id_of_component_function = %s;
        '''
        cursor.execute(delete_function_parameter_query, (function_id,))

        delete_function_query = '''
            DELETE FROM components.component_function 
            WHERE id = %s RETURNING id;
        '''
        cursor.execute(delete_function_query, (function_id,))
        deleted_id = cursor.fetchone()

        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Function not found")

        return {"message": f"Function with id {deleted_id[0]} has been deleted."}  # Возвращаем сообщение об успешном удалении
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor is not None:
            cursor.close()

@components_route.get("/components/functions/{component_id}", response_model=List[Function], tags=["Коллекция компонентов"])
async def get_functions_by_component_id(component_id: int, db_connection=Depends(get_db)):
    """
    Возвращает список функций компонента c праметрами по его ID.
    """
    cursor = None
    try:
        cursor = db_connection.cursor()

        functions_query = '''
            SELECT id, name 
            FROM components.component_function 
            WHERE id_of_component = %s
        '''
        cursor.execute(functions_query, (component_id,))
        functions = cursor.fetchall()

        functions_with_parameters = []
        for function in functions:
            parameters_query = '''
                SELECT id, name, description, id_type, "position in signature", 
                    "is multiple values", "is return value", "default", path 
                FROM components.component_function_parameter 
                WHERE id_of_component_function = %s
            '''
            cursor.execute(parameters_query, (function['id'],))
            parameters = cursor.fetchall()

            parameters_list = []
            for param in parameters:
                type_query = '''
                    SELECT "type" FROM components."type" WHERE id = %s
                '''
                cursor.execute(type_query, (param['id_type'],))
                type_info = cursor.fetchone()

                if type_info is None:
                    raise HTTPException(status_code=500, detail="Type not found for id_type")

                parameters_list.append(Parameter(
                    id=param['id'],
                    name=param['name'],
                    description=param['description'],
                    param_type=type_info['type'],
                    position_in_signature=param['position in signature'],
                    is_multiple_values=param['is multiple values'],
                    is_return_value=param['is return value'],
                    default=param['default'],
                    path=param['path']
                ))

            functions_with_parameters.append(Function(
                id=function['id'],
                name=function['name'],
                parameters=parameters_list
            ))

        return functions_with_parameters

    except Exception as err:
        print(f"Error executing query: {err}")
        raise HTTPException(status_code=500, detail="Database query execution error")
    
    finally:
        if cursor is not None:
            cursor.close()

@components_route.put("/functions/parameters/{function_id}", response_model=Function, tags=["Коллекция компонентов"])
async def update_function(function_id: int, function: Function, db_connection=Depends(get_db)):
    """
    Обновление функции со всеми параметрами по id
    """
    cursor = None
    try:
        cursor = db_connection.cursor()
        print(f"Received function update request: {function}")

        update_function_query = '''
            UPDATE components.component_function
            SET name = %s
            WHERE id = %s
        '''
        cursor.execute(update_function_query, (function.name, function_id))

        for param in function.parameters:
            if param.id is None:
                insert_param_query = '''
                    INSERT INTO components.component_function_parameter (name, description, id_type, "position in signature", "is multiple values", "is return value", "default", path, id_of_component_function)
                    VALUES (%s, %s, (SELECT id FROM components."type" WHERE "type" = %s), %s, %s, %s, %s, %s, %s)
                '''
                cursor.execute(insert_param_query, (
                    param.name,
                    param.description,
                    param.param_type,
                    param.position_in_signature,
                    param.is_multiple_values,
                    param.is_return_value,
                    param.default,
                    param.path,
                    function_id
                ))
            else:
                update_param_query = '''
                    UPDATE components.component_function_parameter
                    SET name = %s,
                        description = %s,
                        id_type = (SELECT id FROM components."type" WHERE "type" = %s),
                        "position in signature" = %s,
                        "is multiple values" = %s,
                        "is return value" = %s,
                        "default" = %s,
                        path = %s
                    WHERE id = %s
                '''
                cursor.execute(update_param_query, (
                    param.name,
                    param.description,
                    param.param_type,
                    param.position_in_signature,
                    param.is_multiple_values,
                    param.is_return_value,
                    param.default,
                    param.path,
                    param.id
                ))

        db_connection.commit()

        cursor.execute("SELECT * FROM components.component_function WHERE id = %s", (function_id,))
        function_data = cursor.fetchone()
        print(function_data)

        if function_data is None:
            raise HTTPException(status_code=404, detail="Function not found")

        cursor.execute('''
            SELECT p.*, t.type
            FROM components.component_function_parameter p
            JOIN components."type" t ON p.id_type = t.id
            WHERE p.id_of_component_function = %s
        ''', (function_id,))
        parameters_data = cursor.fetchall()

        print(f"Parameters data from DB: {parameters_data}")

        parameters = [
            Parameter(
                id=param[0],  # id
                name=param[2],  # name
                description=param[3],  # description
                position_in_signature=param[5],  # position_in_signature
                is_multiple_values=param[6],  # is_multiple_values
                is_return_value=param[7],  # is_return_value
                default=param[8],  # default
                path=param[9],  # path
                param_type=param[11],
            ) for param in parameters_data
        ]

        return Function(id=function_data[0], name=function_data[2], parameters=parameters)

    except Exception as err:
        print(f"Error updating function parameters: {err}")
        raise HTTPException(status_code=500, detail="Error updating function parameters")
    
    finally:
        if cursor is not None:
            cursor.close()
            
@components_route.delete("/components/{component_id}", tags=["Коллекция компонентов"])
async def delete_component(component_id: int, db_connection=Depends(get_db)):
    """
    Удаление компонента и всех его функций и параметров по id
    """
    cursor = None
    try:
        cursor = db_connection.cursor()

        get_functions_query = '''
            SELECT id FROM components.component_function 
            WHERE id_of_component = %s;
        '''
        cursor.execute(get_functions_query, (component_id,))
        function_ids = [row[0] for row in cursor.fetchall()]

        for function_id in function_ids:
            delete_parameters_query = '''
                DELETE FROM components.component_function_parameter 
                WHERE id_of_component_function = %s;
            '''
            cursor.execute(delete_parameters_query, (function_id,))

        delete_functions_query = '''
            DELETE FROM components.component_function 
            WHERE id_of_component = %s;
        '''
        cursor.execute(delete_functions_query, (component_id,))

        delete_component_query = '''
            DELETE FROM components.components
            WHERE id = %s;
        '''
        cursor.execute(delete_component_query, (component_id,))

        db_connection.commit()

        return {"message": f"Component with id {component_id} and all associated functions and parameters have been deleted."}
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor is not None:
            cursor.close()