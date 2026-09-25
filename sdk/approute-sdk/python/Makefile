.PHONY: install lint type-check test test-cov fmt clean

install:
	pip install -e ".[dev]"

lint:
	ruff check approute/ tests/

fmt:
	ruff format approute/ tests/
	ruff check --fix approute/ tests/

type-check:
	mypy approute/

test:
	pytest tests/ -v

test-cov:
	pytest tests/ -v --cov=approute --cov-report=term-missing --cov-report=html

clean:
	rm -rf dist/ build/ *.egg-info .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
