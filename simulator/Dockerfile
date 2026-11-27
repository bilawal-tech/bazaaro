FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY *.py ./
WORKDIR /work
ENTRYPOINT ["python", "/app/simulate.py"]
CMD ["live", "--brokers", "kafka:9092", "--speed", "60"]
