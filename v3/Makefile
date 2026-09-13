.PHONY: setup check build serve export

setup:
	uv sync --locked
	npm --prefix frontend ci

check:
	uv run ruff check backend
	uv run ruff format --check backend
	uv run pytest
	npm --prefix frontend test
	npm --prefix frontend run check
	npm --prefix frontend run build

build:
	npm --prefix frontend run build

serve: build
	uv run uvicorn enclosure.service:app --host 127.0.0.1 --port 8000

export:
	uv run python -m enclosure.cli --out artifacts --format pack
