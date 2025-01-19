FROM python:3.13-slim           
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
COPY requirements.txt .         
RUN pip install -r requirements.txt  
COPY api/ /app/api/
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]