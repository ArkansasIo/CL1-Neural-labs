# Client / Server Architecture

```text
React UI
   |
   +-- CL1ClusterClient
   |      |
   |      +-- REST /api/cluster
   |      +-- REST /api/database
   |
   +-- PongTeachingClient
          |
          +-- experiment state
          +-- rewards
          +-- trial history
          +-- policy trace
                    |
                    v
             Python Cluster Server
                    |
          +---------+---------+
          |                   |
     Virtual Cluster      Database
     1..128 nodes        MySQL/MariaDB
```

The same TypeScript client contract can later target a dataset-replay service or official SDK simulator without changing the UI's domain models.

For a physical integration, a separately reviewed adapter must sit behind the server boundary. The browser client should never contain direct device credentials or undocumented hardware-control protocol logic.
