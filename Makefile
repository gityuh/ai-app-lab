.PHONY: all 

POETRY_VERSION=1.6.1
# poetry command will be installed in ``${HOME}/.local/bin/`` directory.
PATH = ${HOME}/.local/bin/:$(shell printenv PATH)
poetry_install:
		@if ! command -v poetry >/dev/null; then \
		        echo "Install Poetry"; \
		        pip install poetry==$(POETRY_VERSION); \
		else \
		        echo "Poetry has been installed"; \
		fi

		@echo "Poetry version: $(shell poetry --version)"

install:
		poetry install

build:
		poetry build

clean:
		rm -rf dist