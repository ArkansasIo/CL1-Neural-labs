"""Maze teaching primitives and pathfinding benchmarks; pure Python, no hardware required."""
from __future__ import annotations
from collections import deque
from dataclasses import dataclass
from heapq import heappop, heappush
from typing import Callable

Point = tuple[int, int]
Grid = list[list[int]]  # 0=open, 1=wall

@dataclass(frozen=True)
class PathResult:
    algorithm: str
    path: list[Point]
    visited: list[Point]
    cost: float
    found: bool

def neighbors(grid: Grid, p: Point, diagonal: bool = False) -> list[Point]:
    r, c = p
    steps = [(-1,0),(0,1),(1,0),(0,-1)]
    if diagonal: steps += [(-1,-1),(-1,1),(1,-1),(1,1)]
    out=[]
    for dr,dc in steps:
        nr,nc=r+dr,c+dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] == 0:
            if dr and dc and (grid[r][nc] or grid[nr][c]): continue
            out.append((nr,nc))
    return out

def solve(grid: Grid, start: Point, goal: Point, algorithm: str = "astar", diagonal: bool = False,
          costs: dict[Point, float] | None = None) -> PathResult:
    if not grid or not grid[0]: raise ValueError("grid must be non-empty")
    for p in (start, goal):
        r,c=p
        if not (0<=r<len(grid) and 0<=c<len(grid[0])) or grid[r][c]:
            raise ValueError(f"start/goal must be walkable: {p}")
    costs=costs or {}
    def heuristic(p:Point)->float:
        dr,dc=abs(p[0]-goal[0]),abs(p[1]-goal[1])
        return (max(dr,dc) if diagonal else dr+dc)
    key=algorithm.lower().replace("_","-")
    if key not in {"bfs","dfs","dijkstra","astar","a*","greedy","bidirectional-bfs"}:
        raise ValueError(f"unsupported algorithm: {algorithm}")
    if start==goal: return PathResult(key,[start],[start],0,True)
    if key=="bidirectional-bfs":
        fronts=[deque([start]),deque([goal])]
        parents=[{start:None},{goal:None}]
        visited=[]
        meeting=None
        while fronts[0] and fronts[1] and meeting is None:
            side=0 if len(fronts[0])<=len(fronts[1]) else 1
            for _ in range(len(fronts[side])):
                p=fronts[side].popleft(); visited.append(p)
                if p in parents[1-side]: meeting=p; break
                for q in neighbors(grid,p,diagonal):
                    if q not in parents[side]:
                        parents[side][q]=p; fronts[side].append(q)
        if meeting is None:return PathResult(key,[],visited,float("inf"),False)
        left=[]; p=meeting
        while p is not None:left.append(p);p=parents[0].get(p)
        left.reverse(); right=[];p=parents[1].get(meeting)
        while p is not None:right.append(p);p=parents[1].get(p)
        path=left+right
        return PathResult(key,path,visited,float(len(path)-1),True)
    frontier=[]; counter=0
    # BFS/DFS use unit-cost ordering; other algorithms use priority queues.
    if key in {"bfs","dfs"}:
        frontier=deque([start])
    else:
        heappush(frontier,(heuristic(start) if key=="greedy" else 0.0,counter,start))
    parent={start:None}; dist={start:0.0}; visited=[]
    while frontier:
        if key=="bfs": p=frontier.popleft()
        elif key=="dfs": p=frontier.pop()
        else: _,_,p=heappop(frontier)
        if p in visited: continue
        visited.append(p)
        if p==goal: break
        for q in neighbors(grid,p,diagonal):
            step=float(costs.get(q,1.0))
            if step<0: raise ValueError("negative edge costs are not supported")
            nd=dist[p]+step
            if q in dist and nd>=dist[q]: continue
            dist[q]=nd;parent[q]=p;counter+=1
            if key=="bfs": frontier.append(q)
            elif key=="dfs": frontier.append(q)
            else:
                priority=heuristic(q) if key=="greedy" else nd+(heuristic(q) if key in {"astar","a*"} else 0)
                heappush(frontier,(priority,counter,q))
    if goal not in parent:return PathResult(key,[],visited,float("inf"),False)
    path=[];p=goal
    while p is not None:path.append(p);p=parent[p]
    path.reverse()
    return PathResult(key,path,visited,dist[goal],True)

def generate_perfect_maze(rows:int, cols:int, seed:int=1)->Grid:
    """Randomized depth-first carving; dimensions are cells, odd or even supported."""
    import random
    if rows<2 or cols<2: raise ValueError("rows and cols must be >= 2")
    rng=random.Random(seed); grid=[[1]*cols for _ in range(rows)]
    start=(0,0);grid[0][0]=0;stack=[start]
    while stack:
        r,c=stack[-1]
        candidates=[(r+dr,c+dc) for dr,dc in [(-1,0),(0,1),(1,0),(0,-1)]
                    if 0<=r+dr<rows and 0<=c+dc<cols and grid[r+dr][c+dc]]
        if not candidates:stack.pop();continue
        q=rng.choice(candidates);grid[q[0]][q[1]]=0;stack.append(q)
    return grid

MAZE_VARIANTS = [
 {"id":"perfect","name":"Perfect / simply connected","teaching":"DFS carving; exactly one simple path between connected cells"},
 {"id":"braided","name":"Braided maze","teaching":"Add loops to reduce dead ends"},
 {"id":"rooms","name":"Rooms and corridors","teaching":"Rectangular rooms joined by narrow passages"},
 {"id":"recursive-division","name":"Recursive division","teaching":"Recursive walls with doors"},
 {"id":"weave","name":"Weave maze","teaching":"Passages that cross over/under in layered representation"},
 {"id":"hex","name":"Hexagonal grid","teaching":"Six-neighbour graph rather than four-neighbour square grid"},
 {"id":"triangular","name":"Triangular grid","teaching":"Orientation-dependent adjacency"},
 {"id":"weighted","name":"Weighted terrain","teaching":"Path cost differs from geometric distance"},
 {"id":"dynamic","name":"Dynamic / moving walls","teaching":"Replan as obstacles change"},
 {"id":"multi-goal","name":"Multi-goal / waypoint","teaching":"Visit ordered or unordered targets"},
 {"id":"multi-agent","name":"Multi-agent","teaching":"Collision avoidance and reservation tables"},
 {"id":"3d","name":"3D voxel maze","teaching":"Six-axis graph and 3D heuristics"},
 {"id":"time-expanded","name":"Time-expanded maze","teaching":"State includes position and time"},
 {"id":"unknown-map","name":"Unknown / exploration","teaching":"Discover graph while navigating"},
 {"id":"labyrinth","name":"Labyrinth with cycles","teaching":"Graph search and loop handling"},
]
