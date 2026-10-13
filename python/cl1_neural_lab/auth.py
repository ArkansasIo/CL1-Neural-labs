"""Authentication and authorization primitives for the simulator and future API."""
from dataclasses import dataclass,field
from hashlib import pbkdf2_hmac,sha256
import hmac,os,secrets,time
class AuthError(Exception): pass
class PermissionDenied(AuthError): pass
@dataclass
class User:
 id:int; username:str; email:str; display_name:str; password_hash:str; status:str="active"; roles:set[str]=field(default_factory=lambda:{"user"})
def hash_password(password:str,salt:bytes|None=None,iterations:int=310_000)->str:
 if len(password)<12: raise ValueError("Password must contain at least 12 characters.")
 salt=salt or os.urandom(16); d=pbkdf2_hmac("sha256",password.encode(),salt,iterations)
 return "pbkdf2_sha256$%d$%s$%s"%(iterations,salt.hex(),d.hex())
def verify_password(password,encoded):
 try:
  scheme,n,s,d=encoded.split("$"); actual=pbkdf2_hmac("sha256",password.encode(),bytes.fromhex(s),int(n)); return scheme=="pbkdf2_sha256" and hmac.compare_digest(actual.hex(),d)
 except (ValueError,TypeError): return False
class MemoryAuthStore:
 def __init__(self): self.users={};self.by_username={};self.by_email={};self.sessions={};self.next_id=1
 def register(self,username,email,password,display_name=""):
  u=username.strip().lower();e=email.strip().lower()
  if not u or not e or u in self.by_username or e in self.by_email: raise AuthError("Invalid or duplicate account.")
  user=User(self.next_id,u,e,display_name.strip() or u,hash_password(password));self.next_id+=1;self.users[user.id]=user;self.by_username[u]=user.id;self.by_email[e]=user.id;return user
 def login(self,username,password,ttl_seconds=28800):
  user=self.users.get(self.by_username.get(username.strip().lower()))
  if not user or user.status!="active" or not verify_password(password,user.password_hash): raise AuthError("Invalid username or password.")
  token=secrets.token_urlsafe(48);self.sessions[sha256(token.encode()).hexdigest()]=(user.id,time.time()+ttl_seconds);return user,token
 def authenticate(self,token):
  row=self.sessions.get(sha256(token.encode()).hexdigest())
  if not row or row[1]<=time.time(): raise AuthError("Invalid or expired session.")
  user=self.users.get(row[0]);
  if not user or user.status!="active": raise AuthError("Account unavailable.")
  return user
 def logout(self,token): self.sessions.pop(sha256(token.encode()).hexdigest(),None)
class PermissionService:
 ROLE_PERMISSIONS={"user":{"profile.read","profile.write","experiments.read","hardware.read"},"researcher":{"profile.read","profile.write","experiments.read","experiments.run","hardware.read","hardware.simulate_stimulation","cluster.manage"},"admin":{"profile.read","profile.write","experiments.read","experiments.run","hardware.read","hardware.simulate_stimulation","cluster.manage","users.read","users.manage","system.admin"}}
 def allowed(self,user,permission): return any(permission in self.ROLE_PERMISSIONS.get(r,set()) for r in user.roles)
 def require(self,user,permission):
  if not self.allowed(user,permission): raise PermissionDenied("Permission required: "+permission)