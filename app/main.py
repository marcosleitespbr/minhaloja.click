import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_, case
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import joinedload, Session, session
from fastapi.responses import HTMLResponse, FileResponse, Response
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel 

app = FastAPI(title="Gestor de projetos")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRONTEND_PATH = os.path.join(BASE_DIR, "frontend")

class UserLogin(BaseModel):
    email: str
    password: Optional[str] = None

# ---------------------------------------------------------------------------
# Simple health‑check endpoint
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# ---------------------------------------------------------------------------
# Handle Chrome DevTools requests to avoid 404 logs
# ---------------------------------------------------------------------------
@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools_well_known():
    """
    Handles a request from Chrome DevTools that can be safely ignored.
    Returns an empty 204 No Content response to prevent 404 errors in logs.
    """
    return Response(status_code=204)
# ---------------------------------------------------------------------------
# Handle favicon.ico requests to avoid 404 logs
# ---------------------------------------------------------------------------
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """
    Handles browser requests for favicon.ico to prevent 404 errors in logs.
    """
    return Response(status_code=204)
# ---------------------------------------------------------------------------
# Serve o frontend estático
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve a página principal (Landing Page) da aplicação."""
    return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))

# Monta o diretório 'frontend' para servir todos os outros arquivos estáticos (js, css, imagens, etc.)
app.mount("/frontend", StaticFiles(directory=FRONTEND_PATH), name="frontend")
