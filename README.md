# Clean Notes App 📝✨

A beautiful, minimal notes application built with a modern tech stack. This project demonstrates a full-stack microservices architecture designed to be deployed on Kubernetes (Minikube).

![Clean UI Notes App](https://img.shields.io/badge/UI-Clean%20%26%20Minimal-6366f1?style=flat-square)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326ce5?style=flat-square&logo=kubernetes&logoColor=white)

## 🛠 Tech Stack

- **Frontend**: React, Vite, Custom CSS (Clean Minimal Design)
- **Backend**: Node.js, Express, PostgreSQL (Neon DB for managed database)
- **Infrastructure**: Docker, Kubernetes (Minikube), NGINX Ingress Controller

## 🚀 Features

- **Clean Minimal UI**: Clutter-free writing experience with an Indigo accent color.
- **Auto-Save**: Changes are saved automatically as you type.
- **Pin & Archive**: Stay organized by pinning important notes or archiving old ones.
- **Fast Search**: Instantly filter notes by content or title.
- **Fully Containerized**: Ready for production-like deployment using Kubernetes.

## 📦 Local Deployment Guide (Minikube)

This guide shows you how to run the entire stack locally using **Minikube** and the **Docker driver**.

### Prerequisites

- [Docker](https://www.docker.com/) installed and running
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed

### Step 1: Start Minikube

Start your local Kubernetes cluster using the Docker driver:

```bash
minikube start --driver=docker
```

Enable the NGINX Ingress controller in Minikube (required for routing traffic to the frontend and backend):

```bash
minikube addons enable ingress
```

### Step 2: Build Docker Images inside Minikube

Because Minikube runs inside a Docker container (when using the Docker driver), it cannot see the Docker images built on your host machine. We need to point your terminal's Docker CLI to the Minikube Docker daemon before building:

```bash
# Point your shell to minikube's docker-daemon
eval $(minikube docker-env)

# Build the backend image
cd backend
docker build -t notesapp-backend:latest .
cd ..

# Build the frontend image
cd frontend
docker build -t notesapp-frontend:latest .
cd ..
```

### Step 3: Deploy to Kubernetes

Now, apply the Kubernetes manifests to create the Deployments, Services, and Ingress resources:

```bash
kubectl apply -f k8s/
```

Wait a few moments and verify the pods are running:

```bash
kubectl get pods
```

### Step 4: Run Minikube Tunnel (Crucial for Docker Driver) ⚠️

When running Minikube with the Docker driver on Mac or Windows, the Ingress controller doesn't automatically get an IP address accessible from your host machine. 

To create a network route to the Ingress, you **must run the minikube tunnel command in a separate terminal window**:

```bash
minikube tunnel
```
*(Leave this terminal window open. It may ask for your administrator password.)*

### Step 5: Access the Application

Add the local domain mapping to your host's `/etc/hosts` file. Open `/etc/hosts` with `sudo` and append:

```text
127.0.0.1 notesapp.local
```

Now, open your browser and navigate to:
👉 **[http://notesapp.local](http://notesapp.local)**

---

## 🏗 Directory Structure

- `/frontend/` - React SPA (Vite). Packaged efficiently using multi-stage Docker builds with NGINX serving static files.
- `/backend/` - Node.js + Express API. Handles note CRUDS connected to Postgres.
- `/k8s/` - Kubernetes manifests (Deployments, Services, Ingress).

## 🛢 Database Setup (Neon DB)

The `backend-deployment.yaml` is pre-configured to connect to a Neon PostgreSQL instance via `DB_URI`.
If you want to use a local Postgres database inside the cluster, you will need to deploy a Postgres StatefulSet and update the `DB_URI` environment variable accordingly.

---

### Happy Note-Taking! 🚀
