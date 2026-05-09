FROM python:3.11-slim

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers

# Playwright system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    playwright install chromium

# AutoShare entry point (committed to git)
COPY entrypoint.py .

# Bot source from meroshare-ipo-bot (gitignored, copied by build script)
COPY src/bot ./bot

RUN useradd -r -u 1001 botuser && chown -R botuser:botuser /app
USER botuser

ENTRYPOINT ["python", "entrypoint.py"]
