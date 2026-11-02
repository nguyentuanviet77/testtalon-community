# TestTalon Community: run the tests in a container.
#
#   Build:  docker build -t testtalon-community .
#   Run:    docker run --rm testtalon-community
#   Keep the reports and logs on your machine:
#           docker run --rm -v "$PWD/logs:/app/logs" testtalon-community
#   Use your own profile without putting it in the image (the mounted file replaces the one in the image):
#           docker run --rm -v "$PWD/config/project-profiles/.env.dev:/app/config/project-profiles/.env.dev:ro" testtalon-community
#
# The image contains your project files, including config/project-profiles. Keep real credentials encrypted with dotenvx
# and pass the private key at run time (-e DOTENV_PRIVATE_KEY_DEV=...), or mount the profile as shown above. .dockerignore keeps
# .env.keys and key files out of the image.

# Node 24 (matches "engines": ">=24" in package.json). The 24 tag follows the latest 24.x security release.
FROM node:24-bookworm-slim

WORKDIR /app

# Install the locked dependencies first, so Docker can reuse this layer until the lock file changes.
COPY package.json package-lock.json ./
RUN npm ci

# Chromium (the browser of the dev project) and the system libraries it needs.
RUN npx playwright install --with-deps chromium

COPY . .

# Build, run the unit tests, then run the smoke test (the same as `npm test`).
CMD ["npm", "test"]
