# Cluster Server Deployment

## Windows
```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e "./python[server]"
python -m cl1_neural_lab.cluster_server
```

## macOS / Linux
```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -e "./python[server]"
python -m cl1_neural_lab.cluster_server
```

The default virtual cluster contains 8 nodes and listens on port 3001. For 16–128 nodes, the recommended next step is a process pool so simulation work does not block the HTTP service.

Initialize MySQL/MariaDB from `database/cluster_schema.sql`. Keep passwords and device credentials in environment variables, never in Git.