#!/bin/bash
function cleanup {
	docker-compose down
	exit
}
echo "[dev-helper] Building and starting containers..."
docker-compose -p rallyup build
trap cleanup EXIT INT
docker-compose -p rallyup up -d
watch "docker restart rallyup_web_1" --ignoreDotFiles
