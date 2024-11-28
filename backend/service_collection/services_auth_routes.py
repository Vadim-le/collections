from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from .database import db  
import base64
import os

collection_auth_route = APIRouter()

def get_db():
    return db.get_connection()  # Возвращаем соединение
