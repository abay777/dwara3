from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import validation  # Use 'api' instead of 'app'

app = FastAPI(title="NAS Folder Validation API", version="1.0.0")

# CORS Middleware (Modify Allowed Origins as Needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routes
app.include_router(validation.router)

@app.get("/")
async def root():
    return {"message": "NAS Folder Validation API is running!"}
