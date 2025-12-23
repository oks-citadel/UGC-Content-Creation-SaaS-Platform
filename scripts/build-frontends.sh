#!/bin/bash
# Build frontend apps to Azure Container Registry
# Run this from the repository root directory

set -e

ACR_NAME="acrmktstagingravs"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

echo "=== Building Frontend Apps to ACR ==="

# Login to ACR
echo "Logging in to ACR..."
az acr login --name $ACR_NAME

# Build and push each frontend app
for app in web creator-portal admin; do
    echo ""
    echo "=== Building $app ==="

    az acr build \
        --registry $ACR_NAME \
        --image "$app:latest" \
        --file "apps/$app/Dockerfile" \
        .

    echo "✓ $app built and pushed successfully"
done

echo ""
echo "=== All frontend apps built successfully ==="
echo ""
echo "Images available:"
az acr repository list --name $ACR_NAME --output table
