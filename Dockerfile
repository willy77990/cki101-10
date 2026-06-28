# 使用與您環境相同的 Python 3.13
FROM python:3.13-slim

WORKDIR /app

# 從官方 image 複製 uv 執行檔
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 先複製依賴管理檔案 (可善用 Docker Cache)
COPY pyproject.toml uv.lock ./

# 同步依賴套件 (這會在容器內建立 .venv 並安裝套件)
RUN uv sync --frozen --no-install-project

# 複製專案其餘程式碼
COPY . .

# 再次同步確保所有設定就緒
RUN uv sync --frozen

# Flask 預設使用 5000 port
EXPOSE 5000

# 使用 uv run 來執行 app.py，它會自動使用 .venv 內的 Python
CMD ["uv", "run", "python", "app.py"]
