"""HTTP server for the virtual CL1 cluster and database-backed state."""
from aiohttp import web
from .cluster import VirtualCL1Cluster
from .database_store import CL1DatabaseStore

class ClusterServer:
    def __init__(self,count=8):
        self.cluster=VirtualCL1Cluster(count); self.db=CL1DatabaseStore()
    async def cluster_status(self,request):
        return web.json_response({"topology":self.cluster.topology(),"devices":self.cluster.status()})
    async def connect(self,request):
        self.cluster.connect_all(); return await self.cluster_status(request)
    async def pause(self,request):
        self.cluster.pause_device(int(request.match_info["slot"])-1); return await self.cluster_status(request)
    async def resume(self,request):
        self.cluster.resume_device(int(request.match_info["slot"])-1); return await self.cluster_status(request)
    async def tables(self,request):
        return web.json_response({"tables":self.db.get_table_names()})
    async def table(self,request):
        name=request.match_info["table"]
        if name not in self.db.get_table_names(): raise web.HTTPNotFound(text='{"error":"unknown table"}')
        return web.json_response({"table":name,"rows":self.db.get_table_data(name)})
    def app(self):
        app=web.Application()
        app.add_get("/api/cluster",self.cluster_status); app.add_post("/api/cluster/connect",self.connect)
        app.add_post("/api/cluster/pause/{slot}",self.pause); app.add_post("/api/cluster/resume/{slot}",self.resume)
        app.add_get("/api/database/tables",self.tables); app.add_get("/api/database/{table}",self.table)
        return app
def main(): web.run_app(ClusterServer().app(),host="0.0.0.0",port=3001)
if __name__=="__main__": main()
